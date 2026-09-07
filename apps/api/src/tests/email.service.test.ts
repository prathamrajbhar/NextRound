import assert from 'node:assert/strict';
import { runTemplateTests } from './email.templates.test';
import { EmailService } from '../services/email.service';

async function runTests() {
  console.log('🧪 Running Email Subsystem Tests...');

  runTemplateTests();

  console.log('  Testing EmailService behavior...');
  const testService = new EmailService();
  assert.strictEqual(typeof testService.sendEmail, 'function');
  assert.strictEqual(typeof testService.sendImmediate, 'function');
  assert.strictEqual(typeof testService.verifyConnection, 'function');
  assert.strictEqual(typeof testService.sendWelcomeCandidate, 'function');
  assert.strictEqual(typeof testService.sendPasswordReset, 'function');
  assert.strictEqual(typeof testService.sendOfferEmail, 'function');
  assert.strictEqual(typeof testService.sendInterviewConfirmation, 'function');
  assert.strictEqual(typeof testService.sendOfferResponseAlert, 'function');
  assert.strictEqual(typeof testService.sendProctoringAnomalyAlert, 'function');

  console.log('✅ All Email Subsystem tests passed successfully!');
}

runTests().catch((error) => {
  console.error('❌ Email test failed:', error);
  process.exit(1);
});
