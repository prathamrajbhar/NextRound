'use client';

import React, { use } from 'react';
import { FormCardSkeleton, PageHeaderSkeleton } from '@/components/ui';
import PipelineConfigCard from '../../new/components/PipelineConfigCard';
import { EditJobHeader } from './components/EditJobHeader';
import { EditJobBasicsCard } from './components/EditJobBasicsCard';
import { EditJobDescriptionCard } from './components/EditJobDescriptionCard';
import { EditJobRubricCard } from './components/EditJobRubricCard';
import { useEditJobForm } from './hooks/useEditJobForm';

export default function HrEditJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const form = useEditJobForm(jobId);

  if (form.loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <PageHeaderSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <FormCardSkeleton rows={4} />
          <FormCardSkeleton rows={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 pb-12">
      <EditJobHeader
        isRubricBalanced={form.isRubricBalanced}
        submitting={form.submitting}
        onUpdate={form.handleUpdate}
      />

      {form.errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs font-bold text-rose-700 dark:text-rose-300">
          ⚠️ {form.errorMsg}
        </div>
      )}

      <form onSubmit={form.handleUpdate} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <EditJobBasicsCard
            title={form.title}
            setTitle={form.setTitle}
            location={form.location}
            setLocation={form.setLocation}
            salary={form.salary}
            setSalary={form.setSalary}
            experienceLevel={form.experienceLevel}
            setExperienceLevel={form.setExperienceLevel}
            status={form.status}
            setStatus={form.setStatus}
          />

          <EditJobDescriptionCard
            description={form.description}
            setDescription={form.setDescription}
            skills={form.skills}
          />
        </div>

        <div className="space-y-6">
          <EditJobRubricCard
            techWeight={form.techWeight}
            commWeight={form.commWeight}
            probWeight={form.probWeight}
            expWeight={form.expWeight}
            totalWeight={form.totalWeight}
            isRubricBalanced={form.isRubricBalanced}
            onWeightChange={form.handleWeightChange}
          />

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
      </form>
    </div>
  );
}
