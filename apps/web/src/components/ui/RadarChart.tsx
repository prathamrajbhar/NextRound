'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export interface RadarSeries {
  label: string;
  color: string;
  values: number[];
}

export interface RadarChartProps {
  axes: string[];
  series: RadarSeries[];
  size?: number;
  maxValue?: number;
  className?: string;
}





export function RadarChart({ axes, series, size = 280, maxValue = 100, className }: RadarChartProps) {
  const center = size / 2;
  const radius = size / 2 - 36;
  const angleStep = (Math.PI * 2) / axes.length;

  const pointFor = (axisIndex: number, value: number) => {
    const angle = angleStep * axisIndex - Math.PI / 2;
    const r = (Math.max(0, Math.min(value, maxValue)) / maxValue) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const ringLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {ringLevels.map((level) => (
          <polygon
            key={level}
            points={axes
              .map((_, i) => {
                const p = pointFor(i, maxValue * level);
                return `${p.x},${p.y}`;
              })
              .join(' ')}
            fill="none"
            stroke="rgb(226 232 240)"
            strokeWidth={1}
          />
        ))}

        {axes.map((_, i) => {
          const p = pointFor(i, maxValue);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="rgb(226 232 240)"
              strokeWidth={1}
            />
          );
        })}

        {series.map((s) => (
          <polygon
            key={s.label}
            points={s.values.map((v, i) => {
              const p = pointFor(i, v);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill={s.color}
            fillOpacity={0.18}
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}

        {series.map((s) =>
          s.values.map((v, i) => {
            const p = pointFor(i, v);
            return <circle key={`${s.label}-${i}`} cx={p.x} cy={p.y} r={3} fill={s.color} />;
          })
        )}

        {axes.map((axis, i) => {
          const p = pointFor(i, maxValue * 1.18);
          return (
            <text
              key={axis}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-500 font-bold"
              fontSize={10}
            >
              {axis}
            </text>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {series.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[11px] font-bold text-slate-600">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
