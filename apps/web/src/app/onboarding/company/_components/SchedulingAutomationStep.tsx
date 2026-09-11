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
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <label className={labelCls}>When should the AI Scheduler book interviews?</label>
        <p className="text-xs text-slate-400 mb-3.5">
          The Scheduler Agent proposes slots to candidates within these windows.
        </p>
        <div className="space-y-2.5">
          {DAYS.map((day) => (
            <div
              key={day.key}
              className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center p-4 rounded-xl border border-slate-800 bg-slate-900/60"
            >
              <span className="text-sm font-bold text-slate-200">{day.label}</span>
              <div className="flex flex-wrap gap-2">
                {TIMES.map((time) => (
                  <button
                    key={time.key}
                    type="button"
                    onClick={() => toggle(day.key, time.key)}
                    className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                      form.availabilityHours[day.key][time.key]
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
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

      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-3.5">
        <div className="h-10 w-10 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400 border border-orange-500/30 shrink-0">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-white flex items-center gap-1.5">
            Google Calendar sync <Bell className="h-3.5 w-3.5 text-slate-500" />
          </p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Connect your calendar later from <span className="text-slate-200 font-semibold">Settings → Scheduling</span> to auto-block busy time and avoid double-booking.
          </p>
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-slate-400">
        <Clock className="h-4 w-4 text-orange-400 shrink-0" />
        You can always adjust availability windows from the HR Settings page after launch.
      </p>
    </div>
  );
}
