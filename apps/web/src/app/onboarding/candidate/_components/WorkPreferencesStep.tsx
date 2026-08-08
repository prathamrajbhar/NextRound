'use client';

import React from 'react';
import { Sun, Clock } from '@/lib/lucide-google-icons';
import { OnboardingStepProps, WorkMode } from './useCandidateOnboarding';
import { labelCls, TagInput } from './CandidateOnboardingShell';

const WORK_MODES: WorkMode[] = ['Remote', 'Hybrid', 'Onsite'];

const AVAILABILITY_SLOTS = [
  { key: 'weekday', label: 'Weekdays' },
  { key: 'weekend', label: 'Weekends' },
] as const;

const AVAILABILITY_TIMES = [
  { key: 'morning', label: 'Morning (9a–12p)' },
  { key: 'afternoon', label: 'Afternoon (12p–5p)' },
  { key: 'evening', label: 'Evening (5p–9p)' },
] as const;

export function WorkPreferencesStep({ form, update, addTag, removeTag }: OnboardingStepProps) {
  const toggleAvailability = (key: keyof typeof form.availability) => {
    update('availability', { ...form.availability, [key]: !form.availability[key] });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <label className={labelCls}>Preferred Work Mode</label>
        <div className="flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 select-none text-xs sm:text-sm font-black text-slate-400 gap-1.5 shadow-sm">
          {WORK_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => update('workMode', mode)}
              className={`flex-1 py-3 rounded-xl transition-all cursor-pointer ${
                form.workMode === mode ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <TagInput
        label="Target Locations"
        placeholder="e.g. Bengaluru, Mumbai, Remote (IN)"
        hint="Cities or regions you can work from. Leave open to match anywhere."
        tags={form.targetLocations}
        onAdd={(v) => addTag('targetLocations', v)}
        onRemove={(v) => removeTag('targetLocations', v)}
      />

      <div>
        <label className={`flex items-center gap-2 ${labelCls}`}>
          <Clock className="h-4 w-4 text-orange-400" />
          Interview Availability
        </label>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY_SLOTS.map((slot) => (
            <button
              key={slot.key}
              type="button"
              onClick={() => toggleAvailability(slot.key)}
              className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                form.availability[slot.key]
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-2.5">
          {AVAILABILITY_TIMES.map((slot) => (
            <button
              key={slot.key}
              type="button"
              onClick={() => toggleAvailability(slot.key)}
              className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                form.availability[slot.key]
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-2.5">
          <Sun className="h-4 w-4 text-amber-400" />
          The scheduler agent uses this to propose slots for AI voice interviews.
        </p>
      </div>
    </div>
  );
}
