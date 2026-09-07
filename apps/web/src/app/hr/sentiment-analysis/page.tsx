'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CandidateSentimentProfile } from '@/types';
import { useSentimentProfiles } from '@/hooks/queries';
import { AnalyticsGridSkeleton } from '@/components/ui';
import { SentimentHeroHeader } from './_components/SentimentHeroHeader';
import { NoAudioAnalysisCard } from './_components/NoAudioAnalysisCard';
import { SentimentMetricCards } from './_components/SentimentMetricCards';
import { BiomarkersEngineCard } from './_components/BiomarkersEngineCard';
import { EmotionalJourneyGraph } from './_components/EmotionalJourneyGraph';

export default function SentimentAnalysisPage() {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');

  const { data, isLoading } = useSentimentProfiles();
  const profiles = useMemo(
    () => (Array.isArray(data?.profiles) ? data.profiles : []) as unknown as CandidateSentimentProfile[],
    [data]
  );

  useEffect(() => {
    if (profiles.length > 0 && !selectedCandidateId) {
      setSelectedCandidateId(profiles[0].id);
    }
  }, [profiles, selectedCandidateId]);

  if (isLoading) {
    return <AnalyticsGridSkeleton />;
  }

  const currentProfile = profiles.find((p) => p.id === selectedCandidateId) || profiles[0];

  if (!currentProfile) {
    return (
      <div className="text-center py-16 text-xs text-slate-400">
        No completed candidate sessions exist yet with vocal sentiment and stress analysis data.
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-16 animate-in fade-in duration-300">
      <SentimentHeroHeader
        currentProfile={currentProfile}
        profiles={profiles}
        selectedCandidateId={selectedCandidateId}
        onSelectCandidate={setSelectedCandidateId}
      />

      {!currentProfile.hasAudioAnalysis ? (
        <NoAudioAnalysisCard hasAudioUrl={Boolean(currentProfile.audioUrl)} />
      ) : (
        <>
          <SentimentMetricCards profile={currentProfile} />

          {currentProfile.biomarkers && (
            <BiomarkersEngineCard biomarkers={currentProfile.biomarkers} />
          )}

          <EmotionalJourneyGraph journeyGraph={currentProfile.journeyGraph} />
        </>
      )}
    </div>
  );
}
