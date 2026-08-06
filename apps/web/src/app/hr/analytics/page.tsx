'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Download,
  AlertCircle,
  Users,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
} from '@/lib/lucide-google-icons';
import { getStoredJobs, getHRAnalytics } from '@/lib/mockData';
import { AnalyticsKpiCards } from './_components/AnalyticsKpiCards';
import { StageBreakdownChart } from './_components/StageBreakdownChart';

export default function HrAnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | 'ytd'>('30d');
  const [department, setDepartment] = useState<string>('all');
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  const analyticsData = getHRAnalytics();
  const mockJobs = getStoredJobs();

  // Simple funnel steps
  const funnelSteps = analyticsData.funnel.map(f => ({ name: f.stage, count: f.count, pct: f.pct }));

  // Monthly candidate numbers
  const trendData = analyticsData.monthlyTrends.map(t => ({ month: t.month, count: t.applicants, hires: t.hires }));

  const getSvgCoordinates = () => {
    const width = 420;
    const height = 130;
    const points = trendData.map((d, i) => {
      const x = 45 + i * (width / (trendData.length - 1));
      const y = 160 - (d.count / 120) * height;
      return { x, y, ...d };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} 160 L ${points[0].x} 160 Z`;

    return { points, linePath, areaPath };
  };

  const { points, linePath, areaPath } = getSvgCoordinates();

  const handleExportCSV = () => {
    const csvContent =
      'Stage,Candidate Count,Percentage\n' +
      funnelSteps.map((s) => `"${s.name}",${s.count},${s.pct}%`).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HireOS_Hiring_Analytics_${timeframe}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 font-sans">
      {/* Page Header & Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-extrabold text-brand-600 dark:text-orange-400 uppercase tracking-widest block mb-1">
            HR Console
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Hiring Analytics &amp; Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Track hiring speed, applicant results, candidate ratings, and drop-off points.
          </p>
        </div>

        {/* Toolbar Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Timeframe Pills */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 select-none">
            <button
              type="button"
              onClick={() => setTimeframe('30d')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeframe === '30d'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('90d')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeframe === '90d'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              90 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('ytd')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeframe === 'ytd'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Year to Date
            </button>
          </div>

          {/* Department Filter Dropdown */}
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="engineering">Engineering</option>
            <option value="product">Product Management</option>
            <option value="design">UI/UX Design</option>
          </select>

          {/* Export CSV button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-sm cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Stat Cards */}
      <AnalyticsKpiCards />

      {/* Main Grid Section (8 Cols / 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart 1: Hiring Stage Breakdown */}
          <StageBreakdownChart funnelSteps={funnelSteps} />

          {/* Chart 2: Monthly Applicants Evaluated */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-display">
                <TrendingUp className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
                Monthly Applicants Evaluated
              </h3>
              <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 px-2.5 py-1 rounded-full flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +25% Growth
              </span>
            </div>

            {/* SVG Interactive Line Plot */}
            <div className="relative pt-2">
              <svg className="w-full h-auto" viewBox="0 0 500 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Gridlines */}
                <line x1="40" y1="20" x2="460" y2="20" stroke="currentColor" className="text-slate-200/60 dark:text-slate-800" strokeWidth="1" strokeDasharray="4" />
                <line x1="40" y1="55" x2="460" y2="55" stroke="currentColor" className="text-slate-200/60 dark:text-slate-800" strokeWidth="1" strokeDasharray="4" />
                <line x1="40" y1="90" x2="460" y2="90" stroke="currentColor" className="text-slate-200/60 dark:text-slate-800" strokeWidth="1" strokeDasharray="4" />
                <line x1="40" y1="125" x2="460" y2="125" stroke="currentColor" className="text-slate-200/60 dark:text-slate-800" strokeWidth="1" strokeDasharray="4" />
                <line x1="40" y1="160" x2="460" y2="160" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="1" />

                {/* Y Axis Labels */}
                <text x="15" y="24" className="fill-slate-400 dark:fill-slate-500 text-[8px] font-bold font-mono">120</text>
                <text x="15" y="94" className="fill-slate-400 dark:fill-slate-500 text-[8px] font-bold font-mono">60</text>
                <text x="20" y="164" className="fill-slate-400 dark:fill-slate-500 text-[8px] font-bold font-mono">0</text>

                {/* Area Gradient Fill */}
                <path d={areaPath} fill="url(#purpleAreaGrad)" />

                {/* Line Path */}
                <path d={linePath} stroke="url(#purpleLineGrad)" strokeWidth="3.5" strokeLinecap="round" />

                {/* Interactive Dots */}
                {points.map((p, idx) => (
                  <g
                    key={idx}
                    className="cursor-pointer group"
                    onMouseEnter={() => setActiveTooltip(idx)}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={activeTooltip === idx ? '6' : '4'}
                      className={activeTooltip === idx ? 'fill-brand-600 dark:fill-orange-400' : 'fill-purple-600 dark:fill-purple-400'}
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </g>
                ))}

                {/* X Axis Labels */}
                {points.map((p, idx) => (
                  <text
                    key={idx}
                    x={p.x}
                    y="182"
                    className={activeTooltip === idx ? 'fill-brand-600 dark:fill-orange-400 font-extrabold text-[9px]' : 'fill-slate-500 dark:fill-slate-400 font-bold text-[9px]'}
                    textAnchor="middle"
                  >
                    {p.month}
                  </text>
                ))}

                {/* Definitions */}
                <defs>
                  <linearGradient id="purpleLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#9333ea" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                  <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ea580c" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Tooltip Hover Card */}
              {activeTooltip !== null && (
                <div
                  className="absolute bg-slate-900 text-white rounded-xl p-2.5 shadow-xl text-[10px] pointer-events-none space-y-0.5 border border-slate-700 animate-in fade-in zoom-in-95 duration-100 z-10"
                  style={{
                    left: `${(points[activeTooltip].x / 500) * 100}%`,
                    top: `${(points[activeTooltip].y / 200) * 100 - 25}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <span className="block font-black text-slate-400 uppercase tracking-wider leading-none">
                    {trendData[activeTooltip].month} Results
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-extrabold text-white">Evaluated: {trendData[activeTooltip].count}</span>
                    <span className="text-emerald-400 font-extrabold">({trendData[activeTooltip].hires} Hired)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dropoff Analysis & Ratings (1 Col) */}
        <div className="space-y-6">
          {/* Card 1: Where Candidates Drop Off */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
            <div className="border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
                Where Candidates Drop Off
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Main reasons candidates do not advance to the next step.
              </p>
            </div>

            <div className="space-y-3.5 text-xs font-semibold">
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 space-y-1">
                <div className="flex justify-between items-center text-amber-800 dark:text-amber-300 font-extrabold">
                  <span>Hard Coding Test</span>
                  <span>24% Left</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                  Candidates struggled on difficult coding questions.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 space-y-1">
                <div className="flex justify-between items-center text-indigo-800 dark:text-indigo-300 font-extrabold">
                  <span>Interview Booking Delays</span>
                  <span>12% Left</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                  Candidates took longer than 48 hours to select an interview time.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 space-y-1">
                <div className="flex justify-between items-center text-rose-800 dark:text-rose-300 font-extrabold">
                  <span>Scored Below Passing Mark</span>
                  <span>15% Left</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                  Candidates scored below the required 80% passing score.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: AI Accuracy & Candidate Rating */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-2.5 font-display flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
              AI Accuracy &amp; Candidate Rating
            </h3>

            <div className="space-y-4 text-xs font-semibold">
              <div>
                <div className="flex justify-between text-slate-800 dark:text-slate-200 mb-1 font-extrabold">
                  <span>Candidate Experience Rating</span>
                  <span className="text-emerald-600 dark:text-emerald-400">4.8 / 5.0 Rating</span>
                </div>
                <div className="w-full bg-slate-200/60 dark:bg-slate-800/60 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '96%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-800 dark:text-slate-200 mb-1 font-extrabold">
                  <span>AI Evaluation Accuracy</span>
                  <span className="text-indigo-600 dark:text-indigo-400">98.4% Accuracy</span>
                </div>
                <div className="w-full bg-slate-200/60 dark:bg-slate-800/60 rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '98%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Job Listings Table */}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
              Active Job Listings &amp; Applicant Count
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Live overview of candidates across active open roles.
            </p>
          </div>

          <Link
            href="/hr/jobs"
            className="text-brand-600 dark:text-orange-400 hover:underline text-xs font-extrabold flex items-center gap-0.5 cursor-pointer"
          >
            <span>View All Jobs</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                <th className="py-3 px-4">Job Title</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Total Applicants</th>
                <th className="py-3 px-4">Pass Rate</th>
                <th className="py-3 px-4">Average Candidate Score</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
              {mockJobs.slice(0, 5).map((j) => (
                <tr key={j.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-slate-900 dark:text-slate-100 font-display">{j.title}</div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{j.orgName}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{j.location}</td>
                  <td className="py-3.5 px-4 font-bold">{j.applicantsCount} candidates</td>
                  <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {Math.min(85, Math.max(50, j.applicantsCount * 4))}%
                  </td>
                  <td className="py-3.5 px-4 font-bold">{j.thresholds.minScore + 4}%</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      Hiring Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

