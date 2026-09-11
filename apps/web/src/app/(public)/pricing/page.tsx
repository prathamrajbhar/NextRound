'use client';

import React, { useState } from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import { Sparkles } from '@/lib/lucide-google-icons';
import { getPricingPlans } from './_components/pricing.data';
import { PricingPlanCard } from './_components/PricingPlanCard';
import { PricingFaqSection } from './_components/PricingFaqSection';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const plans = getPricingPlans(billingCycle);

  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <PublicNavbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex-1 w-full animate-in fade-in duration-300">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[10px] font-extrabold text-brand-600 dark:text-orange-400 bg-brand-50 dark:bg-orange-950/80 border border-brand-200/60 dark:border-orange-900/60 px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Transparent &amp; Reliable Pricing
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-3 font-display">
            Plans Built for Growing Engineering Teams
          </h1>
          <p className="mt-4 text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-xl mx-auto font-medium leading-relaxed">
            Select a plan tailored to your hiring volume. Automate candidate screening with transparent, reliable evaluation tools.
          </p>

          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-slate-100 font-extrabold' : 'text-slate-400'}`}>
              Monthly Billing
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 dark:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-brand-600 dark:bg-orange-500 transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === 'annual' ? 'text-slate-900 dark:text-slate-100 font-extrabold' : 'text-slate-400'}`}>
              Annual Billing
              <span className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded-full uppercase">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-20">
          {plans.map((plan, idx) => (
            <PricingPlanCard key={idx} plan={plan} />
          ))}
        </div>

        <PricingFaqSection />
      </main>

      <PublicFooter />
    </div>
  );
}
