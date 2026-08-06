'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { MockSession } from '@/types';
import { ChevronRight, TrendingUp } from 'lucide-react';
import { getCompanyDomain } from '@/utils/logo';

export default function MockHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<MockSession[]>([]);

  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true);
        const data = await apiClient.get<MockSession[]>('/mock/sessions');
        if (data) {
          setSessions(data);
        }
      } catch (err) {
        console.error('Failed to load mock history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-slate-100 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Practice History</h1>
        <p className="text-xs text-slate-505 font-semibold mt-1">
          Monitor your score progress and rubric trends across past sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Table of past sessions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-extrabold text-slate-800">Past Attempts</h2>
          
          <div className="glass-card overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-white/30 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Blueprint</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-white/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{session.targetRole}</td>
                    <td className="px-6 py-4 text-indigo-650 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-white border border-slate-200 p-0.5 shadow-sm overflow-hidden flex-shrink-0">
                        <img
                          src={`https://logo.clearbit.com/${getCompanyDomain(session.targetCompany)}`}
                          alt={session.targetCompany}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </span>
                      <span>{session.targetCompany}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{session.date}</td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-600 font-extrabold">{session.score}%</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/candidate/mock/${session.id}/feedback`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        View Coach
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Trend chart placeholder/indicator */}
        <div className="space-y-6">
          <h2 className="text-base font-extrabold text-slate-800">Practice Analytics</h2>
          
          <div className="rounded-3xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-md glass-panel space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Score Trend</span>
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <TrendingUp className="h-3 w-3" />
                +4.0%
              </span>
            </div>

            {/* Simulated bar chart */}
            <div className="flex items-end justify-around h-32 pt-4">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-slate-300 w-8 rounded-t-lg transition-all" style={{ height: '81px' }}></div>
                <span className="text-[9px] font-bold text-slate-400">June 30</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-indigo-500 w-8 rounded-t-lg transition-all" style={{ height: '85px' }}></div>
                <span className="text-[9px] font-bold text-slate-400">July 02</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Your overall communication logic shows significant gains. Work on answering core distributed systems questions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
