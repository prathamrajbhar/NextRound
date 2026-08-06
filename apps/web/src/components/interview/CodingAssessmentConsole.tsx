'use client';

import React, { useState } from 'react';
import { CompanyLogo } from '@/components/ui';
import {
  Terminal,
  Play,
  CheckCircle2,
  Clock,
  Award,
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
} from '@/lib/lucide-google-icons';

interface CodingConsoleProps {
  company?: string;
  role?: string;
  onComplete: (score: number) => void;
}

const defaultCode = `/**
 * Problem 1: High-Throughput Order Rate Limiter
 * @param {string} userId
 * @param {number} maxRequests (default: 5 requests per 1000ms)
 * @returns {boolean} true if allowed, false if rate limited
 */
function isRequestAllowed(userId: string, maxRequests: number = 5): boolean {
  const windowMs = 1000;
  const now = Date.now();
  
  // Log telemetry execution
  console.log(\`[RateLimiter] Checking request for \${userId} at t=\${now}\`);
  
  // Sliding window execution check
  return true;
}

// Test Suite Execution
console.log(isRequestAllowed("usr_9921", 5));
`;

export default function CodingAssessmentConsole({
  company = 'Swiggy',
  role = 'Senior Frontend Engineer',
  onComplete,
}: CodingConsoleProps) {
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState('TypeScript');
  const [activeLeftTab, setActiveLeftTab] = useState<'description' | 'editorial' | 'submissions'>('description');
  const [activeBottomTab, setActiveBottomTab] = useState<'testcases' | 'results' | 'console'>('testcases');
  
  const [isRunning, setIsRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<
    { name: string; input: string; expected: string; actual: string; status: 'passed' | 'failed'; time: string }[]
  >([]);

  const handleRunCode = () => {
    setIsRunning(true);
    setActiveBottomTab('results');
    setOutputLogs(['[Compiler] TypeScript 5.4 AST Verification...', '[Sandbox] Initializing sliding window memory...']);

    setTimeout(() => {
      setTestResults([
        {
          name: 'Case 1',
          input: 'userId = "usr_9921", maxRequests = 5',
          expected: 'true',
          actual: 'true',
          status: 'passed',
          time: '2ms',
        },
        {
          name: 'Case 2',
          input: 'userId = "usr_9921", burstCount = 6',
          expected: 'false',
          actual: 'false',
          status: 'passed',
          time: '4ms',
        },
        {
          name: 'Case 3',
          input: 'userId = "usr_4040", slidingEviction = true',
          expected: 'true',
          actual: 'true',
          status: 'passed',
          time: '3ms',
        },
      ]);
      setOutputLogs((prev) => [
        ...prev,
        `[Telemetry] [RateLimiter] Checking request for usr_9921 at t=${Date.now()}`,
        `[Telemetry] Result: true`,
        `✓ All 3 test cases passed successfully.`,
      ]);
      setIsRunning(false);
    }, 500);
  };

  const handleSubmitSolution = () => {
    setSubmitted(true);
  };

  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 15) }, (_, i) => i + 1);

  return (
    <div className="w-full h-screen bg-[#0a0a0a] text-slate-100 flex flex-col justify-between overflow-hidden font-sans select-none">
      {/* LeetCode Header Navbar */}
      <header className="h-14 px-4 bg-[#141414] border-b border-slate-800/80 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <CompanyLogo name={company} size="sm" className="shadow-xs flex-shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200 font-display">
              1. High-Throughput Order Rate Limiter
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Medium
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {company}
            </span>
          </div>
        </div>

        {/* Center Timer & Round Info */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs font-semibold">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>29:45</span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{role}</span>
        </div>

        {/* Right Run & Submit Controls */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[#1e1e1e] border border-slate-700 text-xs text-slate-200 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer appearance-none pr-7"
            >
              <option value="TypeScript">TypeScript</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Python">Python 3</option>
              <option value="Java">Java 21</option>
              <option value="C++">C++ 20</option>
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700 disabled:opacity-50 transition-all"
          >
            <Play className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </button>

          <button
            type="button"
            onClick={handleSubmitSolution}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Submit</span>
          </button>
        </div>
      </header>

      {/* LeetCode 2-Panel Split Workspace */}
      {!submitted ? (
        <main className="flex-1 p-2 flex gap-2 overflow-hidden bg-[#0a0a0a]">
          {/* Left Panel: Problem Specification Workspace */}
          <div className="w-1/2 bg-[#141414] rounded-xl border border-slate-800/80 flex flex-col overflow-hidden">
            {/* Left Panel Tabs */}
            <div className="h-10 px-3 bg-[#1a1a1a] border-b border-slate-800/80 flex items-center gap-4 text-xs font-semibold text-slate-400 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveLeftTab('description')}
                className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeLeftTab === 'description'
                    ? 'border-brand-500 text-slate-100 font-bold'
                    : 'border-transparent hover:text-slate-200'
                }`}
              >
                <Code className="h-3.5 w-3.5 text-brand-500" /> Description
              </button>
              <button
                type="button"
                onClick={() => setActiveLeftTab('editorial')}
                className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeLeftTab === 'editorial'
                    ? 'border-brand-500 text-slate-100 font-bold'
                    : 'border-transparent hover:text-slate-200'
                }`}
              >
                Editorial
              </button>
              <button
                type="button"
                onClick={() => setActiveLeftTab('submissions')}
                className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeLeftTab === 'submissions'
                    ? 'border-brand-500 text-slate-100 font-bold'
                    : 'border-transparent hover:text-slate-200'
                }`}
              >
                Submissions
              </button>
            </div>

            {/* Left Panel Scrollable Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6 text-slate-300 text-xs font-medium leading-relaxed">
              {activeLeftTab === 'description' && (
                <>
                  <div className="space-y-2">
                    <h2 className="text-base font-extrabold text-slate-100 font-display">
                      1. High-Throughput Order Rate Limiter
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap text-[10px] font-semibold text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                        Medium
                      </span>
                      <span>Acceptance: <strong>74.2%</strong></span>
                      <span>•</span>
                      <span>Topics: <strong className="text-slate-300">Array • Sliding Window • Hash Table</strong></span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <p>
                      Implement an in-memory sliding window rate limiter function{' '}
                      <code className="text-amber-300 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono">
                        isRequestAllowed(userId, maxRequests)
                      </code>{' '}
                      to handle order dispatch traffic spikes.
                    </p>
                    <p>
                      Requests arriving within 1,000 milliseconds from the same{' '}
                      <code className="text-amber-300 font-mono">userId</code> must be capped at{' '}
                      <code className="text-amber-300 font-mono">maxRequests</code>. Excess requests exceeding the sliding threshold should return{' '}
                      <code className="text-rose-400 font-mono">false</code>.
                    </p>
                  </div>

                  {/* Example 1 */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-200 block">Example 1:</span>
                    <div className="p-3 rounded-xl bg-[#1e1e1e] border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300">
                      <p><strong className="text-slate-400">Input:</strong> userId = &quot;usr_9921&quot;, maxRequests = 5</p>
                      <p><strong className="text-slate-400">Output:</strong> true</p>
                      <p><strong className="text-slate-400">Explanation:</strong> First request within 1000ms sliding window (1 of 5 limit).</p>
                    </div>
                  </div>

                  {/* Example 2 */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-200 block">Example 2:</span>
                    <div className="p-3 rounded-xl bg-[#1e1e1e] border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300">
                      <p><strong className="text-slate-400">Input:</strong> userId = &quot;usr_9921&quot;, maxRequests = 5 (6th burst request)</p>
                      <p><strong className="text-slate-400">Output:</strong> false</p>
                      <p><strong className="text-slate-400">Explanation:</strong> User exceeded the 5-request capacity within 1000ms window.</p>
                    </div>
                  </div>

                  {/* Constraints */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <span className="font-bold text-slate-200 block">Constraints &amp; Complexity:</span>
                    <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-slate-400">
                      <li>1 &lt;= userId.length &lt;= 64</li>
                      <li>1 &lt;= maxRequests &lt;= 10,000</li>
                      <li>Time Complexity: <span className="text-emerald-400 font-bold">O(1)</span> average</li>
                      <li>Space Complexity: <span className="text-indigo-400 font-bold">O(N)</span> memory</li>
                    </ul>
                  </div>
                </>
              )}

              {activeLeftTab === 'editorial' && (
                <div className="p-4 text-center text-slate-400">
                  <Sparkles className="h-6 w-6 text-brand-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-200">Sliding Window Log Algorithm</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Store timestamps in a queue per user ID. Evict timestamps older than (now - 1000ms). Allow request if queue length &lt; maxRequests.
                  </p>
                </div>
              )}

              {activeLeftTab === 'submissions' && (
                <div className="p-4 text-center text-slate-400">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-200">No Prior Submissions</p>
                  <p className="text-xs text-slate-400 mt-1">Submit your code to see runtime and memory benchmarks.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Code Editor Sandbox & Testcase Runner */}
          <div className="w-1/2 flex flex-col gap-2 overflow-hidden">
            {/* Top IDE Code Editor */}
            <div className="flex-1 bg-[#141414] rounded-xl border border-slate-800/80 flex flex-col overflow-hidden">
              <div className="h-10 px-3 bg-[#1a1a1a] border-b border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400 flex-shrink-0">
                <span className="flex items-center gap-2 text-slate-200 font-bold">
                  <Terminal className="h-3.5 w-3.5 text-brand-500" /> solution.ts
                </span>
                <span className="text-[10px] text-emerald-400 font-extrabold uppercase flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Auto-Saved
                </span>
              </div>

              {/* Editor Textarea with Line Numbers */}
              <div className="flex-1 flex overflow-hidden bg-[#1e1e1e]">
                {/* Line Numbers */}
                <div className="w-10 py-3 bg-[#181818] border-r border-slate-800/80 text-right pr-2 text-slate-600 font-mono text-xs select-none leading-relaxed">
                  {lineNumbers.map((n) => (
                    <div key={n}>{n}</div>
                  ))}
                </div>

                {/* Editable Code Box */}
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 bg-[#1e1e1e] text-slate-100 font-mono text-xs p-3 focus:outline-none resize-none leading-relaxed border-none"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Bottom Testcase & Console Output Window */}
            <div className="h-44 bg-[#141414] rounded-xl border border-slate-800/80 flex flex-col overflow-hidden flex-shrink-0">
              <div className="h-9 px-3 bg-[#1a1a1a] border-b border-slate-800/80 flex items-center gap-4 text-xs font-semibold text-slate-400 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('testcases')}
                  className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    activeBottomTab === 'testcases' ? 'border-brand-500 text-slate-100 font-bold' : 'hover:text-slate-200'
                  }`}
                >
                  Testcases
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('results')}
                  className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    activeBottomTab === 'results' ? 'border-brand-500 text-slate-100 font-bold' : 'hover:text-slate-200'
                  }`}
                >
                  Test Results {testResults.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('console')}
                  className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    activeBottomTab === 'console' ? 'border-brand-500 text-slate-100 font-bold' : 'hover:text-slate-200'
                  }`}
                >
                  Console Output
                </button>
              </div>

              {/* Bottom Content Body */}
              <div className="flex-1 p-3 font-mono text-xs overflow-y-auto bg-[#181818]">
                {activeBottomTab === 'testcases' && (
                  <div className="space-y-2 text-slate-300">
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">Case 1</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400">Case 2</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400">Case 3</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                      <p><span className="text-slate-500">userId = </span>&quot;usr_9921&quot;</p>
                      <p><span className="text-slate-500">maxRequests = </span>5</p>
                    </div>
                  </div>
                )}

                {activeBottomTab === 'results' && (
                  <div className="space-y-2">
                    {testResults.length > 0 ? (
                      testResults.map((r, i) => (
                        <div key={i} className="flex justify-between items-center text-[11px] p-1.5 rounded bg-slate-900 border border-slate-800">
                          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {r.name}: Accepted
                          </span>
                          <span className="text-slate-400 text-[10px]">{r.time}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-xs">Click &quot;Run&quot; to execute test cases against your solution.</p>
                    )}
                  </div>
                )}

                {activeBottomTab === 'console' && (
                  <div className="space-y-1 text-slate-300 text-[11px]">
                    {outputLogs.length > 0 ? (
                      outputLogs.map((log, idx) => (
                        <p key={idx} className="text-emerald-400">
                          {log}
                        </p>
                      ))
                    ) : (
                      <p className="text-slate-500 text-xs">No console logs generated yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* Redesigned Submission Completion View */
        <div className="w-full max-w-xl mx-auto my-auto p-8 rounded-3xl border border-slate-800/90 bg-[#121214]/95 backdrop-blur-xl text-left space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
          {/* Header Banner */}
          <div className="flex items-center gap-4 pb-5 border-b border-slate-800/80">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Check className="h-7 w-7 stroke-[3]" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#121214]"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Solution Accepted
                </span>
                <span className="text-xs text-slate-500 font-mono">• {language}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-1 font-display">
                All Test Cases Passed Successfully
              </h2>
              <p className="text-xs text-slate-400">
                Your code passed all automated functional and performance test suites.
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Metric 1: Runtime */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold">Runtime</span>
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-xl font-extrabold text-white tracking-tight font-mono">
                2ms
              </div>
              <span className="inline-block mt-1 text-[10px] text-emerald-400 font-medium">
                Fast execution
              </span>
            </div>

            {/* Metric 2: Memory */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold">Memory</span>
                <Cpu className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="text-xl font-extrabold text-white tracking-tight font-mono">
                42.1 MB
              </div>
              <span className="inline-block mt-1 text-[10px] text-slate-400 font-medium">
                V8 Sandbox
              </span>
            </div>

            {/* Metric 3: Test Cases */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold">Test Cases</span>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-xl font-extrabold text-white tracking-tight font-mono">
                3 / 3
              </div>
              <span className="inline-block mt-1 text-[10px] text-emerald-400 font-medium">
                100% Passed
              </span>
            </div>
          </div>

          {/* Execution Specs */}
          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Complexity: <strong className="text-slate-200 font-mono">O(N) Time</strong> • <strong className="text-slate-200 font-mono">O(1) Space</strong></span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Verified AST</span>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Review Code</span>
            </button>

            <button
              type="button"
              onClick={() => onComplete(98)}
              className="flex-1 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/60 cursor-pointer"
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
