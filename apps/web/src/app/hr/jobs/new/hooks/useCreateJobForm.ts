'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { RubricWeights, DEFAULT_ASSESSMENT_CONFIG, rebalanceRubric } from './rubricBalancing';

export type PipelineStage = 'screening' | 'assessment' | 'voice_screen' | 'hr_round' | 'panel' | 'decision';

export function useCreateJobForm() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [locationType, setLocationType] = useState('Remote');
  const [experienceLevel, setExperienceLevel] = useState('Senior (5+ Years)');
  const [minSalary, setMinSalary] = useState(1300000);
  const [maxSalary, setMaxSalary] = useState(1800000);

  const [jd, setJd] = useState('');
  const [assisting, setAssisting] = useState(false);
  const [assisted, setAssisted] = useState(false);
  const [assistStep, setAssistStep] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [softSkills, setSoftSkills] = useState<string[]>([]);
  const [cultureKeywords, setCultureKeywords] = useState<string[]>([]);

  const [rubric, setRubric] = useState<RubricWeights>({
    technical: 25,
    communication: 25,
    problemSolving: 25,
    experience: 25,
  });
  const [autoBalance, setAutoBalance] = useState(true);

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
  const [assessmentConfig, setAssessmentConfig] = useState<{
    mcqCount: number;
    codingProblemId: string;
    passingScore: number;
    mcqDistribution?: Record<string, number>;
  }>(DEFAULT_ASSESSMENT_CONFIG);

  const handleAiAssist = async () => {
    if (!jd) return;
    setAssisting(true);
    setAssistStep('Analyzing job description with Gemini AI...');

    try {
      const res = await apiClient.post<{
        skills?: string[];
        softSkills?: string[];
        cultureKeywords?: string[];
        rubric?: Partial<RubricWeights>;
        enhancedDescription?: string;
      }>('/jobs/extract-requirements', { description: jd, title });

      if (res) {
        if (Array.isArray(res.skills) && res.skills.length > 0) setSkills(res.skills);
        if (Array.isArray(res.softSkills) && res.softSkills.length > 0) setSoftSkills(res.softSkills);
        if (Array.isArray(res.cultureKeywords) && res.cultureKeywords.length > 0) setCultureKeywords(res.cultureKeywords);
        if (res.rubric) {
          setRubric({
            technical: res.rubric.technical ?? 30,
            communication: res.rubric.communication ?? 20,
            problemSolving: res.rubric.problemSolving ?? 25,
            experience: res.rubric.experience ?? 25,
          });
        }
        if (res.enhancedDescription) setJd(res.enhancedDescription);
      }
    } catch {
      // Keep UI responsive
    } finally {
      setAssisted(true);
      setAssisting(false);
    }
  };

  const handleWeightChange = (key: keyof RubricWeights, newValue: number) => {
    if (!autoBalance) {
      setRubric((prev) => ({ ...prev, [key]: newValue }));
      return;
    }
    setRubric(rebalanceRubric(rubric, key, newValue));
  };

  const totalWeight = rubric.technical + rubric.communication + rubric.problemSolving + rubric.experience;
  const isRubricBalanced = totalWeight === 100;

  const buildPayload = (status: 'draft' | 'active') => ({
    title: title || (status === 'draft' ? 'Untitled Draft Job' : ''),
    description: jd || (status === 'draft' ? 'Draft job description.' : 'No description provided.'),
    department,
    rubric,
    thresholds: { minScore, autoOffer },
    status,
    location: locationType === 'Remote' ? 'Remote' : 'Bengaluru, KA (On-site)',
    salary: `₹${(minSalary / 100000).toFixed(1)}L - ₹${(maxSalary / 100000).toFixed(1)}L`,
    experienceLevel,
    stages,
    assessmentConfig,
  });

  const handleSaveDraft = async () => {
    try {
      await apiClient.post('/jobs', buildPayload('draft'));
    } catch {
      // Ignored
    }
    router.push('/hr/jobs');
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRubricBalanced) return;

    try {
      await apiClient.post('/jobs', buildPayload('active'));
    } catch {
      // Ignored
    }
    router.push('/hr/jobs');
  };

  return {
    title,
    setTitle,
    department,
    setDepartment,
    locationType,
    setLocationType,
    experienceLevel,
    setExperienceLevel,
    minSalary,
    setMinSalary,
    maxSalary,
    setMaxSalary,
    jd,
    setJd,
    assisting,
    assisted,
    assistStep,
    skills,
    setSkills,
    softSkills,
    setSoftSkills,
    cultureKeywords,
    setCultureKeywords,
    rubric,
    autoBalance,
    setAutoBalance,
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
    handleAiAssist,
    handleWeightChange,
    isRubricBalanced,
    handleSaveDraft,
    handlePublish,
  };
}
