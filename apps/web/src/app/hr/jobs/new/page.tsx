'use client';

import React from 'react';
import JobBasicsCard from './components/JobBasicsCard';
import JobDescriptionCard from './components/JobDescriptionCard';
import AiExtractPanel from './components/AiExtractPanel';
import RubricWeightingCard from './components/RubricWeightingCard';
import PipelineConfigCard from './components/PipelineConfigCard';
import { NewJobHeader } from './components/NewJobHeader';
import { JobPreviewDrawer } from './components/JobPreviewDrawer';
import { useCreateJobForm } from './hooks/useCreateJobForm';

export default function HrCreateJob() {
  const form = useCreateJobForm();

  const completionCriteria = [
    !!form.title.trim(),
    form.jd.trim().length > 30,
    form.isRubricBalanced,
    form.stages.length >= 2,
  ];
  const completedCount = completionCriteria.filter(Boolean).length;
  const completionScore = Math.round((completedCount / completionCriteria.length) * 100);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      <NewJobHeader
        isRubricBalanced={form.isRubricBalanced}
        completionScore={completionScore}
        onSaveDraft={form.handleSaveDraft}
        onPublish={form.handlePublish}
        isSavingDraft={form.isSavingDraft}
        isPublishing={form.isPublishing}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Primary Column: Complete comprehensive configuration */}
        <div className="lg:col-span-8 space-y-8">
          <section id="role-basics" className="scroll-mt-6">
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
          </section>

          <section id="job-description" className="scroll-mt-6 space-y-6">
            <JobDescriptionCard
              jd={form.jd}
              setJd={form.setJd}
              title={form.title}
              onGenerateJd={form.handleGenerateJd}
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
