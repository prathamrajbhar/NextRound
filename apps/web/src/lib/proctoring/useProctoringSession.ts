'use client';

import { useEffect, useState, useRef } from 'react';
import { ProctoringClient } from './ProctoringClient';
import { applyViolationPolicy, MAX_STRIKES } from './violationPolicy';

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
  const [recordingActive, setRecordingActive] = useState(false);
  const [recordingDurationMs, setRecordingDurationMs] = useState(0);
  const clientRef = useRef<ProctoringClient | null>(null);

  useEffect(() => {
    if (!clientRef.current) return;
    const t = setInterval(() => {
      const state = clientRef.current?.getRecordingState?.();
      if (state) {
        setRecordingActive(state.active);
        setRecordingDurationMs(state.durationMs);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [proctoringClient]);

  const onViolationDetectedRef = useRef(onViolationDetected);
  const onDisqualifiedRef = useRef(onDisqualified);

  const isEndedRef = useRef(false);

  useEffect(() => {
    onViolationDetectedRef.current = onViolationDetected;
    onDisqualifiedRef.current = onDisqualified;
  }, [onViolationDetected, onDisqualified]);

  useEffect(() => {
    if (!sessionId || !candidateId) return;
    isEndedRef.current = false;

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
        if (isEndedRef.current) return;

        const decision = applyViolationPolicy(kind, 0);

        if (decision.disqualifiesImmediately) {
          onDisqualifiedRef.current?.();
          return;
        }

        if (decision.incrementsStrike) {
          setStrikeCount((prev) => {
            const next = prev + 1;
            setShowWarningModal(true);
            if (next >= MAX_STRIKES) {
              onDisqualifiedRef.current?.();
            }
            return next;
          });
        }
        onViolationDetectedRef.current?.(kind);
      },
    });

    client.start();
    clientRef.current = client;
    setProctoringClient(client);

    return () => {
      isEndedRef.current = true;
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
    isEndedRef.current = true;
    setShowWarningModal(false);
    if (clientRef.current) {
      await clientRef.current.end();
    }
  };

  const suppressViolations = (suppress: boolean) => {
    if (clientRef.current) {
      clientRef.current.setSuppressViolations(suppress);
    }
    if (suppress) {
      setShowWarningModal(false);
    }
  };

  const trackMediaStream = (stream: MediaStream) => {
    if (clientRef.current) {
      clientRef.current.trackMediaStream(stream);
    }
  };

  const startCapture = (stream: MediaStream) => {
    if (clientRef.current) {
      clientRef.current.trackMediaStream(stream);
    }
  };

  return {
    strikeCount,
    showWarningModal,
    recordingActive,
    recordingDurationMs,
    handleResumeFullscreen,
    handlePause,
    handleResume,
    handleEnd,
    suppressViolations,
    trackMediaStream,
    startCapture,
    proctoringClient,
  };
}
