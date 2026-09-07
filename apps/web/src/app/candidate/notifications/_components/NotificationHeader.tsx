'use client';

import React from 'react';
import { Bell, CheckCheck, Trash2 } from '@/lib/lucide-google-icons';

interface NotificationHeaderProps {
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export function NotificationHeader({
  unreadCount,
  onMarkAllAsRead,
  onClearAll,
}: NotificationHeaderProps) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Notifications &amp; Activity Feed
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
            onClick={onMarkAllAsRead}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <CheckCheck className="h-3.5 w-3.5 text-brand-500" />
            Mark all read
          </button>
        )}
        <button
          type="button"
          onClick={onClearAll}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 text-slate-500 dark:text-slate-400 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear feed
        </button>
      </div>
    </div>
  );
}
