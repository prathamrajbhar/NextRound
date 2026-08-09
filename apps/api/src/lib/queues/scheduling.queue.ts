import { schedulingQueue, DEFAULT_JOB_OPTIONS } from '../bullmq';

export interface SchedulingJobPayload {
  applicationId: string;
  interviewId?: string;
  candidateEmail?: string;
  jobTitle?: string;
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

  const job = await schedulingQueue.add('schedule_negotiation', payload, DEFAULT_JOB_OPTIONS);

  return job;
}
