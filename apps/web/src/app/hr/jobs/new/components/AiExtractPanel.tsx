'use client';

import React, { useState } from 'react';
import { Sparkles, Cpu, Plus, X, Award, ShieldAlert, Heart } from 'lucide-react';

interface AiExtractProps {
  assisted: boolean;
  assisting: boolean;
  assistStep: string;
  skills: string[];
  setSkills: React.Dispatch<React.SetStateAction<string[]>>;
  softSkills: string[];
  setSoftSkills: React.Dispatch<React.SetStateAction<string[]>>;
  cultureKeywords: string[];
  setCultureKeywords: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function AiExtractPanel({
  assisted,
  assisting,
  assistStep,
  skills,
  setSkills,
  softSkills,
  setSoftSkills,
  cultureKeywords,
  setCultureKeywords,
}: AiExtractProps) {
  const [newSkill, setNewSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');
  const [newCulture, setNewCulture] = useState('');

  const addChip = (
    value: string,
    setValue: (val: string) => void,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    currentList: string[]
  ) => {
    const trimmed = value.trim();
    if (trimmed && !currentList.includes(trimmed)) {
      setter((prev) => [...prev, trimmed]);
      setValue('');
    }
  };

  const removeChip = (
    item: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => prev.filter((i) => i !== item));
  };

  if (assisting) {
    return (
      <div className="rounded-3xl border border-indigo-200/80 dark:border-indigo-900/80 bg-indigo-50/40 dark:bg-indigo-950/40 p-6 shadow-sm backdrop-blur-md space-y-4 animate-pulse">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Cpu className="h-5 w-5 animate-spin" />
          <h3 className="text-xs font-extrabold tracking-wider">AI is reading your job description...</h3>
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full bg-indigo-100 dark:bg-indigo-900/50 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-indigo-500 rounded-full animate-infinite animate-duration-1000" style={{ width: '50%' }} />
          </div>
          <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-extrabold tracking-tight italic select-none">
            {assistStep}
          </p>
        </div>
      </div>
    );
  }

  if (!assisted) return null;

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-6 animate-in slide-in-from-bottom-3 duration-250">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Sparkles className="h-5 w-5" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">AI Extracted Requirements</h3>
        </div>
      </div>

      <div className="space-y-5 text-xs font-semibold">
        <div className="space-y-2">
          <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-indigo-500" />
            Technical Skills
          </span>
          <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 min-h-[48px] items-center">
            {skills.length === 0 && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 italic pl-1">
                No technical skills parsed. Add skills manually below.
              </span>
            )}
            {skills.map((item) => (
              <span
                key={item}
                className="bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 group transition-all"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeChip(item, setSkills)}
                  className="opacity-70 hover:opacity-100 text-indigo-900 dark:text-indigo-200 cursor-pointer p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <div className="flex items-center gap-1 max-w-[140px] ml-1">
              <input
                type="text"
                placeholder="+ Add Skill"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addChip(newSkill, setNewSkill, setSkills, skills);
                  }
                }}
                className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none text-slate-900 dark:text-slate-100 text-[11px] py-1 font-bold transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => addChip(newSkill, setNewSkill, setSkills, skills)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer text-slate-600 dark:text-slate-300"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-purple-500" />
            Soft Skills
          </span>
          <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 min-h-[48px] items-center">
            {softSkills.map((item) => (
              <span
                key={item}
                className="bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 group transition-all"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeChip(item, setSoftSkills)}
                  className="opacity-70 hover:opacity-100 text-purple-900 dark:text-purple-200 cursor-pointer p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <div className="flex items-center gap-1 max-w-[140px] ml-1">
              <input
                type="text"
                placeholder="+ Add Soft Skill"
                value={newSoftSkill}
                onChange={(e) => setNewSoftSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addChip(newSoftSkill, setNewSoftSkill, setSoftSkills, softSkills);
                  }
                }}
                className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none text-slate-900 dark:text-slate-100 text-[11px] py-1 font-bold transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => addChip(newSoftSkill, setNewSoftSkill, setSoftSkills, softSkills)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer text-slate-600 dark:text-slate-300"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-rose-500" />
            Culture &amp; Values
          </span>
          <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 min-h-[48px] items-center">
            {cultureKeywords.map((item) => (
              <span
                key={item}
                className="bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 group transition-all"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeChip(item, setCultureKeywords)}
                  className="opacity-70 hover:opacity-100 text-rose-900 dark:text-rose-200 cursor-pointer p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <div className="flex items-center gap-1 max-w-[140px] ml-1">
              <input
                type="text"
                placeholder="+ Add Culture Tag"
                value={newCulture}
                onChange={(e) => setNewCulture(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addChip(newCulture, setNewCulture, setCultureKeywords, cultureKeywords);
                  }
                }}
                className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-rose-500 dark:focus:border-rose-400 focus:outline-none text-slate-900 dark:text-slate-100 text-[11px] py-1 font-bold transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => addChip(newCulture, setNewCulture, setCultureKeywords, cultureKeywords)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer text-slate-600 dark:text-slate-300"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
