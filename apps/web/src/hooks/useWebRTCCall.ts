'use client';

import { useEffect, useRef, useState } from 'react';
import {
  WebRTCSignalMessage,
  UseWebRTCCallProps,
  DEFAULT_RTC_CONFIG,
} from '@/lib/webrtc/webrtc.types';
import {
  postWebRTCSignal,
  processIncomingSignal,
  pollSignals,
} from '@/lib/webrtc/webrtcSignaling';

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

    const senderRole = mode === 'hr-candidate' ? 'candidate' : 'recruiter';
    const postSignal = (msg: WebRTCSignalMessage) =>
      postWebRTCSignal(applicationId, senderRole, msg);

    const pc = new RTCPeerConnection(DEFAULT_RTC_CONFIG);
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

    let lastPolledTime = new Date(Date.now() - 5000);
    const pollInterval = setInterval(async () => {
      const { signals, latestTime } = await pollSignals(applicationId, lastPolledTime);
      lastPolledTime = latestTime;

      for (const signal of signals) {
        const isSelf = signal.sender === senderRole;
        if (!isSelf) {
          await processIncomingSignal(
            pc,
            signal.message,
            polite,
            makingOfferRef,
            ignoreOfferRef,
            postSignal
          );
        }
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
      } catch {
        // Ignored
      }
    });

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
  }, [isVideoCallMode, localStream]);

  return { remoteStream, connectionState };
}
