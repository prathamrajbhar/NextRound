import assert from 'node:assert/strict';
import {
  renderProfessionalEmailLayout,
  buildWelcomeCandidateEmail,
  buildWelcomeHREmail,
  buildPasswordResetEmail,
  buildMemberInviteEmail,
  buildApplicationReceivedEmail,
  buildInterviewSchedulingEmail,
  buildOfferLetterEmail,
  buildConstructiveRejectionEmail,
  buildHRAlertEmail,
  buildAssessmentReminderEmail,
  buildInterviewConfirmationEmail,
  buildOfferResponseAlertEmail,
  buildProctoringAnomalyAlertEmail,
} from '../lib/email/templates';

export function runTemplateTests() {
  const layout = renderProfessionalEmailLayout({
    title: 'Test Clean Email',
    contentHtml: '<p>Test paragraph content</p>',
    actionButton: {
      text: 'Click Me',
      url: 'https://nextround.ai/action',
    },
    secondaryText: 'Secondary disclaimer notice',
  });
  assert.ok(layout.includes('NextRound'), 'Layout must include brand name');
  assert.ok(layout.includes('Test Clean Email'), 'Layout must include title');
  assert.ok(layout.includes('https://nextround.ai/action'), 'Layout must include button url');
  assert.ok(layout.includes('Secondary disclaimer notice'), 'Layout must include secondary notice');

  const welcomeCand = buildWelcomeCandidateEmail({
    name: 'Alice Smith',
    loginUrl: 'https://nextround.ai/login',
  });
  assert.ok(welcomeCand.subject.includes('Welcome to NextRound'));
  assert.ok(welcomeCand.html.includes('Alice Smith'));
  assert.ok(welcomeCand.text.includes('Alice Smith'));

  const welcomeHR = buildWelcomeHREmail({
    name: 'Robert Recruiter',
    orgName: 'Acme Talent',
    dashboardUrl: 'https://nextround.ai/hr/dashboard',
  });
  assert.ok(welcomeHR.subject.includes('Hiring Workspace is Ready'));
  assert.ok(welcomeHR.html.includes('Robert Recruiter'));
  assert.ok(welcomeHR.html.includes('Acme Talent'));

  const reset = buildPasswordResetEmail({
    resetUrl: 'https://nextround.ai/reset-password/abc123token',
    expiresInHours: 1,
  });
  assert.ok(reset.subject.includes('Password Reset'));
  assert.ok(reset.html.includes('https://nextround.ai/reset-password/abc123token'));
  assert.ok(reset.text.includes('valid for 1 hour'));

  const invite = buildMemberInviteEmail({
    inviteUrl: 'https://nextround.ai/hr/dashboard?org=org-456',
    organizationName: 'Acme Corp',
    invitedByEmail: 'recruiter@acme.com',
  });
  assert.ok(invite.subject.includes('Acme Corp'));
  assert.ok(invite.html.includes('recruiter@acme.com'));

  const appRec = buildApplicationReceivedEmail({
    candidateName: 'Bob Developer',
    jobTitle: 'Senior Rust Engineer',
    orgName: 'Hiring Org',
  });
  assert.ok(appRec.subject.includes('Senior Rust Engineer'));
  assert.ok(appRec.html.includes('Bob Developer'));

  const sched = buildInterviewSchedulingEmail({
    candidateName: 'Carol White',
    jobTitle: 'Full Stack Engineer',
    slots: [
      { date: '2026-09-10', time: '10:00 AM UTC', link: 'https://nextround.ai/book?slot=1' },
      { date: '2026-09-11', time: '02:00 PM UTC', link: 'https://nextround.ai/book?slot=2' },
    ],
    portalUrl: 'https://nextround.ai/candidate/dashboard',
  });
  assert.ok(sched.html.includes('10:00 AM UTC'));
  assert.ok(sched.html.includes('2026-09-10'));
  assert.ok(sched.html.includes('Carol White'));

  const offer = buildOfferLetterEmail({
    candidateName: 'David Lee',
    jobTitle: 'Staff Backend Architect',
    salary: 185000,
    equity: '0.25% ISO options',
    signUrl: 'https://nextround.ai/offers/sign?token=xyz789',
  });
  assert.ok(offer.html.includes('85,000'));
  assert.ok(offer.html.includes('Staff Backend Architect'));
  assert.ok(offer.html.includes('0.25% ISO options'));
  assert.ok(offer.html.includes('https://nextround.ai/offers/sign?token=xyz789'));

  const reject = buildConstructiveRejectionEmail({
    candidateName: 'Elena Rostova',
    jobTitle: 'ML Engineer',
    rejectionFeedback: 'Solid algorithmic foundations, but lacked production PyTorch deployment experience.',
    gaps: ['Distributed Training', 'TensorRT Optimization'],
    prepUrl: 'https://nextround.ai/candidate/mock/new',
  });
  assert.ok(reject.html.includes('Distributed Training'));
  assert.ok(reject.html.includes('TensorRT Optimization'));
  assert.ok(reject.html.includes('Elena Rostova'));

  const hrAlert = buildHRAlertEmail({
    candidateName: 'Frank Miller',
    applicationId: 'app-9988',
    confidence: 0.62,
    reviewUrl: 'https://nextround.ai/hr/candidates?status=hold_for_review',
  });
  assert.ok(hrAlert.subject.includes('62.0%'));
  assert.ok(hrAlert.html.includes('app-9988'));
  assert.ok(hrAlert.html.includes('Frank Miller'));

  const reminder = buildAssessmentReminderEmail({
    candidateName: 'Grace Hopper',
    jobTitle: 'Principal Engineer',
    assessmentType: 'Cognitive Aptitude',
    assessmentUrl: 'https://nextround.ai/assessment/take/123',
    expiresInHours: 24,
  });
  assert.ok(reminder.subject.includes('Cognitive Aptitude'));
  assert.ok(reminder.html.includes('Grace Hopper'));
  assert.ok(reminder.html.includes('24 hours'));

  const confirm = buildInterviewConfirmationEmail({
    candidateName: 'Hannah Abbott',
    jobTitle: 'Backend Architect',
    scheduledAt: 'Wed, 10 Sep 2026 14:00:00 GMT',
    sessionUrl: 'https://nextround.ai/candidate/interview/app-101',
  });
  assert.ok(confirm.subject.includes('Confirmed'));
  assert.ok(confirm.html.includes('Hannah Abbott'));
  assert.ok(confirm.html.includes('app-101'));

  const offerAlert = buildOfferResponseAlertEmail({
    candidateName: 'Ian Malcolm',
    candidateEmail: 'ian@jurassic.com',
    jobTitle: 'Chaos Engineer',
    status: 'accepted',
    reviewUrl: 'https://nextround.ai/hr/candidates/app-202',
  });
  assert.ok(offerAlert.subject.includes('ACCEPTED'));
  assert.ok(offerAlert.html.includes('Ian Malcolm'));
  assert.ok(offerAlert.html.includes('app-202'));

  const proctorAlert = buildProctoringAnomalyAlertEmail({
    candidateName: 'Jane Doe',
    jobTitle: 'Senior Full Stack',
    applicationId: 'app-303',
    interviewId: 'int-404',
    anomalyDescription: 'Multiple faces detected in video stream',
    reviewUrl: 'https://nextround.ai/hr/candidates/app-303',
  });
  assert.ok(proctorAlert.subject.includes('Urgent Proctor Alert'));
  assert.ok(proctorAlert.html.includes('Multiple faces detected'));
  assert.ok(proctorAlert.html.includes('app-303'));
}
