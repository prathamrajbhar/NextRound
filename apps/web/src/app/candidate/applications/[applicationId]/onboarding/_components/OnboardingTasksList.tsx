'use client';

import React from 'react';
import { OnboardingRecord } from '@/types';
import { getCategoryColor } from './onboardingCategoryColor';

interface OnboardingTasksListProps {
  tasks: OnboardingRecord['tasks'];
  onToggleTask: (taskId: string) => void;
}

export function OnboardingTasksList({ tasks, onToggleTask }: OnboardingTasksListProps) {
  return (
    <div className="lg:col-span-2 space-y-4">
      <h3 className="text-xs font-bold text-slate-805">Your Checklist Items</h3>

      <div className="space-y-3">
        {tasks.map((task) => {
          const isCompleted = task.status === 'completed';
          return (
            <div
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer flex gap-3.5 items-start ${
                isCompleted
                  ? 'bg-slate-50 border-slate-200/60 opacity-70'
                  : 'bg-white/45 border-white/60 hover:bg-white/70 shadow-sm'
              }`}
            >
              <div
                className={`flex-shrink-0 mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-indigo-600 border-indigo-650 text-white'
                    : 'border-slate-300 bg-white/40 hover:border-slate-400'
                }`}
              >
                {isCompleted && <span className="text-[10px] font-bold">✓</span>}
              </div>

              <div className="min-w-0 flex-1">
                <span
                  className={`text-xs font-bold block ${
                    isCompleted ? 'text-slate-500 line-through' : 'text-slate-805'
                  }`}
                >
                  {task.title}
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span
                    className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${getCategoryColor(
                      task.category
                    )}`}
                  >
                    {task.category}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold">
                    Due: {task.dueDate} • Owner: {task.owner}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
