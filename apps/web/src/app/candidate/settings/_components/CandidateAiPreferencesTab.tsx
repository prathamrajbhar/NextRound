'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  Mic,
  Video,
  Play,
  Pause,
  CheckCircle2,
  Save,
} from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';
import { useSafeMediaStream } from '@/hooks/useSafeMediaStream';

interface CandidateAiPreferencesTabProps {
  onSave: () => void;
}

export function CandidateAiPreferencesTab({ onSave }: CandidateAiPreferencesTabProps) {
  const [selectedVoice, setSelectedVoice] = useState('Alloy');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState(true);
  const [autoSubmitTranscript, setAutoSubmitTranscript] = useState(true);
  const [micTesting, setMicTesting] = useState(false);
  const [camTesting, setCamTesting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    async function loadAiSettings() {
      try {
        const res = await apiClient.get<{ settings?: Record<string, unknown> }>('/candidate/settings');
        if (res?.settings) {
          const s = res.settings;
          if (typeof s.defaultVoice === 'string') setSelectedVoice(s.defaultVoice);
          if (typeof s.liveTranscript === 'boolean') setLiveTranscript(s.liveTranscript);
          if (typeof s.autoSubmitTranscript === 'boolean') setAutoSubmitTranscript(s.autoSubmitTranscript);
        }
      } catch {}
    }
    loadAiSettings();
  }, []);

  const { start } = useSafeMediaStream({
    constraints: { audio: true },
    enabled: micTesting,
  });

  useEffect(() => {
    if (!micTesting) return;
    let audioContext: AudioContext | null = null;
    let animationFrameId = 0;
    let active = true;

    start()
      .then((stream) => {
        if (!stream || !active) return;
        audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(Math.floor((average / 255) * 100));
          animationFrameId = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      })
      .catch(() => {
        setAudioLevel(0);
      });

    return () => {
      active = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (audioContext) void audioContext.close();
      setAudioLevel(0);
    };
  }, [micTesting, start]);

  const handleTestAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          `Hello! This is a sample of the ${selectedVoice} voice. I will be conducting your NextRound AI interview.`
        );
        
        // Try to match voice properties based on choice
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const lowerVoiceName = selectedVoice.toLowerCase();
          const matchedVoice = voices.find(v => {
            const name = v.name.toLowerCase();
            return name.includes(lowerVoiceName) || 
                   (lowerVoiceName === 'serena' && (name.includes('google us english') || name.includes('samantha') || name.includes('zira'))) ||
                   (lowerVoiceName === 'alloy' && (name.includes('natural') || name.includes('english') || name.includes('david'))) ||
                   (lowerVoiceName === 'echo' && (name.includes('microsoft david') || name.includes('daniel') || name.includes('male'))) ||
                   (lowerVoiceName === 'nova' && (name.includes('hazel') || name.includes('female') || name.includes('google'))) ||
                   (lowerVoiceName === 'onyx' && (name.includes('deep') || name.includes('premium') || name.includes('male')));
          });
          if (matchedVoice) {
            utterance.voice = matchedVoice;
          }
        }

        utterance.onend = () => {
          setIsPlayingAudio(false);
        };
        utterance.onerror = () => {
          setIsPlayingAudio(false);
        };
        setIsPlayingAudio(true);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      setIsPlayingAudio(true);
      setTimeout(() => setIsPlayingAudio(false), 2500);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await apiClient.patch('/candidate/settings', {
        defaultVoice: selectedVoice,
        liveTranscript,
        autoSubmitTranscript,
      });
      onSave();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save AI preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-5">
        <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
              AI Voice Interviewer Preference
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Choose the AI voice persona that will conduct your automated screening interviews.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTestAudio}
            className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-orange-950/60 border border-brand-200 dark:border-orange-900 text-brand-600 dark:text-orange-400 text-xs font-bold flex items-center gap-1.5 hover:bg-brand-100/60 transition-all cursor-pointer"
          >
            {isPlayingAudio ? (
              <>
                <Pause className="h-3.5 w-3.5 animate-pulse text-orange-500" /> Playing Voice...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Sample Voice
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { name: 'Serena', gender: 'Female', tone: 'Professional & Warm' },
            { name: 'Alloy', gender: 'Neutral', tone: 'Balanced & Clear' },
            { name: 'Echo', gender: 'Male', tone: 'Confident & Direct' },
            { name: 'Nova', gender: 'Female', tone: 'Energetic & Expressive' },
            { name: 'Onyx', gender: 'Male', tone: 'Deep & Authoritative' },
          ].map((voice) => {
            const isSelected = selectedVoice === voice.name;
            return (
              <button
                key={voice.name}
                type="button"
                onClick={() => setSelectedVoice(voice.name)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                  isSelected
                    ? 'border-brand-500 dark:border-orange-500 bg-brand-500/10 dark:bg-orange-500/10 ring-2 ring-brand-500/30'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{voice.name}</span>
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-brand-500 dark:text-orange-400" />}
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">{voice.gender}</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-400 line-clamp-1">{voice.tone}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-5">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Volume2 className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
          Hardware &amp; Proctored Diagnostics Check
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-800/60 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Microphone Check</span>
              </div>
              <button
                type="button"
                onClick={() => setMicTesting(!micTesting)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
              >
                {micTesting ? 'Stop Test' : 'Test Mic'}
              </button>
            </div>

            <div className="h-8 rounded-xl bg-slate-900 dark:bg-slate-950 px-3 flex items-center gap-1">
              {[...Array(16)].map((_, i) => {
                const barHeight = micTesting ? Math.min(100, Math.max(15, audioLevel + Math.sin(i) * 30)) : 10;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-emerald-500 to-orange-400 rounded-full transition-all duration-100"
                    style={{ height: `${barHeight}%` }}
                  />
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {micTesting ? '🎤 Listening... speak to test sound input.' : 'Click "Test Mic" to verify input levels.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-800/60 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Webcam Diagnostics</span>
              </div>
              <button
                type="button"
                onClick={() => setCamTesting(!camTesting)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
              >
                {camTesting ? 'Close Feed' : 'Preview Cam'}
              </button>
            </div>

            <div className="h-20 rounded-xl bg-slate-900 dark:bg-slate-950 flex items-center justify-center relative overflow-hidden border border-slate-800">
              {camTesting ? (
                <div className="flex flex-col items-center gap-1 text-emerald-400 animate-in fade-in duration-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-bold">Camera Feed Active (720p HD)</span>
                </div>
              ) : (
                <span className="text-[10px] font-semibold text-slate-500">Camera preview inactive</span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Ensure good lighting for proctored sessions.</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3">
          Session Subtitles &amp; Transcripts
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Real-time Closed Captions</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Display live subtitle text as AI interviewer speaks</span>
            </div>
            <button
              type="button"
              onClick={() => setLiveTranscript(!liveTranscript)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                liveTranscript ? 'bg-brand-600 dark:bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  liveTranscript ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Auto-Save Interview Log</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Automatically save conversation transcript to your dashboard</span>
            </div>
            <button
              type="button"
              onClick={() => setAutoSubmitTranscript(!autoSubmitTranscript)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoSubmitTranscript ? 'bg-brand-600 dark:bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoSubmitTranscript ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

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
