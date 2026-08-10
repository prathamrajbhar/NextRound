'use client';

import React from 'react';
import { Terminal, CheckCircle2, XCircle } from '@/lib/lucide-google-icons';
import { CodingProblem, SupportedLanguage } from './useCodingProblem';
import { TestResult } from './types';

export type CodingBottomTab = 'testcases' | 'results' | 'console';

interface CodingWorkspacePanelProps {
  problem: CodingProblem;
  language: SupportedLanguage;
  code: string;
  onCodeChange: (code: string) => void;
  activeBottomTab: CodingBottomTab;
  onBottomTabChange: (tab: CodingBottomTab) => void;
  testResults: TestResult[];
  outputLogs: string[];
}

const FILE_EXTENSION: Record<SupportedLanguage, string> = {
  python: 'py',
  javascript: 'js',
  typescript: 'ts',
  java: 'java',
  cpp: 'cpp',
};

/**
 * Right split of the coding workspace: the code editor with line-number
 * gutter plus the bottom testcases / results / console output window.
 */
export function CodingWorkspacePanel({
  problem,
  language,
  code,
  onCodeChange,
  activeBottomTab,
  onBottomTabChange,
  testResults,
  outputLogs,
}: CodingWorkspacePanelProps) {
  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 16) }, (_, i) => i + 1);
  const publicCases = problem.testCases.filter((tc) => !tc.hidden);

  return (
    <div className="w-1/2 flex flex-col gap-2 overflow-hidden">
      {/* Top Code Editor */}
      <div className="flex-1 bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-xs">
        <div className="h-10 px-3 bg-slate-50 dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 flex-shrink-0">
          <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
            <Terminal className="h-3.5 w-3.5 text-brand-600 dark:text-brand-500" /> solution.{FILE_EXTENSION[language]}
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
            onChange={(e) => onCodeChange(e.target.value)}
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
            onClick={() => onBottomTabChange('testcases')}
            className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeBottomTab === 'testcases' ? 'border-brand-600 dark:border-brand-500 text-slate-900 dark:text-slate-100 font-bold' : 'hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Testcases ({publicCases.length})
          </button>
          <button
            type="button"
            onClick={() => onBottomTabChange('results')}
            className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeBottomTab === 'results' ? 'border-brand-600 dark:border-brand-500 text-slate-900 dark:text-slate-100 font-bold' : 'hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Test Results {testResults.length > 0 && <span className={`h-1.5 w-1.5 rounded-full ${testResults.every((r) => r.status === 'passed') ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>}
          </button>
          <button
            type="button"
            onClick={() => onBottomTabChange('console')}
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
              {publicCases.map((tc, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 block uppercase">{tc.name || `Case ${i + 1}`}</span>
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
  );
}
