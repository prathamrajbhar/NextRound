'use client';

import React, { useState } from 'react';
import { X, Save, Sparkles } from '@/lib/lucide-google-icons';
import type { GeneratedResumeData, ResumeItem } from './resume.types';
import { EditResumeSkillsSection } from './EditResumeSkillsSection';
import { EditResumeExperienceSection } from './EditResumeExperienceSection';

export type { GeneratedResumeData, ResumeItem };

interface EditResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeItem: ResumeItem | null;
  onSave: (updatedItem: ResumeItem) => void;
}

function ModalContent({
  resumeItem,
  onClose,
  onSave,
}: {
  resumeItem: ResumeItem;
  onClose: () => void;
  onSave: (updatedItem: ResumeItem) => void;
}) {
  const initialData = resumeItem.generatedResume || {
    name: 'Candidate Name',
    title: resumeItem.targetRole || 'Software Engineer',
    email: '',
    phone: '',
    location: '',
    summary: '',
    experience: [],
    skills: [],
  };

  const [roleTitle, setRoleTitle] = useState(initialData.title || resumeItem.targetRole);
  const [name, setName] = useState(initialData.name || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [summary, setSummary] = useState(initialData.summary || '');
  const rawSkills = initialData.skills;
  const initialSkillsList: string[] = Array.isArray(rawSkills) && typeof rawSkills[0] === 'string'
    ? (rawSkills as string[])
    : [];
  const [skills, setSkills] = useState<string[]>(initialSkillsList);
  const [experiences, setExperiences] = useState<NonNullable<GeneratedResumeData['experience']>>(
    initialData.experience || []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedGeneratedResume: GeneratedResumeData = {
      ...initialData,
      name,
      title: roleTitle,
      email,
      summary,
      skills,
      experience: experiences,
    };

    onSave({
      ...resumeItem,
      targetRole: roleTitle,
      generatedResume: updatedGeneratedResume,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-brand-50 dark:bg-orange-950/80 border border-brand-200 dark:border-orange-900 flex items-center justify-center text-brand-600 dark:text-orange-400 shadow-sm">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Edit ATS Resume</h2>
              <p className="text-xs text-slate-500 font-medium">Customize summary, skills, and experience bullets</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Target Role Title
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Candidate Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Professional Summary
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 resize-none leading-relaxed"
            />
          </div>

          <EditResumeSkillsSection skills={skills} setSkills={setSkills} />
          <EditResumeExperienceSection experiences={experiences} setExperiences={setExperiences} />

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Save Resume Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditResumeModal({ isOpen, onClose, resumeItem, onSave }: EditResumeModalProps) {
  if (!isOpen || !resumeItem) return null;
  return <ModalContent resumeItem={resumeItem} onClose={onClose} onSave={onSave} />;
}
