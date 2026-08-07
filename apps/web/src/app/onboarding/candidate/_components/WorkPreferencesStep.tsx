'use client';

import React from 'react';
import { Sun, Clock } from '@/lib/lucide-google-icons';
import { OnboardingStepProps, WorkMode } from './useCandidateOnboarding';
import { TagInput } from './CandidateOnboardingShell';

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
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <label className="block text-[11px] font-bold text-slate-300 mb-2">Preferred Work Mode</label>
        <div className="flex p-1 rounded-xl bg-slate-900/60 border border-white/10 select-none text-xs font-bold text-slate-400">
          {WORK_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => update('workMode', mode)}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                form.workMode === mode ? 'bg-orange-600 text-white shadow-md' : 'hover:text-white'
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
        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 mb-2">
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          Interview Availability
        </label>
        <div className="flex flex-wrap gap-1.5">
          {AVAILABILITY_SLOTS.map((slot) => (
            <button
              key={slot.key}
              type="button"
              onClick={() => toggleAvailability(slot.key)}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                form.availability[slot.key]
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {AVAILABILITY_TIMES.map((slot) => (
            <button
              key={slot.key}
              type="button"
              onClick={() => toggleAvailability(slot.key)}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                form.availability[slot.key]
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>
        <p className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-2">
          <Sun className="h-3.5 w-3.5" />
          The scheduler agent uses this to propose slots for AI voice interviews.
        </p>
      </div>
    </div>
  );
}
