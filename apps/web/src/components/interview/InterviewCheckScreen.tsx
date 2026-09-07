'use client';

import React, { useState } from 'react';
import {
  Mic, MicOff,
  Video, VideoOff,
  Wifi, WifiOff,
  Maximize2,
  Shield,
} from '@/lib/lucide-google-icons';
import { CompanyLogo } from '@/components/ui';
import { StepKey, InterviewCheckProps } from './check/types';
import { StepCard, SpeedMetric, SkeletonMetric } from './check/CheckCards';
import { useSystemCheck } from './check/useSystemCheck';

const QUALITY_COLOR = {
  Excellent: 'text-emerald-500',
  Good: 'text-emerald-400',
  Fair: 'text-amber-500',
  Poor: 'text-red-500',
};

const QUALITY_BAR = {
  Excellent: 'bg-emerald-500',
  Good: 'bg-emerald-400',
  Fair: 'bg-amber-400',
  Poor: 'bg-red-500',
};

export default function InterviewCheckScreen({ company, role, onJoin }: InterviewCheckProps) {
  const { steps, micLevel, connResult, allPassed, runAll, cleanup } = useSystemCheck();
  const [consentAll, setConsentAll] = useState(false);

  const launch = () => {
    if (!consentAll) return;
    cleanup();

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    onJoin();
  };

  const activeStep = (['mic', 'camera', 'connection'] as StepKey[]).find(
    (k) => steps[k].status === 'checking'
  );

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center font-sans overflow-y-auto">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm px-6 py-10">
        <div className="flex flex-col items-center gap-3">
          <div
            className={`h-14 w-14 rounded-full flex items-center justify-center transition-colors duration-300 ${
              allPassed
                ? 'bg-emerald-950/60 text-emerald-400'
                : activeStep
                ? 'bg-slate-800 text-orange-400'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
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
            qualityBadge={
              connResult ? (
                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${QUALITY_COLOR[connResult.quality]}`}>
                  {connResult.quality}
                </span>
              ) : undefined
            }
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
                    connResult.latencyMs < 80
                      ? 'bg-emerald-500'
                      : connResult.latencyMs < 200
                      ? 'bg-amber-400'
                      : 'bg-red-500'
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
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1.5 mb-2">
              Proctoring Consent
            </div>

            <div className="space-y-2.5">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentAll}
                  onChange={(e) => setConsentAll(e.target.checked)}
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
          </div>
        )}
      </div>
    </div>
  );
}
