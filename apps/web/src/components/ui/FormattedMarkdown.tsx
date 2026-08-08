'use client';

import React from 'react';
import { Check } from '@/lib/lucide-google-icons';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

export function FormattedMarkdown({ content, className = '' }: FormattedMarkdownProps) {
  if (!content) return null;

  // 1. Normalize string: insert linebreaks before headings (##) and bullet points (* or -) if they lack newlines
  const normalized = content
    .replace(/([^\n])\s*(##+)/g, '$1\n\n$2')
    .replace(/([^\n])\s*(\*|-)\s+/g, '$1\n* ');

  // 2. Split content into blocks by double newlines or heading boundaries
  const rawBlocks = normalized.split(/\n\s*\n/);

  // Helper to parse inline markdown (bold **text**, italic *text*)
  const parseInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.substring(lastIdx, match.index));
      }
      const matchedStr = match[0];
      if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-extrabold text-slate-900 dark:text-slate-100">
            {matchedStr.slice(2, -2)}
          </strong>
        );
      } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
        parts.push(
          <em key={match.index} className="italic text-slate-800 dark:text-slate-200">
            {matchedStr.slice(1, -1)}
          </em>
        );
      }
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }

    return parts;
  };

  return (
    <div className={`space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300 ${className}`}>
      {rawBlocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Heading 2 or Heading 3
        if (trimmed.startsWith('##')) {
          const headingText = trimmed.replace(/^##+\s*/, '');
          return (
            <div key={bIdx} className="pt-3 pb-1 border-b border-slate-200/60 dark:border-slate-800/80 first:pt-0">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-display">
                {parseInline(headingText)}
              </h3>
            </div>
          );
        }

        // Bullet points block (lines starting with * or -)
        const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
        const isBulletBlock = lines.every((l) => l.startsWith('*') || l.startsWith('-'));

        if (isBulletBlock || lines.some((l) => l.startsWith('*') || l.startsWith('-'))) {
          return (
            <div key={bIdx} className="space-y-2 py-1">
              {lines.map((line, lIdx) => {
                const isBullet = line.startsWith('*') || line.startsWith('-');
                const cleanLine = isBullet ? line.replace(/^(\*|-)\s*/, '') : line;

                if (!cleanLine) return null;

                if (isBullet) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2.5 pl-1">
                      <div className="h-4 w-4 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-900/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        {parseInline(cleanLine)}
                      </span>
                    </div>
                  );
                }

                return (
                  <p key={lIdx} className="font-normal leading-relaxed">
                    {parseInline(cleanLine)}
                  </p>
                );
              })}
            </div>
          );
        }

        // Normal paragraph
        return (
          <p key={bIdx} className="font-normal leading-relaxed text-slate-700 dark:text-slate-300">
            {parseInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
