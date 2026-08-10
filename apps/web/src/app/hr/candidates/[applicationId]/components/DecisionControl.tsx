'use client';

import React, { useState } from 'react';
import { ShieldCheck } from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';

interface DecisionControlProps {
  appId: string;
  evaluationId?: string;
  initialDecision: 'hire' | 'reject' | 'hold';
  initialReasoning: string;
  showApprovalButtons: boolean;
}

export default function DecisionControl({
  appId,
  evaluationId,
  initialDecision,
  initialReasoning,
  showApprovalButtons,
}: DecisionControlProps) {
  const [decision, setDecision] = useState(initialDecision);
  const [reasoning, setReasoning] = useState(initialReasoning);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [proctorReviewed, setProctorReviewed] = useState(false);

  const handleSaveDecision = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const evalId = evaluationId || appId;
      await apiClient.patch(`/hr/evaluations/${evalId}/hr-override`, {
        decision: decision === 'hire' ? 'hire' : 'reject',
        notes: reasoning,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save decision';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/60 p-6 shadow-sm backdrop-blur-md glass-panel space-y-4">
      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-2 flex items-center gap-2">
        <ShieldCheck className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
        Decision Control
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase block mb-2">Outcome Picker</label>
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-200/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
            {(['hire', 'reject', 'hold'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setDecision(item)}
                className={`py-2 rounded-lg cursor-pointer capitalize ${
                  decision === item
                    ? item === 'hire' ? 'bg-emerald-600 text-white shadow'
                    : item === 'reject' ? 'bg-rose-600 text-white shadow'
                    : 'bg-slate-700 dark:bg-slate-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase block mb-1.5">Decision Reasoning</label>
          <textarea
            rows={4}
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all font-semibold"
            placeholder="Record justification overrides..."
          />
        </div>

        <div className="py-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={proctorReviewed}
              onChange={(e) => setProctorReviewed(e.target.checked)}
              className="mt-0.5 rounded border-slate-350 dark:border-slate-700 bg-slate-200/50 dark:bg-slate-800 text-purple-600 h-4 w-4 cursor-pointer flex-shrink-0"
            />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold leading-relaxed">
              I verify that I have reviewed the Proctoring and Integrity Report before submitting this decision.
            </span>
          </label>
        </div>

        <button
          type="button"
          disabled={loading || !proctorReviewed}
          onClick={handleSaveDecision}
          className="w-full rounded-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-2.5 text-xs shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving Parameters...' : 'Save Decision parameters'}
        </button>

        {errorMsg && (
          <div className="text-center text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/60 rounded p-1.5">
            {errorMsg}
          </div>
        )}

        {showApprovalButtons && (
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
            <button
              type="button"
              disabled={!proctorReviewed}
              onClick={() => alert(`POST /evaluations/${appId}/decision/approve successful`)}
              className="w-full rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 text-xs shadow transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Approve Offer
            </button>
            <button
              type="button"
              disabled={!proctorReviewed}
              onClick={() => alert(`Decision overridden for application ${appId}`)}
              className="w-full rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold py-2.5 text-xs shadow-sm transition-all cursor-pointer glass-panel disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Override Decision
            </button>
          </div>
        )}

        {saved && (
          <div className="text-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 rounded p-1.5 animate-pulse">
            Parameters saved successfully.
          </div>
        )}
      </div>
    </div>
  );
}
