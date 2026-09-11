'use client';

import React from 'react';
import { Sparkles, Cpu, Award, ShieldAlert, Heart } from '@/lib/lucide-google-icons';
import { AiChipInputSection } from './AiChipInputSection';

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
  const addChip = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    currentList: string[],
    val: string
  ) => {
    if (!currentList.includes(val)) {
      setter((prev) => [...prev, val]);
    }
  };

  const removeChip = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    val: string
  ) => {
    setter((prev) => prev.filter((i) => i !== val));
  };

  if (assisting) {
    return (
      <div className="rounded-3xl border border-brand-500/30 bg-brand-50/50 dark:bg-brand-950/20 p-6 shadow-sm backdrop-blur-md space-y-4 animate-pulse">
        <div className="flex items-center gap-2.5 text-brand-600 dark:text-brand-400">
          <Cpu className="h-5 w-5 animate-spin" />
          <h3 className="text-xs font-black tracking-wider uppercase">AI is analyzing job requirements...</h3>
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full bg-brand-200 dark:bg-brand-900/50 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-brand-500 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
          <p className="text-xs text-brand-700 dark:text-brand-300 font-bold tracking-tight">
            {assistStep}
          </p>
        </div>
      </div>
    );
  }

  if (!assisted) return null;

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-6 md:p-7 shadow-sm backdrop-blur-md space-y-6 animate-in slide-in-from-bottom-3 duration-250">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5 text-brand-600 dark:text-brand-400">
          <div className="h-8 w-8 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">Extracted Candidate Competencies</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">AI automatically curated requirements from your description</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 text-xs font-semibold">
        <AiChipInputSection
          title="Technical Competencies & Tools"
          icon={<Award className="h-4 w-4 text-brand-500" />}
          items={skills}
          onAdd={(val) => addChip(setSkills, skills, val)}
          onRemove={(val) => removeChip(setSkills, val)}
          placeholder="+ Add Skill"
          badgeClasses="bg-brand-50 dark:bg-brand-950/60 border-brand-200 dark:border-brand-800 text-brand-800 dark:text-brand-300"
          removeBtnClasses="text-brand-900 dark:text-brand-200"
          focusBorderClasses="focus:border-brand-500 dark:focus:border-brand-400"
          emptyMessage="No technical skills parsed. Add skills manually below."
        />

        <AiChipInputSection
          title="Behavioral & Problem Solving Skills"
          icon={<ShieldAlert className="h-4 w-4 text-emerald-500" />}
          items={softSkills}
          onAdd={(val) => addChip(setSoftSkills, softSkills, val)}
          onRemove={(val) => removeChip(setSoftSkills, val)}
          placeholder="+ Add Soft Skill"
          badgeClasses="bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
          removeBtnClasses="text-emerald-900 dark:text-emerald-200"
          focusBorderClasses="focus:border-emerald-500 dark:focus:border-emerald-400"
        />

        <AiChipInputSection
          title="Culture, Values & Working Style"
          icon={<Heart className="h-4 w-4 text-rose-500" />}
          items={cultureKeywords}
          onAdd={(val) => addChip(setCultureKeywords, cultureKeywords, val)}
          onRemove={(val) => removeChip(setCultureKeywords, val)}
          placeholder="+ Add Value"
          badgeClasses="bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
          removeBtnClasses="text-rose-900 dark:text-rose-200"
          focusBorderClasses="focus:border-rose-500 dark:focus:border-rose-400"
        />
      </div>
    </div>
  );
}
