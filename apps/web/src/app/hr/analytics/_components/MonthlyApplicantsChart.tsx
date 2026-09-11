'use client';

import React, { useState } from 'react';
import { TrendingUp } from '@/lib/lucide-google-icons';

interface MonthlyApplicantsChartProps {
  trendData: Array<{ month: string; count: number; hires: number }>;
}

export function MonthlyApplicantsChart({ trendData }: MonthlyApplicantsChartProps) {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  const getSvgCoordinates = () => {
    const width = 420;
    const height = 130;
    if (trendData.length === 0) {
      return { points: [], linePath: '', areaPath: '' };
    }
    if (trendData.length === 1) {
      const p = { x: 45, y: 160, ...trendData[0] };
      return {
        points: [p],
        linePath: 'M 45 160 L 465 160',
        areaPath: 'M 45 160 L 465 160 L 465 160 L 45 160 Z',
      };
    }
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

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-display">
          <TrendingUp className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
          Monthly Applicants Evaluated
        </h3>
        <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 px-2.5 py-1 rounded-full flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {trendData.length > 0 ? `${trendData.length} period(s)` : 'No data'}
        </span>
      </div>

      <div className="relative pt-2">
        <svg className="w-full h-auto" viewBox="0 0 500 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="40" y1="20" x2="460" y2="20" stroke="currentColor" className="text-slate-200/60 dark:text-slate-800" strokeWidth="1" strokeDasharray="4" />
          <line x1="40" y1="55" x2="460" y2="55" stroke="currentColor" className="text-slate-200/60 dark:text-slate-800" strokeWidth="1" strokeDasharray="4" />
          <line x1="40" y1="90" x2="460" y2="90" stroke="currentColor" className="text-slate-200/60 dark:text-slate-800" strokeWidth="1" strokeDasharray="4" />
          <line x1="40" y1="125" x2="460" y2="125" stroke="currentColor" className="text-slate-200/60 dark:text-slate-800" strokeWidth="1" strokeDasharray="4" />
          <line x1="40" y1="160" x2="460" y2="160" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="1" />

          <text x="15" y="24" className="fill-slate-400 dark:fill-slate-500 text-[8px] font-bold font-mono">120</text>
          <text x="15" y="94" className="fill-slate-400 dark:fill-slate-500 text-[8px] font-bold font-mono">60</text>
          <text x="20" y="164" className="fill-slate-400 dark:fill-slate-500 text-[8px] font-bold font-mono">0</text>

          <path d={areaPath} fill="url(#purpleAreaGrad)" />
          <path d={linePath} stroke="url(#purpleLineGrad)" strokeWidth="3.5" strokeLinecap="round" />

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
  );
}
