import { prisma, Prisma } from '@nextround/database';
import { notFound, badRequest } from '../../lib/http-errors';

export async function recordMockFeedback(sessionId: string, body: Record<string, unknown>) {
  const id = sessionId;
  const { score, feedback, status } = body;

  const session = await prisma.mockSession.findUnique({
    where: { id },
  });

  if (!session) {
    throw notFound('Mock session not found');
  }

  const updated = await prisma.mockSession.update({
    where: { id },
    data: {
      status: (status as string) || 'completed',
      ...(typeof score === 'number' ? { score } : {}),
      ...(feedback ? { feedback: feedback as Prisma.InputJsonValue } : {}),
    },
  });

  return { session: updated };
}

export async function recordResumeBuilderResult(sessionId: string, body: Record<string, unknown>) {
  const { generatedResume, resumePdfUrl, status } = body;

  const session = await prisma.mockSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw notFound('Resume builder session not found');
  }

  const updated = await prisma.mockSession.update({
    where: { id: sessionId },
    data: {
      status: (status as string) || 'completed',
      ...(generatedResume ? { generated_resume: generatedResume as Prisma.InputJsonValue } : {}),
      ...(resumePdfUrl ? { resume_pdf_url: resumePdfUrl as string } : {}),
    },
  });

  return { session: updated };
}

export async function generatePrepContent(body: Record<string, unknown>) {
  const {
    companyName,
    roleArchetype,
    questions,
    cultureNotes,
    skillChecklist,
    jobId,
    orgId,
  } = body;

  let existing = null;
  if (jobId) {
    existing = await prisma.prepContent.findFirst({ where: { job_id: jobId as string } });
  } else if (orgId) {
    existing = await prisma.prepContent.findFirst({ where: { org_id: orgId as string } });
  } else if (companyName) {
    existing = await prisma.prepContent.findFirst({
      where: { company_name: companyName as string },
    });
  }

  let prepContent;
  if (existing) {
    prepContent = await prisma.prepContent.update({
      where: { id: existing.id },
      data: {
        company_name: (companyName as string) || existing.company_name,
        role_archetype: (roleArchetype as string) || existing.role_archetype,
        questions: (questions ?? existing.questions) as Prisma.InputJsonValue,
        culture_notes: (cultureNotes as string) || existing.culture_notes,
        skill_checklist: (skillChecklist ?? existing.skill_checklist) as Prisma.InputJsonValue,
        ...(jobId ? { job_id: jobId as string } : {}),
        ...(orgId ? { org_id: orgId as string } : {}),
      },
    });
  } else {
    if (!companyName || !roleArchetype) {
      throw badRequest('companyName and roleArchetype are required to generate prep content');
    }
    prepContent = await prisma.prepContent.create({
      data: {
        company_name: companyName as string,
        role_archetype: roleArchetype as string,
        questions: ((questions as unknown[]) || []) as Prisma.InputJsonValue,
        culture_notes: (cultureNotes as string) || '',
        skill_checklist: ((skillChecklist as unknown[]) || []) as Prisma.InputJsonValue,
        job_id: (jobId as string) || null,
        org_id: (orgId as string) || null,
      },
    });
  }

  return { prepContent };
}
