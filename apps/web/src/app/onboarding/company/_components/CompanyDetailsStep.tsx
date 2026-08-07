'use client';

import React from 'react';
import { Building, Globe, MapPin } from '@/lib/lucide-google-icons';
import { CompanyStepProps } from './useCompanyOnboarding';
import { inputCls, labelCls, selectCls } from './CompanyOnboardingShell';

const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'E-commerce',
  'Manufacturing',
  'Media & Entertainment',
  'Consulting',
  'Other',
];

const SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'];

export function CompanyDetailsStep({ form, update }: CompanyStepProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <label className={labelCls}>
          Organization Name <span className="text-orange-400">*</span>
        </label>
        <div className="relative">
          <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Acme SaaS Ltd."
            className={`${inputCls} pl-10`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Website</label>
          <div className="relative">
            <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="url"
              value={form.website}
              onChange={(e) => update('website', e.target.value)}
              placeholder="https://acme.com"
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>HQ Location</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={form.hqLocation}
              onChange={(e) => update('hqLocation', e.target.value)}
              placeholder="e.g. Bengaluru, India"
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Industry</label>
          <select value={form.industry} onChange={(e) => update('industry', e.target.value)} className={selectCls}>
            {INDUSTRIES.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Company Size</label>
          <select value={form.size} onChange={(e) => update('size', e.target.value)} className={selectCls}>
            {SIZES.map((size) => (
              <option key={size} value={size}>
                {size} Employees
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
