'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, Plus, X, ArrowRight, Check, Globe, Link2, Loader2 } from 'lucide-react';

export default function CandidateOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STEP 1 STATES ---
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  const handleSelectResume = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
    e.target.value = '';
  };


  // --- STEP 2 STATES ---
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [workMode, setWorkMode] = useState<'Remote' | 'Hybrid' | 'Onsite'>('Remote');
  const [targetLocation, setTargetLocation] = useState('');

  // --- STEP 3 STATES ---
  const [expectedSalary, setExpectedSalary] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [workAuth, setWorkAuth] = useState('');
  const [proudProject, setProudProject] = useState('');
  const [workValues, setWorkValues] = useState<string[]>([
    'Learning & Career Growth',
    'High Autonomy & Ownership',
    'Compensation & Benefits',
    'Work-Life Balance',
    'Team Collaboration'
  ]);

  const handleComplete = async () => {
    setSubmitting(true);
    setError('');

    try {
      const profileData = {
        skills,
        targetRoles,
        expectedSalary: Number(expectedSalary) || 0,
        noticePeriod,
        workAuthorization: workAuth,
        proudProject,
        workValues,
      };

      const formData = new FormData();
      formData.append('data', JSON.stringify(profileData));
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1'}/candidate/profile`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      setSubmitting(false);

      if (data.success) {
        router.push('/candidate/dashboard');
      } else {
        setError(data.error || 'Failed to complete profile onboarding');
      }
    } catch {
      setSubmitting(false);
      setError('Failed to upload profile data');
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRole.trim() && !targetRoles.includes(newRole.trim())) {
      setTargetRoles([...targetRoles, newRole.trim()]);
      setNewRole('');
    }
  };

  const moveValueUp = (idx: number) => {
    if (idx === 0) return;
    const valuesCopy = [...workValues];
    const temp = valuesCopy[idx];
    valuesCopy[idx] = valuesCopy[idx - 1];
    valuesCopy[idx - 1] = temp;
    setWorkValues(valuesCopy);
  };

  const moveValueDown = (idx: number) => {
    if (idx === workValues.length - 1) return;
    const valuesCopy = [...workValues];
    const temp = valuesCopy[idx];
    valuesCopy[idx] = valuesCopy[idx + 1];
    valuesCopy[idx + 1] = temp;
    setWorkValues(valuesCopy);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-xl rounded-3xl border border-white/60 bg-white/45 p-8 shadow-xl backdrop-blur-md glass-panel">
        
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Candidate Setup</span>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {step === 1 && 'Step 1: Resume & Links'}
              {step === 2 && 'Step 2: Core Preferences & Stack'}
              {step === 3 && 'Step 3: Fit & Culture Questions'}
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-8 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-emerald-500' : 'bg-slate-200'}`}></span>
            <span className={`h-2 w-8 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`}></span>
            <span className={`h-2 w-8 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`}></span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-semibold">
            {error}
          </div>
        )}

        {/* STEP 1: RESUME & SOCIAL LINKS */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Upload your resume and links to sync social profile details with the AI Screening Agent.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileSelected}
            />

            {resumeFile ? (
              <div className="border border-indigo-200 bg-indigo-50/20 rounded-2xl p-6 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-indigo-700">
                  <Check className="h-4 w-4" />
                  <span className="truncate max-w-xs">{resumeFile.name}</span>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleSelectResume}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Choose a different file
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSelectResume}
                className="w-full border-2 border-dashed border-slate-350 hover:border-indigo-500 bg-white/30 hover:bg-indigo-50/10 rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center group"
              >
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-all mb-3">
                  <FileUp className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold text-slate-800 block">Select Resume PDF</span>
                <span className="text-xs text-slate-400 block mt-0.5">PDF or DOCX up to 5MB</span>
              </button>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">LinkedIn Profile URL</label>
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">GitHub Profile URL</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleComplete}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Skip Setup
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Next Step
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PREFERENCES & TECH STACK */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Target roles */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Target Roles</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {targetRoles.map((role) => (
                  <span key={role} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-700">
                    {role}
                    <button type="button" onClick={() => setTargetRoles(targetRoles.filter((r) => r !== role))} className="hover:text-indigo-900 cursor-pointer">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddRole} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add target title..."
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="flex-grow px-3 py-1.5 text-xs rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
                />
                <button type="submit" className="rounded-xl bg-slate-900 text-white font-bold text-xs px-3.5 hover:bg-slate-800 cursor-pointer flex items-center justify-center">
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Tech stack */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Core Tech Stack</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-emerald-50 border border-emerald-100 text-emerald-700">
                    {s}
                    <button type="button" onClick={() => setSkills(skills.filter((item) => item !== s))} className="hover:text-emerald-900 cursor-pointer">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add skill tag..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="flex-grow px-3 py-1.5 text-xs rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
                />
                <button type="submit" className="rounded-xl bg-slate-900 text-white font-bold text-xs px-3.5 hover:bg-slate-800 cursor-pointer flex items-center justify-center">
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Experience, work mode, and location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Years of Experience</label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Work Location Target</label>
                <input
                  type="text"
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Work Mode preference</label>
              <div className="flex p-1 rounded-xl bg-slate-200/50 border border-slate-200 select-none text-xs font-bold text-slate-600">
                {(['Remote', 'Hybrid', 'Onsite'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setWorkMode(mode)}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      workMode === mode ? 'bg-indigo-600 text-white shadow-sm' : 'hover:text-slate-900'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer animate-in"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Next Step
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FIT & CULTURE QUESTIONS */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Annual Salary ($)</label>
                <input
                  type="number"
                  value={expectedSalary}
                  onChange={(e) => setExpectedSalary(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Notice Period</label>
                <select
                  value={noticePeriod}
                  onChange={(e) => setNoticePeriod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
                >
                  <option value="Immediate">Immediate</option>
                  <option value="1-2 weeks">1-2 weeks</option>
                  <option value="30 days">30 days</option>
                  <option value="60+ days">60+ days</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Work Authorization</label>
              <select
                value={workAuth}
                onChange={(e) => setWorkAuth(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
              >
                <option value="Authorized">Authorized to work without sponsorship</option>
                <option value="Sponsorship Required">Requires visa sponsorship</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Describe a Proud Project</label>
              <textarea
                rows={3}
                value={proudProject}
                onChange={(e) => setProudProject(e.target.value)}
                placeholder="Explain the technical details of a project you shipped..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
              />
            </div>

            {/* Value priority ranking */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Work Values Priority Ranking</label>
              <div className="space-y-1.5">
                {workValues.map((val, idx) => (
                  <div
                    key={val}
                    className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100 bg-white/60 text-xs font-semibold text-slate-700"
                  >
                    <span>{idx + 1}. {val}</span>
                    <div className="flex gap-2 text-[10px] font-bold text-slate-400 select-none">
                      <button type="button" onClick={() => moveValueUp(idx)} className="hover:text-slate-800 disabled:opacity-30 cursor-pointer" disabled={idx === 0}>
                        ▲
                      </button>
                      <button type="button" onClick={() => moveValueDown(idx)} className="hover:text-slate-800 disabled:opacity-30 cursor-pointer" disabled={idx === workValues.length - 1}>
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleComplete}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 hover:scale-[1.01] disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Onboarding</span>
                    <Check className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
