import nodemailer from 'nodemailer';
import { env } from '../lib/env';
import { logger } from '../lib/logger';
import { enqueueEmail, EmailJobPayload } from '../lib/queues/email.queue';
import {
  buildWelcomeCandidateEmail,
  buildPasswordResetEmail,
  buildMemberInviteEmail,
  buildApplicationReceivedEmail,
  buildInterviewSchedulingEmail,
  buildOfferLetterEmail,
  buildConstructiveRejectionEmail,
  buildHRAlertEmail,
  buildAssessmentReminderEmail,
} from '../lib/email/templates';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  userId?: string;
  async?: boolean;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter(): void {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: port === 465,
        auth: { user, pass },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
      });
      this.isConfigured = true;
    } else {
      logger.child('Email').warn('SMTP configuration missing; outbound emails will not be delivered over network.');
    }
  }

  public async verifyConnection(): Promise<boolean> {
    if (!this.transporter) return false;
    try {
      await this.transporter.verify();
      logger.child('Email').info('SMTP transporter connection verified successfully.');
      return true;
    } catch (error) {
      logger.child('Email').error('SMTP transporter verification failed:', error);
      return false;
    }
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    if (options.async !== false) {
      try {
        await enqueueEmail({
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          userId: options.userId,
        });
        return true;
      } catch (err) {
        logger.child('Email').warn(`BullMQ enqueue failed for ${options.to}, falling back to synchronous send: ${err}`);
      }
    }

    return this.sendImmediate(options);
  }

  public async sendImmediate(options: EmailOptions): Promise<boolean> {
    try {
      const from = process.env.SMTP_FROM || 'NextRound <noreply@nextround.ai>';
      if (this.transporter) {
        await this.transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        });
        logger.child('Email').info(`Email delivered to ${options.to}: ${options.subject}`);
        return true;
      } else {
        logger.child('Email').error(`SMTP not configured; email to ${options.to} was NOT delivered (subject: ${options.subject}).`);
        return false;
      }
    } catch (error) {
      logger.child('Email').error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  public async sendWelcomeCandidate(toEmail: string, candidateName: string): Promise<boolean> {
    const appUrl = env('APP_URL');
    const loginUrl = `${appUrl}/login`;
    const email = buildWelcomeCandidateEmail({ name: candidateName, loginUrl });
    return this.sendEmail({ to: toEmail, ...email });
  }

  public async sendPasswordReset(toEmail: string, resetUrl: string, expiresInHours = 1): Promise<boolean> {
    const email = buildPasswordResetEmail({ resetUrl, expiresInHours });
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
    const promises = hrEmails.map((emailAddr) =>
      this.sendEmail({ to: emailAddr, ...email })
    );
    const results = await Promise.all(promises);
    return results.every(Boolean);
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
}

export const emailService = new EmailService();
