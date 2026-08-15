'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Job } from '@/types';
import { Sliders, Briefcase, ArrowLeft, Building2, MapPin, IndianRupee, Layers, Loader2 } from '@/lib/lucide-google-icons';
import Link from 'next/link';
import { Autocomplete, FormCardSkeleton, PageHeaderSkeleton } from '@/components/ui';
import { SUGGESTED_ROLES } from '@/lib/suggestedOptions';
import PipelineConfigCard from '../../new/components/PipelineConfigCard';

export default function HrEditJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const router = useRouter();
  const { jobId } = use(params);

  const [loading, setLoading] = useState(true);

  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Remote (Worldwide)');
  const [salary, setSalary] = useState('$140,000 - $180,000');
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

  const [stages, setStages] = useState<('screening' | 'assessment' | 'voice_screen' | 'hr_round' | 'panel' | 'decision')[]>([
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
  }>({
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

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJob() {
      try {
        setLoading(true);
        const data = await apiClient.get<Job>(`/jobs/${jobId}`);
        if (data) {
          setTitle(data.title || '');
          setDescription(data.description || '');
          setLocation(data.location || 'Remote (Worldwide)');
          setSalary(data.salary || '$140,000 - $180,000');
          const rawExp = data.experienceLevel || 'Senior (5+ Years)';
          const normalizedExp = rawExp.includes('Senior')
            ? 'Senior (5+ Years)'
            : rawExp.includes('Lead')
            ? 'Lead / Principal'
            : rawExp.includes('Mid')
            ? 'Mid-Level'
            : rawExp.includes('Junior') || rawExp.includes('Entry')
            ? 'Entry-Level'
            : rawExp;
          setExperienceLevel(normalizedExp);
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
          if (data.stages) setStages(data.stages as ('screening' | 'assessment' | 'voice_screen' | 'hr_round' | 'panel' | 'decision')[]);
          if (data.assessmentConfig) {
            const config = { ...data.assessmentConfig } as typeof assessmentConfig;
            if (!config.mcqDistribution) {
              const total = config.mcqCount || 20;
              const base = Math.floor(total / 4);
              const remainder = total % 4;
              config.mcqDistribution = {
                'Quantitative Aptitude': base + (remainder > 0 ? 1 : 0),
                'Logical Reasoning': base + (remainder > 1 ? 1 : 0),
                'Verbal Ability': base + (remainder > 2 ? 1 : 0),
                'Data Interpretation': base,
              };
            }
            setAssessmentConfig(config);
          } else {
            
            setAssessmentConfig({
              mcqCount: 20,
              codingProblemId: 'virtualized-list',
              passingScore: 80,
              mcqDistribution: {
                'Quantitative Aptitude': 5,
                'Logical Reasoning': 5,
                'Verbal Ability': 5,
                'Data Interpretation': 5,
              },
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch job:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [jobId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <PageHeaderSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <FormCardSkeleton rows={4} />
          <FormCardSkeleton rows={3} />
        </div>
      </div>
    );
  }

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
      thresholds: {
        minScore,
        autoOffer,
      },
      stages,
      assessmentConfig,
    };

    try {
      await apiClient.put(`/jobs/${jobId}`, payload);
      router.push('/hr/jobs');
    } catch (err: unknown) {
      console.error('API job update failed:', err);
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">
            <Link href="/hr/jobs" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Jobs</Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-700 dark:text-slate-300">Edit Settings</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Edit Job Opening
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Modify job specifications, active pipeline stages, evaluation parameters, and gating thresholds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/hr/jobs"
            className="inline-flex items-center gap-1.5 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Link>
          <button
            type="button"
            disabled={!isRubricBalanced || submitting}
            onClick={handleUpdate}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold px-6 py-2.5 text-xs shadow-md transition-all cursor-pointer disabled:opacity-40 hover:scale-[1.01]"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin text-white" />}
            {submitting ? 'Updating Job...' : 'Update Job Listing'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs font-bold text-rose-700 dark:text-rose-300">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <Building2 className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
                Position Basics &amp; Meta
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Position Title
                </label>
                <Autocomplete
                  required
                  options={SUGGESTED_ROLES}
                  value={title}
                  onChange={(val) => setTitle(val)}
                  icon={<Briefcase className="h-4 w-4 text-slate-400" />}
                  className="text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Location
                  </label>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50">
                    <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                      placeholder="e.g. Remote (Worldwide)"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Salary Range
                  </label>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50">
                    <IndianRupee className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      required
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                      placeholder="e.g. $140k - $180k"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Experience Level
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="Entry-Level">Entry-Level (0-2 Yrs)</option>
                    <option value="Mid-Level">Mid-Level (2-5 Yrs)</option>
                    <option value="Senior (5+ Years)">Senior (5+ Years)</option>
                    <option value="Lead / Principal">Lead / Principal (8+ Yrs)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Job Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'draft' | 'closed')}
                    className="w-full p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="active">Active (Published)</option>
                    <option value="draft">Draft (Unpublished)</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-indigo-500" />
                Job Description &amp; Scope
              </h3>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Markdown Supported
              </span>
            </div>

            <div>
              <textarea
                required
                rows={10}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 text-xs rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 transition-all font-medium leading-relaxed"
                placeholder="Detail core responsibilities, tech stack expectations, and team goals..."
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Required Tech Stack Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 flex items-center gap-1.5"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
                  AI Evaluation Rubric Weights
                </h3>
              </div>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                  isRubricBalanced
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
                }`}
              >
                Total: {totalWeight}% {isRubricBalanced ? '(Balanced)' : '(Must Equal 100%)'}
              </span>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div>
                <div className="flex justify-between mb-1 text-[11px] font-bold">
                  <span>Technical Skills</span>
                  <span className="text-brand-600 dark:text-orange-400 font-extrabold">{techWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={techWeight}
                  onChange={(e) => handleWeightChange('tech', Number(e.target.value))}
                  className="w-full accent-brand-600 dark:accent-orange-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-[11px] font-bold">
                  <span>Communication</span>
                  <span className="text-purple-600 dark:text-purple-400 font-extrabold">{commWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={commWeight}
                  onChange={(e) => handleWeightChange('comm', Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-[11px] font-bold">
                  <span>Problem Solving</span>
                  <span className="text-pink-600 dark:text-pink-400 font-extrabold">{probWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={probWeight}
                  onChange={(e) => handleWeightChange('prob', Number(e.target.value))}
                  className="w-full accent-pink-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-[11px] font-bold">
                  <span>Relevant Experience</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{expWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={expWeight}
                  onChange={(e) => handleWeightChange('exp', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <PipelineConfigCard
            minScore={minScore}
            setMinScore={setMinScore}
            autoOffer={autoOffer}
            setAutoOffer={setAutoOffer}
            qCount={qCount}
            setQCount={setQCount}
            enableSourcing={enableSourcing}
            setEnableSourcing={setEnableSourcing}
            voiceProfile={voiceProfile}
            setVoiceProfile={setVoiceProfile}
            stages={stages}
            setStages={setStages}
            assessmentConfig={assessmentConfig}
            setAssessmentConfig={setAssessmentConfig}
          />
        </div>
      </form>
    </div>
  );
}
