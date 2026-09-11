'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Save } from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';
import { useHardwareDiagnostics } from './useHardwareDiagnostics';
import { WebcamDiagnosticCard } from './WebcamDiagnosticCard';
import { MicDiagnosticCard } from './MicDiagnosticCard';
import { ScreenShareDiagnosticCard } from './ScreenShareDiagnosticCard';
import { LatencyDiagnosticCard } from './LatencyDiagnosticCard';
import { AiCaptionsConfigCard } from './AiCaptionsConfigCard';

interface CandidateAiPreferencesTabProps {
  onSave: () => void;
}

export function CandidateAiPreferencesTab({ onSave }: CandidateAiPreferencesTabProps) {
  const [liveTranscript, setLiveTranscript] = useState(true);
  const [autoSubmitTranscript, setAutoSubmitTranscript] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const diag = useHardwareDiagnostics();

  useEffect(() => {
    async function loadAiSettings() {
      try {
        const res = await apiClient.get<{ settings?: Record<string, unknown> }>('/candidate/settings');
        if (res?.settings) {
          const s = res.settings;
          if (typeof s.liveTranscript === 'boolean') setLiveTranscript(s.liveTranscript);
          if (typeof s.autoSubmitTranscript === 'boolean') setAutoSubmitTranscript(s.autoSubmitTranscript);
        }
      } catch {
        // Non-blocking initial preferences load
      }
    }
    loadAiSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await apiClient.patch('/candidate/settings', {
        liveTranscript,
        autoSubmitTranscript,
      });
      onSave();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-8">
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
          Hardware &amp; Security Diagnostics Check
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 leading-relaxed">
          Verify your camera feed, microphone levels, screen sharing settings, and network speed before starting your proctored assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <WebcamDiagnosticCard
            camTesting={diag.camTesting}
            setCamTesting={diag.setCamTesting}
            hasCamPermission={diag.hasCamPermission}
            videoRef={diag.videoRef}
            videoDevices={diag.videoDevices}
            selectedVideoDeviceId={diag.selectedVideoDeviceId}
            setSelectedVideoDeviceId={diag.setSelectedVideoDeviceId}
          />

          <MicDiagnosticCard
            micTesting={diag.micTesting}
            setMicTesting={diag.setMicTesting}
            micLevel={diag.micLevel}
            audioDevices={diag.audioDevices}
            selectedAudioDeviceId={diag.selectedAudioDeviceId}
            setSelectedAudioDeviceId={diag.setSelectedAudioDeviceId}
          />
        </div>

        <div className="space-y-6">
          <ScreenShareDiagnosticCard
            screenShareVerified={diag.screenShareVerified}
            screenShareError={diag.screenShareError}
            onTest={diag.handleScreenShareTest}
          />

          <LatencyDiagnosticCard
            latencyStatus={diag.latencyStatus}
            latencyMs={diag.latencyMs}
            jitterMs={diag.jitterMs}
            onTest={diag.handleLatencyTest}
          />
        </div>
      </div>

      <AiCaptionsConfigCard
        liveTranscript={liveTranscript}
        setLiveTranscript={setLiveTranscript}
        autoSubmitTranscript={autoSubmitTranscript}
        setAutoSubmitTranscript={setAutoSubmitTranscript}
      />

      <div className="flex justify-end items-center gap-3">
        {saveError && (
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60">
            ⚠️ {saveError}
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save AI Preferences'}
        </button>
      </div>
    </div>
  );
}
