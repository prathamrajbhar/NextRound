'use client';

import { useEffect, useRef, useState } from 'react';

interface UseWebRTCCallProps {
  applicationId: string;
  mode: 'hr-candidate' | 'hr-recruiter' | 'ai-voice' | 'mock-practice';
  localStream: MediaStream | null;
}

export function useWebRTCCall({ applicationId, mode, localStream }: UseWebRTCCallProps) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);

  const isVideoCallMode = mode === 'hr-candidate' || mode === 'hr-recruiter';

  useEffect(() => {
    if (!isVideoCallMode || !applicationId) {
      return;
    }

    // 1. Initialize BroadcastChannel for real-time local signaling
    const channel = new BroadcastChannel(`hr_call_${applicationId}`);
    channelRef.current = channel;

    // 2. Initialize RTCPeerConnection with public STUN servers
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;

    const polite = mode === 'hr-candidate';

    // 3. Perfect Negotiation: Handle onnegotiationneeded (automatically triggered on track additions)
    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channel.postMessage({ type: 'description', description: pc.localDescription });
      } catch (err) {
        console.error('[WebRTC] Error during negotiation offer creation:', err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    // 4. Perfect Negotiation: Exchange ICE candidates
    pc.onicecandidate = ({ candidate }) => {
      channel.postMessage({ type: 'candidate', candidate });
    };

    // 5. Track Remote Video Stream
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // 6. Monitor connection state changes
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setRemoteStream(null);
      }
    };

    // 7. Perfect Negotiation: Handle incoming signaling messages
    channel.onmessage = async ({ data }) => {
      try {
        const { type, description, candidate } = data;

        if (description) {
          const offerCollision =
            description.type === 'offer' &&
            (makingOfferRef.current || pc.signalingState !== 'stable');

          ignoreOfferRef.current = !polite && offerCollision;
          if (ignoreOfferRef.current) {
            return;
          }

          await pc.setRemoteDescription(new RTCSessionDescription(description));
          if (description.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            channel.postMessage({ type: 'description', description: pc.localDescription });
          }
        } else if (candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            if (!ignoreOfferRef.current) {
              throw err;
            }
          }
        } else if (type === 'ready') {
          // If the candidate joins or reconnects, the impolite peer (Recruiter) initiates renegotiation
          if (!polite && pc.signalingState === 'stable') {
            try {
              makingOfferRef.current = true;
              const offer = await pc.createOffer({ iceRestart: true });
              await pc.setLocalDescription(offer);
              channel.postMessage({ type: 'description', description: pc.localDescription });
            } catch (err) {
              console.error('[WebRTC] Error initiating renegotiation offer:', err);
            } finally {
              makingOfferRef.current = false;
            }
          }
        }
      } catch (err) {
        console.error('[WebRTC] Error processing signaling message:', err);
      }
    };

    // 8. Broadcast ready state to the other peer immediately upon initialization
    channel.postMessage({ type: 'ready' });

    return () => {
      pc.close();
      channel.close();
      setRemoteStream(null);
      setConnectionState('new');
    };
  }, [isVideoCallMode, applicationId, mode]);

  // Sync local stream tracks dynamically to the RTCPeerConnection
  useEffect(() => {
    if (!isVideoCallMode || !pcRef.current || !localStream) {
      return;
    }

    const pc = pcRef.current;
    const currentSenders = pc.getSenders();

    // Remove old tracks
    currentSenders.forEach((sender) => {
      try {
        pc.removeTrack(sender);
      } catch (err) {
        console.error('[WebRTC] Error removing old track:', err);
      }
    });

    // Add new tracks
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
  }, [isVideoCallMode, localStream]);

  return { remoteStream, connectionState };
}
