import React from 'react';
import { Mail, MapPin, Building2 } from '@/lib/lucide-google-icons';

export function ContactChannelsCard() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
        <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-display border-b border-slate-200/60 dark:border-slate-800 pb-2">
          Direct Contact Channels
        </h4>

        <div className="space-y-3 text-xs font-semibold">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-brand-50 dark:bg-orange-950/60 text-brand-600 dark:text-orange-400 flex items-center justify-center border border-brand-200 dark:border-orange-800 flex-shrink-0">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Support Email</span>
              <a href="mailto:support@nextround.ai" className="text-slate-900 dark:text-slate-100 font-extrabold hover:underline">
                support@nextround.ai
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 flex-shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Enterprise Sales</span>
              <a href="mailto:sales@nextround.ai" className="text-slate-900 dark:text-slate-100 font-extrabold hover:underline">
                sales@nextround.ai
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 flex-shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Global Offices</span>
              <span className="text-slate-900 dark:text-slate-100 font-extrabold block">
                Bengaluru, KA &amp; San Francisco, CA
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
