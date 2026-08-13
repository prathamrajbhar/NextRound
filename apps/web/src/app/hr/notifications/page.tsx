'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ArrowUpRight, Sparkles, Scale, Mic, Send, AlertTriangle, CheckCheck, Trash2, Check, Clock } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Notification } from '@/types';
import { NotificationsListSkeleton } from '@/components/ui';

type FilterKey = 'all' | 'unread';

const typeMeta: Record<Notification['type'], { label: string; icon: React.ReactNode }> = {
  pipeline: { label: 'Pipeline', icon: <Sparkles className="h-4 w-4 text-brand-500" /> },
  decision: { label: 'Decision', icon: <Scale className="h-4 w-4 text-purple-500" /> },
  interview: { label: 'Interview', icon: <Mic className="h-4 w-4 text-sky-500" /> },
  offer: { label: 'Offer', icon: <Send className="h-4 w-4 text-emerald-500" /> },
  alert: { label: 'Alert', icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> },
  shortlist: { label: 'Shortlist', icon: <Sparkles className="h-4 w-4 text-brand-500" /> },
  system: { label: 'System', icon: <Bell className="h-4 w-4 text-slate-500" /> },
};

export default function HrNotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true);
        const data = await apiClient.get<{ notifications: Notification[] } | Notification[]>('/notifications');
        if (data) {
          const list = Array.isArray(data) ? data : data.notifications;
          setNotifications(Array.isArray(list) ? list : []);
        } else {
          setNotifications([]);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const visible = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    return notifications;
  }, [notifications, filter]);

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await apiClient.delete(`/notifications/${id}`);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await apiClient.post('/notifications/read-all');
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const clearAll = async () => {
    setNotifications((prev) => prev.filter((n) => !n.read));
    try {
      await apiClient.delete('/notifications');
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const handleRowClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    router.push(n.link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-200">
      {}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Recruiter Notifications Feed
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-xs font-black">
                  {unreadCount} Unread
                </span>
              )}
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Review critical events triggered by pipeline agents, decision algorithms, and candidate evaluations.
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

      {}
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

      {}
      {loading ? (
        <NotificationsListSkeleton count={6} />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden">
          {visible.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {visible.map((n) => {
                const meta = typeMeta[n.type] ?? typeMeta.alert;

                return (
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
                      {}
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          n.read ? 'bg-transparent' : 'bg-brand-500 animate-pulse'
                        }`}
                      />

                      {}
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                        {meta.icon}
                      </div>

                      {}
                      <p className="truncate text-xs font-semibold leading-relaxed">
                        {n.text}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {}
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {n.time}
                      </span>

                      {}
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
                );
              })}
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
      )}
    </div>
  );
}
