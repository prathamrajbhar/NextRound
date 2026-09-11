import { Request, Response, NextFunction } from 'express';
import { Prisma, prisma } from '@nextround/database';
import { ProctoringFlagBodySchema } from '../../validators/interview.schemas';
import { findInterviewByRef } from './interviews.helpers';
import { emailService } from '../../services/email/email.service';
import { logger } from '../../lib/logger';

export async function recordProctoringFlag(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params['id']);
    const body = ProctoringFlagBodySchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ success: false, error: body.error.flatten() });
    }

    const interview = await findInterviewByRef({ idOrApplicationId: id });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview session not found' });
    }

    const existingFlags = Array.isArray(interview.proctor_flags)
      ? (interview.proctor_flags as Prisma.JsonValue[])
      : [];

    const newFlag = {
      timestamp: new Date().toISOString(),
      face_count: body.data.face_count ?? null,
      gaze_centered: body.data.gaze_centered ?? null,
      engagement_index: body.data.engagement_index ?? null,
      multiple_faces_detected: body.data.multiple_faces_detected ?? null,
      tab_switch_count: body.data.tab_switch_count ?? null,
    };

    const updatedFlags: Prisma.JsonValue[] = [...existingFlags, newFlag as Prisma.JsonValue];

    const updated = await prisma.interview.update({
      where: { id: interview.id },
      data: {
        proctor_flags: updatedFlags as Prisma.InputJsonValue,
        engagement_signal: {
          last_updated: newFlag.timestamp,
          latest_engagement: newFlag.engagement_index,
          total_events: updatedFlags.length,
        } as Prisma.InputJsonValue,
      },
      include: {
        application: {
          include: {
            job: { include: { organization: { include: { users: true } } } },
            candidate: { include: { user: true } },
          },
        },
      },
    });

    const isSevereAnomaly =
      Boolean(newFlag.multiple_faces_detected) ||
      (typeof newFlag.tab_switch_count === 'number' && newFlag.tab_switch_count >= 5) ||
      (newFlag.face_count === 0 && updatedFlags.length % 5 === 0);

    if (isSevereAnomaly && updated.application?.job?.organization?.users) {
      const hrEmails = updated.application.job.organization.users
        .filter((user) => user.role === 'hr')
        .map((user) => user.email);

      if (hrEmails.length > 0) {
        const candidateEmail = updated.application.candidate.user?.email || 'Candidate';
        const candidateName = candidateEmail.split('@')[0];
        const anomalyDescription = newFlag.multiple_faces_detected
          ? 'Multiple faces detected in camera frame during interview session'
          : typeof newFlag.tab_switch_count === 'number' && newFlag.tab_switch_count >= 5
          ? `Candidate exceeded browser tab switch limit (${newFlag.tab_switch_count} switches)`
          : 'Candidate face absent from video feed';

        emailService
          .sendProctoringAnomalyAlert(
            hrEmails,
            candidateName,
            updated.application.job.title,
            updated.application.id,
            updated.id,
            anomalyDescription
          )
          .catch((error) =>
            logger.child('Interviews').warn(`Failed to dispatch proctor anomaly alert:`, error)
          );
      }
    }

    return res.json({
      success: true,
      data: {
        interviewId: updated.id,
        proctor_flag_count: updatedFlags.length,
      },
    });
  } catch (error) {
    return next(error);
  }
}
