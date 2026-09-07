/**
 * Professional, clean corporate email layout and responsive templates.
 * Designed with standard system typography, neutral borders, clear call-to-action buttons,
 * and high accessibility contrast. No garish gradients or distracting gimmicks.
 */

export interface EmailLayoutProps {
  preheader?: string;
  title: string;
  contentHtml: string;
  actionButton?: {
    text: string;
    url: string;
  };
  secondaryText?: string;
  footerNotice?: string;
}

export function renderProfessionalEmailLayout(props: EmailLayoutProps): string {
  const { preheader, title, contentHtml, actionButton, secondaryText, footerNotice } = props;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  ${preheader ? `<span style="display:none;font-size:0px;line-height:0px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</span>` : ''}
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    a {
      color: #2563eb;
      text-decoration: underline;
    }
    @media only screen and (max-width: 600px) {
      .container-table {
        width: 100% !important;
        padding: 16px !important;
      }
      .card-content {
        padding: 24px 18px !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" class="container-table" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;margin:0 auto;">
          <!-- Brand Header -->
          <tr>
            <td style="padding:0 0 20px 0;text-align:left;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#0f172a;width:28px;height:28px;border-radius:6px;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:14px;font-weight:700;line-height:28px;">N</span>
                  </td>
                  <td style="padding-left:10px;font-size:17px;font-weight:700;color:#0f172a;letter-spacing:-0.2px;">
                    NextRound
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td class="card-content" style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:36px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
              <h1 style="margin:0 0 20px 0;font-size:20px;font-weight:600;color:#0f172a;line-height:1.4;">
                ${escapeHtml(title)}
              </h1>
              
              <div style="font-size:15px;line-height:1.6;color:#334155;">
                ${contentHtml}
              </div>

              ${actionButton ? `
              <div style="margin:32px 0 24px 0;">
                <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="background-color:#0f172a;border-radius:6px;">
                      <a href="${actionButton.url}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;">
                        ${escapeHtml(actionButton.text)} &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
              ` : ''}

              ${secondaryText ? `
              <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f1f5f9;font-size:13px;color:#64748b;line-height:1.5;">
                ${secondaryText}
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 8px;text-align:left;font-size:12px;color:#94a3b8;line-height:1.5;">
              <p style="margin:0 0 6px 0;">
                ${footerNotice || 'This is an automated notification from NextRound. Please do not reply directly to this email.'}
              </p>
              <p style="margin:0;">
                &copy; ${new Date().getFullYear()} NextRound Platform. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   SPECIFIC APPLICATION EMAIL TEMPLATES
   ========================================================================== */

export function buildWelcomeCandidateEmail(params: {
  name: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const title = `Welcome to NextRound, ${params.name}`;
  const subject = 'Welcome to NextRound — Your Autonomous Interview Platform';
  const contentHtml = `
    <p style="margin:0 0 14px 0;">Hello <strong>${escapeHtml(params.name)}</strong>,</p>
    <p style="margin:0 0 14px 0;">Your candidate account has been successfully created. With NextRound, you can participate in role-specific voice assessments, complete technical evaluation challenges, and track all your applications with full transparency.</p>
    <p style="margin:0;">You can access your candidate portal below to set up your profile, test your microphone and camera, or explore practice sessions.</p>
  `;
  const secondaryText = 'If you did not sign up for this account, please disregard this email or notify security.';
  const html = renderProfessionalEmailLayout({
    title,
    contentHtml,
    actionButton: {
      text: 'Sign In to Candidate Portal',
      url: params.loginUrl,
    },
    secondaryText,
  });
  const text = `Hello ${params.name},\n\nWelcome to NextRound. Your candidate account is active.\n\nAccess your portal here: ${params.loginUrl}\n\nNextRound Team`;
  return { subject, html, text };
}

export function buildWelcomeHREmail(params: {
  name: string;
  orgName?: string;
  dashboardUrl: string;
}): { subject: string; html: string; text: string } {
  const org = params.orgName ? ` at ${params.orgName}` : '';
  const title = `Welcome to NextRound${org}`;
  const subject = `Welcome to NextRound — Your Hiring Workspace is Ready`;
  const contentHtml = `
    <p style="margin:0 0 14px 0;">Hello <strong>${escapeHtml(params.name)}</strong>,</p>
    <p style="margin:0 0 14px 0;">Your HR recruiter workspace has been created${params.orgName ? ` for <strong>${escapeHtml(params.orgName)}</strong>` : ''}. NextRound empowers your team to configure hiring rubrics, schedule autonomous voice assessments, and review AI candidate evaluations with zero human bottlenecks.</p>
    <p style="margin:0;">You can access your recruiter dashboard below to create job requisitions, configure assessment criteria, or invite team members.</p>
  `;
  const secondaryText = 'If you did not create this workspace, please reach out to support immediately.';
  const html = renderProfessionalEmailLayout({
    title,
    contentHtml,
    actionButton: {
      text: 'Open Recruiter Dashboard',
      url: params.dashboardUrl,
    },
    secondaryText,
  });
  const text = `Hello ${params.name},\n\nWelcome to NextRound. Your HR workspace is ready.\n\nOpen your dashboard here: ${params.dashboardUrl}\n\nNextRound Team`;
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

export function buildMemberInviteEmail(params: {
  inviteUrl: string;
  organizationName?: string;
  invitedByEmail?: string;
}): { subject: string; html: string; text: string } {
  const org = params.organizationName || 'your organization';
  const title = `Invitation to join ${org}`;
  const subject = `Invitation to join ${org} on NextRound`;
  const inviterText = params.invitedByEmail ? ` by <strong>${escapeHtml(params.invitedByEmail)}</strong>` : '';
  const contentHtml = `
    <p style="margin:0 0 14px 0;">You have been invited${inviterText} to collaborate on NextRound as part of <strong>${escapeHtml(org)}</strong>.</p>
    <p style="margin:0 0 14px 0;">NextRound enables talent acquisition teams to build pipelines, review AI candidate evaluations, and manage autonomous assessment rounds seamlessly.</p>
    <p style="margin:0;">Click below to accept the invitation and set up your workspace access.</p>
  `;
  const html = renderProfessionalEmailLayout({
    title,
    contentHtml,
    actionButton: {
      text: 'Accept Invitation & Sign In',
      url: params.inviteUrl,
    },
    secondaryText: 'If you believe this invitation was sent in error, please contact your workspace administrator.',
  });
  const text = `You have been invited to join ${org} on NextRound.

Accept invitation: ${params.inviteUrl}`;
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

export function buildInterviewSchedulingEmail(params: {
  candidateName: string;
  jobTitle: string;
  slots: Array<{ date: string; time: string; link?: string }>;
  portalUrl: string;
}): { subject: string; html: string; text: string } {
  const title = 'Voice Interview Invitation';
  const subject = `NextRound: Next Steps for ${params.jobTitle}`;

  const slotsListHtml = params.slots.map((s) => `
    <li style="margin-bottom:8px;font-size:14px;color:#1e293b;">
      <strong>${escapeHtml(s.date)} at ${escapeHtml(s.time)}</strong>
      ${s.link ? ` &mdash; <a href="${s.link}" style="color:#2563eb;font-weight:600;text-decoration:none;">Select this time</a>` : ''}
    </li>
  `).join('');

  const contentHtml = `
    <p style="margin:0 0 14px 0;">Hello <strong>${escapeHtml(params.candidateName)}</strong>,</p>
    <p style="margin:0 0 14px 0;">Your application for <strong>${escapeHtml(params.jobTitle)}</strong> has successfully passed the initial evaluation. We invite you to schedule your autonomous voice assessment session.</p>
    
    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:20px 0;">
      <div style="font-size:13px;font-weight:600;color:#0f172a;margin-bottom:10px;">Available Assessment Windows:</div>
      <ul style="margin:0;padding-left:20px;">
        ${slotsListHtml}
      </ul>
    </div>
    <p style="margin:0;">Please confirm your selection directly through the candidate portal to reserve your session.</p>
  `;
  const html = renderProfessionalEmailLayout({
    title,
    contentHtml,
    actionButton: {
      text: 'Open Candidate Portal',
      url: params.portalUrl,
    },
  });
  const text = `Hello ${params.candidateName},

You have been invited to schedule your assessment for ${params.jobTitle}.
Visit your portal to confirm: ${params.portalUrl}`;
  return { subject, html, text };
}

export function buildOfferLetterEmail(params: {
  candidateName: string;
  jobTitle: string;
  salary: number;
  equity?: string;
  signUrl: string;
}): { subject: string; html: string; text: string } {
  const title = `Offer of Employment: ${params.jobTitle}`;
  const subject = `Offer Letter: ${params.jobTitle} at NextRound`;
  const contentHtml = `
    <p style="margin:0 0 14px 0;">Hello <strong>${escapeHtml(params.candidateName)}</strong>,</p>
    <p style="margin:0 0 14px 0;">Following your successful interviews and evaluations, we are pleased to extend an official offer of employment for the position of <strong>${escapeHtml(params.jobTitle)}</strong>.</p>
    
    <div style="background-color:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:16px 20px;margin:24px 0;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="4">
        <tr>
          <td style="font-size:14px;color:#64748b;width:140px;">Position:</td>
          <td style="font-size:14px;font-weight:600;color:#0f172a;">${escapeHtml(params.jobTitle)}</td>
        </tr>
        <tr>
          <td style="font-size:14px;color:#64748b;">Annual Base:</td>
          <td style="font-size:14px;font-weight:600;color:#0f172a;">$${params.salary.toLocaleString()}</td>
        </tr>
        ${params.equity ? `
        <tr>
          <td style="font-size:14px;color:#64748b;">Equity:</td>
          <td style="font-size:14px;font-weight:600;color:#0f172a;">${escapeHtml(params.equity)}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <p style="margin:0;">Please click below to review the formal offer terms and execute your electronic signature.</p>
  `;
  const html = renderProfessionalEmailLayout({
    title,
    contentHtml,
    actionButton: {
      text: 'Review & Sign Offer Letter',
      url: params.signUrl,
    },
    secondaryText: 'Please review and sign this agreement before its designated expiration window.',
  });
  const text = `Hello ${params.candidateName},

We are pleased to extend an offer for ${params.jobTitle} with an annual base of $${params.salary.toLocaleString()}.

Review and sign here: ${params.signUrl}`;
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
        ${params.gaps.map((g) => `<li>${escapeHtml(g)}</li>`).join('')}
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

export function buildHRAlertEmail(params: {
  candidateName: string;
  applicationId: string;
  confidence: number;
  reviewUrl: string;
}): { subject: string; html: string; text: string } {
  const confidencePercent = (params.confidence * 100).toFixed(1);
  const title = `Review Required: ${params.candidateName}`;
  const subject = `[Action Required] Low Confidence Evaluation: ${params.candidateName} (${confidencePercent}%)`;
  const contentHtml = `
    <p style="margin:0 0 14px 0;">An autonomous candidate evaluation has completed with a confidence score of <strong>${confidencePercent}%</strong>, which falls below the automated decision threshold.</p>
    
    <div style="background-color:#fffbeb;border:1px solid #fef3c7;border-left:4px solid #d97706;border-radius:4px;padding:14px 16px;margin:20px 0;">
      <div style="font-size:13px;font-weight:600;color:#92400e;margin-bottom:4px;">Manual HR Review Triggered</div>
      <div style="font-size:13px;color:#78350f;line-height:1.4;">
        Candidate: <strong>${escapeHtml(params.candidateName)}</strong><br/>
        Application ID: <code>${escapeHtml(params.applicationId)}</code><br/>
        Confidence Rating: <strong>${confidencePercent}%</strong>
      </div>
    </div>
    
    <p style="margin:0;">Please review the evaluation transcript and rubric scores in the HR dashboard to record a hiring decision.</p>
  `;
  const html = renderProfessionalEmailLayout({
    title,
    contentHtml,
    actionButton: {
      text: 'Review Candidate in Dashboard',
      url: params.reviewUrl,
    },
  });
  const text = `Review required for candidate ${params.candidateName} (Confidence: ${confidencePercent}%).
Review at: ${params.reviewUrl}`;
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

export function buildInterviewConfirmationEmail(params: {
  candidateName: string;
  jobTitle: string;
  scheduledAt: string;
  sessionUrl: string;
}): { subject: string; html: string; text: string } {
  const title = `Interview Confirmed: ${params.jobTitle}`;
  const subject = `Confirmed: Autonomous Interview for ${params.jobTitle}`;
  const contentHtml = `
    <p style="margin:0 0 14px 0;">Hello <strong>${escapeHtml(params.candidateName)}</strong>,</p>
    <p style="margin:0 0 14px 0;">Your autonomous interview session for <strong>${escapeHtml(params.jobTitle)}</strong> is officially confirmed.</p>
    
    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:20px 0;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="4">
        <tr>
          <td style="font-size:14px;color:#64748b;width:130px;">Scheduled Time:</td>
          <td style="font-size:14px;font-weight:600;color:#0f172a;">${escapeHtml(params.scheduledAt)}</td>
        </tr>
        <tr>
          <td style="font-size:14px;color:#64748b;">Format:</td>
          <td style="font-size:14px;font-weight:600;color:#0f172a;">AI Voice & Video Session</td>
        </tr>
      </table>
    </div>
    
    <p style="margin:0 0 14px 0;">Please ensure you are using a Chromium-based browser (Chrome, Edge, Brave) with camera and microphone permissions enabled.</p>
  `;
  const html = renderProfessionalEmailLayout({
    title,
    contentHtml,
    actionButton: {
      text: 'Go to Interview Room',
      url: params.sessionUrl,
    },
  });
  const text = `Hello ${params.candidateName},\n\nYour interview for ${params.jobTitle} is confirmed for ${params.scheduledAt}.\nAccess the interview room: ${params.sessionUrl}\n\nNextRound Team`;
  return { subject, html, text };
}

export function buildOfferResponseAlertEmail(params: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  status: 'accepted' | 'declined';
  reason?: string;
  reviewUrl: string;
}): { subject: string; html: string; text: string } {
  const isAccepted = params.status === 'accepted';
  const title = `Offer ${isAccepted ? 'Accepted' : 'Declined'}: ${params.candidateName}`;
  const subject = `[Offer Update] ${params.candidateName} has ${isAccepted ? 'ACCEPTED' : 'DECLINED'} offer for ${params.jobTitle}`;
  const contentHtml = `
    <p style="margin:0 0 14px 0;">Candidate <strong>${escapeHtml(params.candidateName)}</strong> (${escapeHtml(params.candidateEmail)}) has recorded a decision on their offer letter for <strong>${escapeHtml(params.jobTitle)}</strong>.</p>
    
    <div style="background-color:${isAccepted ? '#ecfdf5' : '#fff1f2'};border:1px solid ${isAccepted ? '#a7f3d0' : '#fecdd3'};border-left:4px solid ${isAccepted ? '#059669' : '#e11d48'};border-radius:4px;padding:14px 16px;margin:20px 0;">
      <div style="font-size:14px;font-weight:600;color:${isAccepted ? '#065f46' : '#9f1239'};">Decision: ${isAccepted ? 'Offer Accepted & Digitally Signed' : 'Offer Declined'}</div>
      ${params.reason ? `<div style="font-size:13px;color:#475569;margin-top:6px;">Candidate Note: "${escapeHtml(params.reason)}"</div>` : ''}
    </div>
    
    <p style="margin:0;">You can review the updated candidate application and onboarding details in the HR dashboard.</p>
  `;
  const html = renderProfessionalEmailLayout({
    title,
    contentHtml,
    actionButton: {
      text: 'View Candidate in Dashboard',
      url: params.reviewUrl,
    },
  });
  const text = `Candidate ${params.candidateName} has ${isAccepted ? 'accepted' : 'declined'} the offer for ${params.jobTitle}.\nReview at: ${params.reviewUrl}`;
  return { subject, html, text };
}

export function buildProctoringAnomalyAlertEmail(params: {
  candidateName: string;
  jobTitle: string;
  applicationId: string;
  interviewId: string;
  anomalyDescription: string;
  reviewUrl: string;
}): { subject: string; html: string; text: string } {
  const title = `Integrity Alert: ${params.candidateName}`;
  const subject = `[Urgent Proctor Alert] Integrity Anomaly Detected: ${params.candidateName}`;
  const contentHtml = `
    <p style="margin:0 0 14px 0;">Our client-side vision proctoring engine has flagged a significant integrity anomaly during an active evaluation session.</p>
    
    <div style="background-color:#fff1f2;border:1px solid #fecdd3;border-left:4px solid #e11d48;border-radius:4px;padding:14px 16px;margin:20px 0;">
      <div style="font-size:13px;font-weight:600;color:#9f1239;margin-bottom:4px;">Proctoring Flag Triggered</div>
      <div style="font-size:13px;color:#881337;line-height:1.4;">
        Candidate: <strong>${escapeHtml(params.candidateName)}</strong><br/>
        Role: <strong>${escapeHtml(params.jobTitle)}</strong><br/>
        Detail: ${escapeHtml(params.anomalyDescription)}
      </div>
    </div>
    
    <p style="margin:0;">Please inspect the telemetry logs and proctor flags recorded for this session.</p>
  `;
  const html = renderProfessionalEmailLayout({
    title,
    contentHtml,
    actionButton: {
      text: 'Inspect Proctoring Telemetry',
      url: params.reviewUrl,
    },
  });
  const text = `Integrity Alert for ${params.candidateName} (${params.jobTitle}): ${params.anomalyDescription}.\nInspect at: ${params.reviewUrl}`;
  return { subject, html, text };
}
