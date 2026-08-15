'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/cn';

interface CompanyLogoProps {
  name: string;
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-9 w-9 text-xs rounded-xl p-1',
  md: 'h-12 w-12 text-sm rounded-2xl p-1.5',
  lg: 'h-14 w-14 text-base rounded-2xl p-2',
  xl: 'h-16 w-16 text-lg rounded-2xl p-2.5',
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-7 w-7',
  xl: 'h-8 w-8',
};

const brandSvgMap: Record<string, (props: { className?: string }) => React.ReactNode> = {
  swiggy: ({ className }) => (
    <svg className={cn("w-full h-full text-[#FC8019]", className)} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.8 15.5c-2.4 0-4.3-1.4-5.1-3.4h2.2c.6 1 1.7 1.6 2.9 1.6 1.8 0 3.2-1.3 3.2-2.9 0-1.5-1.2-2.5-3.3-3.1l-.7-.2c-2.7-.8-4.4-2.2-4.4-4.5 0-2.6 2.2-4.5 5.3-4.5 2.2 0 4 1.1 4.8 2.9h-2.1c-.6-.8-1.5-1.2-2.7-1.2-1.7 0-3 1.2-3 2.6 0 1.4 1.1 2.2 3.1 2.8l.7.2c2.9.8 4.6 2.3 4.6 4.7 0 2.8-2.3 4.9-5.5 4.9z" />
    </svg>
  ),
  razorpay: ({ className }) => (
    <svg className={cn("w-full h-full text-[#0C2340]", className)} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.43 4.47L13.88 20.3a.62.62 0 0 1-1.09.05L7.7 13.9a.62.62 0 0 1 .15-.83L17.2 6.2a.62.62 0 0 1 .91.75l-4.5 7.8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20.5 3L11.5 19.5 7 13l9-7" fill="#0284C7" />
    </svg>
  ),
  cred: ({ className }) => (
    <svg className={cn("w-full h-full text-slate-900 dark:text-white", className)} viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" fillOpacity="0.1" />
      <path d="M7 7h10v10H7z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M10 10h4v4h-4z" fill="currentColor" />
    </svg>
  ),
  zoho: ({ className }) => (
    <svg className={cn("w-full h-full", className)} viewBox="0 0 24 24">
      <rect x="3" y="4" width="8" height="7" rx="1.5" fill="#E42526" />
      <rect x="13" y="4" width="8" height="7" rx="1.5" fill="#209A48" />
      <rect x="3" y="13" width="8" height="7" rx="1.5" fill="#1479C9" />
      <rect x="13" y="13" width="8" height="7" rx="1.5" fill="#F4B41A" />
    </svg>
  ),
  google: ({ className }) => (
    <svg className={cn("w-full h-full", className)} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  ),
  microsoft: ({ className }) => (
    <svg className={cn("w-full h-full", className)} viewBox="0 0 24 24">
      <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
      <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
      <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
    </svg>
  )
};

const colorGradients = [
  'from-amber-500 to-orange-600 text-white',
  'from-blue-600 to-indigo-700 text-white',
  'from-emerald-500 to-teal-700 text-white',
  'from-purple-600 to-violet-800 text-white',
  'from-rose-500 to-pink-600 text-white',
  'from-cyan-500 to-blue-600 text-white',
];

function getBrandGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorGradients.length;
  return colorGradients[index];
}

function getInitials(name: string): string {
  if (!name) return 'CO';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function CompanyLogo({ name, logoUrl, size = 'md', className }: CompanyLogoProps) {
  const [imageError, setImageError] = useState(false);
  const normalizedName = name.toLowerCase().trim();

  
  const BuiltInSvg = brandSvgMap[normalizedName];

  return (
    <div
      className={cn(
        'relative flex items-center justify-center flex-shrink-0 font-extrabold shadow-sm transition-all duration-200 group-hover:scale-105 border',
        'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800',
        sizeClasses[size],
        className
      )}
    >
      {BuiltInSvg ? (
        <div className="w-full h-full flex items-center justify-center p-1">
          <BuiltInSvg className={iconSizes[size]} />
        </div>
      ) : logoUrl && !imageError ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          onError={() => setImageError(true)}
          className="h-full w-full object-contain rounded-lg p-0.5"
        />
      ) : (
        <div
          className={cn(
            'w-full h-full rounded-xl flex items-center justify-center bg-gradient-to-br font-extrabold tracking-wider',
            getBrandGradient(name)
          )}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
