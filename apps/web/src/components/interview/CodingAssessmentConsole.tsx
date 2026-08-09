'use client';

import React, { useState, useEffect } from 'react';
import { CompanyLogo } from '@/components/ui';
import { apiClient } from '@/lib/apiClient';
import {
  Terminal,
  Play,
  CheckCircle2,
  Clock,
  Send,
  Code,
  ChevronDown,
  Sparkles,
  Zap,
  Cpu,
  Check,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  BookOpen,
  XCircle,
} from '@/lib/lucide-google-icons';

interface CodingConsoleProps {
  company?: string;
  role?: string;
  applicationId?: string;
  sessionId?: string;
  onComplete: (score: number) => void;
}

export type SupportedLanguage = 'python' | 'javascript' | 'typescript' | 'java' | 'cpp';

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  starterCode: {
    python: string;
    javascript: string;
    typescript: string;
    java: string;
    cpp: string;
  };
  testCases: { name: string; input: string; expected: string; hidden?: boolean }[];
  editorial: string;
  expectedComplexity: { time: string; space: string };
}

export default function CodingAssessmentConsole({
  company = '',
  role = '',
  applicationId,
  sessionId,
  onComplete,
}: CodingConsoleProps) {
  const [activeProblem, setActiveProblem] = useState<CodingProblem | null>(null);
  const [language, setLanguage] = useState<'python' | 'javascript' | 'typescript' | 'java' | 'cpp'>('python');
  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [activeLeftTab, setActiveLeftTab] = useState<'description' | 'editorial' | 'submissions'>('description');
  const [activeBottomTab, setActiveBottomTab] = useState<'testcases' | 'results' | 'console'>('testcases');

  const [isRunning, setIsRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<
    { name: string; input: string; expected: string; actual: string; status: 'passed' | 'failed'; time: string }[]
  >([]);
  const [complexityFeedback, setComplexityFeedback] = useState<string | null>(null);
  const [finalPassRate, setFinalPassRate] = useState<number>(0);

  // Load problem dynamically from Backend AI Coding Generator API
  useEffect(() => {
    async function fetchCodingProblem() {
      try {
        const endpoint = applicationId
          ? `/applications/${applicationId}/assessment/coding`
          : `/coding/problem?role=${encodeURIComponent(role || 'Software Engineer')}&company=${encodeURIComponent(company || 'Tech Enterprise')}`;

        const res = await apiClient.get<{ problem: Record<string, unknown> }>(endpoint);
        if (res?.problem) {
          const p = res.problem as Record<string, unknown>;
          const rawTestCases = Array.isArray(p.testCases) ? p.testCases : [];
          const loaded: CodingProblem = {
            id: typeof p.id === 'string' ? p.id : 'dynamic-problem',
            title: typeof p.title === 'string' ? p.title : 'Coding Problem',
            difficulty: (typeof p.difficulty === 'string' ? p.difficulty : 'Medium') as CodingProblem['difficulty'],
            category: typeof p.category === 'string' ? p.category : 'Algorithms',
            description: typeof p.description === 'string' ? p.description : '',
            constraints: Array.isArray(p.constraints) ? (p.constraints as string[]) : [],
            examples: Array.isArray(p.examples) ? (p.examples as CodingProblem['examples']) : [],
            starterCode: {
              python: (p.starterCode as Record<string, string>)?.python || '',
              javascript: (p.starterCode as Record<string, string>)?.javascript || '',
              typescript: (p.starterCode as Record<string, string>)?.typescript || '',
              java: (p.starterCode as Record<string, string>)?.java || '',
              cpp: (p.starterCode as Record<string, string>)?.cpp || '',
            },
            testCases: rawTestCases.map((tc: Record<string, unknown>, i: number) => ({
              name: typeof tc.name === 'string' ? tc.name : `Case ${i + 1}`,
              input: typeof tc.input === 'string' ? tc.input : '',
              expected: typeof tc.expected === 'string' ? tc.expected : typeof tc.expectedOutput === 'string' ? tc.expectedOutput : '',
              hidden: Boolean(tc.hidden),
            })),
            editorial: typeof p.editorial === 'string' ? p.editorial : '',
            expectedComplexity: (p.expectedComplexity as CodingProblem['expectedComplexity']) || { time: 'O(N)', space: 'O(1)' },
          };
          setActiveProblem(loaded);
          setCode(loaded.starterCode.python);
        } else {
          throw new Error('Problem payload is empty.');
        }
      } catch (err) {
        console.error('Failed to load dynamic LLM coding problem:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate coding problem. Please refresh and try again.');
      }
    }
    fetchCodingProblem();
  }, [applicationId, sessionId, role, company]);

  const handleLanguageChange = (newLang: 'python' | 'javascript' | 'typescript' | 'java' | 'cpp') => {
    setLanguage(newLang);
    if (activeProblem?.starterCode[newLang]) {
      setCode(activeProblem.starterCode[newLang]);
    }
  };

  // Production Backend Sandbox Code Execution
  const handleRunCode = async () => {
    if (!activeProblem) return;
    setIsRunning(true);
    setActiveBottomTab('results');
    setOutputLogs([
      `[Server Sandbox] Dispatching code execution to backend container...`,
      `[Server Sandbox] Language: ${language.toUpperCase()}`,
    ]);

    try {
      const publicCases = activeProblem.testCases.filter((tc) => !tc.hidden);
      const res = await apiClient.post<{
        results: { name: string; input: string; expected: string; actual: string; status: 'passed' | 'failed'; time: string }[];
        passRate: number;
        logs: string[];
      }>('/coding/execute', {
        code,
        language,
        testCases: publicCases,
      });

      if (res) {
        setTestResults(res.results || []);
        setOutputLogs(res.logs || ['[Server Sandbox] Execution completed.']);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed connecting to execution server.';
      setOutputLogs((prev) => [...prev, `[Server Error] ${msg}`]);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Solution & Compute Final Score
  const handleSubmitSolution = async () => {
    if (!activeProblem) return;
    setIsRunning(true);
    setActiveBottomTab('results');

    try {
      if (applicationId) {
        await apiClient.post(`/applications/${applicationId}/assessment/coding`, {
          problemId: activeProblem.id,
          code,
          language,
        }).catch(() => null);
      }

      const res = await apiClient.post<{
        results: { name: string; input: string; expected: string; actual: string; status: 'passed' | 'failed'; time: string }[];
        passRate: number;
        logs: string[];
        complexity: string;
      }>('/coding/execute', {
        code,
        language,
        testCases: activeProblem.testCases,
      });

      if (res) {
        setTestResults(res.results || []);
        setFinalPassRate(res.passRate || 0);
        setComplexityFeedback(res.complexity || `Time: ${activeProblem.expectedComplexity.time}`);
        setOutputLogs(res.logs || []);
        setSubmitted(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission error';
      setOutputLogs((prev) => [...prev, `[Submit Error] ${msg}`]);
    } finally {
      setIsRunning(false);
    }
  };

  if (error) {
    return (
      <div className="w-full h-screen bg-slate-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center font-sans">
        <div className="max-w-md p-6 bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Generation Failed</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!activeProblem) {
    return (
      <div className="w-full h-screen bg-slate-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 animate-pulse">
            Generating live coding problem via Gemini AI...
          </p>
        </div>
      </div>
    );
  }

  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 16) }, (_, i) => i + 1);

  return (
    <div className="w-full h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 flex flex-col justify-between overflow-hidden font-sans select-none transition-colors duration-300">
      {/* Header Navbar */}
      <header className="h-14 px-4 bg-white dark:bg-[#141414] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0 z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <CompanyLogo name={company || 'NextRound'} size="sm" className="shadow-xs flex-shrink-0 border border-slate-200 dark:border-slate-700" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
              {activeProblem.title}
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
              activeProblem.difficulty === 'Easy'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                : activeProblem.difficulty === 'Medium'
                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
            }`}>
              {activeProblem.difficulty}
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hidden sm:inline-block">
              {activeProblem.category}
            </span>
          </div>
        </div>

        {/* Center Timer */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold">
            <Clock className="h-3.5 w-3.5 text-brand-600 dark:text-amber-400" />
            <span>29:45</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{role || 'Candidate'}</span>
        </div>

        {/* Right Language & Execution Controls */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
              className="bg-slate-100 dark:bg-[#1e1e1e] border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer appearance-none pr-7"
            >
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="java">Java 21</option>
              <option value="cpp">C++ 20</option>
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700 disabled:opacity-50 transition-all"
          >
            <Play className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
            <span>{isRunning ? 'Executing...' : 'Run'}</span>
          </button>

          <button
            type="button"
            onClick={handleSubmitSolution}
            disabled={isRunning}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Submit</span>
          </button>
        </div>
      </header>

      {/* 2-Panel Split Workspace */}
      {!submitted ? (
        <main className="flex-1 p-2 flex gap-2 overflow-hidden bg-slate-100 dark:bg-[#0a0a0a]">
          {/* Left Panel: Problem Statement & Documentation */}
          <div className="w-1/2 bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-xs">
            <div className="h-10 px-3 bg-slate-50 dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveLeftTab('description')}
                className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeLeftTab === 'description'
                    ? 'border-brand-600 dark:border-brand-500 text-slate-900 dark:text-slate-100 font-bold'
                    : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Code className="h-3.5 w-3.5 text-brand-600 dark:text-brand-500" /> Description
              </button>
              <button
                type="button"
                onClick={() => setActiveLeftTab('editorial')}
                className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeLeftTab === 'editorial'
                    ? 'border-brand-600 dark:border-brand-500 text-slate-900 dark:text-slate-100 font-bold'
                    : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" /> Editorial
              </button>
              <button
                type="button"
                onClick={() => setActiveLeftTab('submissions')}
                className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeLeftTab === 'submissions'
                    ? 'border-brand-600 dark:border-brand-500 text-slate-900 dark:text-slate-100 font-bold'
                    : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Submissions
              </button>
            </div>

            {/* Left Panel Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-300 text-xs font-medium leading-relaxed">
              {activeLeftTab === 'description' && (
                <>
                  <div className="space-y-2">
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 font-display">
                      {activeProblem.title}
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap text-[10px] font-semibold">
                      <span className="px-2 py-0.5 rounded bg-brand-50 dark:bg-amber-500/10 text-brand-700 dark:text-amber-400 border border-brand-200 dark:border-amber-500/20 font-bold">
                        {activeProblem.category}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                        Target Time: {activeProblem.expectedComplexity.time}
                      </span>
                    </div>
                  </div>

                  {/* Description text */}
                  <div className="whitespace-pre-line text-slate-800 dark:text-slate-200 leading-relaxed font-sans text-xs">
                    {activeProblem.description}
                  </div>

                  {/* Examples */}
                  {activeProblem.examples.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Examples:</h4>
                      {activeProblem.examples.map((ex, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 font-mono text-[11px]">
                          <p><span className="text-slate-400 font-bold">Input: </span><span className="text-slate-800 dark:text-slate-200">{ex.input}</span></p>
                          <p><span className="text-slate-400 font-bold">Output: </span><span className="text-emerald-600 dark:text-emerald-400 font-bold">{ex.output}</span></p>
                          {ex.explanation && (
                            <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 pt-1">{ex.explanation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Constraints */}
                  {activeProblem.constraints.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Constraints:</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {activeProblem.constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {activeLeftTab === 'editorial' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800">
                    <h3 className="text-sm font-bold text-brand-900 dark:text-brand-300 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Optimal Solution Approach
                    </h3>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">{activeProblem.editorial}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Target Complexity</span>
                    <div className="flex justify-between font-mono text-xs text-slate-800 dark:text-slate-200">
                      <span>Time Complexity: <strong>{activeProblem.expectedComplexity.time}</strong></span>
                      <span>Space Complexity: <strong>{activeProblem.expectedComplexity.space}</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {activeLeftTab === 'submissions' && (
                <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-800 dark:text-slate-200">Submissions History</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Run or submit code to populate execution benchmarks.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Code Editor Sandbox & Testcases */}
          <div className="w-1/2 flex flex-col gap-2 overflow-hidden">
            {/* Top Code Editor */}
            <div className="flex-1 bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-xs">
              <div className="h-10 px-3 bg-slate-50 dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 flex-shrink-0">
                <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                  <Terminal className="h-3.5 w-3.5 text-brand-600 dark:text-brand-500" /> solution.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language === 'java' ? 'java' : 'cpp'}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Auto-Saved
                </span>
              </div>

              {/* Editor Textarea with Line Numbers */}
              <div className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-[#1e1e1e]">
                {/* Line Numbers */}
                <div className="w-10 py-3 bg-slate-100 dark:bg-[#181818] border-r border-slate-200 dark:border-slate-800 text-right pr-2 text-slate-400 dark:text-slate-600 font-mono text-xs select-none leading-relaxed">
                  {lineNumbers.map((n) => (
                    <div key={n}>{n}</div>
                  ))}
                </div>

                {/* Editable Code Box */}
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-[#1e1e1e] text-slate-900 dark:text-slate-100 font-mono text-xs p-3 focus:outline-none resize-none leading-relaxed border-none"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Bottom Testcase & Console Output Window */}
            <div className="h-52 bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden flex-shrink-0 shadow-xs">
              <div className="h-9 px-3 bg-slate-50 dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('testcases')}
                  className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    activeBottomTab === 'testcases' ? 'border-brand-600 dark:border-brand-500 text-slate-900 dark:text-slate-100 font-bold' : 'hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Testcases ({activeProblem.testCases.filter(tc => !tc.hidden).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('results')}
                  className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    activeBottomTab === 'results' ? 'border-brand-600 dark:border-brand-500 text-slate-900 dark:text-slate-100 font-bold' : 'hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Test Results {testResults.length > 0 && <span className={`h-1.5 w-1.5 rounded-full ${testResults.every(r => r.status === 'passed') ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('console')}
                  className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    activeBottomTab === 'console' ? 'border-brand-600 dark:border-brand-500 text-slate-900 dark:text-slate-100 font-bold' : 'hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Console Output
                </button>
              </div>

              {/* Bottom Content Body */}
              <div className="flex-1 p-3 font-mono text-xs overflow-y-auto bg-slate-50 dark:bg-[#181818]">
                {activeBottomTab === 'testcases' && (
                  <div className="space-y-2 text-slate-700 dark:text-slate-300">
                    {activeProblem.testCases.filter(tc => !tc.hidden).map((tc, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                        <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 block uppercase">{tc.name || `Case ${i+1}`}</span>
                        <p><span className="text-slate-400">Input: </span><span className="text-slate-800 dark:text-slate-200">{tc.input}</span></p>
                        <p><span className="text-slate-400">Expected: </span><span className="text-emerald-600 dark:text-emerald-400 font-bold">{tc.expected}</span></p>
                      </div>
                    ))}
                  </div>
                )}

                {activeBottomTab === 'results' && (
                  <div className="space-y-2">
                    {testResults.length > 0 ? (
                      testResults.map((r, i) => (
                        <div
                          key={i}
                          className={`flex flex-col p-2.5 rounded-lg border text-[11px] space-y-1 ${
                            r.status === 'passed'
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
                              : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span
                              className={`flex items-center gap-1.5 font-bold ${
                                r.status === 'passed'
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-rose-700 dark:text-rose-400'
                              }`}
                            >
                              {r.status === 'passed' ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-rose-500" />
                              )}
                              {r.name}: {r.status === 'passed' ? 'Passed' : 'Failed'}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-mono">{r.time}</span>
                          </div>
                          <div className="font-mono text-[10px] space-y-0.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                            <p><span className="text-slate-400">Input: </span><span className="text-slate-700 dark:text-slate-300">{r.input}</span></p>
                            <p><span className="text-slate-400">Expected: </span><span className="text-emerald-600 dark:text-emerald-400 font-bold">{r.expected}</span></p>
                            <p><span className="text-slate-400">Actual: </span><span className={r.status === 'passed' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>{r.actual}</span></p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-xs">Click &quot;Run&quot; or &quot;Submit&quot; to execute test cases.</p>
                    )}
                  </div>
                )}

                {activeBottomTab === 'console' && (
                  <div className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                    {outputLogs.length > 0 ? (
                      outputLogs.map((log, idx) => (
                        <p key={idx} className={log.includes('Error') ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400'}>
                          {log}
                        </p>
                      ))
                    ) : (
                      <p className="text-slate-500 text-xs">No execution console logs yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* Submission Completion View */
        <div className="w-full max-w-xl mx-auto my-auto p-8 rounded-3xl border border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-xl text-left space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="relative">
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-md border ${
                finalPassRate > 0
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}>
                {finalPassRate > 0 ? <Check className="h-7 w-7 stroke-[3]" /> : <XCircle className="h-7 w-7" />}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  finalPassRate > 0
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                    : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                }`}>
                  {finalPassRate > 0 ? 'Submission Evaluated' : 'Execution Failed'}
                </span>
                <span className="text-xs text-slate-500 font-mono">• {language}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1 font-display">
                {activeProblem.title} Evaluation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluation processed with {finalPassRate}% pass rate.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold">Pass Rate</span>
                <Zap className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
                {finalPassRate}%
              </div>
              <span className={`inline-block mt-1 text-[10px] font-bold ${finalPassRate > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {testResults.filter((r) => r.status === 'passed').length} of {testResults.length} passed
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold">Complexity</span>
                <Cpu className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                {complexityFeedback || activeProblem.expectedComplexity.time}
              </div>
              <span className="inline-block mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Sandbox analysis
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold">Difficulty</span>
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
                {activeProblem.difficulty}
              </div>
              <span className="inline-block mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {activeProblem.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Review Code</span>
            </button>

            <button
              type="button"
              onClick={() => onComplete(finalPassRate)}
              className="flex-1 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <span>View Evaluation Feedback</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
