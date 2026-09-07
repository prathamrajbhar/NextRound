import { renderProfessionalEmailLayout, escapeHtml } from './email-layout';

export function buildInterviewSchedulingEmail(params: {
  candidateName: string;
  jobTitle: string;
  slots: Array<{ date: string; time: string; link?: string }>;
  portalUrl: string;
}): { subject: string; html: string; text: string } {
  const title = 'Voice Interview Invitation';
  const subject = `NextRound: Next Steps for ${params.jobTitle}`;

  const slotsListHtml = params.slots.map((slotItem) => `
    <li style="margin-bottom:8px;font-size:14px;color:#1e293b;">
      <strong>${escapeHtml(slotItem.date)} at ${escapeHtml(slotItem.time)}</strong>
      ${slotItem.link ? ` &mdash; <a href="${slotItem.link}" style="color:#2563eb;font-weight:600;text-decoration:none;">Select this time</a>` : ''}
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
