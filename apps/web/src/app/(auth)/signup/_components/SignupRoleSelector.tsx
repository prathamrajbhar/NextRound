'use client';

import React from 'react';
import { Role, ROLE_OPTIONS } from './signup.constants';

interface SignupRoleSelectorProps {
  role: Role;
  onChange: (role: Role) => void;
}

export function SignupRoleSelector({ role, onChange }: SignupRoleSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Account type"
      className="grid grid-cols-2 gap-1.5 rounded-2xl border border-white/10 bg-slate-950/60 p-1.5"
    >
      {ROLE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={role === option.value}
          className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-extrabold transition-all ${
            role === option.value
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <option.icon className="h-4 w-4" />
          {option.label}
        </button>
      ))}
    </div>
  );
}
