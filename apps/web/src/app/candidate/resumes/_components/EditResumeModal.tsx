'use client';

import React, { useState } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  Sparkles,
} from '@/lib/lucide-google-icons';

export interface GeneratedResumeData {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  experience?: Array<{
    title?: string;
    company?: string;
    duration?: string;
    highlights?: string[];
  }>;
  skills?: string[];
}

export interface ResumeItem {
  id: string;
  targetRole: string;
  targetCompany: string;
  generatedResume: GeneratedResumeData | null;
}

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
  const [skills, setSkills] = useState<string[]>(initialData.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [experiences, setExperiences] = useState<NonNullable<GeneratedResumeData['experience']>>(
    initialData.experience || []
  );

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (tag: string) => {
    setSkills(skills.filter((s) => s !== tag));
  };

  const handleAddHighlight = (expIdx: number) => {
    const updated = [...experiences];
    const exp = updated[expIdx];
    if (exp) {
      if (!exp.highlights) exp.highlights = [];
      exp.highlights.push('New key achievement or technical bullet point...');
      setExperiences(updated);
    }
  };

  const handleUpdateHighlight = (expIdx: number, hIdx: number, val: string) => {
    const updated = [...experiences];
    const exp = updated[expIdx];
    if (exp && exp.highlights) {
      exp.highlights[hIdx] = val;
      setExperiences(updated);
    }
  };

  const handleRemoveHighlight = (expIdx: number, hIdx: number) => {
    const updated = [...experiences];
    const exp = updated[expIdx];
    if (exp && exp.highlights) {
      exp.highlights.splice(hIdx, 1);
      setExperiences(updated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedGeneratedResume = {
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
        
        {/* Modal Header */}
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

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Target Role & Candidate Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Target Role Title</label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Candidate Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500"
              />
            </div>
          </div>

          {/* Professional Summary */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Professional Summary</label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 resize-none leading-relaxed"
            />
          </div>

          {/* Skills Keywords */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Extracted Skills Matrix</label>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-xl bg-brand-50 dark:bg-orange-950/60 border border-brand-200 dark:border-orange-900/60 text-brand-700 dark:text-orange-300"
                >
                  {s}
                  <button type="button" onClick={() => handleRemoveSkill(s)} className="hover:text-red-500 cursor-pointer">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add skill (e.g. Redis, Kubernetes)..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-grow px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-extrabold cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Work Experience Bullets */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Work Experience &amp; Accomplishments</label>
            {experiences.map((exp, expIdx) => (
              <div key={expIdx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100">{exp.title || 'Role'} • {exp.company || 'Company'}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{exp.duration || ''}</span>
                </div>

                <div className="space-y-2">
                  {(exp.highlights || []).map((h: string, hIdx: number) => (
                    <div key={hIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => handleUpdateHighlight(expIdx, hIdx, e.target.value)}
                        className="flex-grow px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(expIdx, hIdx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddHighlight(expIdx)}
                    className="text-[10px] font-extrabold text-brand-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <Plus className="h-3 w-3" /> Add Bullet Highlight
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Form Actions */}
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
