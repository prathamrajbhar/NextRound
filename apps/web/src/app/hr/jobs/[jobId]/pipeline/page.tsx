'use client';

import React, { useState, use } from 'react';
import { getStoredJobs, mockApplications, Job, Application } from '@/lib/mockData';

// Subcomponents
import PipelineHeader from './components/PipelineHeader';
import KanbanColumn from './components/KanbanColumn';
import CandidateCard from './components/CandidateCard';
import EditThresholdModal from './components/EditThresholdModal';
import CandidateProfileDrawer from './components/CandidateProfileDrawer';

export default function HrJobPipeline({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);

  const initialData = () => {
    const jobsList = getStoredJobs();
    const foundJob = jobsList.find((j) => j.id === jobId) || jobsList[0];
    const jobApps = mockApplications.filter((app) => app.jobId === foundJob.id);
    const activeStages = foundJob.stages || ['screening', 'assessment', 'voice_screen', 'decision'];
    const normalizedApps = jobApps.map((app) => {
      let appStage = app.stage;
      if (appStage === 'Screened' && !activeStages.includes('screening')) {
        appStage = 'Sourced';
      }
      if (appStage === 'Assessment' && !activeStages.includes('assessment')) {
        appStage = activeStages.includes('screening') ? 'Screened' : 'Sourced';
      }
      if (appStage === 'Interview' && !activeStages.includes('voice_screen')) {
        appStage = activeStages.includes('assessment') ? 'Assessment' : activeStages.includes('screening') ? 'Screened' : 'Sourced';
      }
      return {
        ...app,
        stage: appStage
      };
    });
    return { foundJob, normalizedApps };
  };

  const [{ foundJob, normalizedApps }] = useState(initialData);

  const [job] = useState<Job>(foundJob);
  const [candidates, setCandidates] = useState<Application[]>(normalizedApps);

  // Gating thresholds state
  const [minScore, setMinScore] = useState(foundJob.thresholds.minScore);
  const [autoOffer, setAutoOffer] = useState(foundJob.thresholds.autoOffer);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Candidate Profile Review Drawer state
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [pipelineActive, setPipelineActive] = useState(true);

  if (!job) {
    return <div className="text-center p-8 text-xs font-bold text-slate-400">Loading pipeline...</div>;
  }

  // Generate dynamic columns based on job stages
  const columns: { id: 'Sourced' | 'Screened' | 'Assessment' | 'Interview' | 'HR Round' | 'Panel' | 'Decision'; name: string }[] = [
    { id: 'Sourced', name: 'Applied' }
  ];

  const activeStages = job.stages || ['screening', 'assessment', 'voice_screen', 'hr_round', 'decision'];

  if (activeStages.includes('screening')) {
    columns.push({ id: 'Screened', name: 'AI Screened' });
  }
  if (activeStages.includes('assessment')) {
    columns.push({ id: 'Assessment', name: 'Assessment' });
  }
  if (activeStages.includes('voice_screen')) {
    columns.push({ id: 'Interview', name: 'AI Interview' });
  }
  if (activeStages.includes('hr_round') || true) {
    columns.push({ id: 'HR Round', name: 'HR Round' });
  }
  if (activeStages.includes('panel')) {
    columns.push({ id: 'Panel', name: 'Live Panel' });
  }
  columns.push({ id: 'Decision', name: 'Final Decision' });

  const handleAdvanceCandidateStage = (appId: string) => {
    const candidate = candidates.find((c) => c.id === appId);
    if (!candidate) return;

    const currentIdx = columns.findIndex((col) => col.id === candidate.stage);
    if (currentIdx === -1 || currentIdx >= columns.length - 1) return;

    const nextStage = columns[currentIdx + 1].id;
    setCandidates((prev) =>
      prev.map((c) => (c.id === appId ? { ...c, stage: nextStage } : c))
    );
  };

  const getColCandidates = (stage: string) => {
    return candidates.filter((c) => c.stage === stage);
  };

  const gridColsClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
  }[columns.length] || 'md:grid-cols-5';

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Header controls section */}
      <PipelineHeader
        jobTitle={job.title}
        pipelineActive={pipelineActive}
        setPipelineActive={setPipelineActive}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Widescreen Full-Width Kanban Board Columns */}
      <div className={`grid grid-cols-1 ${gridColsClass} gap-4 items-start w-full`}>
        {columns.map((col) => {
          const colApps = getColCandidates(col.id);
          return (
            <KanbanColumn
              key={col.id}
              id={col.id}
              name={col.name}
              count={colApps.length}
            >
              {colApps.map((app) => (
                <CandidateCard
                  key={app.id}
                  app={app}
                  onSelectCandidate={(selected) => {
                    setSelectedCandidate(selected);
                    setIsDrawerOpen(true);
                  }}
                />
              ))}
            </KanbanColumn>
          );
        })}
      </div>

      {/* Candidate Profile Review Drawer */}
      <CandidateProfileDrawer
        app={selectedCandidate}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onAdvanceStage={handleAdvanceCandidateStage}
      />

      {/* Threshold settings Modal */}
      <EditThresholdModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        minScore={minScore}
        setMinScore={setMinScore}
        autoOffer={autoOffer}
        setAutoOffer={setAutoOffer}
      />
    </div>
  );
}
