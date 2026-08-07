'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';
import { ATSResumeData, DynamicConversationTurn } from '@/types';
import { SetupStage } from './_components/SetupStage';
import { InterviewStage } from './_components/InterviewStage';
import { ResumeStage } from './_components/ResumeStage';

const DEFAULT_DYNAMIC_TURNS: DynamicConversationTurn[] = [
  {
    id: 1,
    aiMessage: "Welcome! To tailor your resume, let's start with your background. Can you describe a complex technical project you led recently?",
    topicTag: 'Technical Architecture & Leadership',
    simulatedUserAnswer: 'I architected a high-throughput micro-services pipeline handling 50k requests/sec using Node.js, Kafka, and Redis.',
    extractedInsights: [
      { type: 'Skill', label: 'Tech Stack', value: 'Node.js, Kafka, Redis' },
      { type: 'Metric', label: 'Scale', value: '50k req/sec throughput' },
    ],
  },
  {
    id: 2,
    aiMessage: "Great scale! How did you optimize frontend performance and state management in that project?",
    topicTag: 'Frontend Optimization',
    simulatedUserAnswer: 'I implemented Virtual Scrolling with react-window and leveraged Server-Sent Events for real-time dashboard updates.',
    extractedInsights: [
      { type: 'Experience', label: 'Frontend Strategy', value: 'Virtualization & SSE streaming' },
    ],
  },
];

const DEFAULT_GENERATED_RESUME: ATSResumeData = {
  name: 'Candidate User',
  title: 'Senior Full Stack Engineer',
  email: 'candidate@example.com',
  phone: '+1 (555) 019-2834',
  location: 'San Francisco, CA',
  linkedin: 'linkedin.com/in/candidate',
  github: 'github.com/candidate',
  portfolio: 'candidate.dev',
  summary: 'Senior Full Stack Engineer with 6+ years of experience architecting high-availability distributed web applications and cloud services.',
  atsScore: 94,
  scoreBreakdown: [
    { label: 'Keyword Relevance', score: 96, description: 'Matches 96% of core target role requirements' },
    { label: 'Impact Metrics', score: 92, description: 'Includes quantified business & engineering metrics' },
    { label: 'Formatting & Structure', score: 95, description: 'Clean single-column ATS-parsable format' },
  ],
  experience: [
    {
      company: 'TechCorp',
      role: 'Senior Full Stack Engineer',
      location: 'San Francisco, CA',
      period: '2022 - Present',
      highlights: [
        'Architected real-time streaming pipeline processing 50k req/sec with zero downtime',
        'Reduced frontend bundle sizes by 38% through route splitting and dynamic imports',
      ],
    },
  ],
  projects: [
    {
      title: 'Distributed Queue Engine',
      techStack: ['TypeScript', 'Node.js', 'Redis'],
      description: 'Built high-concurrency background job processing system with retry strategies.',
      impact: 'Reduced background task processing latency by 60%',
    },
  ],
  skills: [
    { category: 'Languages', items: ['TypeScript', 'JavaScript', 'Python', 'SQL'] },
    { category: 'Frameworks', items: ['React', 'Next.js', 'Node.js', 'Express', 'Tailwind CSS'] },
  ],
  education: [
    { degree: 'B.S. in Computer Science', institution: 'University of California, Berkeley', year: '2020', gpa: '3.8' },
  ],
  certifications: ['AWS Certified Solutions Architect'],
};

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

  // Dynamic Turns State
  const [dynamicTurns] = useState<DynamicConversationTurn[]>(DEFAULT_DYNAMIC_TURNS);

  // Resume State
  const [resumeData] = useState<ATSResumeData>(DEFAULT_GENERATED_RESUME);
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'modern' | 'executive'>('classic');
  const [copiedText, setCopiedText] = useState(false);

  // Video Ref for Local WebCam Feed
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentTurn = dynamicTurns[turnIndex] || dynamicTurns[dynamicTurns.length - 1];

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

  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleStartCall = async () => {
    setStage('interview');
    setTimeRemaining(900);
    setIsTimerRunning(true);
    setTurnIndex(0);
    setAiState('speaking');
    setExtractedInsights(dynamicTurns[0].extractedInsights);

    try {
      const res = await apiClient.post<{ sessionId: string }>('/resume-builder/sessions', {
        targetRole,
        experienceLevel,
      });
      if (res?.sessionId) {
        setSessionId(res.sessionId);
      }
    } catch (err) {
      console.error('Failed to create resume builder session:', err);
    }

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
        if (nextIdx < dynamicTurns.length) {
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

  const handleEndCall = async () => {
    setIsTimerRunning(false);
    setStage('resume');
    if (sessionId) {
      try {
        await apiClient.post(`/resume-builder/${sessionId}/end`, {
          transcript: dynamicTurns.map((t) => ({
            role: 'candidate',
            text: t.simulatedUserAnswer,
          })),
        });
      } catch (err) {
        console.error('Failed to end resume builder session:', err);
      }
    }
  };

  const handleCopyResumeText = () => {
    const fullText = `${resumeData.name}\n${resumeData.title} | ${resumeData.email} | ${resumeData.phone}\n${resumeData.location}\n\nSUMMARY\n${resumeData.summary}\n\nEXPERIENCE\n` +
      resumeData.experience.map(e => `${e.role} - ${e.company} (${e.period})\n` + e.highlights.map(h => `• ${h}`).join('\n')).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between pb-2 animate-in fade-in duration-300">
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
          aiState={aiState}
          currentTurn={currentTurn}
          videoRef={videoRef}
          camActive={camActive}
          setCamActive={setCamActive}
          micActive={micActive}
          setMicActive={setMicActive}
          candidateSpeechText={candidateSpeechText}
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

