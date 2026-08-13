'use client';

import React from 'react';
import { Check } from '@/lib/lucide-google-icons';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

export function FormattedMarkdown({ content, className = '' }: FormattedMarkdownProps) {
  if (!content) return null;

  
  const preprocessed = content
    
    .replace(/([^\n])\s*(##+)/g, '$1\n\n$2')
    
    .replace(/(##+\s+[^*\n]+?)\s*(\*|-)\s+/g, '$1\n\n* ')
    
    .replace(/([^\n])\s*(\*|-)\s+/g, '$1\n* ');

  
  const rawBlocks = preprocessed.split(/\n\s*\n/);

  
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
          <em key={match.index} className="italic text-slate-800 dark:text-slate-200 font-semibold">
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
    <div className={`space-y-6 text-sm sm:text-[15px] leading-relaxed sm:leading-loose text-slate-700 dark:text-slate-300 ${className}`}>
      {rawBlocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        
        if (trimmed.startsWith('##')) {
          let rawHeading = trimmed.replace(/^##+\s*/, '').trim();
          let bodyAfterHeading = '';

          
          const wordCount = rawHeading.split(/\s+/).length;
          if (wordCount > 5) {
            const splitMatch = rawHeading.match(
              /^(About the Role|Key Responsibilities|Required Skills|Preferred Qualifications|What We Offer|Ideal Candidate|[A-Z][a-zA-Z0-9\s&/-]{2,30}?)(?:\s+([\s\S]+))?$/
            );
            if (splitMatch && splitMatch[2]) {
              rawHeading = splitMatch[1].trim();
              bodyAfterHeading = splitMatch[2].trim();
            }
          }

          return (
            <div key={bIdx} className="space-y-3.5 pt-3">
              <div className="flex items-center gap-2.5 border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight font-display">
                  {parseInline(rawHeading)}
                </h3>
              </div>

              {bodyAfterHeading && (
                bodyAfterHeading.startsWith('*') || bodyAfterHeading.startsWith('-') ? (
                  <BulletListBlock text={bodyAfterHeading} parseInline={parseInline} />
                ) : (
                  <p className="font-normal leading-relaxed text-slate-700 dark:text-slate-300">
                    {parseInline(bodyAfterHeading)}
                  </p>
                )
              )}
            </div>
          );
        }

        
        const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
        const hasBullets = lines.some((l) => l.startsWith('*') || l.startsWith('-'));

        if (hasBullets) {
          return <BulletListBlock key={bIdx} text={trimmed} parseInline={parseInline} />;
        }

        
        return (
          <p key={bIdx} className="font-normal leading-relaxed text-slate-700 dark:text-slate-300">
            {parseInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}


function BulletListBlock({
  text,
  parseInline,
}: {
  text: string;
  parseInline: (t: string) => React.ReactNode[];
}) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  return (
    <div className="space-y-2.5 py-1">
      {lines.map((line, lIdx) => {
        const isBullet = line.startsWith('*') || line.startsWith('-');
        const cleanLine = isBullet ? line.replace(/^(\*|-)\s*/, '') : line;

        if (!cleanLine) return null;

        if (isBullet) {
          return (
            <div key={lIdx} className="flex items-start gap-3 pl-1">
              <div className="h-5 w-5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5 shadow-xs">
                <Check className="h-3 w-3" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                {parseInline(cleanLine)}
              </span>
            </div>
          );
        }

        return (
          <p key={lIdx} className="font-normal leading-relaxed text-slate-700 dark:text-slate-300">
            {parseInline(cleanLine)}
          </p>
        );
      })}
    </div>
  );
}
