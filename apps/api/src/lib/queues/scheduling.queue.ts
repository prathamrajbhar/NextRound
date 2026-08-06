import { schedulingQueue } from '../bullmq';

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

  const job = await schedulingQueue.add('schedule_negotiation', payload, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  });

  return job;
}
