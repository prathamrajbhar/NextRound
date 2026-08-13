'use client';

import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/apiClient';

interface WebRTCSignalMessage {
  type: 'description' | 'candidate' | 'ready' | 'ready_reply';
  description?: RTCSessionDescriptionInit | null;
  candidate?: RTCIceCandidateInit | null;
}

interface WebRTCSignal {
  id: string;
  application_id: string;
  sender: string;
  message: WebRTCSignalMessage;
  created_at: string;
}

interface UseWebRTCCallProps {
  applicationId: string;
  mode: 'hr-candidate' | 'hr-recruiter' | 'ai-voice' | 'mock-practice';
  localStream: MediaStream | null;
}

export function useWebRTCCall({ applicationId, mode, localStream }: UseWebRTCCallProps) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);

  const isVideoCallMode = mode === 'hr-candidate' || mode === 'hr-recruiter';

  useEffect(() => {
    if (!isVideoCallMode || !applicationId) {
      return;
    }

    
    const postSignal = async (msg: WebRTCSignalMessage) => {
      try {
        await apiClient.post(`/interviews/${applicationId}/signal`, {
          sender: mode === 'hr-candidate' ? 'candidate' : 'recruiter',
          message: msg,
        });
      } catch (err) {
        console.error('[WebRTC] Failed to post signal:', err);
      }
    };

    
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;

    const polite = mode === 'hr-candidate';

    
    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await postSignal({
          type: 'description',
          description: pc.localDescription
            ? { type: pc.localDescription.type, sdp: pc.localDescription.sdp }
            : null,
        });
      } catch (err) {
        console.error('[WebRTC] Error during negotiation offer creation:', err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    pc.onicecandidate = ({ candidate }) => {
      postSignal({
        type: 'candidate',
        candidate: candidate
          ? {
              candidate: candidate.candidate,
              sdpMid: candidate.sdpMid,
              sdpMLineIndex: candidate.sdpMLineIndex,
              usernameFragment: candidate.usernameFragment,
            }
          : null,
      });
    };

    
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setRemoteStream(null);
      }
    };

    
    const handleIncomingSignal = async (data: WebRTCSignalMessage) => {
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
            await postSignal({
              type: 'description',
              description: pc.localDescription
                ? { type: pc.localDescription.type, sdp: pc.localDescription.sdp }
                : null,
            });
          }
        } else if (candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            if (!ignoreOfferRef.current) {
              throw err;
            }
          }
        } else if (type === 'ready' || type === 'ready_reply') {
          
          if (!polite && pc.signalingState === 'stable') {
            try {
              makingOfferRef.current = true;
              const offer = await pc.createOffer({ iceRestart: true });
              await pc.setLocalDescription(offer);
              await postSignal({
                type: 'description',
                description: pc.localDescription
                  ? { type: pc.localDescription.type, sdp: pc.localDescription.sdp }
                  : null,
              });
            } catch (err) {
              console.error('[WebRTC] Error initiating renegotiation offer:', err);
            } finally {
              makingOfferRef.current = false;
            }
          } else if (polite && type === 'ready') {
            
            await postSignal({ type: 'ready_reply' });
          }
        }
      } catch (err) {
        console.error('[WebRTC] Error processing signaling message:', err);
      }
    };

    
    let lastPolledTime = new Date(Date.now() - 5000);
    const pollInterval = setInterval(async () => {
      try {
        const res = await apiClient.get<WebRTCSignal[]>(
          `/interviews/${applicationId}/signals?since=${lastPolledTime.toISOString()}`
        );
        if (res && Array.isArray(res)) {
          for (const signal of res) {
            
            const isSelf = signal.sender === (mode === 'hr-candidate' ? 'candidate' : 'recruiter');
            if (!isSelf) {
              await handleIncomingSignal(signal.message);
            }
          }
          if (res.length > 0) {
            
            const maxTime = new Date(res[res.length - 1].created_at);
            lastPolledTime = maxTime;
          }
        }
      } catch (err) {
        console.error('[WebRTC] Error polling signals:', err);
      }
    }, 1200);

    
    postSignal({ type: 'ready' });

    return () => {
      pc.close();
      clearInterval(pollInterval);
      setRemoteStream(null);
      setConnectionState('new');
    };
  }, [isVideoCallMode, applicationId, mode]);

  
  useEffect(() => {
    if (!isVideoCallMode || !pcRef.current || !localStream) {
      return;
    }

    const pc = pcRef.current;
    const currentSenders = pc.getSenders();

    
    currentSenders.forEach((sender) => {
      try {
        pc.removeTrack(sender);
      } catch (err) {
        console.error('[WebRTC] Error removing old track:', err);
      }
    });

    
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
  }, [isVideoCallMode, localStream]);

  return { remoteStream, connectionState };
}
