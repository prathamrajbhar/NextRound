import nodemailer from 'nodemailer';
import { env } from '../lib/env';
import { logger } from '../lib/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      logger.child('Email').warn('SMTP configuration missing; emails will not be sent.');
    }
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const from = process.env.SMTP_FROM;
      if (this.transporter) {
        await this.transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]+>/g, ''),
        });
        logger.child('Email').info(`Email sent to ${options.to}: "${options.subject}"`);
      } else {
        logger.child('Email').error(`SMTP not configured; email to ${options.to} was NOT delivered (subject: "${options.subject}").`);
        return false;
      }
      return true;

    } catch (error) {
      logger.child('Email').error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  public async sendMemberInvite(
    toEmail: string,
    organizationId: string,
    invitedByEmail?: string
  ): Promise<boolean> {
    const appUrl = env('APP_URL');
    const inviteUrl = `${appUrl}/hr/dashboard?org=${organizationId}`;
    const subject = 'You have been invited to an organization on NextRound / HireOS';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0f172a; margin-top: 0;">Organization Invitation</h2>
        <p>Hi there,</p>
        <p>You have been invited to join an organization on the NextRound / HireOS platform${invitedByEmail ? ` by <strong>${invitedByEmail}</strong>` : ''}.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block;">Sign in to NextRound</a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
          NextRound / HireOS • Team Management
        </p>
      </div>
    `;
    return this.sendEmail({ to: toEmail, subject, html });
  }

  public async sendApplicationReceived(
    toEmail: string,
    candidateName: string,
    jobTitle: string,
    orgName: string = 'HireOS Network'
  ): Promise<boolean> {
    const subject = `Application Received: ${jobTitle} at ${orgName}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #6366f1; margin-top: 0;">Application Received!</h2>
        <p>Hi <strong>${candidateName}</strong>,</p>
        <p>Thank you for applying for the position of <strong>${jobTitle}</strong> at <strong>${orgName}</strong>.</p>
        <p>Our autonomous hiring pipeline has received your application and resume. Your profile is currently undergoing initial screening against the job requirements.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
          <p style="margin: 0; font-size: 14px; color: #475569;">
            <strong>What happens next?</strong><br/>
            Our screening agent is reviewing your experience against the job rubric. You will receive an update as soon as the evaluation is complete.
          </p>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
          NextRound / HireOS • Zero-Human-Step Hiring Infrastructure
        </p>
      </div>
    `;
    return this.sendEmail({ to: toEmail, subject, html });
  }

  public async sendRejectionEmail(
    toEmail: string,
    candidateName: string,
    jobTitle: string,
    gapAnalysis?: { missing_skills?: string[]; experience_gaps?: string[]; feedback?: string } | any,
    rejectionFeedback?: string
  ): Promise<boolean> {
    const subject = `Application Update: ${jobTitle}`;

    const missingSkills = gapAnalysis?.missing_skills || gapAnalysis?.gaps || [];
    const feedbackText = rejectionFeedback || gapAnalysis?.feedback || 'Thank you for taking the time to apply. While your background is impressive, we have chosen to move forward with candidates whose experience more closely aligns with the technical requirements of this role.';

    const skillsHtml = Array.isArray(missingSkills) && missingSkills.length > 0
      ? `<div style="margin: 15px 0;">
           <strong>Areas for Growth / Technical Gaps Identified:</strong>
           <ul style="margin-top: 5px; color: #475569;">
             ${missingSkills.map((skill: string) => `<li>${skill}</li>`).join('')}
           </ul>
         </div>`
      : '';

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0f172a; margin-top: 0;">Update on your Application for ${jobTitle}</h2>
        <p>Hi <strong>${candidateName}</strong>,</p>
        <p>Thank you for your interest in the <strong>${jobTitle}</strong> position and for taking the time to share your background with us.</p>
        <p>${feedbackText}</p>

        ${skillsHtml}

        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #94a3b8;">
          <p style="margin: 0; font-size: 13px; color: #475569;">
            <strong>Automated Constructive Feedback Note:</strong><br/>
            We provide structured feedback to help candidates grow. You can practice and enhance your skill profile anytime using NextRound Candidate Prep &amp; Mock Sessions.
          </p>
        </div>

        <p>We wish you the very best in your job search and future professional endeavors.</p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
          NextRound / HireOS • Talent Team
        </p>
      </div>
    `;
    return this.sendEmail({ to: toEmail, subject, html });
  }

  public async sendSchedulingSlots(
    toEmail: string,
    candidateName: string,
    jobTitle: string,
    slots: Array<{ date: string; time: string; link?: string }>
  ): Promise<boolean> {
    const subject = `Invitation to Voice Assessment / Interview: ${jobTitle}`;

    const slotsHtml = slots.map((s) => `
      <li style="margin-bottom: 8px;">
        <strong>${s.date} at ${s.time}</strong>
        ${s.link ? ` — <a href="${s.link}" style="color: #6366f1; text-decoration: none;">Select Slot</a>` : ''}
      </li>
    `).join('');

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #10b981; margin-top: 0;">Congratulations! You've Passed Initial Screening</h2>
        <p>Hi <strong>${candidateName}</strong>,</p>
        <p>Great news! Your profile passed the initial AI screening for <strong>${jobTitle}</strong>. We would love to invite you to the next stage: the NextRound Autonomous Voice Assessment.</p>

        <div style="background-color: #ecfdf5; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #065f46;">
            Available Assessment Time Slots:
          </p>
          <ul style="margin: 0; padding-left: 20px; color: #047857;">
            ${slotsHtml}
          </ul>
        </div>

        <p>Please log in to your Candidate Portal to confirm your preferred time slot and review assessment instructions.</p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
          NextRound / HireOS • Autonomous Assessment Platform
        </p>
      </div>
    `;
    return this.sendEmail({ to: toEmail, subject, html });
  }

  public async sendOfferEmail(
    toEmail: string,
    candidateName: string,
    jobTitle: string,
    offer: { salary: number; equity?: string; magicLinkToken: string }
  ): Promise<boolean> {
    const appUrl = env('APP_URL');
    const signUrl = `${appUrl}/candidate/applications/offer?token=${offer.magicLinkToken}`;
    const subject = `Official Job Offer: ${jobTitle} at NextRound / HireOS`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #4f46e5; margin-top: 0;">Congratulations on your Offer!</h2>
        <p>Hi <strong>${candidateName}</strong>,</p>
        <p>We are thrilled to extend an official offer of employment for the <strong>${jobTitle}</strong> position!</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #cbd5e1;">
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong style="color: #334155;">Annual Base Salary:</strong> $${offer.salary.toLocaleString()}</p>
          ${offer.equity ? `<p style="margin: 0; font-size: 14px;"><strong style="color: #334155;">Equity Component:</strong> ${offer.equity}</p>` : ''}
        </div>
        <p>Please click below to review your formal contract details and digitally sign your offer:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${signUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block;">Review &amp; Sign Offer</a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
          NextRound / HireOS • Talent Acquisition &amp; Automated Contracting
        </p>
      </div>
    `;
    return this.sendEmail({ to: toEmail, subject, html });
  }

  public async sendConstructiveRejection(
    toEmail: string,
    candidateName: string,
    jobTitle: string,
    gaps: string[],
    rejectionFeedback: string
  ): Promise<boolean> {
    const appUrl = env('APP_URL');
    const mockConsoleUrl = `${appUrl}/candidate/mock/new`;
    const subject = `Application Update & Feedback: ${jobTitle}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #0f172a; margin-top: 0;">Update on your Application for ${jobTitle}</h2>
        <p>Hi <strong>${candidateName}</strong>,</p>
        <p>${rejectionFeedback}</p>
        ${
          gaps && gaps.length > 0
            ? `
          <div style="background-color: #fff1f2; padding: 16px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #f43f5e;">
            <strong style="color: #9f1239;">Target Areas for Technical Growth:</strong>
            <ul style="margin-top: 8px; color: #881337; padding-left: 20px;">
              ${gaps.map((g) => `<li>${g}</li>`).join('')}
            </ul>
          </div>
        `
            : ''
        }
        <p>We encourage you to practice on our Candidate Mock Interview platform to sharpen your skills for future openings:</p>
        <div style="margin: 20px 0;">
          <a href="${mockConsoleUrl}" style="color: #4f46e5; font-weight: bold; text-decoration: none;">Launch Candidate Prep Console &rarr;</a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
          NextRound / HireOS • Automated Candidate Development
        </p>
      </div>
    `;
    return this.sendEmail({ to: toEmail, subject, html });
  }

  public async sendHRHoldAlert(
    hrEmails: string[],
    candidateName: string,
    applicationId: string,
    confidence: number
  ): Promise<boolean> {
    const appUrl = env('APP_URL');
    const holdQueueUrl = `${appUrl}/hr/candidates?status=hold_for_review`;
    const subject = `[Action Required] Low Confidence Evaluation Hold: ${candidateName}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a; border: 1px solid #fef08a; border-radius: 16px; background-color: #fefce8;">
        <h2 style="color: #854d0e; margin-top: 0;">Application Flagged for HR Review</h2>
        <p>Application for <strong>${candidateName}</strong> yielded a low confidence score of <strong>${(
      confidence * 100
    ).toFixed(1)}%</strong>.</p>
        <p>Manual review and HR override are required to proceed.</p>
        <div style="margin-top: 20px;">
          <a href="${holdQueueUrl}" style="background-color: #854d0e; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">View HR Hold Queue</a>
        </div>
      </div>
    `;
    return this.sendEmail({ to: hrEmails.join(','), subject, html });
  }
}

export const emailService = new EmailService();
