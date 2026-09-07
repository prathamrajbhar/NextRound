import { Application, AssessmentResult, Job, Offer, OnboardingRecord } from '@/types';
import { Gift, ClipboardCheck, UserPlus, Sparkles } from '@/lib/lucide-google-icons';

export function buildApplicationStages(
  app: Application,
  job?: Job | null,
  assessments: AssessmentResult[] = []
) {
  const isScreenedDone = [
    'screening_completed',
    'assessment',
    'interview_scheduled',
    'interviewed',
    'voice_screen',
    'evaluation',
    'hr_round',
    'decided',
    'offered',
    'accepted',
    'hired',
  ].includes(app.status);

  const isAssessmentDone =
    [
      'interview_scheduled',
      'interviewed',
      'voice_screen',
      'evaluation',
      'hr_round',
      'decided',
      'offered',
      'accepted',
      'hired',
    ].includes(app.status) || assessments.some((a) => a.status === 'completed');

  const isInterviewDone = [
    'interviewed',
    'voice_screen',
    'evaluation',
    'hr_round',
    'decided',
    'offered',
    'accepted',
    'hired',
  ].includes(app.status);

  const isHrRoundDone =
    app.hrRoundStatus === 'PASSED' ||
    ['decided', 'offered', 'accepted', 'hired'].includes(app.status);

  const isDecisionDone = ['decided', 'offered', 'accepted', 'hired', 'rejected'].includes(
    app.status
  );

  return [
    {
      name: 'Applied',
      desc: 'Application received and resume queue matching active.',
      date: app.appliedDate,
      done: true,
    },
    (!job?.stages || job.stages.includes('screening')) && {
      name: 'Screened',
      desc: 'AI Screening Agent completed parsing and qualification matching.',
      date: isScreenedDone ? app.appliedDate : '',
      done: isScreenedDone,
    },
    (!job?.stages || job.stages.includes('assessment')) && {
      name: 'Assessment',
      desc: 'Completed Aptitude Test & Coding Assessment module.',
      date: isAssessmentDone ? assessments[0]?.completedDate || app.appliedDate : '',
      done: isAssessmentDone,
    },
    (!job?.stages || job.stages.includes('voice_screen')) && {
      name: 'Interview',
      desc: 'Completed voice conversational session with Interviewer Agent.',
      date: isInterviewDone ? app.appliedDate : '',
      done: isInterviewDone,
    },
    (!job?.stages || job.stages.includes('panel') || job.stages.includes('hr_round')) && {
      name: 'HR Round',
      desc: 'Live 1:1 human video call evaluation with HR representative.',
      date: isHrRoundDone
        ? app.hrRoundCompletedAt || app.hrRoundScheduledAt || app.appliedDate
        : app.hrRoundScheduledAt || '',
      done: isHrRoundDone,
    },
    {
      name: 'Decision',
      desc: 'Final structured scoring compiled. Outcome determined.',
      date: isDecisionDone ? app.appliedDate : '',
      done: isDecisionDone,
    },
  ].filter(Boolean) as { name: string; desc: string; date: string; done: boolean }[];
}

export function buildApplicationNextSteps(params: {
  app: Application;
  job?: Job | null;
  assessments: AssessmentResult[];
  offer?: Offer | null;
  onboarding?: OnboardingRecord | null;
}) {
  const { app, job, assessments, offer, onboarding } = params;
  const isDecisionDone = ['decided', 'offered', 'accepted', 'hired', 'rejected'].includes(
    app.status
  );

  const allNextSteps = [
    (app.status === 'applied' || app.status === 'screening') &&
      (!job?.stages || job.stages.includes('screening')) && {
        icon: Sparkles,
        label: 'AI Resume Screening',
        desc: 'Your application has been received. Click to run AI qualification matching.',
        href: '#',
        isScreeningModal: true,
        tone: 'indigo' as const,
        badge: 'In Progress',
      },

    (app.status === 'screening_completed' || app.status === 'assessment') &&
      (!job?.stages || job.stages.includes('assessment')) && {
        icon: ClipboardCheck,
        label: 'Aptitude Assessment',
        desc:
          assessments[0]?.status === 'completed'
            ? `Completed — Score: ${assessments[0].overallScore != null ? `${assessments[0].overallScore}%` : 'Completed'}`
            : 'Continue your timed assessment',
        href: `/candidate/applications/${app.id}/assessment`,
        tone: 'indigo' as const,
        badge: assessments[0]?.status === 'completed' ? 'Completed' : 'Pending',
      },

    offer &&
      isDecisionDone && {
        icon: Gift,
        label: 'Review Your Offer',
        desc: `${offer.status === 'accepted' ? 'Accepted' : 'Action needed'} — ${offer.baseSalary} base salary`,
        href: `/candidate/applications/${app.id}/offer`,
        tone: 'emerald' as const,
        badge: offer.status === 'accepted' ? 'Completed' : 'Action Required',
      },

    onboarding &&
      isDecisionDone && {
        icon: UserPlus,
        label: 'Onboarding Checklist',
        desc: `${onboarding.progressPercent}% complete — starts ${onboarding.startDate}`,
        href: `/candidate/applications/${app.id}/onboarding`,
        tone: 'emerald' as const,
        badge: `${onboarding.progressPercent}%`,
      },
  ].filter(Boolean) as {
    icon: typeof Gift;
    label: string;
    desc: string;
    href: string;
    isScreeningModal?: boolean;
    tone: 'emerald' | 'indigo' | 'purple' | 'amber';
    badge: string;
  }[];

  const completedBadges = ['Completed', 'Graded'];
  const firstIncomplete = allNextSteps.find((s) => !completedBadges.includes(s.badge));
  return firstIncomplete ? [firstIncomplete] : [];
}
