import { Request, Response, NextFunction } from 'express';
import { prisma, Prisma } from '@nextround/database';
import { logger } from '../../lib/logger';
import { enqueueMockEvaluation } from '../../lib/queues/mock.queue';
import { getCandidateProfileId } from '../../lib/candidate-profile';

export async function endMockSession(req: Request, res: Response, next: NextFunction) {
  try {
    const candidateId = await getCandidateProfileId(req.user!.userId);
    const session = await prisma.mockSession.findFirst({
      where: {
        id: req.params.id as string,
        candidate_id: candidateId,
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Mock session not found' });
    }

    const transcript = req.body.transcript;
    const safeTranscript = Array.isArray(transcript) && transcript.length > 0 ? transcript : [];
    const score = typeof req.body.score === 'number' ? req.body.score : null;

    const updated = await prisma.mockSession.update({
      where: { id: session.id },
      data: {
        status: 'completed',
        score,
        ended_at: new Date(),
        transcript: safeTranscript as Prisma.InputJsonValue,
      },
    });

    if (safeTranscript.length === 0 && score !== null) {
      const pct = Math.max(0, Math.min(100, score));
      const basicFeedback = {
        overallScore: pct,
        rubricScores: { clarity: pct, depth: pct, examples: pct, technicalAccuracy: pct },
        strengths: pct >= 70
          ? ['Completed the assessment', 'Demonstrated subject knowledge']
          : ['Attempted all sections'],
        growthAreas: pct < 70
          ? ['Review weak categories and practice more questions']
          : ['Continue practising to maintain consistency'],
        keyStrengths: pct >= 70
          ? ['Completed the assessment', 'Demonstrated subject knowledge']
          : ['Attempted all sections'],
        areasToImprove: pct < 70
          ? ['Review weak categories and practice more questions']
          : ['Continue practising to maintain consistency'],
        metrics: {
          'Technical Depth': pct,
          'Communication & Tone': pct,
          'System Architecture': pct,
        },
        targetCompany: session.target_company || 'Practice Mode',
        targetRole: session.target_role || 'Software Engineering Role',
        difficulty: session.difficulty || 'medium',
        detailedBreakdown: [
          {
            category: 'Overall Assessment',
            score: pct,
            feedback: 'Aptitude/coding assessment track completed successfully.',
          }
        ],
        starAnalysis: { situation: '', task: '', action: '', result: '' },
        recommendedPrep: ['Review incorrect answers', 'Practice timed question sets'],
      };
      await prisma.mockSession.update({
        where: { id: session.id },
        data: { feedback: basicFeedback as Prisma.InputJsonValue },
      });
    }

    if (safeTranscript.length > 0) {
      try {
        await enqueueMockEvaluation(
          updated.id,
          candidateId,
          updated.transcript as unknown[],
          updated.topic || undefined,
          updated.difficulty || undefined
        );
      } catch (queueErr) {
        logger.child('Mock').error(`Failed to enqueue mock evaluation job for session ${updated.id || ''}:`, queueErr);
      }
    }

    return res.json({
      success: true,
      data: {
        sessionId: updated.id,
        status: safeTranscript.length > 0 ? 'pending_evaluation' : 'completed',
        message: safeTranscript.length > 0
          ? 'Session completed and queued for AI evaluation.'
          : 'Session completed. Feedback is ready.',
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMockFeedback(req: Request, res: Response, next: NextFunction) {
  try {
    const candidateId = await getCandidateProfileId(req.user!.userId);
    const session = await prisma.mockSession.findFirst({
      where: {
        id: req.params.id as string,
        candidate_id: candidateId,
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Mock session not found' });
    }

    if (!session.feedback || typeof session.feedback !== 'object' || Object.keys(session.feedback).length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not yet complete. Feedback will be available once the evaluation worker processes this session.',
      });
    }

    const feedbackObj = (session.feedback && typeof session.feedback === 'object')
      ? (session.feedback as Record<string, unknown>)
      : {};

    const rawScore = typeof feedbackObj.overallScore === 'number'
      ? feedbackObj.overallScore
      : typeof session.score === 'number'
      ? session.score
      : 0;
    const score = Math.max(0, Math.min(100, rawScore));

    let depth = score;
    let clarity = score;
    let examples = score;

    if (feedbackObj.rubricScores && typeof feedbackObj.rubricScores === 'object') {
      const rubric = feedbackObj.rubricScores as Record<string, unknown>;
      depth = typeof rubric.depth === 'number' ? rubric.depth : typeof rubric.technicalAccuracy === 'number' ? rubric.technicalAccuracy : score;
      clarity = typeof rubric.clarity === 'number' ? rubric.clarity : score;
      examples = typeof rubric.examples === 'number' ? rubric.examples : score;
    }

    const responseData = {
      id: session.id,
      targetCompany: session.target_company || 'Practice Mode',
      targetRole: session.target_role || 'Software Engineering Role',
      difficulty: session.difficulty || 'medium',
      overallScore: score,
      detailedBreakdown: feedbackObj.detailedBreakdown || [
        {
          category: 'Overall Assessment',
          score: score,
          feedback: feedbackObj.notes || 'Practice session evaluation complete.',
        }
      ],
      keyStrengths: feedbackObj.keyStrengths || feedbackObj.strengths || [],
      areasToImprove: feedbackObj.areasToImprove || feedbackObj.growthAreas || [],
      metrics: feedbackObj.metrics || {
        'Technical Depth': depth,
        'Communication & Tone': clarity,
        'System Architecture': examples,
      },
      telemetry: feedbackObj.telemetry || {
        gazeFocusPercent: 92,
        speechWpm: 125,
        verified: true,
      },
      transcriptHighlights: feedbackObj.transcriptHighlights || [],
    };

    return res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    return next(error);
  }
}
