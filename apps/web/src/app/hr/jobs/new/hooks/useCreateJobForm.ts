'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/contexts/ToastContext';
import { RubricWeights, AssessmentConfig, DEFAULT_ASSESSMENT_CONFIG, rebalanceRubric } from './rubricBalancing';

export type PipelineStage = 'screening' | 'assessment' | 'voice_screen' | 'hr_round' | 'panel' | 'decision';

export function useCreateJobForm() {
  const router = useRouter();
  const { toast } = useToast();

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
  const [assessmentConfig, setAssessmentConfig] = useState<AssessmentConfig>(DEFAULT_ASSESSMENT_CONFIG);

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

  const handleGenerateJd = async (params: {
    prompt: string;
    title?: string;
    department?: string;
    experienceLevel?: string;
    locationType?: string;
  }) => {
    setAssisting(true);
    setAssistStep('AI is crafting professional job description...');

    try {
      const payload = {
        prompt: params.prompt,
        title: params.title || title,
        department: params.department || department,
        experienceLevel: params.experienceLevel || experienceLevel,
        locationType: params.locationType || locationType,
      };

      const res = await apiClient.post<{
        description?: string;
        detectedTitle?: string;
        skills?: string[];
        softSkills?: string[];
        cultureKeywords?: string[];
        rubric?: Partial<RubricWeights>;
      }>('/jobs/generate-jd', payload);

      if (res) {
        if (res.description) setJd(res.description);
        if (res.detectedTitle && !title.trim()) {
          setTitle(res.detectedTitle);
        }

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
          title: 'Job Description Generated',
          description: res.detectedTitle ? `Drafted for ${res.detectedTitle} with curated skills and rubric.` : 'Professional job description generated successfully.',
          variant: 'success',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate job description';
      toast({
        title: 'AI Generation Failed',
        description: message,
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

  const buildPayload = (status: 'draft' | 'active') => ({
    title: title || (status === 'draft' ? 'Untitled Draft Job' : ''),
    description: jd || (status === 'draft' ? 'Draft job description.' : 'No description provided.'),
    department,
    skills,
    rubric,
    thresholds: { minScore, autoOffer },
    status,
    location: locationType === 'Remote' ? 'Remote' : 'Bengaluru, KA (On-site)',
    salary: `₹${(minSalary / 100000).toFixed(1)}L - ₹${(maxSalary / 100000).toFixed(1)}L`,
    experienceLevel,
    stages,
    assessmentConfig,
  });

  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await apiClient.post('/jobs', buildPayload('draft'));
      toast({
        title: 'Draft Saved',
        description: 'Job draft has been saved successfully.',
        variant: 'success',
      });
      router.push('/hr/jobs');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save job draft';
      toast({
        title: 'Save Failed',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      toast({
        title: 'Job Title Required',
        description: 'Please enter a job title before publishing.',
        variant: 'error',
      });
      return;
    }
    if (jd.trim().length < 15) {
      toast({
        title: 'Job Description Incomplete',
        description: 'Please provide or generate a job description before publishing.',
        variant: 'error',
      });
      return;
    }
    if (!isRubricBalanced) {
      toast({
        title: 'Rubric Must Total 100%',
        description: 'Please balance candidate scoring weights to exactly 100%.',
        variant: 'error',
      });
      return;
    }

    setIsPublishing(true);
    try {
      await apiClient.post('/jobs', buildPayload('active'));
      toast({
        title: 'Job Published Successfully',
        description: `Position "${title}" is now active with automated evaluation stages.`,
        variant: 'success',
      });
      router.push('/hr/jobs');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to publish job opening';
      toast({
        title: 'Publishing Failed',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsPublishing(false);
    }
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
    handleGenerateJd,
    handleWeightChange,
    isRubricBalanced,
    handleSaveDraft,
    handlePublish,
    isPublishing,
    isSavingDraft,
  };
}

