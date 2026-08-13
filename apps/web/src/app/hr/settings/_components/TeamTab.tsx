'use client';

import React from 'react';
import { Users, Plus, Trash2 } from '@/lib/lucide-google-icons';

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
  handleInviteSubmit: (e: React.FormEvent) => void;
  handleRemoveMember: (id: string) => void;
}

export function TeamTab({
  team,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  handleInviteSubmit,
  handleRemoveMember,
}: TeamTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {}
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
      </div>

      {}
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

              <div className="flex items-center gap-3">
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
