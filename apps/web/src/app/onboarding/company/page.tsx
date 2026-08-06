'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building, Calendar, ArrowRight, Check, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function CompanyOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [orgName, setOrgName] = useState('');
  const [orgSize, setOrgSize] = useState('1-10');
  const [industry, setIndustry] = useState('Technology');
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Invites list
  const [invites, setInvites] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');

  const handleConnectCalendar = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setCalendarConnected(true);
    }, 1000);
  };

  const handleAddInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim() && !invites.includes(emailInput.trim())) {
      setInvites([...invites, emailInput.trim()]);
      setEmailInput('');
    }
  };

  const handleRemoveInvite = (email: string) => {
    setInvites(invites.filter((item) => item !== email));
  };

  const handleComplete = async () => {
    setSubmitting(true);
    setError('');

    const res = await api.post('/organizations', {
      name: orgName,
      size: orgSize,
      industry,
    });

    setSubmitting(false);

    if (res.success) {
      router.push('/hr/dashboard');
    } else {
      setError(typeof res.error === 'string' ? res.error : res.error?.message || 'Failed to setup organization');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-xl rounded-3xl border border-white/60 bg-white/45 p-8 shadow-xl backdrop-blur-md glass-panel">
        {/* Progress Step Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">HR Workspace Setup</span>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {step === 1 ? 'Organization Details' : 'Calendar & Team Settings'}
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-10 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-purple-500' : 'bg-slate-200'}`}></span>
            <span className={`h-2 w-10 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-purple-500' : 'bg-slate-200'}`}></span>
          </div>
        </div>

        {step === 1 ? (
          /* Step 1: Org details */
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Organization Name</label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme SaaS Ltd."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Company Size</label>
                <select
                  value={orgSize}
                  onChange={(e) => setOrgSize(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
                >
                  <option value="1-10">1-10 Employees</option>
                  <option value="11-50">11-50 Employees</option>
                  <option value="51-200">51-200 Employees</option>
                  <option value="201+">201+ Employees</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
                >
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!orgName}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer"
              >
                Next Step
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Integrations & Invites */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Calendar connect card */}
            <div className="p-4 rounded-2xl border border-white/60 bg-white/40 shadow-sm glass-panel space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Connect Google Calendar</h3>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                      Required for the Scheduler Agent to automatically book candidate voice calls.
                    </p>
                  </div>
                </div>
                {calendarConnected ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <Check className="h-3 w-3" />
                    Connected
                  </span>
                ) : (
                  <button
                    onClick={handleConnectCalendar}
                    disabled={connecting}
                    className="text-[10px] font-bold text-indigo-600 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 px-3 py-1.5 rounded-xl cursor-pointer"
                  >
                    {connecting ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
            </div>

            {/* Invite members list */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Invite Recruiting Partners</label>
              
              {invites.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {invites.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50/30 text-xs font-medium"
                    >
                      <span className="text-slate-700">{email}</span>
                      <button
                        onClick={() => handleRemoveInvite(email)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddInvite} className="flex gap-2">
                <input
                  type="email"
                  placeholder="co-recruiter@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-grow px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 text-white font-bold text-xs px-4 hover:bg-slate-800 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Invite
                </button>
              </form>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleComplete}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 hover:scale-[1.01] transition-all flex items-center gap-1 cursor-pointer"
              >
                Launch HR Portal
                <Check className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
