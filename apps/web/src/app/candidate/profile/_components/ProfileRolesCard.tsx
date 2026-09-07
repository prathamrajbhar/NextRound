'use client';

import React from 'react';
import { Check } from '@/lib/lucide-google-icons';
import { PRESET_ROLES } from '../_utils/profileUtils';

interface ProfileRolesCardProps {
  targetRoles: string[];
  onToggleRole: (role: string) => void;
}

export function ProfileRolesCard({ targetRoles, onToggleRole }: ProfileRolesCardProps) {
  return (
    <div className="space-y-2 pt-2">
      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
        Target Job Roles
      </label>
      <div className="flex flex-wrap gap-2">
        {PRESET_ROLES.map((role) => {
          const isSelected = targetRoles.includes(role);
          return (
            <button
              key={role}
              type="button"
              onClick={() => onToggleRole(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
              }`}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {role}
            </button>
          );
        })}
      </div>
    </div>
  );
}
