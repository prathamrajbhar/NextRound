import React from 'react';
import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/40 backdrop-blur-sm py-12 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <span className="text-lg font-bold bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 dark:from-slate-100 dark:via-orange-200 dark:to-slate-100 bg-clip-text text-transparent">
              Next<span className="text-brand-600">Round</span>
            </span>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              The intelligent technical recruitment platform for automated candidate screening, voice interviews, and objective evaluation.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Platform</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/candidate/jobs" className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-orange-400 transition-colors">
                  Explore Roles
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-orange-400 transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/signup?role=hr" className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-orange-400 transition-colors">
                  Hire Talent
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Trust &amp; Security</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/about" className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-orange-400 transition-colors">
                  Bias Audit Standards
                </Link>
              </li>
              <li>
                <span className="text-sm text-slate-600 dark:text-slate-400">Enterprise Privacy Compliance</span>
              </li>
              <li>
                <span className="text-sm text-slate-600 dark:text-slate-400">Candidate Proctoring Consent</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Company</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              © {new Date().getFullYear()} NextRound Technologies. All rights reserved. Built for modern engineering teams and candidate preparation.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
