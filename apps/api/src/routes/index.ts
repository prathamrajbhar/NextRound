import { Router } from 'express';
import { authRouter } from './auth/auth.routes';
import { candidateRouter } from './candidate/candidate.routes';
import { mockRouter } from './candidate/mock.routes';
import { resumeBuilderRouter } from './candidate/resume-builder.routes';
import { hrRouter } from './hr/hr.routes';
import { analyticsRouter } from './hr/analytics.routes';
import { sentimentRouter } from './hr/sentiment.routes';
import { talentPoolRouter } from './hr/talent-pool.routes';
import { jobRouter } from './jobs/job.routes';
import { applicationRouter } from './applications/application.routes';
import { interviewRouter } from './interviews/interview.routes';
import { prepRouter } from './prep/prep.routes';
import { organizationRouter } from './organization/organization.routes';
import { internalRouter } from './internal/internal.routes';
import { notificationRouter } from './common/notification.routes';
import { userRouter } from './common/user.routes';
import { codingRouter } from './coding/coding.routes';
import { proctoringRouter } from './proctoring/proctoring.routes';

export const apiRouter = Router();

// Domain-driven API v1 Route Mounts
apiRouter.use('/auth', authRouter);
apiRouter.use('/organizations', organizationRouter);
apiRouter.use('/jobs', jobRouter);
apiRouter.use('/applications', applicationRouter);
apiRouter.use('/coding', codingRouter);
apiRouter.use('/candidate', candidateRouter);
apiRouter.use('/proctoring', proctoringRouter);

apiRouter.use('/hr/analytics', analyticsRouter);
apiRouter.use('/hr/sentiment', sentimentRouter);
apiRouter.use('/hr/talent-pool', talentPoolRouter);
apiRouter.use('/hr', hrRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/interviews', interviewRouter);
apiRouter.use('/mock', mockRouter);
apiRouter.use('/resume-builder', resumeBuilderRouter);
apiRouter.use('/prep', prepRouter);
apiRouter.use('/internal', internalRouter);
apiRouter.use('/', userRouter);
