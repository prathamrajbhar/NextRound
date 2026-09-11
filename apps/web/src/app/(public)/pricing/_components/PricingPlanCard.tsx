'use client';

import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from '@/lib/lucide-google-icons';
import { PricingPlan } from './pricing.data';

interface PricingPlanCardProps {
  plan: PricingPlan;
}

export function PricingPlanCard({ plan }: PricingPlanCardProps) {
  return (
    <div
      className={`rounded-3xl border p-6 sm:p-8 flex flex-col justify-between backdrop-blur-md glass-panel relative transition-all duration-200 hover:scale-[1.02] ${
        plan.highlight
          ? 'border-brand-500 dark:border-orange-500 bg-white dark:bg-slate-900/90 shadow-xl ring-2 ring-brand-500/20 dark:ring-orange-500/20'
          : 'border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/50 shadow-md'
      }`}
    >
      {plan.popular && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 dark:bg-orange-600 text-white font-extrabold text-[10px] px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md">
          {plan.badge}
        </span>
      )}

      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 font-display">{plan.name}</h3>
          {!plan.popular && (
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full uppercase">
              {plan.badge}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed min-h-[36px]">
          {plan.description}
        </p>

        <div className="my-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-900 dark:text-slate-100 font-display tracking-tight">
              {plan.price}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">/ {plan.period}</span>
          </div>
        </div>

        <ul className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
          {plan.features.map((feature, fIdx) => (
            <li key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
              <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <Link
          href={plan.href}
          className={`w-full text-center rounded-xl py-3 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
            plan.highlight
              ? 'bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white hover:scale-[1.01]'
              : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white'
          }`}
        >
          <span>{plan.buttonText}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
