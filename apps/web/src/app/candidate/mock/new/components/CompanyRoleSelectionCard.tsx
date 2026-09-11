'use client';

import React from 'react';
import { Building2, Target } from '@/lib/lucide-google-icons';
import { CompanyLogo, SearchableSelect } from '@/components/ui';
import type { SearchableSelectOption } from '@/components/ui';

interface CompanyRoleSelectionCardProps {
  company: string;
  companyOptions: SearchableSelectOption[];
  selectedCompany: SearchableSelectOption | null;
  roleOptions: SearchableSelectOption[];
  selectedRole: SearchableSelectOption | null;
  postedLoading: boolean;
  postedErrorMessage?: string;
  orgId: string | null;
  onCompanySelect: (opt: SearchableSelectOption) => void;
  onRoleSelect: (opt: SearchableSelectOption) => void;
}

export function CompanyRoleSelectionCard({
  company,
  companyOptions,
  selectedCompany,
  roleOptions,
  selectedRole,
  postedLoading,
  postedErrorMessage,
  orgId,
  onCompanySelect,
  onRoleSelect,
}: CompanyRoleSelectionCardProps) {
  return (
    <div className="space-y-4 border-b border-slate-200/60 dark:border-slate-800 pb-5">
      <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider">
        <Building2 className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
        Target Role &amp; Enterprise
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Target Enterprise
          </label>
          <div className="flex items-center gap-2">
            {postedLoading || !company ? (
              <span className="h-12 w-12 flex-shrink-0 rounded-2xl bg-slate-200/70 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 animate-pulse" />
            ) : (
              <CompanyLogo
                name={company}
                logoUrl={selectedCompany?.logoUrl}
                size="md"
                className="shadow-xs flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <SearchableSelect
                options={companyOptions}
                selected={selectedCompany}
                onSelect={onCompanySelect}
                loading={postedLoading}
                emptyMessage="No companies have posted roles yet"
                placeholder="Search companies with open roles..."
                icon={<Building2 className="h-4 w-4" />}
                error={postedErrorMessage}
                className="text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Target Position Title
          </label>
          <SearchableSelect
            options={roleOptions}
            selected={selectedRole}
            onSelect={onRoleSelect}
            loading={postedLoading}
            disabled={!orgId}
            emptyMessage="Pick a company to see its open roles"
            placeholder="Roles posted by this company..."
            icon={<Target className="h-4 w-4" />}
            className="text-xs font-semibold"
          />
        </div>
      </div>
    </div>
  );
}
