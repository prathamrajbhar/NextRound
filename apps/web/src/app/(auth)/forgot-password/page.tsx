'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/60 bg-white/45 p-8 shadow-xl backdrop-blur-md glass-panel animate-in zoom-in-95 duration-200">
        <div className="text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 font-bold text-white shadow-md shadow-indigo-200 mx-auto">
            H
          </span>
          <h2 className="mt-6 text-xl font-extrabold text-slate-900 tracking-tight">Recover your password</h2>
          <p className="mt-1.5 text-xs text-slate-500 font-semibold leading-relaxed">
            We will send a password reset link to your email.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs font-semibold text-emerald-700 leading-relaxed">
              Reset link sent! Please check your inbox at <span className="font-bold text-slate-800">{email}</span>.
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ananya.iyer@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-xl transition-all cursor-pointer text-sm disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
                <Send className="h-4 w-4" />
              </button>
              <Link
                href="/login"
                className="text-center text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel and return
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
