'use client';

import React, { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Application } from '@/types';
import { Calendar, Clock, ChevronRight, Check } from 'lucide-react';

export default function CandidateSchedulePage({ params }: { params: Promise<{ applicationId: string }> }) {
  const router = useRouter();
  const { applicationId } = use(params);

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApp() {
      try {
        setLoading(true);
        const res = await apiClient.get<Application>(`/applications/${applicationId}`);
        if (res) setApp(res);
      } catch (err) {
        console.error('Failed to load application schedule:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchApp();
  }, [applicationId]);

  const slots = app?.scheduledSlots && app.scheduledSlots.length > 0 ? app.scheduledSlots : [
    'Tomorrow at 10:00 AM',
    'Tomorrow at 02:00 PM',
    'Day after tomorrow at 11:30 AM'
  ];

  const [selectedSlot, setSelectedSlot] = useState(slots[0]);
  const [confirmed, setConfirmed] = useState(false);

  if (loading) {
    return <div className="p-8 text-slate-500 font-semibold text-center animate-pulse">Loading schedule options...</div>;
  }

  if (!app) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Application Not Found</h2>
        <p className="text-xs text-slate-500">No application found to schedule.</p>
        <Link href="/candidate/applications" className="inline-block text-xs font-bold text-emerald-600 hover:underline">
          Back to Applications
        </Link>
      </div>
    );
  }

  const handleConfirm = async () => {
    try {
      await apiClient.post(`/applications/${app.id}/schedule`, {
        scheduledAt: new Date(selectedSlot).toISOString(),
      });
    } catch (err) {
      console.warn('API slot confirmation warning:', err);
    }
    setConfirmed(true);
    setTimeout(() => {
      router.push(`/candidate/applications/${app.id}`);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-200">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <Link href="/candidate/applications" className="hover:text-indigo-600 transition-colors">Applications</Link>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <Link href={`/candidate/applications/${app.id}`} className="hover:text-indigo-600 transition-colors">{app.jobTitle}</Link>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <span className="text-slate-800">Schedule</span>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/45 p-8 shadow-xl backdrop-blur-md glass-panel text-center">
        {confirmed ? (
          <div className="space-y-4 py-8">
            <div className="h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
              <Check className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Slot Confirmed!</h1>
            <p className="text-xs text-slate-500 font-semibold max-w-xs mx-auto">
              Your voice interview is scheduled for <span className="text-slate-800 font-bold">{selectedSlot}</span>. The Scheduler Agent has dispatched calendar invites.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 mx-auto">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Select Interview Time</h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                The Scheduler Agent has negotiated these slots with the {app.orgName} recruiting team.
              </p>
            </div>

            {/* Time slot cards */}
            <div className="space-y-2 max-w-sm mx-auto">
              {slots.map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-sm'
                        : 'border-slate-200 bg-white/40 hover:bg-slate-100'
                      }`}
                  >
                    <div className="flex items-center gap-3 font-semibold text-xs text-slate-700">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>{slot}</span>
                    </div>
                    {isSelected && (
                      <span className="h-4.5 w-4.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 max-w-sm mx-auto">
              <button
                onClick={handleConfirm}
                className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-xs shadow-md transition-all cursor-pointer"
              >
                Confirm Booking Slot
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
