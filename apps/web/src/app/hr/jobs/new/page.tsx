'use client';

import React, { useState } from 'react';
import JobBasicsCard from './components/JobBasicsCard';
import JobDescriptionCard from './components/JobDescriptionCard';
import AiExtractPanel from './components/AiExtractPanel';
import RubricWeightingCard from './components/RubricWeightingCard';
import PipelineConfigCard from './components/PipelineConfigCard';
import { NewJobHeader } from './components/NewJobHeader';
import { JobPreviewDrawer } from './components/JobPreviewDrawer';
import { useCreateJobForm } from './hooks/useCreateJobForm';
import { Briefcase, FileText, Sliders, Settings, ArrowRight, ArrowLeft } from '@/lib/lucide-google-icons';

type StudioTab = 'basics' | 'description' | 'rubric' | 'pipeline';

export default function HrCreateJob() {
  const form = useCreateJobForm();
  const [activeTab, setActiveTab] = useState<StudioTab>('basics');

  const tabs: { id: StudioTab; label: string; icon: React.ReactNode; completed: boolean }[] = [
    {
      id: 'basics',
      label: 'Role Basics',
      icon: <Briefcase className="h-4 w-4" />,
      completed: !!form.title.trim(),
    },
    {
      id: 'description',
      label: 'Job Description & AI',
      icon: <FileText className="h-4 w-4" />,
      completed: form.jd.trim().length > 30,
    },
    {
      id: 'rubric',
      label: 'Scoring Rubric',
      icon: <Sliders className="h-4 w-4" />,
      completed: form.isRubricBalanced,
    },
    {
      id: 'pipeline',
      label: 'Hiring Pipeline',
      icon: <Settings className="h-4 w-4" />,
      completed: form.stages.length >= 2,
    },
  ];

  const completedCount = tabs.filter((t) => t.completed).length;
  const completionScore = Math.round((completedCount / tabs.length) * 100);

  const currentTabIndex = tabs.findIndex((t) => t.id === activeTab);

  const goToNextTab = () => {
    if (currentTabIndex < tabs.length - 1) {
      setActiveTab(tabs[currentTabIndex + 1].id);
    }
  };

  const goToPrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      <NewJobHeader
        isRubricBalanced={form.isRubricBalanced}
        completionScore={completionScore}
        onSaveDraft={form.handleSaveDraft}
        onPublish={form.handlePublish}
      />

      {/* Modern Studio Stepper Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200/60 dark:border-slate-800">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-brand-600 dark:bg-brand-500 text-white shadow-sm shadow-brand-500/20'
                  : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800'
              }`}
            >
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                isActive ? 'bg-white text-brand-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {idx + 1}
              </span>
              <span>{tab.label}</span>
              {tab.completed && !isActive && (
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>

      <form onSubmit={form.handlePublish} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'basics' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <JobBasicsCard
                title={form.title}
                setTitle={form.setTitle}
                department={form.department}
                setDepartment={form.setDepartment}
                locationType={form.locationType}
                setLocationType={form.setLocationType}
                experienceLevel={form.experienceLevel}
                setExperienceLevel={form.setExperienceLevel}
                minSalary={form.minSalary}
                setMinSalary={form.setMinSalary}
                maxSalary={form.maxSalary}
                setMaxSalary={form.setMaxSalary}
              />
            </div>
          )}

          {activeTab === 'description' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <JobDescriptionCard
                jd={form.jd}
                setJd={form.setJd}
                onAiAssist={form.handleAiAssist}
                assisting={form.assisting}
              />

              <AiExtractPanel
                assisted={form.assisted}
                assisting={form.assisting}
                assistStep={form.assistStep}
                skills={form.skills}
                setSkills={form.setSkills}
                softSkills={form.softSkills}
                setSoftSkills={form.setSoftSkills}
                cultureKeywords={form.cultureKeywords}
                setCultureKeywords={form.setCultureKeywords}
              />
            </div>
          )}

          {activeTab === 'rubric' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <RubricWeightingCard
                technical={form.rubric.technical}
                communication={form.rubric.communication}
                problemSolving={form.rubric.problemSolving}
                experience={form.rubric.experience}
                autoBalance={form.autoBalance}
                setAutoBalance={form.setAutoBalance}
                onWeightChange={form.handleWeightChange}
              />
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <PipelineConfigCard
                minScore={form.minScore}
                setMinScore={form.setMinScore}
                autoOffer={form.autoOffer}
                setAutoOffer={form.setAutoOffer}
                qCount={form.qCount}
                setQCount={form.setQCount}
                enableSourcing={form.enableSourcing}
                setEnableSourcing={form.setEnableSourcing}
                voiceProfile={form.voiceProfile}
                setVoiceProfile={form.setVoiceProfile}
                stages={form.stages}
                setStages={form.setStages}
                assessmentConfig={form.assessmentConfig}
                setAssessmentConfig={form.setAssessmentConfig}
              />
            </div>
          )}

          {/* Stepper Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              disabled={currentTabIndex === 0}
              onClick={goToPrevTab}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Previous Step</span>
            </button>

            {currentTabIndex < tabs.length - 1 ? (
              <button
                type="button"
                onClick={goToNextTab}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold px-5 py-2 text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <span>Continue to {tabs[currentTabIndex + 1].label}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!form.isRubricBalanced}
                onClick={form.handlePublish}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white font-black px-6 py-2.5 text-xs shadow-md shadow-brand-500/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <span>Publish Job Opening</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Live Preview Dock */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <JobPreviewDrawer
            title={form.title}
            department={form.department}
            locationType={form.locationType}
            experienceLevel={form.experienceLevel}
            minSalary={form.minSalary}
            maxSalary={form.maxSalary}
            jd={form.jd}
            skills={form.skills}
            rubric={form.rubric}
            stages={form.stages}
            minScore={form.minScore}
          />
        </div>
      </form>
    </div>
  );
}
