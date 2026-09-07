'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Job } from '@/types';
import {
  PipelineStage,
  AssessmentConfig,
  normalizeExperienceLevel,
  buildAssessmentConfig,
} from './editJobUtils';

export function useEditJobForm(jobId: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Remote (Worldwide)');
  const [salary, setSalary] = useState('₹12 LPA - ₹18 LPA');
  const [experienceLevel, setExperienceLevel] = useState('Senior (5+ yrs)');
  const [skills] = useState<string[]>(['React', 'TypeScript', 'Next.js', 'System Architecture']);
  const [status, setStatus] = useState<'active' | 'draft' | 'closed'>('active');

  const [techWeight, setTechWeight] = useState(25);
  const [commWeight, setCommWeight] = useState(25);
  const [probWeight, setProbWeight] = useState(25);
  const [expWeight, setExpWeight] = useState(25);

  const [minScore, setMinScore] = useState(80);
  const [autoOffer, setAutoOffer] = useState(false);
  const [qCount, setQCount] = useState(5);
  const [enableSourcing, setEnableSourcing] = useState(true);
  const [voiceProfile, setVoiceProfile] = useState('Serena (Warm/Professional)');

  const [stages, setStages] = useState<PipelineStage[]>([
    'screening',
    'assessment',
    'voice_screen',
    'hr_round',
    'decision',
  ]);
  const [assessmentConfig, setAssessmentConfig] = useState<AssessmentConfig>({
    mcqCount: 5,
    codingProblemId: 'virtualized-list',
    passingScore: 80,
    mcqDistribution: {
      'Quantitative Aptitude': 2,
      'Logical Reasoning': 1,
      'Verbal Ability': 1,
      'Data Interpretation': 1,
    },
  });

  useEffect(() => {
    async function fetchJob() {
      try {
        setLoading(true);
        const data = await apiClient.get<Job>(`/jobs/${jobId}`);
        if (data) {
          setTitle(data.title || '');
          setDescription(data.description || '');
          setLocation(data.location || 'Remote (Worldwide)');
          setSalary(data.salary || '₹12 LPA - ₹18 LPA');
          setExperienceLevel(normalizeExperienceLevel(data.experienceLevel));
          setStatus(data.status === 'published' ? 'active' : (data.status as 'active' | 'draft' | 'closed') || 'active');
          if (data.rubric) {
            setTechWeight(data.rubric.technical ?? 25);
            setCommWeight(data.rubric.communication ?? 25);
            setProbWeight(data.rubric.problemSolving ?? 25);
            setExpWeight(data.rubric.experience ?? 25);
          }
          if (data.thresholds) {
            setMinScore(data.thresholds.minScore ?? 80);
            setAutoOffer(data.thresholds.autoOffer ?? false);
          }
          if (data.stages) setStages(data.stages as PipelineStage[]);
          setAssessmentConfig(buildAssessmentConfig(data.assessmentConfig as Partial<AssessmentConfig>));
        }
      } catch {
        // Ignored
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [jobId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMsg(null);
    setSubmitting(true);

    const payload = {
      title,
      description: description || 'No description provided for job listing.',
      location,
      salary,
      experienceLevel,
      status,
      rubric: {
        technical: techWeight,
        communication: commWeight,
        problemSolving: probWeight,
        experience: expWeight,
      },
      thresholds: { minScore, autoOffer },
      stages,
      assessmentConfig,
    };

    try {
      await apiClient.put(`/jobs/${jobId}`, payload);
      router.push('/hr/jobs');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
      const msg = errorObj?.response?.data?.error || errorObj?.message || 'Failed to update job listing. Please check required fields.';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleWeightChange = (key: 'tech' | 'comm' | 'prob' | 'exp', val: number) => {
    if (key === 'tech') setTechWeight(val);
    if (key === 'comm') setCommWeight(val);
    if (key === 'prob') setProbWeight(val);
    if (key === 'exp') setExpWeight(val);
  };

  const totalWeight = techWeight + commWeight + probWeight + expWeight;
  const isRubricBalanced = totalWeight === 100;

  return {
    loading,
    submitting,
    errorMsg,
    title,
    setTitle,
    description,
    setDescription,
    location,
    setLocation,
    salary,
    setSalary,
    experienceLevel,
    setExperienceLevel,
    skills,
    status,
    setStatus,
    techWeight,
    commWeight,
    probWeight,
    expWeight,
    totalWeight,
    isRubricBalanced,
    handleWeightChange,
    minScore,
    setMinScore,
    autoOffer,
    setAutoOffer,
    qCount,
    setQCount,
    enableSourcing,
    setEnableSourcing,
    voiceProfile,
    setVoiceProfile,
    stages,
    setStages,
    assessmentConfig,
    setAssessmentConfig,
    handleUpdate,
  };
}
