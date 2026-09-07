import { renderProfessionalEmailLayout, escapeHtml } from './email-layout';

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
