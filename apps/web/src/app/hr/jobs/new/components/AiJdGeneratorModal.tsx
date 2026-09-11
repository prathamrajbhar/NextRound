'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui';
import { Sparkles, Briefcase, Building2, Layers, MapPin, Cpu, Check } from '@/lib/lucide-google-icons';

interface AiJdGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle: string;
  initialDepartment: string;
  initialExperienceLevel: string;
  initialLocationType: string;
  onGenerate: (params: {
    title: string;
    department: string;
    experienceLevel: string;
    locationType: string;
    keySkills: string;
    objectives: string;
    tone: string;
  }) => Promise<void>;
  loading: boolean;
}

const TONES = [
  'High Growth & Fast Paced',
  'Executive & Enterprise',
  'Product-Led & Creative',
  'Inclusive & Collaborative',
];

export function AiJdGeneratorModal({
  isOpen,
  onClose,
  initialTitle,
  initialDepartment,
  initialExperienceLevel,
  initialLocationType,
  onGenerate,
  loading,
}: AiJdGeneratorModalProps) {
  const [title, setTitle] = useState(initialTitle || '');
  const [department, setDepartment] = useState(initialDepartment || 'Engineering');
  const [experienceLevel, setExperienceLevel] = useState(initialExperienceLevel || 'Senior (5-8 Yrs)');
  const [locationType, setLocationType] = useState(initialLocationType || 'Remote');
  const [keySkills, setKeySkills] = useState('');
  const [objectives, setObjectives] = useState('');
  const [tone, setTone] = useState(TONES[0]);

  useEffect(() => {
    if (isOpen) {
      if (initialTitle) setTitle(initialTitle);
      if (initialDepartment) setDepartment(initialDepartment);
      if (initialExperienceLevel) setExperienceLevel(initialExperienceLevel);
      if (initialLocationType) setLocationType(initialLocationType);
    }
  }, [isOpen, initialTitle, initialDepartment, initialExperienceLevel, initialLocationType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || loading) return;
    await onGenerate({
      title: title.trim(),
      department,
      experienceLevel,
      locationType,
      keySkills: keySkills.trim(),
      objectives: objectives.trim(),
      tone,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="AI Executive Job Description Writer"
      description="Provide role context and key expectations. Gemini AI will generate an executive, ATS-optimized JD with matching competency rubrics."
      icon={<Sparkles className="h-5 w-5 text-brand-500" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-slate-400" />
              <span>Role Title</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Staff Backend Engineer"
              className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span>Department</span>
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Platform Infrastructure"
              className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              <span>Seniority / Level</span>
            </label>
            <input
              type="text"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              placeholder="e.g. Senior (5-8 Yrs)"
              className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-brand-500" />
            <span>Key Technologies, Stacks, or Skills</span>
          </label>
          <input
            type="text"
            value={keySkills}
            onChange={(e) => setKeySkills(e.target.value)}
            placeholder="e.g. Go, Kubernetes, Kafka, Distributed Systems, PostgreSQL"
            className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Comma-separated skills the role must specialize in</span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Core Team Mission / Key Objective
          </label>
          <textarea
            rows={2}
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            placeholder="e.g. Architecting zero-downtime event pipeline handling 50M requests daily, mentoring mid-level engineers"
            className="w-full px-3.5 py-2 text-xs font-normal rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all leading-relaxed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Writing Tone &amp; Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TONES.map((t) => {
              const active = tone === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 rounded-xl text-left text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-between ${
                    active
                      ? 'border-brand-500 bg-brand-500/10 text-brand-800 dark:text-brand-300'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>{t}</span>
                  {active && <Check className="h-3 w-3 text-brand-500" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200/70 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white font-black text-xs shadow-md shadow-brand-500/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <Sparkles className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'AI Crafting Professional JD...' : 'Generate Executive JD'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
