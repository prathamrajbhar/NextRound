import { prisma } from '@nextround/database';
import { enqueueScheduling } from './queues/scheduling.queue';

type JobLike = {
  assessmentConfig?: unknown;
  thresholds?: unknown;
  stages?: unknown;
  title: string;
  org_id?: string | null;
};

/**
 * Statuses that are already past the assessment phase. A late/retried modality
 * result must never regress an application out of these.
 */
export const PAST_ASSESSMENT: string[] = [
  'interview_scheduled',
  'interviewed',
  'evaluation',
  'hr_round',
  'decided',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function boolFlag(cfg: Record<string, unknown>, key: string, fallback: boolean): boolean {
  if (typeof cfg[key] === 'boolean') return cfg[key];
  return fallback;
}

/**
 * Enabled assessment modalities are driven by Job config toggles
 * (aptitude_enabled / coding_enabled).
 * Missing flags default to enabled so the pipeline always moves forward.
 */
function enabledModalities(job: JobLike): { aptitude: boolean; coding: boolean } {
  const cfg = isObject(job.assessmentConfig) ? job.assessmentConfig : {};
  const thr = isObject(job.thresholds) ? job.thresholds : {};
  return {
    aptitude: boolFlag(cfg, 'aptitude_enabled', true) || boolFlag(thr, 'aptitude_enabled', false),
    coding: boolFlag(cfg, 'coding_enabled', true) || boolFlag(thr, 'coding_enabled', false),
  };
}

/**
 * Create the Interview record for an application (if missing) and enqueue the
 * Scheduler Agent to generate 3 interview slots. Idempotent-safe: later
 * POST /schedule calls update the same interview via the application_id upsert.
 */
export async function ensureInterviewAndSchedule(
  applicationId: string
): Promise<{ interviewId: string | null }> {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        include: {
          organization: { select: { id: true, settings: true } },
        },
      },
      interview: true,
      candidate: { include: { user: true } },
    },
  });
  if (!app) return { interviewId: null };

  let interview = app.interview;
  if (!interview) {
    interview = await prisma.interview.create({
      data: {
        application_id: applicationId,
        status: 'scheduled',
      },
    });
  }

  const candidateEmail = app.candidate?.user?.email ?? '';

  // Pass the org's real availability-hours config (written by the company
  // onboarding "Scheduling & Automation" step) so the Scheduler Agent drives
  // slot times from it. Both the camelCase key the UI writes and the
  // snake_case variant from the specs are honored. When absent the agent uses
  // honest default business-hours slots (never hardcoded strings).
  const orgSettings = isObject(app.job.organization?.settings) ? app.job.organization.settings : {};
  const availabilityHours = isObject(orgSettings.availabilityHours)
    ? (orgSettings.availabilityHours as Record<string, unknown>)
    : isObject(orgSettings.availability_hours)
    ? (orgSettings.availability_hours as Record<string, unknown>)
    : undefined;

  await enqueueScheduling(applicationId, {
    interviewId: interview.id,
    candidateEmail,
    jobTitle: app.job.title,
    orgId: app.job.org_id ?? undefined,
    availabilityHours,
    action: 'generate_slots',
  }).catch((err) => {
    console.error(`Failed to enqueue scheduling for application ${applicationId}:`, err);
  });

  return { interviewId: interview.id };
}

/**
 * After an assessment modality passes, check whether ALL enabled assessment
 * modalities for the job are complete. When they are, create/ensure the
 * Interview and advance the application to `interview_scheduled` (making the
 * Interview stage reachable). Returns the new status, or null to leave status
 * unchanged (assessment phase still in progress).
 */
export async function advanceAssessmentStage(applicationId: string): Promise<string | null> {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true, interview: true, evaluations: true },
  });
  if (!app) return null;

  const current = app.status;
  if (PAST_ASSESSMENT.includes(current)) return current;

  const enabled = enabledModalities(app.job as JobLike);
  const evalRow = app.evaluations?.[0];

  const aptitudeDone = evalRow != null && typeof evalRow.aptitude_score === 'number';
  const codingDone = evalRow != null && typeof evalRow.coding_score === 'number';

  const allDone =
    (enabled.aptitude ? aptitudeDone : true) &&
    (enabled.coding ? codingDone : true);

  if (!allDone) return null;

  const { interviewId } = await ensureInterviewAndSchedule(applicationId);
  const next = interviewId ? 'interview_scheduled' : 'screening_completed';
  await prisma.application.update({ where: { id: applicationId }, data: { status: next } });
  return next;
}
