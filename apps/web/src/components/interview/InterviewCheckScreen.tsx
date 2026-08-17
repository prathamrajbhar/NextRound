'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Mic, MicOff,
  Video, VideoOff,
  Wifi, WifiOff,
  CheckCircle2,
  Loader2,
  Maximize2,
  RefreshCw,
  Shield,
} from '@/lib/lucide-google-icons';
import { CompanyLogo } from '@/components/ui';
import { siteConfig } from '@/lib/config';
import { useSafeMediaStream } from '@/hooks/useSafeMediaStream';

type StepKey = 'mic' | 'camera' | 'connection';
type StepStatus = 'idle' | 'checking' | 'pass' | 'fail';

interface StepState {
  status: StepStatus;
  label: string;
  error: string;
}

interface Props {
  company: string;
  role: string;
  camActive?: boolean;
  onJoin: (bypassed?: boolean) => void;
}

async function queryPerm(name: string): Promise<PermissionState | null> {
  try {
    if (!navigator?.permissions?.query) return null;
    const r = await navigator.permissions.query({ name } as PermissionDescriptor);
    return r.state;
  } catch {
    return null;
  }
}

function apiOrigin(): string {
  return siteConfig.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
}

export default function InterviewCheckScreen({ company, role, onJoin }: Props) {

  const [steps, setSteps] = useState<Record<StepKey, StepState>>({
    mic:        { status: 'idle', label: '', error: '' },
    camera:     { status: 'idle', label: '', error: '' },
    connection: { status: 'idle', label: '', error: '' },
  });

  const [micLevel, setMicLevel] = useState(0);

  const [connResult, setConnResult] = useState<{
    downloadMbps: number;
    latencyMs: number;
    quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  } | null>(null);

  const [allPassed, setAllPassed] = useState(false);
  const [consentAll, setConsentAll] = useState(false);
  const [bypassed, setBypassed] = useState(false);

  const streamRef   = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef      = useRef<number | null>(null);

  const { start: audioStart, stop: audioStop } = useSafeMediaStream({ constraints: { audio: true }, enabled: true });
  const { start: camStart, stop: camStop } = useSafeMediaStream({ constraints: { video: true, audio: false }, enabled: true });

  useEffect(() => {
    return () => {
      if (rafRef.current)      cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
      audioStop();
      camStop();
    };
  }, [audioStop, camStop]);

  const setStep = useCallback((key: StepKey, patch: Partial<StepState>) => {
    setSteps(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }, []);

  const startMicMeter = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const an  = ctx.createAnalyser();
      an.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(an);
      audioCtxRef.current = ctx;
      analyserRef.current = an;
      const buf = new Uint8Array(an.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buf);
        const avg = buf.reduce((s, v) => s + v, 0) / buf.length;
        setMicLevel(Math.round((avg / 255) * 100));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {}
  }, []);

  const stopMicMeter = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    analyserRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setMicLevel(0);
  }, []);

  const checkMic = useCallback(async (): Promise<boolean> => {
    setStep('mic', { status: 'checking', error: '' });

    const perm = await queryPerm('microphone');
    if (perm === 'denied') {
      setStep('mic', {
        status: 'fail',
        error: 'Microphone is blocked. Click the lock icon in the address bar, allow mic, then retry.',
      });
      return false;
    }

    try {

      streamRef.current?.getTracks().forEach(t => t.stop());
      stopMicMeter();

      const stream = await audioStart();
      if (!stream) {
        setStep('mic', {
          status: 'fail',
          error: 'Microphone access denied. Allow it in your browser, then retry.',
        });
        return false;
      }
      streamRef.current = stream;
      startMicMeter(stream);

      const deviceLabel = stream.getAudioTracks()[0]?.label || 'Default microphone';
      setStep('mic', { status: 'pass', label: deviceLabel, error: '' });
      return true;
    } catch (e) {
      const name = e instanceof DOMException ? e.name : '';
      setStep('mic', {
        status: 'fail',
        error: name === 'NotFoundError'
          ? 'No microphone found. Plug one in and retry.'
          : 'Microphone access denied. Allow it in your browser, then retry.',
      });
      return false;
    }
  }, [setStep, startMicMeter, stopMicMeter, audioStart]);

  const checkCamera = useCallback(async (): Promise<boolean> => {
    setStep('camera', { status: 'checking', error: '' });

    const perm = await queryPerm('camera');
    if (perm === 'denied') {
      setStep('camera', {
        status: 'fail',
        error: 'Camera is blocked. Click the lock icon in the address bar, allow camera, then retry.',
      });
      return false;
    }

    try {
      const stream = await camStart();
      if (!stream) {
        setStep('camera', {
          status: 'fail',
          error: 'Camera access denied. Allow it in your browser, then retry.',
        });
        return false;
      }
      const cfg    = stream.getVideoTracks()[0]?.getSettings() ?? {};
      stream.getTracks().forEach(t => t.stop());

      const label = `${cfg.width ?? '?'}×${cfg.height ?? '?'} @ ${Math.round(cfg.frameRate ?? 0)} fps`;
      setStep('camera', { status: 'pass', label, error: '' });
      return true;
    } catch (e) {
      const name = e instanceof DOMException ? e.name : '';
      setStep('camera', {
        status: 'fail',
        error: name === 'NotFoundError'
          ? 'No camera found. Connect a webcam and retry.'
          : 'Camera access denied. Allow it in your browser, then retry.',
      });
      return false;
    }
  }, [setStep, camStart]);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    setStep('connection', { status: 'checking', error: '' });
    setConnResult(null);

    const origin = apiOrigin();

    const getLatency = async (): Promise<number> => {
      const samples: number[] = [];
      for (let i = 0; i < 3; i++) {
        const ctrl = new AbortController();
        const tid  = setTimeout(() => ctrl.abort(), 4000);
        const t0   = Date.now();
        try {
          await fetch(`${origin}/api/v1/ping`, { cache: 'no-store', signal: ctrl.signal });
          samples.push(Date.now() - t0);
        } catch {}
        finally { clearTimeout(tid); }
        if (i < 2) await new Promise(r => setTimeout(r, 60));
      }
      if (samples.length === 0) return 9999;
      samples.sort((a, b) => a - b);
      return samples[Math.floor(samples.length / 2)];
    };

    const getDownload = async (): Promise<number> => {
      const BYTES = 1024 * 1024;
      const ctrl  = new AbortController();
      const tid   = setTimeout(() => ctrl.abort(), 20000);
      try {
        const t0 = Date.now();
        const r  = await fetch(`${origin}/api/v1/speedtest`, { cache: 'no-store', signal: ctrl.signal });
        await r.arrayBuffer();
        clearTimeout(tid);
        const secs = (Date.now() - t0) / 1000;
        if (secs < 0.005) return 0;
        return parseFloat(((BYTES / 1024 / 1024) * 8 / secs).toFixed(1));
      } catch {
        clearTimeout(tid);
        return 0;
      }
    };

    const [latencyMs, downloadMbps] = await Promise.all([getLatency(), getDownload()]);

    if (latencyMs === 9999 && downloadMbps === 0) {
      setStep('connection', {
        status: 'fail',
        error: 'Cannot reach the NextRound server. Make sure the API is running, then retry.',
      });
      return false;
    }

    const quality =
      downloadMbps >= 10 && latencyMs < 80  ? 'Excellent' as const :
      downloadMbps >= 4  && latencyMs < 150 ? 'Good'      as const :
      downloadMbps >= 1  && latencyMs < 300 ? 'Fair'      as const :
                                              'Poor'      as const;

    setConnResult({ downloadMbps, latencyMs, quality });
    setStep('connection', {
      status: 'pass',
      label: `${downloadMbps} Mbps · ${latencyMs} ms · ${quality}`,
      error: '',
    });
    return true;
  }, [setStep]);

  const runAll = useCallback(async (from: StepKey = 'mic') => {
    const order: StepKey[] = ['mic', 'camera', 'connection'];
    const runners: Record<StepKey, () => Promise<boolean>> = {
      mic:        checkMic,
      camera:     checkCamera,
      connection: checkConnection,
    };

    for (let i = order.indexOf(from); i < order.length; i++) {
      const key = order[i];
      const ok  = await runners[key]();
      if (!ok) return;
      await new Promise(r => setTimeout(r, 300));
    }
    setAllPassed(true);
  }, [checkMic, checkCamera, checkConnection]);

  useEffect(() => { runAll(); }, [runAll]);

  const launch = () => {
    if (!bypassed && !consentAll) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setMicLevel(0);
    audioStop();
    camStop();
    streamRef.current = null;

    if (!bypassed && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    onJoin(bypassed);
  };

  const activeStep = (['mic', 'camera', 'connection'] as StepKey[]).find(
    k => steps[k].status === 'checking'
  );

  const QUALITY_COLOR = {
    Excellent: 'text-emerald-500',
    Good:      'text-emerald-400',
    Fair:      'text-amber-500',
    Poor:      'text-red-500',
  };

  const QUALITY_BAR = {
    Excellent: 'bg-emerald-500',
    Good:      'bg-emerald-400',
    Fair:      'bg-amber-400',
    Poor:      'bg-red-500',
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center font-sans overflow-y-auto">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm px-6 py-10">

        <div className="flex flex-col items-center gap-3">
          <div className={`h-14 w-14 rounded-full flex items-center justify-center transition-colors duration-300 ${
            allPassed
              ? 'bg-emerald-950/60 text-emerald-400'
              : activeStep
              ? 'bg-slate-800 text-orange-400'
              : 'bg-slate-800 text-slate-400'
          }`}>
            <Shield className="h-7 w-7" />
          </div>

          <div className="flex items-center gap-2.5">
            <CompanyLogo name={company} size="sm" className="flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-100 truncate">{company}</p>
              <p className="text-[11px] text-slate-400 truncate">{role}</p>
            </div>
          </div>
        </div>

        <div className="w-full space-y-3">

          <StepCard
            icon={steps.mic.status === 'fail' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            title="MICROPHONE"
            status={steps.mic.status}
            label={steps.mic.label}
            error={steps.mic.error}
            onRetry={() => runAll('mic')}
          >
            {(steps.mic.status === 'checking' || steps.mic.status === 'pass') && (
              <div className="mt-2 space-y-1">
                <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-75"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  {micLevel === 0 ? 'Speak to test…' : `Input level ${micLevel}%`}
                </p>
              </div>
            )}
          </StepCard>

          <StepCard
            icon={steps.camera.status === 'fail' ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            title="CAMERA"
            status={steps.camera.status}
            label={steps.camera.label}
            error={steps.camera.error}
            onRetry={() => runAll('camera')}
          />

          <StepCard
            icon={steps.connection.status === 'fail' ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
            title="CONNECTION"
            status={steps.connection.status}
            label={connResult ? undefined : steps.connection.label}
            error={steps.connection.error}
            onRetry={() => runAll('connection')}
            qualityBadge={connResult ? (
              <span className={`text-[10px] font-extrabold uppercase tracking-wider ${QUALITY_COLOR[connResult.quality]}`}>
                {connResult.quality}
              </span>
            ) : undefined}
          >
            {connResult && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SpeedMetric
                  label="DOWNLOAD"
                  value={connResult.downloadMbps}
                  unit="Mbps"
                  fill={Math.min(100, (connResult.downloadMbps / 50) * 100)}
                  barClass={QUALITY_BAR[connResult.quality]}
                />
                <SpeedMetric
                  label="LATENCY"
                  value={connResult.latencyMs}
                  unit="ms"
                  fill={Math.max(0, 100 - (connResult.latencyMs / 400) * 100)}
                  barClass={
                    connResult.latencyMs < 80  ? 'bg-emerald-500' :
                    connResult.latencyMs < 200 ? 'bg-amber-400'   : 'bg-red-500'
                  }
                />
              </div>
            )}

            {steps.connection.status === 'checking' && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SkeletonMetric label="DOWNLOAD" />
                <SkeletonMetric label="LATENCY" />
              </div>
            )}
          </StepCard>
        </div>

        {allPassed && (
          <div className="w-full space-y-4 pt-1 animate-in fade-in duration-300">
            {!bypassed ? (
              <>
                <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1.5 mb-2">
                  Proctoring Consent
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={consentAll}
                      onChange={e => setConsentAll(e.target.checked)}
                      className="mt-0.5 rounded border-slate-600 bg-slate-800 text-emerald-500 h-4 w-4 cursor-pointer flex-shrink-0"
                    />
                    <span className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                      I consent to full-screen mode, camera &amp; microphone streaming, and automated proctoring verification during this assessment.
                    </span>
                  </label>
                </div>

                <button
                  disabled={!consentAll}
                  onClick={launch}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed mt-2"
                >
                  <Maximize2 className="h-4 w-4" />
                  Start Secure Assessment
                </button>
              </>
            ) : (
              <div className="p-4 rounded-2xl border border-sky-800/40 bg-sky-950/20 text-sky-300 space-y-3">
                <p className="text-xs leading-relaxed font-semibold">
                  <strong>Alternative Integrity Flow Enabled:</strong> Proctoring telemetry analysis will be deactivated for this session. Manual HR identity check and post-assessment verification will be performed instead.
                </p>
                <button
                  onClick={launch}
                  className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Start Assessment (Bypassed)
                </button>
              </div>
            )}

            <div className="text-center pt-2 border-t border-slate-850 mt-2">
              <button
                type="button"
                onClick={() => setBypassed(!bypassed)}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-350 underline transition-colors cursor-pointer"
              >
                {bypassed
                  ? 'Return to Standard Proctoring Flow'
                  : 'Need accessibility or technical accommodation? Request alternate flow'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  status: StepStatus;
  label?: string;
  error?: string;
  onRetry: () => void;
  qualityBadge?: React.ReactNode;
  children?: React.ReactNode;
}

function StepCard({ icon, title, status, label, error, onRetry, qualityBadge, children }: StepCardProps) {
  const borderClass =
    status === 'pass'     ? 'border-emerald-800/60' :
    status === 'fail'     ? 'border-red-800/60'     :
    status === 'checking' ? 'border-orange-800/40'  :
                            'border-slate-800';

  const iconColor =
    status === 'pass'     ? 'text-emerald-400' :
    status === 'fail'     ? 'text-red-400'     :
    status === 'checking' ? 'text-orange-400'  :
                            'text-slate-500';

  return (
    <div className={`rounded-2xl border bg-slate-900 px-4 py-3 transition-colors duration-300 ${borderClass}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`flex-shrink-0 transition-colors duration-300 ${iconColor}`}>
            {icon}
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
              {title}
            </span>
            {label && status === 'pass' && (
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{label}</p>
            )}
            {error && status === 'fail' && (
              <p className="text-[10px] text-red-400 leading-snug mt-0.5">{error}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {qualityBadge}
          {status === 'checking' && (
            <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
          )}
          {status === 'pass' && (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          )}
          {status === 'fail' && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-[10px] font-bold transition-all cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          )}
          {status === 'idle' && (
            <span className="h-4 w-4 rounded-full border border-slate-700" />
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

function SpeedMetric({
  label, value, unit, fill, barClass,
}: {
  label: string; value: number; unit: string; fill: number; barClass: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[9px] font-extrabold tracking-widest text-slate-500 uppercase">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black text-slate-100 tabular-nums leading-none">{value}</span>
        <span className="text-[10px] font-bold text-slate-500">{unit}</span>
      </div>
      <div className="h-0.5 w-full bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barClass}`}
          style={{ width: `${fill}%` }}
        />
      </div>
    </div>
  );
}

function SkeletonMetric({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[9px] font-extrabold tracking-widest text-slate-500 uppercase">{label}</span>
      <div className="h-6 w-14 bg-slate-800 rounded animate-pulse" />
      <div className="h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full w-1/4 bg-slate-700 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
