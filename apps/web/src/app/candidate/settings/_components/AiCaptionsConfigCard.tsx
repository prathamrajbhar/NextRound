'use client';

import React from 'react';

interface AiCaptionsConfigCardProps {
  liveTranscript: boolean;
  setLiveTranscript: (val: boolean) => void;
  autoSubmitTranscript: boolean;
  setAutoSubmitTranscript: (val: boolean) => void;
}

export function AiCaptionsConfigCard({
  liveTranscript,
  setLiveTranscript,
  autoSubmitTranscript,
  setAutoSubmitTranscript,
}: AiCaptionsConfigCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3">
        Session Subtitles &amp; Transcripts
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Real-time Closed Captions
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              Display live subtitle text as AI interviewer speaks
            </span>
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
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Auto-Save Interview Log
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              Automatically save conversation transcript to your dashboard
            </span>
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
  );
}
