'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle2, Sparkles, Bot, ShieldCheck, ArrowUpRight, CheckCheck, Trash2, Check, Clock } from '@/lib/lucide-google-icons';

interface CandidateNotification {
  id: string;
  text: string;
  time: string;
  read: boolean;
  type: 'evaluation' | 'shortlist' | 'agent' | 'system';
  link: string;
}

const mockCandidateNotifications: CandidateNotification[] = [
  {
    id: 'notif-1',
    text: 'Mock practice evaluation report for Google Software Engineer is ready.',
    time: '5m ago',
    read: false,
    type: 'evaluation',
    link: '/candidate/mock/history',
  },
  {
    id: 'notif-2',
    text: 'Vercel shortlisted your profile: interview scheduling requested.',
    time: '1h ago',
    read: false,
    type: 'shortlist',
    link: '/candidate/applications/app-501',
  },
  {
    id: 'notif-3',
    text: 'Stripe screening agent: Resume logic tags matched 90%.',
    time: '2h ago',
    read: false,
    type: 'agent',
    link: '/candidate/resume-builder',
  },
  {
    id: 'notif-4',
    text: 'New Frontend Engineer position posted at Microsoft matching your profile.',
    time: '3h ago',
    read: true,
    type: 'shortlist',
    link: '/candidate/jobs',
  },
  {
    id: 'notif-5',
    text: 'Evaluation feedback calibrated for Technical Logic: improved by 15%.',
    time: '5h ago',
    read: true,
    type: 'evaluation',
    link: '/candidate/profile',
  },
];

type FilterCategory = 'all' | 'unread';

export default function CandidateNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<CandidateNotification[]>(mockCandidateNotifications);
  const [filter, setFilter] = useState<FilterCategory>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const visibleNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    return notifications;
  }, [notifications, filter]);

  const markAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleRowClick = (n: CandidateNotification) => {
    if (!n.read) markAsRead(n.id);
    router.push(n.link);
  };

  const getTypeIcon = (type: CandidateNotification['type']) => {
    switch (type) {
      case 'evaluation':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
      case 'shortlist':
        return <Sparkles className="h-4 w-4 text-brand-500 shrink-0" />;
      case 'agent':
        return <Bot className="h-4 w-4 text-indigo-500 shrink-0" />;
      default:
        return <ShieldCheck className="h-4 w-4 text-sky-500 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Notifications & Activity Feed
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-xs font-black">
                  {unreadCount} Unread
                </span>
              )}
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Real-time events from AI screening agents, evaluation pipelines, and recruiter shortlists.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold self-end sm:self-auto">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <CheckCheck className="h-3.5 w-3.5 text-brand-500" />
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={clearAll}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 text-slate-500 dark:text-slate-400 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear feed
          </button>
        </div>
      </div>

      {/* Streamlined Filter Bar (All / Unread Only) */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold w-fit">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-brand-500 text-white text-[9px] font-black">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Linear-Style Activity Feed Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden">
        {visibleNotifications.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {visibleNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleRowClick(n)}
                className={`group p-4 px-5 transition-all text-xs cursor-pointer flex items-center justify-between gap-4 ${
                  n.read
                    ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                    : 'bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 text-slate-900 dark:text-white font-bold'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Status Indicator Dot */}
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      n.read ? 'bg-transparent' : 'bg-brand-500 animate-pulse'
                    }`}
                  />

                  {/* Icon Badge */}
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                    {getTypeIcon(n.type)}
                  </div>

                  {/* Text Title */}
                  <p className="truncate text-xs font-semibold leading-relaxed">
                    {n.text}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Timestamp */}
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {n.time}
                  </span>

                  {/* Action Toolbar on Hover */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    {!n.read && (
                      <button
                        type="button"
                        onClick={(e) => markAsRead(n.id, e)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => deleteNotification(n.id, e)}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 space-y-2">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
              No notifications in this view
            </span>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You are all caught up! New system alerts and application updates will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
