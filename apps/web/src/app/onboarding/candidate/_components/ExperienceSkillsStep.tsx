'use client';

import React from 'react';
import { Briefcase, Code, GraduationCap, Plus, Trash2 } from '@/lib/lucide-google-icons';
import { EducationEntry } from '@nextround/shared';
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

  const handleAddEducation = () => {
    const nextEdu: EducationEntry[] = [
      ...(form.education || []),
      { degree: '', institution: '', fieldOfStudy: '', graduationYear: new Date().getFullYear() },
    ];
    update('education', nextEdu);
  };

  const handleUpdateEducation = (index: number, key: keyof EducationEntry, value: string | number) => {
    const list = [...(form.education || [])];
    if (!list[index]) return;
    list[index] = {
      ...list[index],
      [key]: key === 'graduationYear' ? (value ? Number(value) : null) : value,
    };
    update('education', list);
  };

  const handleRemoveEducation = (index: number) => {
    const list = (form.education || []).filter((_, i) => i !== index);
    update('education', list);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <label className={labelCls}>Years of Experience</label>
        <div className="relative">
          <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
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

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
              Education &amp; Degrees
            </label>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Degrees and certifications considered by hiring managers
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddEducation}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 hover:bg-orange-500/30 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Add Degree
          </button>
        </div>

        {(!form.education || form.education.length === 0) ? (
          <div className="text-center py-5 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            <GraduationCap className="h-6 w-6 text-slate-600 mx-auto mb-1.5" />
            <p className="text-xs text-slate-400 font-medium">No education added yet. Click &quot;Add Degree&quot; to include your background.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {form.education.map((edu, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3 relative">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-orange-400" />
                    Entry #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(idx)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    aria-label="Remove education entry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Degree / Certificate</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
                      placeholder="e.g. B.Tech / B.S. / M.S."
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Field of Study</label>
                    <input
                      type="text"
                      value={edu.fieldOfStudy || ''}
                      onChange={(e) => handleUpdateEducation(idx, 'fieldOfStudy', e.target.value)}
                      placeholder="e.g. Computer Science"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Institution / University</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => handleUpdateEducation(idx, 'institution', e.target.value)}
                      placeholder="e.g. IIT Bombay / Stanford University"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Graduation Year</label>
                    <input
                      type="number"
                      min={1970}
                      max={2035}
                      value={edu.graduationYear || ''}
                      onChange={(e) => handleUpdateEducation(idx, 'graduationYear', e.target.value)}
                      placeholder="e.g. 2024"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
        <div className="flex flex-wrap gap-2 mt-3">
          {ROLE_SUGGESTIONS.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleSuggestion('targetRoles', role)}
              className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                form.targetRoles.includes(role)
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
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
        <div className="flex flex-wrap gap-2 mt-3">
          {SKILL_SUGGESTIONS.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSuggestion('skills', skill)}
              className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                form.skills.includes(skill)
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Code className="h-4 w-4 text-orange-400" />
        The AI screening agent matches these against job rubrics to rank your applications.
      </p>
    </div>
  );
}
