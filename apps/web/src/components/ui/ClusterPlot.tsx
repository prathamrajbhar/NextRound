'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export interface ClusterPoint {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  radius?: number;
  highlighted?: boolean;
}

export interface ClusterPlotProps {
  points: ClusterPoint[];
  width?: number;
  height?: number;
  className?: string;
  xLabel?: string;
  yLabel?: string;
}





export function ClusterPlot({ points, width = 420, height = 300, className, xLabel, yLabel }: ClusterPlotProps) {
  const pad = 28;
  const plotW = width - pad * 2;
  const plotH = height - pad * 2;

  const toX = (x: number) => pad + (x / 100) * plotW;
  const toY = (y: number) => pad + plotH - (y / 100) * plotH;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {[0, 25, 50, 75, 100].map((g) => (
          <React.Fragment key={g}>
            <line x1={toX(0)} y1={toY(g)} x2={toX(100)} y2={toY(g)} stroke="rgb(241 245 249)" strokeWidth={1} />
            <line x1={toX(g)} y1={toY(0)} x2={toX(g)} y2={toY(100)} stroke="rgb(241 245 249)" strokeWidth={1} />
          </React.Fragment>
        ))}

        <line x1={toX(0)} y1={toY(0)} x2={toX(100)} y2={toY(0)} stroke="rgb(203 213 225)" strokeWidth={1.5} />
        <line x1={toX(0)} y1={toY(0)} x2={toX(0)} y2={toY(100)} stroke="rgb(203 213 225)" strokeWidth={1.5} />

        {points.map((p) => (
          <g key={p.id}>
            <circle
              cx={toX(p.x)}
              cy={toY(p.y)}
              r={p.highlighted ? (p.radius ?? 9) : (p.radius ?? 6)}
              fill={p.color}
              fillOpacity={p.highlighted ? 0.9 : 0.55}
              stroke={p.highlighted ? p.color : 'none'}
              strokeWidth={p.highlighted ? 3 : 0}
            />
            {p.highlighted && (
              <circle cx={toX(p.x)} cy={toY(p.y)} r={(p.radius ?? 9) + 5} fill="none" stroke={p.color} strokeWidth={1} strokeOpacity={0.4} />
            )}
          </g>
        ))}
      </svg>
      {(xLabel || yLabel) && (
        <div className="flex w-full justify-between px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span>{yLabel}</span>
          <span>{xLabel}</span>
        </div>
      )}
    </div>
  );
}
