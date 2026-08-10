import { schedulingQueue, JOB_NAMES, DEFAULT_JOB_OPTIONS } from '../bullmq';

export interface SchedulingJobPayload {
  applicationId: string;
  interviewId?: string;
  candidateEmail?: string;
  jobTitle?: string;
  orgId?: string;
  availabilityHours?: Record<string, unknown>;
  action?: 'generate_slots' | 'confirm_slot' | 'reschedule';
  requestedSlot?: string;
}

export async function enqueueScheduling(
  applicationId: string,
  payloadData?: Partial<SchedulingJobPayload>
) {
  const payload: SchedulingJobPayload = {
    applicationId,
    action: 'generate_slots',
    ...payloadData,
  };

  const job = await schedulingQueue.add(JOB_NAMES.scheduling, payload, DEFAULT_JOB_OPTIONS);

  return job;
}
