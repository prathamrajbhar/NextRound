'use client';

import React from 'react';
import UnifiedInterviewConsole, { UnifiedInterviewConsoleProps } from './UnifiedInterviewConsole';

/**
 * Backward compatibility alias wrapper around UnifiedInterviewConsole
 */
export default function InterviewActiveConsole(props: Omit<UnifiedInterviewConsoleProps, 'mode'>) {
  return <UnifiedInterviewConsole mode="ai-voice" {...props} />;
}
