import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { Prisma } from '@nextround/database';
import { logger } from '../../lib/logger';
import { enqueueSourcing } from '../../lib/queues/sourcing.queue';
import { extractRequirementsFromJd } from '../../services/jd/jd-extractor.service';

export async function extractRequirements(req: Request, res: Response, next: NextFunction) {
  try {
    const { description, title } = req.body;
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ success: false, error: 'Job description is required' });
    }

    const extracted = await extractRequirementsFromJd(description, title);
    return res.json({
      success: true,
      data: extracted,
    });
  } catch (error) {
    return next(error);
  }
}

export async function aiAssistJob(req: Request, res: Response, next: NextFunction) {
  try {
    const jobId = req.params.id as string;

    const existingJob = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existingJob) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    if (existingJob.org_id !== req.user!.orgId!) {
      return res.status(403).json({ success: false, error: 'Forbidden: Access denied to job' });
    }

    const extracted = await extractRequirementsFromJd(existingJob.description, existingJob.title);

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        skills: extracted.skills as string[],
        rubric: extracted.rubric as Prisma.InputJsonValue,
        ...(extracted.enhancedDescription ? { description: extracted.enhancedDescription } : {}),
      },
    });

    try {
      await enqueueSourcing(existingJob.id, 'ai-jd-assist', {
        orgId: existingJob.org_id,
        description: existingJob.description,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.child('Jobs').warn(`Could not enqueue sourcing worker for job ${existingJob.id}:`, error);
    }

    return res.json({
      success: true,
      data: {
        job: updatedJob,
        extracted,
        message: 'AI assistance executed and requirements extracted successfully',
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function generateJd(req: Request, res: Response, next: NextFunction) {
  try {
    const { prompt, title, department, experienceLevel, locationType, keySkills, objectives, tone } = req.body;
    const userPrompt = typeof prompt === 'string' ? prompt.trim() : '';
    const roleTitle = typeof title === 'string' ? title.trim() : '';

    if (!userPrompt && !roleTitle) {
      return res.status(400).json({ success: false, error: 'Please describe the job role or provide a title.' });
    }

    const { generateProfessionalJd } = await import('../../services/jd/jd-extractor.service');
    const result = await generateProfessionalJd({
      prompt: userPrompt,
      title: roleTitle,
      department: typeof department === 'string' ? department : undefined,
      experienceLevel: typeof experienceLevel === 'string' ? experienceLevel : undefined,
      locationType: typeof locationType === 'string' ? locationType : undefined,
      keySkills: typeof keySkills === 'string' ? keySkills : undefined,
      objectives: typeof objectives === 'string' ? objectives : undefined,
      tone: typeof tone === 'string' ? tone : undefined,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

export async function generateQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, skills, experienceLevel, countPerTier } = req.body;
    const jdText = typeof description === 'string' ? description.trim() : '';

    if (!jdText) {
      return res.status(400).json({ success: false, error: 'Job description is required to generate assessment questions.' });
    }

    const { generateJdAssessmentQuestions } = await import('../../services/assessment/assessment-generator.service');
    const questions = await generateJdAssessmentQuestions({
      title: typeof title === 'string' ? title.trim() : undefined,
      description: jdText,
      skills: Array.isArray(skills) ? skills.filter((s): s is string => typeof s === 'string') : undefined,
      experienceLevel: typeof experienceLevel === 'string' ? experienceLevel : undefined,
      countPerTier: typeof countPerTier === 'number' ? Math.max(1, Math.min(10, countPerTier)) : 4,
    });

    return res.json({
      success: true,
      data: {
        questions,
        total: questions.length,
        breakdown: {
          easy: questions.filter((q) => q.difficulty === 'easy').length,
          intermediate: questions.filter((q) => q.difficulty === 'intermediate').length,
          advanced: questions.filter((q) => q.difficulty === 'advanced').length,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}


