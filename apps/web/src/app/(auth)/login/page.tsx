'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  LogIn,
  ArrowRight,
  CheckCircle2,
} from '@/lib/lucide-google-icons';
import { useToast } from '@/contexts/ToastContext';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      toast({ title: 'Signed in successfully', variant: 'success' });
      if (email.toLowerCase().includes('candidate') || email.toLowerCase().includes('ananya')) {
        router.push('/candidate/dashboard');
      } else {
        router.push('/hr/dashboard');
      }
    }, 1000);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-8 overflow-hidden font-sans select-none">
      {/* Crisp Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 h-full w-full object-cover z-0 pointer-events-none filter brightness-[0.75] contrast-[1.05] saturate-[1.1]"
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      {/* Subtle Gradient Backdrop Overlay */}
      <div className="fixed inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-slate-950/75 z-0 pointer-events-none" />

      {/* Main Widescreen Container */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Sign-in Specific Showcase */}
        <div className="lg:col-span-6 space-y-6 text-white p-2 sm:p-4 animate-in fade-in duration-300">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="relative h-10 w-10 rounded-full overflow-hidden group-hover:scale-105 transition-transform flex-shrink-0 border border-white/40 shadow-md">
              <Image
                src="/logo.png"
                alt="NextRound Logo"
                fill
                className="object-cover scale-[1.3]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white font-display">
                Next<span className="text-orange-400">Round</span>
              </span>
            </div>
          </Link>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white font-display">
              Welcome Back to NextRound
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-lg">
              Log in to manage job pipelines, review candidate scorecards, or continue interview practice sessions.
            </p>
          </div>

          {/* Sign In Specific Badges */}
          <div className="space-y-2.5 pt-1 max-w-md">
            <div className="flex items-center gap-2.5 bg-slate-950/40 backdrop-blur-xl border border-white/15 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-200">
              <CheckCircle2 className="h-4 w-4 text-orange-400 flex-shrink-0" />
              <span>Instant Access to HR &amp; Candidate Portals</span>
            </div>

            <div className="flex items-center gap-2.5 bg-slate-950/40 backdrop-blur-xl border border-white/15 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-200">
              <CheckCircle2 className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <span>Real-time Scorecards &amp; Interview Records</span>
            </div>

            <div className="flex items-center gap-2.5 bg-slate-950/40 backdrop-blur-xl border border-white/15 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>Secure, Encrypted Workspace</span>
            </div>
          </div>
        </div>

        {/* Right Column: Auth Card */}
        <div className="lg:col-span-6 xl:col-span-5 lg:ml-auto w-full max-w-md">
          <div className="rounded-3xl border border-white/20 border-t-white/30 bg-slate-950/40 p-6 sm:p-8 shadow-2xl shadow-slate-950/80 backdrop-blur-2xl text-white space-y-5 ring-1 ring-white/10 animate-in zoom-in-95 duration-200">
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white font-display">
                Sign In to NextRound
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Enter your credentials to access your account.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/60 p-3 text-xs font-bold text-rose-300 text-center backdrop-blur-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-white/15 bg-slate-900/40 text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:bg-slate-900/70 font-semibold transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">Password</label>
                  <Link href="/forgot-password" className="text-xs font-extrabold text-orange-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-white/15 bg-slate-900/40 text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:bg-slate-900/70 font-semibold transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                </button>
              </div>
            </form>

            <div className="border-t border-white/10 pt-4 text-center text-xs text-slate-300 font-semibold">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-extrabold text-orange-400 hover:underline inline-flex items-center gap-0.5">
                Sign Up
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
