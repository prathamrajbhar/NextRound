'use client';

import React, { useState, useEffect, use } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Job, Application } from '@/types';
import { Loader2 } from '@/lib/lucide-google-icons';

// Subcomponents
import PipelineHeader from './components/PipelineHeader';
import KanbanColumn from './components/KanbanColumn';
import CandidateCard from './components/CandidateCard';
import EditThresholdModal from './components/EditThresholdModal';
import CandidateProfileDrawer from './components/CandidateProfileDrawer';

export default function HrJobPipeline({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);

  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Gating thresholds state
  const [minScore, setMinScore] = useState(80);
  const [autoOffer, setAutoOffer] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Candidate Profile Review Drawer state
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [pipelineActive, setPipelineActive] = useState(true);

  useEffect(() => {
    async function fetchPipelineData() {
      try {
        setLoading(true);
        const [jobRes, appsRes] = await Promise.allSettled([
          apiClient.get<Job>(`/jobs/${jobId}`),
          apiClient.get<Application[]>(`/jobs/${jobId}/applications`).catch(() =>
            apiClient.get<Application[]>(`/applications?jobId=${jobId}`)
          ),
        ]);

        let loadedJob: Job | null = null;
        if (jobRes.status === 'fulfilled' && jobRes.value) {
          loadedJob = jobRes.value;
          setJob(loadedJob);
          setMinScore(loadedJob.thresholds?.minScore ?? 80);
          setAutoOffer(loadedJob.thresholds?.autoOffer ?? false);
        }

        if (appsRes.status === 'fulfilled' && appsRes.value) {
          const rawApps = appsRes.value;
          const activeStages = loadedJob?.stages || ['screening', 'assessment', 'voice_screen', 'decision'];
          const normalizedApps = rawApps.map((app) => {
            let appStage = app.stage;
            if (appStage === 'Screened' && !activeStages.includes('screening')) {
              appStage = 'Sourced';
            }
            if (appStage === 'Assessment' && !activeStages.includes('assessment')) {
              appStage = activeStages.includes('screening') ? 'Screened' : 'Sourced';
            }
            if (appStage === 'Interview' && !activeStages.includes('voice_screen')) {
              appStage = activeStages.includes('assessment')
                ? 'Assessment'
                : activeStages.includes('screening')
                ? 'Screened'
                : 'Sourced';
            }
            return { ...app, stage: appStage };
          });
          setCandidates(normalizedApps);
        }
      } catch (err) {
        console.error('Failed to load pipeline data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPipelineData();
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600 dark:text-orange-400" />
      </div>
    );
  }

  if (!job) {
    return <div className="text-center p-8 text-xs font-bold text-slate-400">Job not found</div>;
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
