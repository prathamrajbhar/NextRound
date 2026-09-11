'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, GripVertical } from '@/lib/lucide-google-icons';
import { labelCls } from './CandidateOnboardingShell';

interface WorkValuesRankingListProps {
  workValues: string[];
  onChange: (values: string[]) => void;
}

export function WorkValuesRankingList({ workValues, onChange }: WorkValuesRankingListProps) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const moveValue = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= workValues.length) return;
    const copy = [...workValues];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    onChange(copy);
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

    const copy = [...workValues];
    const [removed] = copy.splice(draggedIdx, 1);
    copy.splice(dropIdx, 0, removed);
    onChange(copy);

    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={labelCls}>Work Values — Drag &amp; Drop Priority Ranking</label>
      </div>
      <p className="text-xs text-slate-400 font-medium mb-3">
        Drag handles or use arrows to reorder values based on your personal priority.
      </p>

      <div className="space-y-2.5">
        {workValues.map((val, idx) => {
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
                  disabled={idx === workValues.length - 1}
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
  );
}
