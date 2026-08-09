import { prisma } from '@nextround/database';
import { executeCodingSubmission, TestCaseInput } from './coding-executor.service';
import { updateApplicationCodingScore } from './scoring.service';
import crypto from 'crypto';


export interface CreateSubmissionInput {
  applicationId: string;
  problemId?: string;
  code: string;
  language: string;
  idempotencyKey?: string;
}

/**
 * Creates an immutable coding submission record in a database transaction
 * and enqueues execution asynchronously.
 */
export async function enqueueSubmissionExecution(input: CreateSubmissionInput) {
  const idempotencyKey = input.idempotencyKey || `sub_${crypto.randomUUID()}`;

  // Check existing submission by idempotency key
  const existing = await prisma.codingSubmission.findUnique({
    where: { idempotency_key: idempotencyKey },
  });
  if (existing) {
    return existing;
  }

  // Count existing attempts for this application to set attempt_number
  const attemptCount = await prisma.codingSubmission.count({
    where: { application_id: input.applicationId },
  });

  const codeHash = crypto.createHash('sha256').update(input.code).digest('hex');

  // Transaction: Create submission in DB with status "queued"
  const submission = await prisma.$transaction(async (tx) => {
    return tx.codingSubmission.create({
      data: {
        application_id: input.applicationId,
        problem_id: input.problemId,
        attempt_number: attemptCount + 1,
        idempotency_key: idempotencyKey,
        language: input.language,
        code: input.code,
        code_hash: codeHash,
        status: 'queued',
        test_results: [],
        pass_rate: 0,
        pass_rate_percent: 0,
        pass_rate_ratio: 0,
      },
    });
  });

  // Asynchronously execute queue job without blocking HTTP request
  processSubmissionJob(submission.id).catch((err) => {
    // Log error to console/logger and record failed status in DB (never swallow)
    console.error(`[Queue Error] Submission ${submission.id} failed processing:`, err);
    prisma.codingSubmission
      .update({
        where: { id: submission.id },
        data: {
          status: 'errored',
          error_message: err?.message || 'Submission queue execution error',
        },
      })
      .catch(() => {});
  });

  return submission;
}

/**
 * Worker processor for executing candidate submission inside the isolated sandbox.
 */
export async function processSubmissionJob(submissionId: string) {
  // Update status to "running"
  await prisma.codingSubmission.update({
    where: { id: submissionId },
    data: { status: 'running' },
  });

  const submission = await prisma.codingSubmission.findUnique({
    where: { id: submissionId },
    include: { problem: true },
  });

  if (!submission) {
    throw new Error(`Submission ${submissionId} not found in database.`);
  }

  // Determine test cases and entry point from problem database record or default
  let testCases: TestCaseInput[] = [];
  let entryPoint = 'solution';

  if (submission.problem) {
    entryPoint = submission.problem.entry_point || 'solution';
    const publicTests = (submission.problem.public_tests as any[]) || [];
    const hiddenTests = (submission.problem.hidden_tests as any[]) || [];
    testCases = [...publicTests, ...hiddenTests];
  }

  if (testCases.length === 0) {
    throw new Error('No test cases found/configured for this coding problem.');
  }

  // Execute in isolated sandbox
  const summary = executeCodingSubmission(
    submission.code,
    submission.language,
    testCases,
    entryPoint
  );

  const finalStatus = summary.allPassed ? 'passed' : summary.passRate > 0 ? 'failed' : 'failed';

  // Persist final submission result
  const updated = await prisma.codingSubmission.update({
    where: { id: submissionId },
    data: {
      status: finalStatus,
      test_results: summary.results as any,
      pass_rate: summary.passRate,
      pass_rate_percent: summary.passRate,
      pass_rate_ratio: summary.passRateRatio,
      execution_time_ms: Math.round(summary.totalTimeMs),
      memory_kb: summary.memoryKb ?? null,
      runner_version: summary.runnerVersion,
      stdout_stderr: summary.logs.join('\n'),
    },
  });

  // Calculate composite evaluation score without automatically setting decision
  await updateApplicationCodingScore(submission.application_id, summary.passRate);

  return updated;
}

/**
 * Updates application evaluation coding score without making an automated hiring decision.
 */
