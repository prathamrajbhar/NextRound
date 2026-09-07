import assert from 'node:assert/strict';
import {
  renderProfessionalEmailLayout,
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
import { EmailService } from '../services/email.service';

async function runTests() {
  console.log('🧪 Running Email Subsystem Tests...');

  // 1. Test Base Layout Rendering
  console.log('  Testing renderProfessionalEmailLayout...');
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

  // 2. Test Welcome Candidate Template
  console.log('  Testing buildWelcomeCandidateEmail...');
  const welcome = buildWelcomeCandidateEmail({
    name: 'Alice Smith',
    loginUrl: 'https://nextround.ai/login',
  });
  assert.ok(welcome.subject.includes('Welcome to NextRound'));
  assert.ok(welcome.html.includes('Alice Smith'));
  assert.ok(welcome.text.includes('Alice Smith'));

  // 3. Test Password Reset Template
  console.log('  Testing buildPasswordResetEmail...');
  const reset = buildPasswordResetEmail({
    resetUrl: 'https://nextround.ai/reset-password/abc123token',
    expiresInHours: 1,
  });
  assert.ok(reset.subject.includes('Password Reset'));
  assert.ok(reset.html.includes('https://nextround.ai/reset-password/abc123token'));
  assert.ok(reset.text.includes('valid for 1 hour'));

  // 4. Test Member Invite Template
  console.log('  Testing buildMemberInviteEmail...');
  const invite = buildMemberInviteEmail({
    inviteUrl: 'https://nextround.ai/hr/dashboard?org=org-456',
    organizationName: 'Acme Corp',
    invitedByEmail: 'recruiter@acme.com',
  });
  assert.ok(invite.subject.includes('Acme Corp'));
  assert.ok(invite.html.includes('recruiter@acme.com'));

  // 5. Test Application Received Template
  console.log('  Testing buildApplicationReceivedEmail...');
  const appRec = buildApplicationReceivedEmail({
    candidateName: 'Bob Developer',
    jobTitle: 'Senior Rust Engineer',
    orgName: 'Hiring Org',
  });
  assert.ok(appRec.subject.includes('Senior Rust Engineer'));
  assert.ok(appRec.html.includes('Bob Developer'));

  // 6. Test Interview Scheduling Template
  console.log('  Testing buildInterviewSchedulingEmail...');
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

  // 7. Test Offer Letter Template
  console.log('  Testing buildOfferLetterEmail...');
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

  // 8. Test Constructive Rejection Template
  console.log('  Testing buildConstructiveRejectionEmail...');
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

  // 9. Test HR Alert Template
  console.log('  Testing buildHRAlertEmail...');
  const hrAlert = buildHRAlertEmail({
    candidateName: 'Frank Miller',
    applicationId: 'app-9988',
    confidence: 0.62,
    reviewUrl: 'https://nextround.ai/hr/candidates?status=hold_for_review',
  });
  assert.ok(hrAlert.subject.includes('62.0%'));
  assert.ok(hrAlert.html.includes('app-9988'));
  assert.ok(hrAlert.html.includes('Frank Miller'));

  // 10. Test Assessment Reminder Template
  console.log('  Testing buildAssessmentReminderEmail...');
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

  // 11. Test EmailService Class instantiation & methods
  console.log('  Testing EmailService behavior...');
  const testService = new EmailService();
  assert.strictEqual(typeof testService.sendEmail, 'function');
  assert.strictEqual(typeof testService.sendImmediate, 'function');
  assert.strictEqual(typeof testService.verifyConnection, 'function');
  assert.strictEqual(typeof testService.sendWelcomeCandidate, 'function');
  assert.strictEqual(typeof testService.sendPasswordReset, 'function');
  assert.strictEqual(typeof testService.sendOfferEmail, 'function');

  console.log('✅ All Email Subsystem tests passed successfully!');
}

runTests().catch((err) => {
  console.error('❌ Email test failed:', err);
  process.exit(1);
});
