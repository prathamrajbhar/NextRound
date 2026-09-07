import { env } from '../../lib/env';
import { EmailTransportService } from './email-transport.service';
import {
  buildWelcomeCandidateEmail,
  buildPasswordResetEmail,
  buildApplicationReceivedEmail,
  buildInterviewSchedulingEmail,
  buildOfferLetterEmail,
  buildConstructiveRejectionEmail,
  buildAssessmentReminderEmail,
  buildInterviewConfirmationEmail,
} from '../../lib/email/templates';

export class EmailCandidateService extends EmailTransportService {
  public async sendWelcomeCandidate(toEmail: string, candidateName: string): Promise<boolean> {
    const appUrl = env('APP_URL');
    const dashboardUrl = `${appUrl}/candidate/dashboard`;
    const email = buildWelcomeCandidateEmail({ name: candidateName, loginUrl: dashboardUrl });
    return this.sendEmail({ to: toEmail, ...email });
  }

  public async sendPasswordReset(toEmail: string, resetUrl: string, expiresInHours = 1): Promise<boolean> {
    const email = buildPasswordResetEmail({ resetUrl, expiresInHours });
    return this.sendEmail({ to: toEmail, ...email });
  }

  public async sendApplicationReceived(
    toEmail: string,
    candidateName: string,
    jobTitle: string,
    orgName = 'NextRound Hiring Network'
  ): Promise<boolean> {
    const appUrl = env('APP_URL');
    const dashboardUrl = `${appUrl}/candidate/dashboard`;
    const email = buildApplicationReceivedEmail({
      candidateName,
      jobTitle,
      orgName,
      dashboardUrl,
    });
    return this.sendEmail({ to: toEmail, ...email });
  }

  public async sendRejectionEmail(
    toEmail: string,
    candidateName: string,
    jobTitle: string,
    gapAnalysis?: { missing_skills?: string[]; experience_gaps?: string[]; feedback?: string } | Record<string, unknown> | unknown,
    rejectionFeedback?: string
  ): Promise<boolean> {
    const appUrl = env('APP_URL');
    const prepUrl = `${appUrl}/candidate/mock/new`;
    const missingSkills = (gapAnalysis as Record<string, unknown>)?.missing_skills || (gapAnalysis as Record<string, unknown>)?.gaps || [];
    const feedbackText =
      rejectionFeedback ||
      (gapAnalysis as Record<string, unknown>)?.feedback as string ||
      'Thank you for taking the time to interview with us. While your qualifications are impressive, we have chosen to move forward with candidates whose experience more closely aligns with our current technical requirements.';

    const email = buildConstructiveRejectionEmail({
      candidateName,
      jobTitle,
      rejectionFeedback: feedbackText,
      gaps: Array.isArray(missingSkills) ? (missingSkills as string[]) : undefined,
      prepUrl,
    });
    return this.sendEmail({ to: toEmail, ...email });
  }

  public async sendSchedulingSlots(
    toEmail: string,
    candidateName: string,
    jobTitle: string,
    slots: Array<{ date: string; time: string; link?: string }>
  ): Promise<boolean> {
    const appUrl = env('APP_URL');
    const portalUrl = `${appUrl}/candidate/dashboard`;
    const email = buildInterviewSchedulingEmail({
      candidateName,
      jobTitle,
      slots,
      portalUrl,
    });
    return this.sendEmail({ to: toEmail, ...email });
  }

  public async sendOfferEmail(
    toEmail: string,
    candidateName: string,
    jobTitle: string,
    offer: { salary: number; equity?: string; magicLinkToken: string }
  ): Promise<boolean> {
    const appUrl = env('APP_URL');
    const signUrl = `${appUrl}/candidate/applications/offer?token=${offer.magicLinkToken}`;
    const email = buildOfferLetterEmail({
      candidateName,
      jobTitle,
      salary: offer.salary,
      equity: offer.equity,
      signUrl,
    });
    return this.sendEmail({ to: toEmail, ...email });
  }

  public async sendConstructiveRejection(
    toEmail: string,
    candidateName: string,
    jobTitle: string,
    gaps: string[],
    rejectionFeedback: string
  ): Promise<boolean> {
    const appUrl = env('APP_URL');
    const prepUrl = `${appUrl}/candidate/mock/new`;
    const email = buildConstructiveRejectionEmail({
      candidateName,
      jobTitle,
      rejectionFeedback,
      gaps,
      prepUrl,
    });
    return this.sendEmail({ to: toEmail, ...email });
  }

  public async sendAssessmentReminder(
    toEmail: string,
    candidateName: string,
    jobTitle: string,
    assessmentType: string,
    assessmentUrl: string,
    expiresInHours = 24
  ): Promise<boolean> {
    const email = buildAssessmentReminderEmail({
      candidateName,
      jobTitle,
      assessmentType,
      assessmentUrl,
      expiresInHours,
    });
    return this.sendEmail({ to: toEmail, ...email });
  }

  public async sendInterviewConfirmation(
    toEmail: string,
    candidateName: string,
    jobTitle: string,
    scheduledAt: string,
    applicationId: string
  ): Promise<boolean> {
    const appUrl = env('APP_URL');
    const sessionUrl = `${appUrl}/candidate/interview/${applicationId}`;
    const email = buildInterviewConfirmationEmail({
      candidateName,
      jobTitle,
      scheduledAt,
      sessionUrl,
    });
    return this.sendEmail({ to: toEmail, ...email });
  }
}
