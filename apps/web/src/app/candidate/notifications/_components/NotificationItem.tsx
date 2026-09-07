'use client';

import React from 'react';
import {
  CheckCircle2,
  Sparkles,
  Bot,
  ShieldCheck,
  Clock,
  Check,
  Trash2,
  ArrowUpRight,
} from '@/lib/lucide-google-icons';
import { CandidateNotification } from './notification.types';

function getTypeIcon(type: CandidateNotification['type']) {
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
}

interface NotificationItemProps {
  notification: CandidateNotification;
  onClick: () => void;
  onMarkAsRead: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function NotificationItem({
  notification: n,
  onClick,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  return (
    <div
      onClick={onClick}
      className={`group p-4 px-5 transition-all text-xs cursor-pointer flex items-center justify-between gap-4 ${
        n.read
          ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
          : 'bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 text-slate-900 dark:text-white font-bold'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${
            n.read ? 'bg-transparent' : 'bg-brand-500 animate-pulse'
          }`}
        />

        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700/60">
          {getTypeIcon(n.type)}
        </div>

        <p className="truncate text-xs font-semibold leading-relaxed">
          {n.title || n.message}
        </p>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
        </span>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {!n.read && (
            <button
              type="button"
              onClick={onMarkAsRead}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              title="Mark as read"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
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
}
