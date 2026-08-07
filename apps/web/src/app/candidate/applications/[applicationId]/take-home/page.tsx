'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { TakeHomeProject } from '@/types';
import { ChevronRight, Code, CheckCircle2, Copy, FileText, Send, Check } from 'lucide-react';

export default function CandidateTakeHomeProjectPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);

  const [project, setProject] = useState<TakeHomeProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true);
        const res = await apiClient.get<TakeHomeProject>(`/candidate/applications/${applicationId}/take-home`);
        if (res) setProject(res);
      } catch (err) {
        console.error('Failed to load take home project:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [applicationId]);

  // Submission console states
  const [repoUrl, setRepoUrl] = useState('');
  const [comments, setComments] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return <div className="p-8 text-slate-500 font-semibold text-center animate-pulse">Loading take-home assignment details...</div>;
  }

  if (!project) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">No Take-Home Project</h2>
        <p className="text-xs text-slate-500">No take-home assignment assigned for this application stage.</p>
      </div>
    );
  }

  const gitCommand = `git clone https://github.com/nextround-challenges/${project.id}.git`;

  const handleCopy = () => {
    navigator.clipboard.writeText(gitCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setProject({
        ...project,
        status: 'submitted',
        submittedDate: new Date().toISOString().slice(0, 10),
        repoUrl,
      });
    }, 1200);
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'submitted':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'in_progress':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <Link href="/candidate/applications" className="hover:text-indigo-650 transition-colors">Applications</Link>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <Link href={`/candidate/applications/${applicationId}`} className="hover:text-indigo-655 transition-colors">{project.title}</Link>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <span className="text-slate-800">Take-Home Challenge</span>
      </div>

      {/* Header card */}
      <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-md backdrop-blur-md glass-panel flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-655 text-xl font-bold shadow-sm flex-shrink-0">
            <Code className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{project.title}</h1>
            <p className="text-xs text-slate-500 font-semibold">Candidate: <span className="font-bold text-indigo-600">{project.candidateName}</span></p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${getStatusPill(project.status)}`}>
          {project.status === 'assigned' ? 'Pending Action' : project.status}
        </span>
      </div>

      {/* Main Grid: Details or Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Requirements & Assignment */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-white/60 bg-white/45 p-6 sm:p-8 shadow-md backdrop-blur-md glass-panel space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5"><FileText className="h-4.5 w-4.5 text-indigo-500" />Project Requirements</h3>
              <p className="text-[11px] font-semibold text-slate-500 leading-relaxed mt-3">{project.description}</p>
            </div>

            {project.status !== 'graded' && project.status !== 'submitted' && (
              // INTERACTIVE SUBMISSION PANEL
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">1. Get Repository</h4>
                  <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">Use this template repository to build your project. Follow the requirements file in the root folder.</p>
                  
                  <div className="relative flex items-center bg-slate-950 rounded-2xl p-4 mt-2">
                    <code className="text-emerald-400 text-[10px] font-mono select-all flex-1 truncate pr-8">
                      {gitCommand}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Copy clone command"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800">2. Submit Project URL</h4>
                    <p className="text-[10px] text-slate-455 font-semibold">Enter your repository link (GitHub/GitLab) or deployment URL.</p>
                    
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/username/my-solution"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-205 bg-white/70 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Additional comments</label>
                    <textarea
                      placeholder="Notes on design patterns, how to run tests, challenges faced..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={4}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-205 bg-white/70 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold py-3 text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="h-4 w-4" /> {isSubmitting ? 'Submitting project...' : 'Submit Project'}
                  </button>
                </form>
              </div>
            )}

            {project.status === 'submitted' && (
              <div className="pt-6 border-t border-slate-100 text-center space-y-4">
                <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Project Submitted</h4>
                <p className="text-[11px] text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">
                  Your code has been loaded. Sourcing agents are triggering unit test compilers and evaluating code clarity benchmarks.
                </p>
                {project.repoUrl && (
                  <div className="text-[10px] text-slate-400 font-mono bg-slate-50 p-2 rounded-xl border border-slate-200 max-w-xs mx-auto truncate">
                    URL: {project.repoUrl}
                  </div>
                )}
              </div>
            )}

            {project.status === 'graded' && (
              // GRADED RUBRICS DETAILS
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-805">Grading Evaluation Rubrics</h4>
                
                <div className="rounded-2xl border border-slate-150 overflow-hidden">
                  <table className="w-full border-collapse text-left text-[11px]">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-155 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="px-4 py-3">Criterion</th>
                        <th className="px-4 py-3 text-center">Weight</th>
                        <th className="px-4 py-3 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {project.rubric.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-800 font-bold">{r.criterion}</td>
                          <td className="px-4 py-3 text-center text-slate-450">{r.weight}%</td>
                          <td className="px-4 py-3 text-right text-indigo-650 font-extrabold">{r.score || 0}/100</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scorecard if graded */}
        <div className="space-y-6">
          {project.status === 'graded' && project.overallScore && (
            <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-md backdrop-blur-md glass-panel text-center space-y-3">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-705 font-black text-xl shadow-inner">
                {project.overallScore}%
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-805">Overall Grade</h4>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">Evaluated on: {project.submittedDate}</span>
              </div>
            </div>
          )}

          {project.status === 'graded' && project.reviewerNotes && (
            <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-md backdrop-blur-md glass-panel space-y-2">
              <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">Evaluator Remarks</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold italic">{project.reviewerNotes}</p>
            </div>
          )}

          <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-md backdrop-blur-md glass-panel space-y-3">
            <h4 className="text-xs font-bold text-slate-805 border-b border-slate-100 pb-2">Timeline Details</h4>
            <div className="space-y-2 text-[10px] font-bold text-slate-500">
              <div className="flex justify-between">
                <span>Assigned Date</span>
                <span>{project.assignedDate}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Submission Due</span>
                <span>{project.dueDate}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
