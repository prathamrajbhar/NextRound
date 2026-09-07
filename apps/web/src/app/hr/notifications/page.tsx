'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { useNotifications } from '@/hooks/queries';
import { Notification } from '@/types';
import { NotificationsListSkeleton } from '@/components/ui';
import { NotificationsHeader } from './_components/NotificationsHeader';
import { NotificationItem } from './_components/NotificationItem';

type FilterKey = 'all' | 'unread';

export default function HrNotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data, isLoading, refetch } = useNotifications();

  const rawData = data as { notifications?: Notification[] } | Notification[] | undefined;
  const list = Array.isArray(rawData) ? rawData : rawData?.notifications;
  const notifications = useMemo(() => (Array.isArray(list) ? list : []), [list]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const visible = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    return notifications;
  }, [notifications, filter]);

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      refetch();
    } catch {
      // Keep UI active
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/notifications/${id}`);
      refetch();
    } catch {
      // Keep UI active
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.post('/notifications/read-all');
      refetch();
    } catch {
      // Keep UI active
    }
  };

  const clearAll = async () => {
    try {
      await apiClient.delete('/notifications');
      refetch();
    } catch {
      // Keep UI active
    }
  };

  const handleRowClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-200">
      <NotificationsHeader
        unreadCount={unreadCount}
        onMarkAllAsRead={markAllAsRead}
        onClearAll={clearAll}
      />

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

      {isLoading ? (
        <NotificationsListSkeleton count={6} />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden">
          {visible.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {visible.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={() => handleRowClick(n)}
                  onMarkAsRead={(e) => markAsRead(n.id, e)}
                  onDelete={(e) => deleteNotification(n.id, e)}
                />
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
      )}
    </div>
  );
}
