'use client';

import React from 'react';
import { Briefcase, Code } from '@/lib/lucide-google-icons';
import { OnboardingStepProps } from './useCandidateOnboarding';
import { inputCls, labelCls, TagInput } from './CandidateOnboardingShell';

const ROLE_SUGGESTIONS = [
  'Frontend Engineer',
  'Backend Engineer',
  'Full-Stack Engineer',
  'Mobile Developer',
  'DevOps Engineer',
  'Data Scientist',
  'ML Engineer',
  'Product Designer',
  'QA Engineer',
  'Engineering Manager',
];

const SKILL_SUGGESTIONS = [
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'Java',
  'Go',
  'SQL',
  'PostgreSQL',
  'AWS',
  'Docker',
  'Kubernetes',
  'Figma',
];

export function ExperienceSkillsStep({ form, update, addTag, removeTag }: OnboardingStepProps) {
  const toggleSuggestion = (field: 'targetRoles' | 'skills', value: string) => {
    if (form[field].includes(value)) {
      removeTag(field, value);
    } else {
      addTag(field, value);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <label className={labelCls}>Years of Experience</label>
        <div className="relative">
          <Briefcase className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="number"
            min={0}
            max={60}
            value={form.yearsOfExperience}
            onChange={(e) => update('yearsOfExperience', e.target.value)}
            placeholder="e.g. 5"
            className={`${inputCls} pl-10`}
          />
        </div>
      </div>

      <div>
        <TagInput
          label="Target Roles"
          placeholder="Add a role title..."
          hint="The roles you're open to — powers job matching."
          tags={form.targetRoles}
          onAdd={(v) => addTag('targetRoles', v)}
          onRemove={(v) => removeTag('targetRoles', v)}
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {ROLE_SUGGESTIONS.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleSuggestion('targetRoles', role)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                form.targetRoles.includes(role)
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div>
        <TagInput
          label="Core Tech Stack / Skills"
          placeholder="Add a skill tag..."
          hint="Used for skill-match scoring against job rubrics."
          tags={form.skills}
          onAdd={(v) => addTag('skills', v)}
          onRemove={(v) => removeTag('skills', v)}
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {SKILL_SUGGESTIONS.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSuggestion('skills', skill)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                form.skills.includes(skill)
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
        <Code className="h-3.5 w-3.5" />
        The AI screening agent matches these against each job&apos;s rubric to rank your applications.
      </p>
    </div>
  );
}
