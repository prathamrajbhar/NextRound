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





export async function enqueueSubmissionExecution(input: CreateSubmissionInput) {
  const idempotencyKey = input.idempotencyKey || `sub_${crypto.randomUUID()}`;

  
  const existing = await prisma.codingSubmission.findUnique({
    where: { idempotency_key: idempotencyKey },
  });
  if (existing) {
    return existing;
  }

  
  const attemptCount = await prisma.codingSubmission.count({
    where: { application_id: input.applicationId },
  });

  const codeHash = crypto.createHash('sha256').update(input.code).digest('hex');

  
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

  
  processSubmissionJob(submission.id).catch((err) => {
    
    console.error(`[Queue Error] Submission ${submission.id} failed processing:`, err);
    prisma.codingSubmission
      .update({
        where: { id: submission.id },
        data: {
          status: 'errored',
          error_message: err?.message || 'Submission queue execution error',
        },
      })
      .catch((updateErr) => {
        console.error(`Failed to mark submission ${submission.id} as errored:`, updateErr);
      });
  });

  return submission;
}




export async function processSubmissionJob(submissionId: string) {
  
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

  
  let testCases: TestCaseInput[] = [];
  let entryPoint = 'solution';

  if (submission.problem) {
    entryPoint = submission.problem.entry_point || 'solution';
    const publicTests = (submission.problem.public_tests as any[]) || [];
    const hiddenTests = (submission.problem.hidden_tests as any[]) || [];
    testCases = [...publicTests, ...hiddenTests];
  }

  if (testCases.length === 0) {
    testCases = [
      { name: 'Default Case 1', args: [[50, 50, 50, 50, 50], 100, 100], expected: [2, 4] },
      { name: 'Default Case 2', args: [[30, 40, 50, 60, 70], 0, 80], expected: [0, 2] },
    ];
  }

  
  const summary = executeCodingSubmission(
    submission.code,
    submission.language,
    testCases,
    entryPoint
  );

  const finalStatus = summary.allPassed ? 'passed' : summary.passRate > 0 ? 'failed' : 'failed';

  
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

  
  if (submission.application_id) {
    await updateApplicationCodingScore(submission.application_id, summary.passRate);
  }

  return updated;
}




