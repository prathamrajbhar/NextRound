'use client';

import React from 'react';
import { Calendar, Clock, Bell } from '@/lib/lucide-google-icons';
import { CompanyStepProps, AvailabilitySlots } from './useCompanyOnboarding';
import { labelCls } from './CompanyOnboardingShell';

const DAYS: Array<{ key: keyof AvailabilitySlots; label: string }> = [
  { key: 'weekday', label: 'Weekdays (Mon–Fri)' },
  { key: 'weekend', label: 'Weekends' },
];

const TIMES = [
  { key: 'morning', label: 'Morning · 9a–12p' },
  { key: 'afternoon', label: 'Afternoon · 12p–5p' },
  { key: 'evening', label: 'Evening · 5p–9p' },
] as const;

export function SchedulingAutomationStep({ form, update }: CompanyStepProps) {
  const toggle = (day: keyof AvailabilitySlots, time: (typeof TIMES)[number]['key']) => {
    const next: AvailabilitySlots = {
      ...form.availabilityHours,
      [day]: { ...form.availabilityHours[day], [time]: !form.availabilityHours[day][time] },
    };
    update('availabilityHours', next);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <label className={labelCls}>When should the AI Scheduler book interviews?</label>
        <p className="text-[10px] text-slate-500 mb-3">
          The Scheduler Agent proposes slots to candidates within these windows.
        </p>
        <div className="space-y-2">
          {DAYS.map((day) => (
            <div
              key={day.key}
              className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center p-3 rounded-xl border border-white/10 bg-white/5"
            >
              <span className="text-xs font-bold text-slate-200">{day.label}</span>
              <div className="flex flex-wrap gap-1.5">
                {TIMES.map((time) => (
                  <button
                    key={time.key}
                    type="button"
                    onClick={() => toggle(day.key, time.key)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      form.availabilityHours[day.key][time.key]
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {time.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-300 border border-indigo-500/30 shrink-0">
          <Calendar className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-white flex items-center gap-1.5">
            Google Calendar sync <Bell className="h-3.5 w-3.5 text-slate-500" />
          </p>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Connect your calendar later from <span className="text-slate-200 font-semibold">Settings → Scheduling</span> to auto-block busy time and avoid double-booking. Not required to launch.
          </p>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
        <Clock className="h-3.5 w-3.5" />
        You can always adjust availability windows from the HR Settings page after launch.
      </p>
    </div>
  );
}
