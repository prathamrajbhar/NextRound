'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Mic,
  Video,
  CheckCircle2,
  Loader2,
  Maximize2,
  Shield,
  Users,
  RefreshCw,
} from '@/lib/lucide-google-icons';
import { CompanyLogo } from '@/components/ui';
import { detectFaces, loadFaceDetector } from '@/lib/proctoring/faceDetector';

interface ProctoringGateProps {
  company?: string;
  role?: string;
  onProceed: (stream: MediaStream) => void;
}

type FaceStatus = 'checking' | 'pass' | 'fail';

export function ProctoringGate({ company, role, onProceed }: ProctoringGateProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [faceStatus, setFaceStatus] = useState<FaceStatus>('checking');
  const [faceCount, setFaceCount] = useState<number | null>(null);
  const [consented, setConsented] = useState(false);

  const handedOffRef = useRef(false);

  const stopStream = useCallback(() => {
    if (handedOffRef.current) return;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const runFaceCheckRef = useRef<() => void>(() => {});
  const runFaceCheck = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    if (video.readyState < 2) {
      setTimeout(() => runFaceCheckRef.current(), 300);
      return;
    }

    const loaded = await loadFaceDetector();
    if (!loaded) {
      setFaceStatus('pass');
      setFaceCount(1);
      return;
    }

    const result = await detectFaces(video);
    if (!result.ok) {
      setFaceStatus('pass');
      setFaceCount(1);
      return;
    }

    setFaceCount(result.count);
    if (result.count === 0) {
      setFaceStatus('fail');
    } else if (result.count >= 2) {
      setFaceStatus('fail');
      setError('More than one person detected in the camera frame. Please ensure only you are visible.');
    } else {
      setFaceStatus('pass');
    }
  }, []);

  useEffect(() => {
    runFaceCheckRef.current = runFaceCheck;
  }, [runFaceCheck]);

  useEffect(() => {
    let cancelled = false;

    async function acquire() {
      setChecking(true);
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Camera & microphone are not available in this browser.');
          setChecking(false);
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        await videoRef.current?.play().catch(() => {});
        setChecking(false);
        runFaceCheck();
      } catch (err) {
        const name = err instanceof DOMException ? err.name : '';
        setError(
          name === 'NotFoundError'
            ? 'No camera or microphone found. Connect them and retry.'
            : 'Camera & microphone access is required for the secured assessment. Please allow them and retry.'
        );
        setChecking(false);
      }
    }

    acquire();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [runFaceCheck, stopStream]);

  useEffect(() => {
    if (faceStatus === 'fail') {
      const t = setTimeout(runFaceCheck, 2000);
      return () => clearTimeout(t);
    }
  }, [faceStatus, runFaceCheck]);

  const handleProceed = () => {
    if (!streamRef.current) return;
    handedOffRef.current = true;
    onProceed(streamRef.current);
  };

  const canProceed = faceStatus === 'pass' && consented && !checking;

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto transition-colors duration-300">
      <div className="min-h-full flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CompanyLogo name={company || 'NextRound'} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-bold truncate font-display">{company || 'NextRound'}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{role || 'Candidate'}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <Shield className="h-3 w-3" />
              Live Proctoring
            </span>
          </div>

          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                className="h-full w-full object-cover"
              />

              {checking && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-slate-300">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">Activating camera</span>
                </div>
              )}

              {!checking && faceStatus === 'checking' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-slate-300">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">Verifying single person</span>
                </div>
              )}

              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1">
                {faceStatus === 'fail' ? (
                  <Users className="h-3.5 w-3.5 text-rose-400" />
                ) : (
                  <Video className="h-3.5 w-3.5 text-emerald-400" />
                )}
                <span className="text-[10px] font-bold text-slate-200">
                  {faceStatus === 'fail'
                    ? 'Multiple people'
                    : faceCount !== null && faceCount >= 1
                    ? `${faceCount} person in frame`
                    : 'Detecting…'}
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold leading-relaxed">
                {error}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setChecking(true);
                    window.location.reload();
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry Setup
                </button>
              </div>
            )}

            {!error && faceStatus === 'fail' && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold leading-relaxed">
                The assessment requires exactly one person visible in frame. Please adjust and wait for verification.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel space-y-3">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              Secured Assessment Checklist
            </div>

            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Mic className="h-4 w-4 text-emerald-500" />
              <span>Microphone active — speech, noise &amp; background sound are analyzed</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto flex-shrink-0" />
            </div>

            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Video className="h-4 w-4 text-emerald-500" />
              <span>Camera active — exactly one person must remain in frame</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto flex-shrink-0" />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="mt-0.5 rounded border-slate-600 bg-slate-800 text-orange-500 h-4 w-4 cursor-pointer flex-shrink-0"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                I consent to camera &amp; microphone streaming, full-screen mode, automated proctoring, and audio recording of this assessment session for integrity verification.
              </span>
            </label>

            <button
              disabled={!canProceed}
              onClick={handleProceed}
              className="w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Maximize2 className="h-4 w-4" />
              {faceStatus === 'fail' ? 'Waiting for Single-Person Verification' : 'Start Secured Assessment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
