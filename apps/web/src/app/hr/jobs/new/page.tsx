'use client';

import React from 'react';
import JobBasicsCard from './components/JobBasicsCard';
import JobDescriptionCard from './components/JobDescriptionCard';
import AiExtractPanel from './components/AiExtractPanel';
import RubricWeightingCard from './components/RubricWeightingCard';
import PipelineConfigCard from './components/PipelineConfigCard';
import { NewJobHeader } from './components/NewJobHeader';
import { useCreateJobForm } from './hooks/useCreateJobForm';

export default function HrCreateJob() {
  const form = useCreateJobForm();

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-200">
      <NewJobHeader
        isRubricBalanced={form.isRubricBalanced}
        onSaveDraft={form.handleSaveDraft}
        onPublish={form.handlePublish}
      />

      <form onSubmit={form.handlePublish} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
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

        <div className="space-y-6 lg:sticky lg:top-6">
          <RubricWeightingCard
            technical={form.rubric.technical}
            communication={form.rubric.communication}
            problemSolving={form.rubric.problemSolving}
            experience={form.rubric.experience}
            autoBalance={form.autoBalance}
            setAutoBalance={form.setAutoBalance}
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
