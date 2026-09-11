'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/contexts/ToastContext';
import { Job } from '@/types';
import { RubricWeights, DEFAULT_ASSESSMENT_CONFIG, rebalanceRubric } from '../../../new/hooks/rubricBalancing';
import {
  PipelineStage,
  AssessmentConfig,
  normalizeExperienceLevel,
  normalizeLocationType,
  parseSalaryRange,
  buildAssessmentConfig,
} from './editJobUtils';

export function useEditJobForm(jobId: string) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [locationType, setLocationType] = useState('Remote');
  const [experienceLevel, setExperienceLevel] = useState('Senior (5-8 Yrs)');
  const [minSalary, setMinSalary] = useState(1300000);
  const [maxSalary, setMaxSalary] = useState(1800000);
  const [status, setStatus] = useState<'active' | 'draft' | 'closed'>('active');

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
  const [assessmentConfig, setAssessmentConfig] = useState<AssessmentConfig>(DEFAULT_ASSESSMENT_CONFIG);

  useEffect(() => {
    async function fetchJob() {
      try {
        setLoading(true);
        const data = await apiClient.get<Job>(`/jobs/${jobId}`);
        if (data) {
          setTitle(data.title || '');
          setJd(data.description || '');
          setDepartment(data.department || 'Engineering');
          setLocationType(normalizeLocationType(data.location));
          setExperienceLevel(normalizeExperienceLevel(data.experienceLevel));
          setStatus(data.status === 'published' ? 'active' : (data.status as 'active' | 'draft' | 'closed') || 'active');

          const { minSalary: minS, maxSalary: maxS } = parseSalaryRange(data.salary);
          setMinSalary(minS);
          setMaxSalary(maxS);

          if (Array.isArray(data.skills) && data.skills.length > 0) {
            setSkills(data.skills);
            setAssisted(true);
          }

          if (data.rubric) {
            setRubric({
              technical: data.rubric.technical ?? 25,
              communication: data.rubric.communication ?? 25,
              problemSolving: data.rubric.problemSolving ?? 25,
              experience: data.rubric.experience ?? 25,
            });
          }
          if (data.thresholds) {
            setMinScore(data.thresholds.minScore ?? 80);
            setAutoOffer(data.thresholds.autoOffer ?? false);
          }
          if (data.stages) setStages(data.stages as PipelineStage[]);
          setAssessmentConfig(buildAssessmentConfig(data.assessmentConfig as Partial<AssessmentConfig>));
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to fetch job details');
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [jobId]);

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
        setAssisted(true);
        toast({
          title: 'Requirements Extracted',
          description: 'Skills, competencies, and scoring rubric updated from job description.',
          variant: 'success',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to analyze requirements from job description';
      toast({
        title: 'Analysis Failed',
        description: message,
        variant: 'error',
      });
    } finally {
      setAssisting(false);
    }
  };

  const handleGenerateJd = async (params: { prompt: string }) => {
    setAssisting(true);
    setAssistStep('AI is crafting professional job description...');
    try {
      const res = await apiClient.post<{
        description?: string;
        detectedTitle?: string;
        skills?: string[];
        softSkills?: string[];
        cultureKeywords?: string[];
        rubric?: Partial<RubricWeights>;
      }>('/jobs/generate-jd', {
        prompt: params.prompt,
        title,
        department,
        experienceLevel,
        locationType,
      });

      if (res) {
        if (res.description) setJd(res.description);
        if (res.detectedTitle && !title.trim()) setTitle(res.detectedTitle);
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
        setAssisted(true);
        toast({
          title: 'Job Description Updated',
          description: 'Generated professional job description and updated requirements.',
          variant: 'success',
        });
      }
    } catch (err) {
      toast({
        title: 'AI Generation Failed',
        description: err instanceof Error ? err.message : 'Failed to generate JD',
        variant: 'error',
      });
      throw err;
    } finally {
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

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submitting) return;

    if (!title.trim()) {
      toast({ title: 'Title Required', description: 'Please enter a job title.', variant: 'error' });
      return;
    }
    if (jd.trim().length < 15) {
      toast({ title: 'Description Too Short', description: 'Please enter a valid job description.', variant: 'error' });
      return;
    }
    if (!isRubricBalanced) {
      toast({ title: 'Rubric Not Balanced', description: 'Total rubric weights must equal 100%.', variant: 'error' });
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    const payload = {
      title,
      description: jd,
      department,
      location: locationType === 'Remote' ? 'Remote' : `${locationType} (Office)`,
      salary: `₹${(minSalary / 100000).toFixed(1)}L - ₹${(maxSalary / 100000).toFixed(1)}L`,
      experienceLevel,
      status,
      skills,
      rubric,
      thresholds: { minScore, autoOffer },
      stages,
      assessmentConfig,
    };

    try {
      await apiClient.put(`/jobs/${jobId}`, payload);
      toast({ title: 'Job Updated', description: 'Job listing updated successfully.', variant: 'success' });
      router.push('/hr/jobs');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
      const msg = errorObj?.response?.data?.error || errorObj?.message || 'Failed to update job listing.';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
      toast({ title: 'Update Failed', description: String(msg), variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading,
    submitting,
    errorMsg,
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
    status,
    setStatus,
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
    handleWeightChange,
    isRubricBalanced,
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
    handleGenerateJd,
    handleAiAssist,
    handleUpdate,
  };
}
