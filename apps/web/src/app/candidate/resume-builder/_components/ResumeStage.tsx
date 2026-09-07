'use client';

import React from 'react';
import { ATSResumeData } from '@/types';
import { ResumeSidebar } from './ResumeSidebar';
import { ResumeDocumentPreview } from './ResumeDocumentPreview';

interface ResumeStageProps {
  resumeData: ATSResumeData;
  selectedTemplate: 'classic' | 'modern' | 'executive';
  setSelectedTemplate: (val: 'classic' | 'modern' | 'executive') => void;
  copiedText: boolean;
  onCopyResumeText: () => void;
  onRestart: () => void;
}

export function ResumeStage({
  resumeData,
  selectedTemplate,
  setSelectedTemplate,
  copiedText,
  onCopyResumeText,
  onRestart,
}: ResumeStageProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <ResumeSidebar
        resumeData={resumeData}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        copiedText={copiedText}
        onCopyResumeText={onCopyResumeText}
        onRestart={onRestart}
      />
      <ResumeDocumentPreview resumeData={resumeData} />
    </div>
  );
}
