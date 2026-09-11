import { env } from '../../lib/env';
import { EmailOptions } from './email-transport.service';
import { EmailCandidateService } from './email-candidate.service';
import {
  buildWelcomeHREmail,
  buildMemberInviteEmail,
  buildHRAlertEmail,
  buildOfferResponseAlertEmail,
  buildProctoringAnomalyAlertEmail,
} from '../../lib/email/templates';

export type { EmailOptions };

export class EmailService extends EmailCandidateService {
  public async sendWelcomeHR(toEmail: string, recruiterName: string, orgName?: string): Promise<boolean> {
    const appUrl = env('APP_URL');
    const dashboardUrl = `${appUrl}/hr/dashboard`;
    const email = buildWelcomeHREmail({ name: recruiterName, orgName, dashboardUrl });
    return this.sendEmail({ to: toEmail, ...email });
  }

  public async sendMemberInvite(
    toEmail: string,
    organizationId: string,
    invitedByEmail?: string,
    organizationName?: string
  ): Promise<boolean> {
    const appUrl = env('APP_URL');
    const inviteUrl = `${appUrl}/hr/dashboard?org=${organizationId}`;
    const email = buildMemberInviteEmail({
      inviteUrl,
      organizationName,
      invitedByEmail,
    });
    return this.sendEmail({ to: toEmail, ...email });
  }

  public async sendHRHoldAlert(
    hrEmails: string[],
    candidateName: string,
    applicationId: string,
    confidence: number
  ): Promise<boolean> {
    const appUrl = env('APP_URL');
    const reviewUrl = `${appUrl}/hr/candidates?status=hold_for_review`;
    const email = buildHRAlertEmail({
      candidateName,
      applicationId,
      confidence,
      reviewUrl,
    });
    const promises = hrEmails.map((emailAddress) =>
      this.sendEmail({ to: emailAddress, ...email })
    );
    const results = await Promise.all(promises);
    return results.every(Boolean);
  }

  public async sendOfferResponseAlert(
    hrEmails: string[],
    candidateName: string,
    candidateEmail: string,
    jobTitle: string,
    status: 'accepted' | 'declined',
    applicationId: string,
    reason?: string
  ): Promise<boolean> {
    const appUrl = env('APP_URL');
    const reviewUrl = `${appUrl}/hr/candidates/${applicationId}`;
    const email = buildOfferResponseAlertEmail({
      candidateName,
      candidateEmail,
      jobTitle,
      status,
      reason,
      reviewUrl,
    });
    const promises = hrEmails.map((emailAddress) =>
      this.sendEmail({ to: emailAddress, ...email })
    );
    const results = await Promise.all(promises);
    return results.every(Boolean);
  }

  public async sendProctoringAnomalyAlert(
    hrEmails: string[],
    candidateName: string,
    jobTitle: string,
    applicationId: string,
    interviewId: string,
    anomalyDescription: string
  ): Promise<boolean> {
    const appUrl = env('APP_URL');
    const reviewUrl = `${appUrl}/hr/candidates/${applicationId}`;
    const email = buildProctoringAnomalyAlertEmail({
      candidateName,
      jobTitle,
      applicationId,
      interviewId,
      anomalyDescription,
      reviewUrl,
    });
    const promises = hrEmails.map((emailAddress) =>
      this.sendEmail({ to: emailAddress, ...email })
    );
    const results = await Promise.all(promises);
    return results.every(Boolean);
  }
}

export const emailService = new EmailService();
