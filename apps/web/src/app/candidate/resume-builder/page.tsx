'use client';

import React, { useState, useEffect, useRef } from 'react';
import { mockDynamicTurns, mockGeneratedResume, ATSResumeData } from '@/lib/mockData/resumeBuilder';
import { SetupStage } from './_components/SetupStage';
import { InterviewStage } from './_components/InterviewStage';
import { ResumeStage } from './_components/ResumeStage';

type Stage = 'setup' | 'interview' | 'resume';

export default function AIResumeBuilderPage() {
  const [stage, setStage] = useState<Stage>('setup');

  // Setup Form
  const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Senior (5+ Years)');

  // Production Interview Call State
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);

  const [turnIndex, setTurnIndex] = useState(0);
  const [aiState, setAiState] = useState<'speaking' | 'listening' | 'evaluating'>('speaking');
  const [candidateSpeechText, setCandidateSpeechText] = useState('');
  const [isSimulatingSpeech, setIsSimulatingSpeech] = useState(false);
  const [extractedInsights, setExtractedInsights] = useState<
    { type: string; label: string; value: string }[]
  >([]);

  // Live Extracted Points Drawer Toggle
  const [showInsightsDrawer, setShowInsightsDrawer] = useState(false);

  // Resume State
  const [resumeData] = useState<ATSResumeData>(mockGeneratedResume);
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'modern' | 'executive'>('classic');
  const [copiedText, setCopiedText] = useState(false);

  // Video Ref for Local WebCam Feed
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentTurn = mockDynamicTurns[turnIndex] || mockDynamicTurns[mockDynamicTurns.length - 1];

  // Webcam activation effect during interview stage
  useEffect(() => {
    if (stage !== 'interview' || !camActive) return;

    let localStream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        localStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        // Fallback to avatar if webcam is not available
      });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stage, camActive]);

  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerRunning, timeRemaining]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = () => {
    setStage('interview');
    setTimeRemaining(900);
    setIsTimerRunning(true);
    setTurnIndex(0);
    setAiState('speaking');
    setExtractedInsights(mockDynamicTurns[0].extractedInsights);

    setTimeout(() => {
      setAiState('listening');
    }, 3000);
  };

  const handleSimulateCandidateAnswer = () => {
    if (isSimulatingSpeech || aiState === 'speaking') return;

    setIsSimulatingSpeech(true);
    setCandidateSpeechText('Speaking response...');

    setTimeout(() => {
      setCandidateSpeechText(currentTurn.simulatedUserAnswer);
      setIsSimulatingSpeech(false);
      setAiState('evaluating');

      if (currentTurn.extractedInsights) {
        setExtractedInsights(prev => [...prev, ...currentTurn.extractedInsights]);
      }

      setTimeout(() => {
        const nextIdx = turnIndex + 1;
        if (nextIdx < mockDynamicTurns.length) {
          setTurnIndex(nextIdx);
          setCandidateSpeechText('');
          setAiState('speaking');
          setTimeout(() => setAiState('listening'), 3200);
        } else {
          handleEndCall();
        }
      }, 1500);
    }, 1800);
  };

  const handleEndCall = () => {
    setIsTimerRunning(false);
    setStage('resume');
  };

  const handleCopyResumeText = () => {
    const fullText = `${resumeData.name}\n${resumeData.title} | ${resumeData.email} | ${resumeData.phone}\n${resumeData.location}\n\nSUMMARY\n${resumeData.summary}\n\nEXPERIENCE\n` +
      resumeData.experience.map(e => `${e.role} - ${e.company} (${e.period})\n` + e.highlights.map(h => `• ${h}`).join('\n')).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between pb-12 animate-in fade-in duration-300">
      {stage === 'setup' && (
        <SetupStage
          targetRole={targetRole}
          setTargetRole={setTargetRole}
          experienceLevel={experienceLevel}
          setExperienceLevel={setExperienceLevel}
          onStartCall={handleStartCall}
        />
      )}

      {stage === 'interview' && (
        <InterviewStage
          targetRole={targetRole}
          experienceLevel={experienceLevel}
          timeRemaining={timeRemaining}
          formatTimer={formatTimer}
          showInsightsDrawer={showInsightsDrawer}
          setShowInsightsDrawer={setShowInsightsDrawer}
          extractedInsights={extractedInsights}
          aiState={aiState}
          currentTurn={currentTurn}
          videoRef={videoRef}
          camActive={camActive}
          setCamActive={setCamActive}
          micActive={micActive}
          setMicActive={setMicActive}
          isSimulatingSpeech={isSimulatingSpeech}
          candidateSpeechText={candidateSpeechText}
          onSimulateAnswer={handleSimulateCandidateAnswer}
          onEndCall={handleEndCall}
        />
      )}

      {stage === 'resume' && (
        <ResumeStage
          resumeData={resumeData}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          copiedText={copiedText}
          onCopyResumeText={handleCopyResumeText}
          onRestart={() => setStage('setup')}
        />
      )}
    </div>
  );
}

