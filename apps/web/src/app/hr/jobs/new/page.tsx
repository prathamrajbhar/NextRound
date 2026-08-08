'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ArrowLeft, Check, Sparkles, Layers, LayoutGrid, ArrowRight, Save, Send } from 'lucide-react';
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

  // Navigation & View Mode State
  const [viewMode, setViewMode] = useState<'stepper' | 'grid'>('stepper');
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Basic States
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [locationType, setLocationType] = useState('Remote');
  const [experienceLevel, setExperienceLevel] = useState('Senior (5+ Years)');
  const [minSalary, setMinSalary] = useState(130000);
  const [maxSalary, setMaxSalary] = useState(180000);

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
  const [assessmentConfig, setAssessmentConfig] = useState({
    mcqCount: 5,
    codingProblemId: 'virtualized-list',
    passingScore: 80,
  });

  const handleAiAssist = async () => {
    if (!jd) return;
    setAssisting(true);
    setAssistStep('Initializing AI JD Parser agent...');

    try {
      // 1. Create a draft job first
      const draftRes = await apiClient.post<{ job: { id: string } }>('/jobs', {
        title: title || 'Draft Position',
        description: jd,
        department,
        status: 'draft',
      });

      const jobId = draftRes?.job?.id;
      if (jobId) {
        setAssistStep('AI LangGraph Agent computing rubric & parsing requirements...');
        await apiClient.post(`/jobs/${jobId}/ai-assist`);

        // Poll for AI result completion (up to 5 polls)
        let polls = 0;
        while (polls < 5) {
          await new Promise((res) => setTimeout(res, 2000));
          polls++;
          const updatedJob = await apiClient.get<{ description?: string; rubric?: { technical?: number; communication?: number; problemSolving?: number; experience?: number } }>(`/jobs/${jobId}`);
          if (updatedJob && updatedJob.rubric) {
            if (updatedJob.description) setJd(updatedJob.description);
            if (updatedJob.rubric) {
              setRubric({
                technical: updatedJob.rubric.technical ?? 30,
                communication: updatedJob.rubric.communication ?? 20,
                problemSolving: updatedJob.rubric.problemSolving ?? 25,
                experience: updatedJob.rubric.experience ?? 25,
              });
            }
            break;
          }
        }
      }
    } catch (err) {
      console.warn('API AI assist call failed, utilizing client-side fallback:', err);
    } finally {
      // Populate extract tags for UI representation
      const text = jd.toLowerCase();
      if (text.includes('product manager') || text.includes('pm')) {
        setSkills(['Product Strategy', 'Roadmapping', 'Agile/Scrum', 'User Analytics', 'A/B Testing']);
        setSoftSkills(['Collaboration', 'Stakeholder Management', 'Public Speaking']);
        setCultureKeywords(['Customer Obsessed', 'Metrics-Driven', 'Fast Execution']);
      } else if (text.includes('designer') || text.includes('ux') || text.includes('ui')) {
        setSkills(['Figma', 'Prototyping', 'Design Systems', 'User Research', 'Typography']);
        setSoftSkills(['Empathy', 'Creative Problem Solving', 'Constructive Feedback']);
        setCultureKeywords(['Design Excellence', 'User Centricity', 'Detail Oriented']);
      } else {
        setSkills(['React', 'TypeScript', 'Next.js', 'System Architecture', 'Performance optimization']);
        setSoftSkills(['System design thinking', 'Technical leadership', 'Cross-functional collaboration']);
        setCultureKeywords(['Innovation focus', 'High performance', 'Continuous learning']);
      }
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

  // Steps definition for wizard
  const STEPS = [
    { id: 1, name: 'Job Basics', description: 'Position title, department & salary' },
    { id: 2, name: 'Description & AI', description: 'Job description & extracted tags' },
    { id: 3, name: 'Evaluation Rubric', description: 'Scorecard weighting & auto-balance' },
    { id: 4, name: 'Pipeline & Sourcing', description: 'Stage sequence & AI agents' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider mb-1">
            <Link href="/hr/jobs" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Jobs Workspace
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
            <span className="text-slate-700 dark:text-slate-200 font-black">New Opening</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Post a Job Opening
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
            Configure autonomous agent sourcing, AI screening scorecards, and custom evaluation pipelines.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700/60 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('stepper')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'stepper'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Guided Stepper
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Overview Grid
            </button>
          </div>

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
            Publish Job Post
          </button>
        </div>
      </div>

      {/* Stepper Wizard Progress Bar */}
      {viewMode === 'stepper' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STEPS.map((step) => {
              const isCurrent = currentStep === step.id;
              const isDone = currentStep > step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    isCurrent
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 shadow-sm'
                      : isDone
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                      : 'bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" /> : step.id}
                    </span>
                    <span className={`text-xs font-extrabold tracking-tight ${
                      isCurrent
                        ? 'text-indigo-900 dark:text-indigo-200'
                        : isDone
                        ? 'text-emerald-900 dark:text-emerald-200'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate pl-8">
                    {step.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Stepper Progress Bar */}
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Form Content */}
      <form onSubmit={handlePublish} className="space-y-6">
        {viewMode === 'stepper' ? (
          /* Stepper Single Step View */
          <div className="space-y-6">
            {currentStep === 1 && (
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
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
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
            )}

            {currentStep === 3 && (
              <RubricWeightingCard
                technical={rubric.technical}
                communication={rubric.communication}
                problemSolving={rubric.problemSolving}
                experience={rubric.experience}
                autoBalance={autoBalance}
                setAutoBalance={setAutoBalance}
                onWeightChange={handleWeightChange}
              />
            )}

            {currentStep === 4 && (
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
            )}

            {/* Stepper Navigation Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="inline-flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous Step
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-md"
                >
                  Continue to Next Step
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!isRubricBalanced}
                  onClick={handlePublish}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white font-extrabold px-6 py-2.5 text-xs shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  Publish Job Opening
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Overview Grid View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column - Basics, JD, & AI parameters */}
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

            {/* Right Column - Configurations */}
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
          </div>
        )}
      </form>
    </div>
  );
}
