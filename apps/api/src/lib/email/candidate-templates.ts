import { renderProfessionalEmailLayout, escapeHtml } from './email-layout';

export function buildWelcomeCandidateEmail(params: {
  name: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const title = `Welcome to NextRound, ${params.name}`;
  const subject = 'Welcome to NextRound — Your Profile is Active';
  const contentHtml = `
    <p style="margin:0 0 14px 0;">Hello <strong>${escapeHtml(params.name)}</strong>,</p>
    <p style="margin:0 0 14px 0;">Congratulations on completing your candidate onboarding profile! Your profile is now active on the NextRound platform.</p>
    <p style="margin:0 0 14px 0;">You can now participate in role-specific voice assessments, complete technical evaluation challenges, and track all your applications with full transparency.</p>
    <p style="margin:0;">Head over to your candidate dashboard below to explore active job openings, schedule practice sessions, or test your audio and video setup.</p>
  `;
  const secondaryText = 'If you did not create an account on NextRound, please disregard this email or notify security.';
  const html = renderProfessionalEmailLayout({
    title,
    contentHtml,
    actionButton: {
      text: 'Go to Candidate Dashboard',
      url: params.loginUrl,
    },
    secondaryText,
  });
  const text = `Hello ${params.name},\n\nCongratulations on completing your profile! Your candidate account is active.\n\nAccess your dashboard here: ${params.loginUrl}\n\nNextRound Team`;
  return { subject, html, text };
}

export function buildPasswordResetEmail(params: {
  resetUrl: string;
  expiresInHours?: number;
}): { subject: string; html: string; text: string } {
  const title = 'Reset Your Password';
  const subject = 'NextRound — Password Reset Request';
  const hours = params.expiresInHours || 1;
  const contentHtml = `
    <p style="margin:0 0 14px 0;">We received a request to reset the password for your NextRound account.</p>
    <p style="margin:0 0 14px 0;">Click the button below to choose a new password. For security, this link will expire in <strong>${hours} hour${hours > 1 ? 's' : ''}</strong>.</p>
  `;
  const secondaryText = 'If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.';
  const html = renderProfessionalEmailLayout({
    title,
    contentHtml,
    actionButton: {
      text: 'Reset Password',
      url: params.resetUrl,
    },
    secondaryText,
  });
  const text = `Reset your NextRound password using the link below (valid for ${hours} hour):
${params.resetUrl}

If you did not make this request, please ignore this email.`;
  return { subject, html, text };
}

export function buildApplicationReceivedEmail(params: {
  candidateName: string;
  jobTitle: string;
  orgName?: string;
  dashboardUrl?: string;
}): { subject: string; html: string; text: string } {
  const org = params.orgName || 'NextRound Hiring Network';
  const title = 'Application Received';
  const subject = `Application Received: ${params.jobTitle} at ${org}`;
  const contentHtml = `
    <p style="margin:0 0 14px 0;">Hello <strong>${escapeHtml(params.candidateName)}</strong>,</p>
    <p style="margin:0 0 14px 0;">Thank you for submitting your application for the <strong>${escapeHtml(params.jobTitle)}</strong> role at <strong>${escapeHtml(org)}</strong>.</p>
    
    <div style="background-color:#f1f5f9;border-left:3px solid #0f172a;border-radius:4px;padding:14px 16px;margin:20px 0;">
      <div style="font-size:13px;font-weight:600;color:#0f172a;margin-bottom:4px;">Next Stage</div>
      <div style="font-size:13px;color:#475569;line-height:1.4;">
        Our autonomous screening service is reviewing your background and qualifications against the role criteria. You will receive an email update once this initial stage is completed.
      </div>
    </div>
  `;
  const html = renderProfessionalEmailLayout({
    title,
    contentHtml,
    actionButton: params.dashboardUrl ? {
      text: 'View Application Status',
      url: params.dashboardUrl,
    } : undefined,
  });
  const text = `Hello ${params.candidateName},

Thank you for applying for ${params.jobTitle} at ${org}. Your application has been received and is being screened.

NextRound Team`;
  return { subject, html, text };
}

export function buildConstructiveRejectionEmail(params: {
  candidateName: string;
  jobTitle: string;
  rejectionFeedback: string;
  gaps?: string[];
  prepUrl?: string;
}): { subject: string; html: string; text: string } {
  const title = `Application Status: ${params.jobTitle}`;
  const subject = `Update regarding your application for ${params.jobTitle}`;
  
  const gapsHtml = params.gaps && params.gaps.length > 0 ? `
    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px 16px;margin:20px 0;">
      <div style="font-size:13px;font-weight:600;color:#0f172a;margin-bottom:6px;">Key Focus Areas for Future Consideration:</div>
      <ul style="margin:0;padding-left:20px;color:#475569;font-size:13px;line-height:1.5;">
        ${params.gaps.map((gapItem) => `<li>${escapeHtml(gapItem)}</li>`).join('')}
      </ul>
    </div>
  ` : '';

  const contentHtml = `
    <p style="margin:0 0 14px 0;">Hello <strong>${escapeHtml(params.candidateName)}</strong>,</p>
    <p style="margin:0 0 14px 0;">Thank you for taking the time to interview and share your experience with us for the <strong>${escapeHtml(params.jobTitle)}</strong> role.</p>
    <p style="margin:0 0 14px 0;">${escapeHtml(params.rejectionFeedback)}</p>
    ${gapsHtml}
    <p style="margin:0;">We appreciate your effort and wish you continued success in your professional endeavors.</p>
  `;
  const html = renderProfessionalEmailLayout({
    title,
    contentHtml,
    actionButton: params.prepUrl ? {
      text: 'Access Practice & Mock Assessments',
      url: params.prepUrl,
    } : undefined,
  });
  const text = `Hello ${params.candidateName},

Thank you for applying for ${params.jobTitle}. ${params.rejectionFeedback}

NextRound Team`;
  return { subject, html, text };
}

export function buildAssessmentReminderEmail(params: {
  candidateName: string;
  jobTitle: string;
  assessmentType: string;
  assessmentUrl: string;
  expiresInHours?: number;
}): { subject: string; html: string; text: string } {
  const title = `Reminder: ${params.assessmentType} Assessment`;
  const subject = `Reminder: Complete your ${params.assessmentType} assessment for ${params.jobTitle}`;
  const hoursText = params.expiresInHours ? ` in ${params.expiresInHours} hours` : ' shortly';
  const contentHtml = `
    <p style="margin:0 0 14px 0;">Hello <strong>${escapeHtml(params.candidateName)}</strong>,</p>
    <p style="margin:0 0 14px 0;">This is a reminder that your <strong>${escapeHtml(params.assessmentType)}</strong> assessment for the <strong>${escapeHtml(params.jobTitle)}</strong> role is pending and will expire${hoursText}.</p>
    <p style="margin:0;">Please make sure you are in a quiet environment with a stable internet connection before starting.</p>
  `;
  const html = renderProfessionalEmailLayout({
    title,
    contentHtml,
    actionButton: {
      text: 'Start Assessment Now',
      url: params.assessmentUrl,
    },
  });
  const text = `Hello ${params.candidateName},\n\nReminder to complete your ${params.assessmentType} assessment for ${params.jobTitle}.\n\nStart assessment: ${params.assessmentUrl}`;
  return { subject, html, text };
}
