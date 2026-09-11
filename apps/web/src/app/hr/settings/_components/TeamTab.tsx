'use client';

import React, { useState } from 'react';
import { Users, Plus, Trash2, KeyRound, Copy, Check, X } from '@/lib/lucide-google-icons';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface TeamTabProps {
  team: TeamMember[];
  inviteEmail: string;
  setInviteEmail: (val: string) => void;
  inviteRole: 'Admin' | 'Recruiter' | 'Reviewer';
  setInviteRole: (val: 'Admin' | 'Recruiter' | 'Reviewer') => void;
  newlyInvitedCredential?: { email: string; temporaryPassword?: string } | null;
  clearCredential?: () => void;
  handleInviteSubmit: (e: React.FormEvent) => void;
  handleRemoveMember: (id: string) => void;
}

export function TeamTab({
  team,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  newlyInvitedCredential,
  clearCredential,
  handleInviteSubmit,
  handleRemoveMember,
}: TeamTabProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!newlyInvitedCredential?.temporaryPassword) return;
    navigator.clipboard.writeText(newlyInvitedCredential.temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
          <Users className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
            Invite New Recruiting Partner
          </h3>
        </div>

        <form onSubmit={handleInviteSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            placeholder="recruiter@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-grow p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />

          <select
            value={inviteRole}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInviteRole(e.target.value as 'Admin' | 'Recruiter' | 'Reviewer')}
            className="p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-bold focus:outline-none cursor-pointer"
          >
            <option value="Admin">Admin</option>
            <option value="Recruiter">Recruiter</option>
            <option value="Reviewer">Reviewer</option>
          </select>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 justify-center cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Send Invite</span>
          </button>
        </form>

        {newlyInvitedCredential && newlyInvitedCredential.temporaryPassword && (
          <div className="mt-4 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/30 space-y-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                <KeyRound className="h-4 w-4" />
                <span>Temporary Partner Credentials Created</span>
              </div>
              {clearCredential && (
                <button
                  type="button"
                  onClick={clearCredential}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              An invitation email has been dispatched to <strong className="text-slate-900 dark:text-white">{newlyInvitedCredential.email}</strong>. You can also securely copy their temporary password below:
            </p>
            <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-amber-500/20">
              <span className="text-xs text-slate-500 font-medium">Temp Password:</span>
              <code className="font-mono font-extrabold text-xs text-orange-600 dark:text-orange-400 select-all">
                {newlyInvitedCredential.temporaryPassword}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-[11px] transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
              * Note: The recruiting partner will be required to set a permanent private password on their first login.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3 font-display">
          Active Team Members ({team.length})
        </h3>

        <div className="space-y-3">
          {team.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-orange-950/80 text-brand-700 dark:text-orange-400 font-extrabold flex items-center justify-center border border-brand-200 dark:border-orange-800">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <span className="block font-extrabold text-slate-900 dark:text-slate-100">{member.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{member.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {member.status && member.status !== 'Active' && (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                    {member.status}
                  </span>
                )}
                <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 px-2.5 py-0.5 rounded-full uppercase">
                  {member.role}
                </span>

                {member.role !== 'Owner' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    title="Remove member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
