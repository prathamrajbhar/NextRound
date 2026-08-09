'use client';

import React, { useState } from 'react';
import { Trophy, ScrollText, ChevronUp, ChevronDown, GripVertical, RefreshCw, Loader2 } from '@/lib/lucide-google-icons';
import { OnboardingStepProps } from './useCandidateOnboarding';
import { inputCls, labelCls } from './CandidateOnboardingShell';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

export function FitCultureStep({ form, update, mergeParsedProfile }: OnboardingStepProps) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [reparsing, setReparsing] = useState<string | null>(null);

  const handleRegenerateField = async (field: 'proudProject' | 'bio') => {
    if (reparsing) return;
    if (!form.resumeFile) {
      alert('Please upload a resume in Step 1 or 2 to auto-regenerate AI fields from your profile resources.');
      return;
    }

    setReparsing(field);
    try {
      const formData = new FormData();
      formData.append('resume', form.resumeFile);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/candidate/parse-resume`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.data?.profile) {
        if (field === 'proudProject' && json.data.profile.proudProject) {
          update('proudProject', json.data.profile.proudProject);
        } else if (field === 'bio' && json.data.profile.bio) {
          update('bio', json.data.profile.bio);
        }
        if (mergeParsedProfile) {
          mergeParsedProfile(json.data.profile, json.data.rawText);
        }
      }
    } catch (err) {
      console.error('Failed to regenerate AI field:', err);
    } finally {
      setReparsing(null);
    }
  };

  const moveValue = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= form.workValues.length) return;
    const copy = [...form.workValues];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    update('workValues', copy);
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    const copy = [...form.workValues];
    const [removed] = copy.splice(draggedIdx, 1);
    copy.splice(dropIdx, 0, removed);
    update('workValues', copy);

    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className={labelCls}>Describe a Project You&apos;re Proud Of</label>
          <button
            type="button"
            onClick={() => handleRegenerateField('proudProject')}
            disabled={reparsing === 'proudProject'}
            className="flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-1 rounded-lg border border-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
            title="Re-synthesize project description using AI"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${reparsing === 'proudProject' ? 'animate-spin' : ''}`} />
            <span>{reparsing === 'proudProject' ? 'Regenerating...' : 'Regenerate AI'}</span>
          </button>
        </div>
        <div className="relative">
          <Trophy className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <textarea
            rows={3}
            value={form.proudProject}
            onChange={(e) => update('proudProject', e.target.value)}
            placeholder="Explain the technical details of something you shipped — stack, your role, and the impact..."
            className={`${inputCls} pl-10 resize-none leading-relaxed`}
          />
        </div>
        <p className="text-xs text-slate-400 font-medium mt-1.5">Gives the evaluator agent concrete signal beyond the resume.</p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className={labelCls}>About Me / Summary</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleRegenerateField('bio')}
              disabled={reparsing === 'bio'}
              className="flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-1 rounded-lg border border-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
              title="Re-synthesize bio summary using AI"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${reparsing === 'bio' ? 'animate-spin' : ''}`} />
              <span>{reparsing === 'bio' ? 'Regenerating...' : 'Regenerate AI'}</span>
            </button>
            <span className="text-xs font-mono font-bold text-slate-400">{form.bio.length} / 1000</span>
          </div>
        </div>
        <div className="relative">
          <ScrollText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <textarea
            rows={3}
            maxLength={1000}
            value={form.bio}
            onChange={(e) => update('bio', e.target.value)}
            placeholder="Brief description of your background and what you're looking for..."
            className={`${inputCls} pl-10 resize-none leading-relaxed`}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Work Values — Drag &amp; Drop Priority Ranking</label>
          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
            Drag items to reorder
          </span>
        </div>
        <p className="text-xs text-slate-400 font-medium mb-3">Drag handles or use arrows to reorder values based on your personal priority.</p>
        
        <div className="space-y-2.5">
          {form.workValues.map((val, idx) => {
            const isDragging = draggedIdx === idx;
            const isDragOver = dragOverIdx === idx && draggedIdx !== idx;

            return (
              <div
                key={val}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex justify-between items-center p-3.5 rounded-xl border text-sm font-bold text-slate-200 transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
                  isDragging
                    ? 'opacity-40 bg-orange-500/20 border-orange-500 scale-[0.98]'
                    : isDragOver
                      ? 'bg-orange-500/15 border-orange-400 shadow-lg shadow-orange-500/10 translate-y-0.5'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-slate-500 hover:text-orange-400 transition-colors shrink-0">
                    <GripVertical className="h-4.5 w-4.5" />
                  </div>
                  <span className="flex items-center">
                    <span className="text-orange-400 font-black mr-2.5 font-mono">{idx + 1}.</span>
                    <span>{val}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-400">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveValue(idx, -1);
                    }}
                    disabled={idx === 0}
                    className="p-1 rounded-lg hover:bg-slate-800 hover:text-white disabled:opacity-20 cursor-pointer"
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveValue(idx, 1);
                    }}
                    disabled={idx === form.workValues.length - 1}
                    className="p-1 rounded-lg hover:bg-slate-800 hover:text-white disabled:opacity-20 cursor-pointer"
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
