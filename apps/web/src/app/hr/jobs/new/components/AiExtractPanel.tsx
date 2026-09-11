'use client';

import React from 'react';
import { Sparkles, Cpu, Award, ShieldAlert, Heart } from 'lucide-react';
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
        <AiChipInputSection
          title="Technical Skills"
          icon={<Award className="h-3.5 w-3.5 text-indigo-500" />}
          items={skills}
          onAdd={(val) => addChip(setSkills, skills, val)}
          onRemove={(val) => removeChip(setSkills, val)}
          placeholder="+ Add Skill"
          badgeClasses="bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
          removeBtnClasses="text-indigo-900 dark:text-indigo-200"
          focusBorderClasses="focus:border-indigo-500 dark:focus:border-indigo-400"
          emptyMessage="No technical skills parsed. Add skills manually below."
        />

        <AiChipInputSection
          title="Soft Skills"
          icon={<ShieldAlert className="h-3.5 w-3.5 text-purple-500" />}
          items={softSkills}
          onAdd={(val) => addChip(setSoftSkills, softSkills, val)}
          onRemove={(val) => removeChip(setSoftSkills, val)}
          placeholder="+ Add Soft Skill"
          badgeClasses="bg-purple-50 dark:bg-purple-950/80 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
          removeBtnClasses="text-purple-900 dark:text-purple-200"
          focusBorderClasses="focus:border-purple-500 dark:focus:border-purple-400"
        />

        <AiChipInputSection
          title="Culture & Values"
          icon={<Heart className="h-3.5 w-3.5 text-rose-500" />}
          items={cultureKeywords}
          onAdd={(val) => addChip(setCultureKeywords, cultureKeywords, val)}
          onRemove={(val) => removeChip(setCultureKeywords, val)}
          placeholder="+ Add Culture Tag"
          badgeClasses="bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
          removeBtnClasses="text-rose-900 dark:text-rose-200"
          focusBorderClasses="focus:border-rose-500 dark:focus:border-rose-400"
        />
      </div>
    </div>
  );
}
