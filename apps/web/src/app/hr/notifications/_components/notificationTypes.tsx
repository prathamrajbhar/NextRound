import React from 'react';
import { Bell, Sparkles, Scale, Mic, Send, AlertTriangle } from 'lucide-react';
import { Notification } from '@/types';

export const NOTIFICATION_TYPE_META: Record<
  Notification['type'],
  { label: string; icon: React.ReactNode }
> = {
  pipeline: { label: 'Pipeline', icon: <Sparkles className="h-4 w-4 text-brand-500" /> },
  decision: { label: 'Decision', icon: <Scale className="h-4 w-4 text-purple-500" /> },
  interview: { label: 'Interview', icon: <Mic className="h-4 w-4 text-sky-500" /> },
  offer: { label: 'Offer', icon: <Send className="h-4 w-4 text-emerald-500" /> },
  alert: { label: 'Alert', icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> },
  shortlist: { label: 'Shortlist', icon: <Sparkles className="h-4 w-4 text-brand-500" /> },
  system: { label: 'System', icon: <Bell className="h-4 w-4 text-slate-500" /> },
};
