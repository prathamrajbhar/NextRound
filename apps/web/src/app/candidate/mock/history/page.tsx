'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { MockSession } from '@/types';
import { ChevronRight, TrendingUp } from 'lucide-react';
import { getCompanyDomain } from '@/utils/logo';
import { MockHistorySkeleton, Skeleton } from '@/components/ui';

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
  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md" />
        </div>
        <MockHistorySkeleton count={4} />
      </div>
    );
  }

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const trendSessions = sortedSessions.slice(-7);
  const latestScore = trendSessions[trendSessions.length - 1]?.score;
  const firstScore = trendSessions[0]?.score;
  const trendDelta =
    latestScore !== undefined && firstScore !== undefined
      ? Math.round((latestScore - firstScore) * 10) / 10
      : null;
  const avgScore =
    trendSessions.length > 0
      ? Math.round(trendSessions.reduce((sum, s) => sum + s.score, 0) / trendSessions.length)
      : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-slate-100 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Practice History</h1>
        <p className="text-xs text-slate-505 font-semibold mt-1">
          Monitor your score progress and rubric trends across past sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

        <div className="space-y-6">
          <h2 className="text-base font-extrabold text-slate-800">Practice Analytics</h2>

          <div className="rounded-3xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-md glass-panel space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Score Trend</span>
              {trendDelta !== null && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <TrendingUp className="h-3 w-3" />
                  {trendDelta >= 0 ? '+' : ''}{trendDelta}%
                </span>
              )}
            </div>

            {trendSessions.length >= 2 ? (
              <>
                <div className="flex items-end justify-around h-32 pt-4">
                  {trendSessions.map((session, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <div
                        className={idx === trendSessions.length - 1 ? 'bg-indigo-500 w-8 rounded-t-lg transition-all' : 'bg-slate-300 w-8 rounded-t-lg transition-all'}
                        style={{ height: `${Math.round(Math.min(session.score, 100) * 0.96)}px` }}
                        title={`${session.targetRole} — ${session.score}%`}
                      ></div>
                      <span className="text-[9px] font-bold text-slate-400">{session.date}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  {avgScore !== null
                    ? `Your average score across ${trendSessions.length} recent sessions is ${avgScore}%.`
                    : 'No practice sessions recorded yet.'}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Complete at least two practice sessions to see your score trend.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
