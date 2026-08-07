'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { AsyncScreening } from '@/types';
import { ChevronRight, Camera, Video, Play, Clock, AlertTriangle, RefreshCw, StopCircle } from 'lucide-react';

export default function CandidateVideoScreeningPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);

  const [screening, setScreening] = useState<AsyncScreening | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScreening() {
      try {
        setLoading(true);
        const res = await apiClient.get<AsyncScreening>(`/candidate/applications/${applicationId}/video-screening`);
        if (res) setScreening(res);
      } catch (err) {
        console.error('Failed to load video screening:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchScreening();
  }, [applicationId]);

  // Recording console simulator states
  const [recordingActive, setRecordingActive] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [recordedList, setRecordedList] = useState<Record<string, { duration: number; attempts: number }>>({});
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [attempts, setAttempts] = useState(1);
  const [isCapturing, setIsCapturing] = useState(false); // Webcam preview

  // Timer while recording
  useEffect(() => {
    if (!isCapturing || !recordingActive) return;
    const t = setInterval(() => {
      setRecordingTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [isCapturing, recordingActive]);

  const handleStartCapture = () => {
    setIsCapturing(true);
    setRecordingActive(false);
    setRecordingTimer(0);
  };

  const handleStartRecord = () => {
    setRecordingActive(true);
    setRecordingTimer(0);
  };

  const handleStopRecord = () => {
    setRecordingActive(false);
    // save response
    const qId = screening?.responses[currentIdx]?.questionId || `q-${currentIdx}`;
    setRecordedList({
      ...recordedList,
      [qId]: { duration: recordingTimer || 45, attempts },
    });
  };

  const handleNextQuestion = () => {
    if (screening && currentIdx < screening.responses.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setAttempts(1);
      setRecordingTimer(0);
      setRecordingActive(false);
    }
  };

  const handleRetake = () => {
    setAttempts((prev) => prev + 1);
    setRecordingTimer(0);
    setRecordingActive(false);
  };

  const handleSubmitScreening = () => {
    if (!screening) return;
    setIsCapturing(false);
    // Simulate updating screening results
    setScreening({
      ...screening,
      status: 'submitted',
      submittedDate: new Date().toISOString().slice(0, 10),
      responses: screening.responses.map((resp) => {
        const rec = recordedList[resp.questionId];
        return {
          ...resp,
          durationSeconds: rec?.duration || 0,
          attempts: rec?.attempts || 1,
        };
      }),
    });
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'reviewed':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading video screening details...
      </div>
    );
  }

  if (!screening) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Video screening details not found.
      </div>
    );
  }

  const currentQ = screening.responses[currentIdx];
  const currentRecorded = currentQ ? recordedList[currentQ.questionId] : undefined;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <Link href="/candidate/applications" className="hover:text-indigo-650 transition-colors">Applications</Link>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <Link href={`/candidate/applications/${applicationId}`} className="hover:text-indigo-655 transition-colors">{screening.jobTitle}</Link>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <span className="text-slate-800">One-way Video Screening</span>
      </div>

      {isCapturing ? (
        // INTERACTIVE SCREENING CAPTURE CONSOLE
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Capture Box */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex flex-col justify-between p-4 shadow-xl">
              {/* Webcam preview grid guides */}
              <div className="absolute inset-0 opacity-15 border-dashed border border-slate-500 pointer-events-none flex items-center justify-center">
                <div className="w-1/3 h-full border-x border-dashed border-slate-500"></div>
              </div>

              {/* Status Header Overlay */}
              <div className="relative z-10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest bg-slate-900/60 px-2 py-0.5 rounded">
                    Webcam Active
                  </span>
                </div>
                {recordingActive && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 bg-slate-900/80 px-3 py-1 rounded-full animate-pulse border border-rose-500/20">
                    <span className="h-2 w-2 rounded-full bg-rose-600"></span>
                    <span>RECORDING • {recordingTimer}s</span>
                  </div>
                )}
              </div>

              {/* Simulated Face Outline Grid Indicator */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="h-40 w-32 border-2 border-indigo-500 rounded-[50%]"></div>
              </div>

              {/* Lower Controls overlay */}
              <div className="relative z-10 w-full flex justify-center gap-3 pt-24">
                {!recordingActive ? (
                  <button
                    onClick={handleStartRecord}
                    className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-6 py-2.5 text-xs shadow-md shadow-rose-200/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Video className="h-4.5 w-4.5" />
                    {currentRecorded ? 'Record Retake' : 'Start Recording'}
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecord}
                    className="rounded-full bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-2.5 text-xs shadow-md flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <StopCircle className="h-4.5 w-4.5 text-rose-500" />
                    Stop & Review
                  </button>
                )}
              </div>
            </div>

            {/* Current prompt info */}
            <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-md backdrop-blur-md glass-panel space-y-3">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                Prompt {currentIdx + 1} of {screening.responses.length}
              </span>
              <h3 className="text-xs font-bold text-slate-800 leading-relaxed">
                {currentQ.question}
              </h3>
            </div>
          </div>

          {/* Sidebar checklist parameters */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
              <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">Screening Checklist</h4>
              
              <div className="space-y-3">
                {screening.responses.map((resp, idx) => {
                  const done = !!recordedList[resp.questionId];
                  const active = currentIdx === idx;
                  return (
                    <div
                      key={resp.questionId}
                      className={`p-3 rounded-2xl border text-[11px] flex justify-between items-center ${
                        active 
                          ? 'border-indigo-500 bg-indigo-50/40 font-bold text-indigo-800' 
                          : done 
                          ? 'border-emerald-100 bg-emerald-50/20 text-slate-500' 
                          : 'border-slate-200 bg-white/20 text-slate-400'
                      }`}
                    >
                      <span className="truncate max-w-[70%]">Prompt {idx + 1}: {resp.question}</span>
                      {done ? (
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase">
                          Done
                        </span>
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                      )}
                    </div>
                  );
                })}
              </div>

              {currentRecorded && !recordingActive && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                    <span>Attempts: {attempts}</span>
                    <span>Duration: {currentRecorded.duration}s</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRetake}
                      className="flex-1 py-2 text-[10px] font-bold border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" /> Retake
                    </button>
                    {currentIdx < screening.responses.length - 1 ? (
                      <button
                        onClick={handleNextQuestion}
                        className="flex-1 py-2 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer text-center"
                      >
                        Next Question
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitScreening}
                        className="flex-1 py-2 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer text-center"
                      >
                        Submit Video
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // DETAILS AND SUBMISSION VIEW
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-md backdrop-blur-md glass-panel flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-650 text-xl font-bold shadow-sm flex-shrink-0">
                <Camera className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Video Interview</h1>
                <p className="text-xs text-slate-500 font-semibold">{screening?.jobTitle || 'Role Assessment'}</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${screening ? getStatusPill(screening.status) : ''}`}>
              {screening?.status || 'Invited'}
            </span>
          </div>

          {screening.status === 'submitted' || screening.status === 'reviewed' ? (
            // COMPLETED SUBMISSION VIEW
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Responses List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xs font-bold text-slate-805">Recorded Submissions</h3>
                {screening.responses.map((resp, idx) => (
                  <div key={resp.questionId} className="rounded-3xl border border-white/60 bg-white/45 p-5 shadow-sm backdrop-blur-md glass-panel space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                          Prompt {idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 leading-relaxed pt-1">{resp.question}</h4>
                      </div>
                      <button className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-205 flex items-center justify-center flex-shrink-0 cursor-pointer">
                        <Play className="h-4 w-4 text-slate-600" />
                      </button>
                    </div>

                    <div className="bg-slate-50/65 border border-slate-150 p-3 rounded-2xl text-[11px] font-semibold text-slate-505 leading-relaxed">
                      <strong className="text-slate-800 font-bold block mb-1">AI Transcription Summary:</strong>
                      {resp.aiSummary}
                    </div>

                    <div className="flex gap-4 text-[10px] font-semibold text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Duration: {resp.durationSeconds}s</span>
                      <span>Attempts: {resp.attempts}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Review scorecard column */}
              <div className="space-y-6">
                {screening.reviewScore && (
                  <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-md backdrop-blur-md glass-panel text-center space-y-3">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-705 font-black text-xl shadow-inner">
                      {screening.reviewScore}%
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Evaluator Score</h4>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-1">Submitted on: {screening.submittedDate}</span>
                    </div>
                  </div>
                )}

                {screening.reviewerNotes && (
                  <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-md backdrop-blur-md glass-panel space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">Reviewer Feedback</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold italic">{screening.reviewerNotes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // NOT STARTED SCREENING INVITE NUDGE
            <div className="rounded-3xl border border-white/60 bg-white/45 p-8 shadow-xl backdrop-blur-md glass-panel text-center max-w-lg mx-auto space-y-6">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650 mx-auto">
                <Video className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-slate-900">Video Interview Pending</h2>
                <p className="text-xs text-slate-550 font-semibold max-w-sm mx-auto leading-relaxed">
                  Record video responses to screening questions. Recruiters will review your recordings.
                </p>
              </div>

              <div className="bg-amber-50/40 border border-amber-100/50 p-4 rounded-2xl text-[11px] font-semibold text-amber-900 text-left max-w-md mx-auto flex gap-3 items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="space-y-1">
                  <span className="font-bold block">Hardware Check Required</span>
                  <p className="text-slate-500">Ensure microphone and webcam access is granted before starting. Deadlines expire on: {screening.deadline}.</p>
                </div>
              </div>

              <button
                onClick={handleStartCapture}
                className="w-full max-w-md rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 text-xs shadow-md transition-all cursor-pointer"
              >
                Start Video Interview
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
