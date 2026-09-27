'use client';

import React from 'react';
import { Building, Globe, CheckCircle2, AlignLeft, Laptop } from '@/lib/lucide-google-icons';
import { CompanyStepProps, WorkplaceType } from './useCompanyOnboarding';
import { inputCls, labelCls, selectCls } from './CompanyOnboardingShell';
import { SingleCityInput } from '../../candidate/_components/SingleCityInput';
import { CompanyLogoUpload } from './CompanyLogoUpload';

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

const WORKPLACE_TYPES: { type: WorkplaceType; label: string; desc: string }[] = [
  { type: 'Remote-first', label: 'Remote-first', desc: 'Work from anywhere' },
  { type: 'Hybrid', label: 'Hybrid', desc: 'Flexible in-office days' },
  { type: 'Onsite', label: 'Onsite', desc: 'Physical office presence' },
];

export function CompanyDetailsStep({ form, update }: CompanyStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <CompanyLogoUpload
        logoUrl={form.logoUrl}
        onLogoChange={(url) => update('logoUrl', url)}
      />

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls.replace('mb-2', '')}>
            Organization Name <span className="text-orange-400">*</span>
          </label>
          {form.isPreConfigured && form.name && (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="h-3 w-3" /> Configured at signup
            </span>
          )}
        </div>
        <div className="relative">
          <Building className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Acme SaaS Ltd."
            className={`${inputCls} pl-10`}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls.replace('mb-2', '')}>Company Overview &amp; Mission</label>
          <span className="text-[10px] font-mono text-slate-400">
            {form.description.length}/300
          </span>
        </div>
        <div className="relative">
          <AlignLeft className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <textarea
            rows={2}
            maxLength={300}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Briefly describe what your company does and why candidates love working here..."
            className={`${inputCls} pl-10 py-3 resize-none`}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Workplace Policy</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {WORKPLACE_TYPES.map((wp) => {
            const isSelected = form.workplaceType === wp.type;
            return (
              <button
                key={wp.type}
                type="button"
                onClick={() => update('workplaceType', wp.type)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-orange-500/20 border-orange-500/60 text-white shadow-md shadow-orange-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Laptop className={`h-3.5 w-3.5 ${isSelected ? 'text-orange-400' : 'text-slate-500'}`} />
                  <span className={`text-xs font-bold ${isSelected ? 'text-orange-300' : 'text-slate-200'}`}>
                    {wp.label}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium mt-1">{wp.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Website</label>
          <div className="relative">
            <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
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
          <SingleCityInput
            value={form.hqLocation}
            onChange={(val) => update('hqLocation', val)}
            placeholder="e.g. Bengaluru, India"
          />
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
