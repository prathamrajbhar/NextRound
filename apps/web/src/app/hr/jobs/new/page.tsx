'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ArrowLeft, Save, Send } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';

// Component imports
import JobBasicsCard from './components/JobBasicsCard';
import JobDescriptionCard from './components/JobDescriptionCard';
import AiExtractPanel from './components/AiExtractPanel';
import RubricWeightingCard from './components/RubricWeightingCard';
import PipelineConfigCard from './components/PipelineConfigCard';

export default function HrCreateJob() {
  const router = useRouter();

  // Basic States
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [locationType, setLocationType] = useState('Remote');
  const [experienceLevel, setExperienceLevel] = useState('Senior (5+ Years)');
  const [minSalary, setMinSalary] = useState(1300000);
  const [maxSalary, setMaxSalary] = useState(1800000);

  // Description & AI assistant state
  const [jd, setJd] = useState('');
  const [assisting, setAssisting] = useState(false);
  const [assisted, setAssisted] = useState(false);
  const [assistStep, setAssistStep] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [softSkills, setSoftSkills] = useState<string[]>([]);
  const [cultureKeywords, setCultureKeywords] = useState<string[]>([]);

  // Rubric weights state
  const [rubric, setRubric] = useState({
    technical: 25,
    communication: 25,
    problemSolving: 25,
    experience: 25,
  });
  const [autoBalance, setAutoBalance] = useState(true);

  // Pipeline configuration state
  const [minScore, setMinScore] = useState(80);
  const [autoOffer, setAutoOffer] = useState(false);
  const [qCount, setQCount] = useState(5);
  const [enableSourcing, setEnableSourcing] = useState(true);
  const [voiceProfile, setVoiceProfile] = useState('Serena (Warm/Professional)');

  const [stages, setStages] = useState<('screening' | 'assessment' | 'voice_screen' | 'hr_round' | 'panel' | 'decision')[]>([
    'screening',
    'assessment',
    'voice_screen',
    'hr_round',
    'decision',
  ]);
  const [assessmentConfig, setAssessmentConfig] = useState<{
    mcqCount: number;
    codingProblemId: string;
    passingScore: number;
    mcqDistribution?: Record<string, number>;
  }>({
    mcqCount: 20,
    codingProblemId: 'virtualized-list',
    passingScore: 80,
    mcqDistribution: {
      'Quantitative Aptitude': 5,
      'Logical Reasoning': 5,
      'Verbal Ability': 5,
      'Data Interpretation': 5,
    },
  });

  const handleAiAssist = async () => {
    if (!jd) return;
    setAssisting(true);
    setAssistStep('Analyzing job description with Gemini AI...');

    try {
      const res = await apiClient.post<{
        skills?: string[];
        softSkills?: string[];
        cultureKeywords?: string[];
        rubric?: { technical?: number; communication?: number; problemSolving?: number; experience?: number };
        enhancedDescription?: string;
      }>('/jobs/extract-requirements', {
        description: jd,
        title,
      });

      if (res) {
        if (Array.isArray(res.skills) && res.skills.length > 0) {
          setSkills(res.skills);
        }
        if (Array.isArray(res.softSkills) && res.softSkills.length > 0) {
          setSoftSkills(res.softSkills);
        }
        if (Array.isArray(res.cultureKeywords) && res.cultureKeywords.length > 0) {
          setCultureKeywords(res.cultureKeywords);
        }
        if (res.rubric) {
          setRubric({
            technical: res.rubric.technical ?? 30,
            communication: res.rubric.communication ?? 20,
            problemSolving: res.rubric.problemSolving ?? 25,
            experience: res.rubric.experience ?? 25,
          });
        }
        if (res.enhancedDescription) {
          setJd(res.enhancedDescription);
        }
      }
    } catch (err) {
      console.error('API AI requirement extraction failed:', err);
    } finally {
      setAssisted(true);
      setAssisting(false);
    }
  };

  const handleWeightChange = (
    key: 'technical' | 'communication' | 'problemSolving' | 'experience',
    newValue: number
  ) => {
    if (!autoBalance) {
      setRubric((prev) => ({ ...prev, [key]: newValue }));
      return;
    }

    const keys = ['technical', 'communication', 'problemSolving', 'experience'] as const;
    const otherKeys = keys.filter((k) => k !== key);
    const oldValue = rubric[key];
    const diff = newValue - oldValue;

    const tempRubric = { ...rubric, [key]: newValue };
    let remainingDiff = diff;

    const eligibleKeys = otherKeys.filter((k) => {
      if (diff > 0) return rubric[k] > 0;
      if (diff < 0) return rubric[k] < 100;
      return true;
    });

    if (eligibleKeys.length > 0) {
      const share = Math.round(diff / eligibleKeys.length);

      eligibleKeys.forEach((k, idx) => {
        let change = share;
        if (idx === eligibleKeys.length - 1) {
          change = remainingDiff;
        }
        const targetVal = Math.max(0, Math.min(100, rubric[k] - change));
        tempRubric[k] = targetVal;
        remainingDiff -= (rubric[k] - targetVal);
      });
    }

    const finalSum =
      tempRubric.technical +
      tempRubric.communication +
      tempRubric.problemSolving +
      tempRubric.experience;
    if (finalSum !== 100) {
      const adjustKey = otherKeys[0];
      tempRubric[adjustKey] = Math.max(0, Math.min(100, tempRubric[adjustKey] + (100 - finalSum)));
    }

    setRubric(tempRubric);
  };

  const totalWeight =
    rubric.technical + rubric.communication + rubric.problemSolving + rubric.experience;
  const isRubricBalanced = totalWeight === 100;

  const handleSaveDraft = async () => {
    const payload = {
      title: title || 'Untitled Draft Job',
      description: jd || 'Draft job description.',
      department,
      rubric: {
        technical: rubric.technical,
        communication: rubric.communication,
        problemSolving: rubric.problemSolving,
        experience: rubric.experience,
      },
      thresholds: {
        minScore,
        autoOffer,
      },
      status: 'draft',
      location: locationType === 'Remote' ? 'Remote' : 'Bengaluru, KA (On-site)',
      salary: `₹${(minSalary / 100000).toFixed(1)}L - ₹${(maxSalary / 100000).toFixed(1)}L`,
      experienceLevel,
      stages,
      assessmentConfig,
    };

    try {
      await apiClient.post('/jobs', payload);
    } catch (err) {
      console.warn('API draft creation failed, redirecting:', err);
    }
    router.push('/hr/jobs');
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRubricBalanced) return;

    const payload = {
      title,
      description: jd || 'No description provided.',
      department,
      rubric: {
        technical: rubric.technical,
        communication: rubric.communication,
        problemSolving: rubric.problemSolving,
        experience: rubric.experience,
      },
      thresholds: {
        minScore,
        autoOffer,
      },
      status: 'active',
      location: locationType === 'Remote' ? 'Remote' : 'Bengaluru, KA (On-site)',
      salary: `₹${(minSalary / 100000).toFixed(1)}L - ₹${(maxSalary / 100000).toFixed(1)}L`,
      experienceLevel,
      stages,
      assessmentConfig,
    };

    try {
      await apiClient.post('/jobs', payload);
    } catch (err) {
      console.warn('API creation failed, redirecting:', err);
    }
    router.push('/hr/jobs');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider mb-1">
            <Link href="/hr/jobs" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Jobs
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
            <span className="text-slate-700 dark:text-slate-200 font-black">New Job</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Post a New Job
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
            Fill in the job details, AI test requirements, and hiring steps to start finding candidates.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/hr/jobs"
            className="inline-flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Link>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all shadow-xs cursor-pointer"
          >
            <Save className="h-4 w-4 text-slate-500" />
            Save Draft
          </button>

          <button
            type="button"
            disabled={!isRubricBalanced}
            onClick={handlePublish}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white font-extrabold px-5 py-2 text-xs shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" />
            Publish Job
          </button>
        </div>
      </div>

      {/* Clean 2-Column Responsive Layout */}
      <form onSubmit={handlePublish} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column - Core Basics, Description & AI Parameters */}
        <div className="lg:col-span-2 space-y-6">
          <JobBasicsCard
            title={title}
            setTitle={setTitle}
            department={department}
            setDepartment={setDepartment}
            locationType={locationType}
            setLocationType={setLocationType}
            experienceLevel={experienceLevel}
            setExperienceLevel={setExperienceLevel}
            minSalary={minSalary}
            setMinSalary={setMinSalary}
            maxSalary={maxSalary}
            setMaxSalary={setMaxSalary}
          />

          <JobDescriptionCard
            jd={jd}
            setJd={setJd}
            onAiAssist={handleAiAssist}
            assisting={assisting}
          />

          <AiExtractPanel
            assisted={assisted}
            assisting={assisting}
            assistStep={assistStep}
            skills={skills}
            setSkills={setSkills}
            softSkills={softSkills}
            setSoftSkills={setSoftSkills}
            cultureKeywords={cultureKeywords}
            setCultureKeywords={setCultureKeywords}
          />
        </div>

        {/* Right Column - Rubric Weighting & Pipeline Settings */}
        <div className="space-y-6 lg:sticky lg:top-6">
          <RubricWeightingCard
            technical={rubric.technical}
            communication={rubric.communication}
            problemSolving={rubric.problemSolving}
            experience={rubric.experience}
            autoBalance={autoBalance}
            setAutoBalance={setAutoBalance}
            onWeightChange={handleWeightChange}
          />

          <PipelineConfigCard
            minScore={minScore}
            setMinScore={setMinScore}
            autoOffer={autoOffer}
            setAutoOffer={setAutoOffer}
            qCount={qCount}
            setQCount={setQCount}
            enableSourcing={enableSourcing}
            setEnableSourcing={setEnableSourcing}
            voiceProfile={voiceProfile}
            setVoiceProfile={setVoiceProfile}
            stages={stages}
            setStages={setStages}
            assessmentConfig={assessmentConfig}
            setAssessmentConfig={setAssessmentConfig}
          />
        </div>
      </form>
    </div>
  );
}
