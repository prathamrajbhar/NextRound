import nodemailer from 'nodemailer';
import { logger } from '../lib/logger';
import { enqueueEmail } from '../lib/queues/email.queue';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  userId?: string;
  async?: boolean;
}

export class EmailTransportService {
  protected transporter: nodemailer.Transporter | null = null;
  protected isConfigured = false;

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
      } catch (error) {
        logger.child('Email').warn(`BullMQ enqueue failed for ${options.to}, falling back to synchronous send: ${error}`);
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
}
