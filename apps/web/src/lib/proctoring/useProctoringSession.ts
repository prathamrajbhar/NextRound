'use client';

import { useEffect, useState, useRef } from 'react';
import { ProctoringClient } from './ProctoringClient';

interface UseProctoringSessionProps {
  sessionId: string;
  candidateId: string;
  sessionType: 'aptitude' | 'coding' | 'video' | 'interview';
  applicationId?: string;
  mockSessionId?: string;
  assessmentId?: string;
  policyVersion?: string;
  consentVersion?: string;
  onViolationDetected?: (eventKind: string) => void;
  onDisqualified?: () => void;
}

export function useProctoringSession({
  sessionId,
  candidateId,
  sessionType,
  applicationId,
  mockSessionId,
  assessmentId,
  policyVersion = 'assessment-v1',
  consentVersion = 'v1',
  onViolationDetected,
  onDisqualified,
}: UseProctoringSessionProps) {
  const [strikeCount, setStrikeCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [proctoringClient, setProctoringClient] = useState<ProctoringClient | null>(null);
  const clientRef = useRef<ProctoringClient | null>(null);

  useEffect(() => {
    if (!sessionId || !candidateId) return;

    const client = new ProctoringClient({
      sessionId,
      candidateId,
      sessionType,
      applicationId,
      mockSessionId,
      assessmentId,
      policyVersion,
      consentVersion,
      onViolation: (kind) => {
        // Tab hidden, fullscreen exit, and window blur trigger strikes
        if (
          kind === 'tab_hidden' ||
          kind === 'fullscreen_exit' ||
          kind === 'window_blur' ||
          kind === 'network_disconnected'
        ) {
          setStrikeCount((prev) => {
            const next = prev + 1;
            setShowWarningModal(true);
            if (next >= 3) {
              onDisqualified?.();
            }
            return next;
          });
        }
        onViolationDetected?.(kind);
      },
    });

    client.start();
    clientRef.current = client;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProctoringClient(client);

    return () => {
      client.stop();
      clientRef.current = null;
      setProctoringClient(null);
    };
  }, [
    sessionId,
    candidateId,
    sessionType,
    applicationId,
    mockSessionId,
    assessmentId,
    policyVersion,
    consentVersion,
    onViolationDetected,
    onDisqualified,
  ]);

  const handleResumeFullscreen = () => {
    if (typeof document !== 'undefined' && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen:', err);
      });
    }
    setShowWarningModal(false);
    if (clientRef.current) {
      clientRef.current.logEvent('fullscreen_enter', 'info', 'browser', {
        resumed: true,
      });
    }
  };

  const handlePause = async () => {
    if (clientRef.current) {
      await clientRef.current.pause();
    }
  };

  const handleResume = async () => {
    if (clientRef.current) {
      await clientRef.current.resume();
    }
  };

  const handleEnd = async () => {
    if (clientRef.current) {
      await clientRef.current.end();
    }
  };

  const trackMediaStream = (stream: MediaStream) => {
    if (clientRef.current) {
      clientRef.current.trackMediaStream(stream);
    }
  };

  return {
    strikeCount,
    showWarningModal,
    handleResumeFullscreen,
    handlePause,
    handleResume,
    handleEnd,
    trackMediaStream,
    proctoringClient,
  };
}
