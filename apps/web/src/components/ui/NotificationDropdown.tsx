'use client';

import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2, CheckCircle2, Sparkles, Bot, ShieldCheck, Clock, Check, X } from '@/lib/lucide-google-icons';

export interface NotificationItem {
  id: number;
  text: string;
  time: string;
  read: boolean;
  category?: 'report' | 'shortlist' | 'agent' | 'security';
}

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onToggleRead: (id: number) => void;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  onMarkAllRead,
  onClearAll,
  onToggleRead,
  onClose,
}: NotificationDropdownProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const getEventIcon = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('mock') || lower.includes('evaluation') || lower.includes('score')) {
      return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
    }
    if (lower.includes('shortlist') || lower.includes('interview') || lower.includes('position')) {
      return <Sparkles className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />;
    }
    if (lower.includes('agent') || lower.includes('resume') || lower.includes('anomalies')) {
      return <Bot className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />;
    }
    return <ShieldCheck className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />;
  };

  return (
    <div className="absolute right-0 mt-2.5 w-84 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200 space-y-3">
      {}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
              Notifications Center
            </h3>
            <span className="text-[10px] font-medium text-slate-400 block">
              Workspace Alerts & System Events
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold">
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
            title="Mark all as read"
          >
            <CheckCheck className="h-3 w-3" />
            Mark read
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <button
            type="button"
            onClick={onClearAll}
            className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            title="Clear all notifications"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ml-1 cursor-pointer"
            title="Close notifications dropdown"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`flex-1 py-1 rounded-lg transition-all cursor-pointer text-center text-[11px] ${
            filter === 'all'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`flex-1 py-1 rounded-lg transition-all cursor-pointer text-center text-[11px] flex items-center justify-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
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
      <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => onToggleRead(n.id)}
              className={`group p-3 rounded-2xl border transition-all text-xs cursor-pointer flex gap-3 items-start relative ${
                n.read
                  ? 'bg-slate-50/70 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-medium'
                  : 'bg-slate-100/90 dark:bg-slate-800/80 border-brand-500/30 dark:border-brand-500/40 text-slate-900 dark:text-slate-100 font-bold shadow-sm'
              }`}
            >
              {getEventIcon(n.text)}

              <div className="min-w-0 flex-1 space-y-1">
                <p className="leading-snug text-[11px] break-words">{n.text}</p>
                <div className="flex items-center justify-between text-[9px] font-medium text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> {n.time}
                  </span>
                  {!n.read && (
                    <span className="px-1.5 py-0.2 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400 font-extrabold uppercase text-[8px]">
                      New
                    </span>
                  )}
                </div>
              </div>

              {}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleRead(n.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-brand-500 hover:text-white transition-all text-slate-600 dark:text-slate-300 shrink-0"
                title={n.read ? 'Mark unread' : 'Mark read'}
              >
                <Check className="h-3 w-3" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-8 space-y-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              {filter === 'unread' ? 'No unread notifications' : 'All caught up!'}
            </span>
            <span className="text-[10px] text-slate-400 block">
              You will be notified when system events occur.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
