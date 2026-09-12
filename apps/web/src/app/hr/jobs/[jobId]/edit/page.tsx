'use client';

import React, { use } from 'react';
import { FormCardSkeleton, PageHeaderSkeleton } from '@/components/ui';
import JobDescriptionCard from '../../new/components/JobDescriptionCard';
import AiExtractPanel from '../../new/components/AiExtractPanel';
import RubricWeightingCard from '../../new/components/RubricWeightingCard';
import PipelineConfigCard from '../../new/components/PipelineConfigCard';
import { JobPreviewDrawer } from '../../new/components/JobPreviewDrawer';
import { EditJobHeader } from './components/EditJobHeader';
import { EditJobBasicsCard } from './components/EditJobBasicsCard';
import { useEditJobForm } from './hooks/useEditJobForm';

export default function HrEditJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const form = useEditJobForm(jobId);

  if (form.loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 pb-16">
        <PageHeaderSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <FormCardSkeleton rows={4} />
            <FormCardSkeleton rows={4} />
          </div>
          <div className="lg:col-span-4">
            <FormCardSkeleton rows={6} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      <EditJobHeader
        isRubricBalanced={form.isRubricBalanced}
        submitting={form.submitting}
        onUpdate={form.handleUpdate}
        status={form.status}
      />

      {form.errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs font-bold text-rose-700 dark:text-rose-300">
          ⚠️ {form.errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Primary Column: Complete comprehensive configuration */}
        <div className="lg:col-span-8 space-y-8">
          <section id="role-basics" className="scroll-mt-6">
            <EditJobBasicsCard
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
              status={form.status}
              setStatus={form.setStatus}
            />
          </section>

          <section id="job-description" className="scroll-mt-6 space-y-6">
            <JobDescriptionCard
              jd={form.jd}
              setJd={form.setJd}
              title={form.title}
              experienceLevel={form.experienceLevel}
              onGenerateJd={form.handleGenerateJd}
              onGenerateQuestions={() => {
                const el = document.getElementById('hiring-pipeline');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              assisting={form.assisting}
              assistStep={form.assistStep}
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
              onExtractSkills={form.handleAiAssist}
              canExtract={form.jd.trim().length > 15}
            />
          </section>

          <section id="scoring-rubric" className="scroll-mt-6">
            <RubricWeightingCard
              technical={form.rubric.technical}
              communication={form.rubric.communication}
              problemSolving={form.rubric.problemSolving}
              experience={form.rubric.experience}
              autoBalance={form.autoBalance}
              setAutoBalance={form.setAutoBalance}
              onWeightChange={form.handleWeightChange}
            />
          </section>

          <section id="hiring-pipeline" className="scroll-mt-6">
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
              jdText={form.jd}
              roleTitle={form.title}
              skills={form.skills}
              experienceLevel={form.experienceLevel}
            />
          </section>
        </div>

        {/* Right Sticky Column: Live Candidate & Hiring Matrix Preview */}
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
      </div>
    </div>
  );
}
