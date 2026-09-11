'use client';

import React, { use, useEffect, useState } from 'react';
import { useApplication, useJob } from '@/hooks/queries';
import { apiClient } from '@/lib/apiClient';
import { CandidateHeader } from './components/CandidateHeader';
import { CandidateDetailSkeleton } from '@/components/ui';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProctoringSummaryCard } from './components/ProctoringSummaryCard';
import { CandidateProfileBreadcrumbs } from './components/CandidateProfileBreadcrumbs';
import { CandidateDossierCard } from './components/CandidateDossierCard';
import { CandidateMetaCard } from './components/CandidateMetaCard';
import { CandidateProfileNotFound } from './components/CandidateProfileNotFound';
import type { ProctoringReport } from './components/ProctoringReportCard';

export default function HrCandidateProfilePage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = use(params);

  const { data: app, isLoading, isError, error, refetch } = useApplication(applicationId);
  const { data: job } = useJob(app?.jobId ?? null);
  const [proctorReport, setProctorReport] = useState<ProctoringReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!applicationId) return;
    apiClient
      .get<ProctoringReport>(`/proctoring/applications/${applicationId}/report`)
      .then((report) => {
        if (!cancelled && report) setProctorReport(report);
      })
      .catch(() => {
        if (!cancelled) setProctorReport(null);
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="w-full max-w-md">
          <ErrorState error={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <CandidateDetailSkeleton />;
  }

  if (!app) {
    return <CandidateProfileNotFound />;
  }

  const handleDownloadResume = () => {
    const content = `=================================================\nHireOS CANDIDATE DOSSIER: ${app.candidateName.toUpperCase()}\nEmail: ${app.candidateEmail}\nPipeline Stage: ${app.stage}\n=================================================\n\nCANDIDATE SNAPSHOT:\n- Position Applied: ${job?.title || app.jobTitle || 'N/A'}\n- Skills: ${(app.skills || []).join(', ') || 'N/A'}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${app.candidateName.replace(/\s+/g, '_')}_Resume.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12 font-sans">
      <CandidateProfileBreadcrumbs
        jobId={app.jobId}
        applicationId={app.id}
        candidateName={app.candidateName}
      />

      <CandidateHeader app={app} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <CandidateDossierCard app={app} onDownloadResume={handleDownloadResume} />
        </div>

        <div className="space-y-6">
          <ProctoringSummaryCard applicationId={app.id} report={proctorReport} />
          <CandidateMetaCard app={app} job={job} />
        </div>
      </div>
    </div>
  );
}
