'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import {
  Check,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
} from '@/lib/lucide-google-icons';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const plans = [
    {
      name: 'Free Starter Plan',
      price: '$0',
      period: 'forever',
      description: 'Perfect for small teams experiencing automated technical AI recruitment.',
      popular: false,
      badge: 'Free Tier',
      features: [
        'Post up to 3 active job openings',
        'Automated AI resume screening',
        'Interactive AI voice interview room',
        'Standard candidate scorecards & transcripts',
        'Automated scoring rubrics',
      ],
      buttonText: 'Get Started Free',
      href: '/signup',
      highlight: false,
    },
    {
      name: 'Pro Recruiter',
      price: billingCycle === 'annual' ? '$39' : '$49',
      period: 'per month',
      description: 'Ideal for growing engineering teams automating high-volume pipelines.',
      popular: true,
      badge: 'Most Popular',
      features: [
        'Post up to 15 active job openings',
        'Custom evaluation rubrics & question generator',
        'Online MCQ & LeetCode-style coding tests',
        'Priority AI Voice interviewer (3 persona voices)',
        'Composite scorecard evaluation metrics',
        'Candidate PDF dossier export',
      ],
      buttonText: 'Start 14-Day Free Trial',
      href: '/signup',
      highlight: true,
    },
    {
      name: 'Enterprise Scale',
      price: billingCycle === 'annual' ? '$119' : '$149',
      period: 'per month',
      description: 'Custom evaluation rubrics, team collaboration workflows, and multi-user roles.',
      popular: false,
      badge: 'Enterprise',
      features: [
        'Unlimited active job openings',
        'Custom ATS integration support',
        'Multi-user team roles (Admin, Recruiter, Reviewer)',
        'Candidate engagement & gaze video telemetry',
        'Dedicated SLA & account support manager',
      ],
      buttonText: 'Contact Sales',
      href: '/contact',
      highlight: false,
    },
  ];

  const faqs = [
    {
      question: 'Is NextRound free to try?',
      answer: 'Yes! Our Free Starter Plan gives you lifetime access to post up to 3 active jobs, run automated AI resume screening, and conduct AI voice interviews with zero credit card required.',
    },
    {
      question: 'How do AI voice interviews work?',
      answer: 'When a candidate passes initial screening, they select a 15-minute slot. In our secure voice room, an AI interviewer asks technical questions, records answers, and generates immediate scorecard analytics.',
    },
    {
      question: 'Can I upgrade or downgrade my plan at any time?',
      answer: 'Absolutely. You can switch between Monthly and Annual billing or upgrade your plan anytime from your Organization Settings tab.',
    },
    {
      question: 'How is candidate privacy protected?',
      answer: 'All candidate data and interview recordings are strictly encrypted with secure storage and strict role-based access control.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <PublicNavbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex-1 w-full animate-in fade-in duration-300">
        {/* Header Section */}
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

          {/* Billing Cycle Toggle */}
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

        {/* Pricing Cards Grid (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-20">
          {plans.map((plan, idx) => (
            <div
              key={idx}
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
          ))}
        </div>

        {/* FAQ Accordion Section */}
        <div className="max-w-3xl mx-auto border-t border-slate-200/60 dark:border-slate-800 pt-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-display">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
              Everything you need to know about plans, billing, and AI voice assessment.
            </p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 shadow-xs backdrop-blur-md glass-panel overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4 flex justify-between items-center text-left font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:text-brand-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <HelpCircle className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400 flex-shrink-0" />
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 leading-relaxed font-medium">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
