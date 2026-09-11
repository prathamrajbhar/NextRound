import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { requireOrgScope, rejectOrgIdParam } from '../../middleware/orgScope';
import {
  listJobs,
  listOrgJobs,
  getJob,
} from './jobs-query.controller';
import {
  createJob,
  updateJob,
  publishJob,
  closeJob,
  deleteJob,
} from './jobs-mutation.controller';
import { extractRequirements, aiAssistJob } from './jobs-ai.controller';
import { getJobPipeline, getJobApplications } from './jobs-pipeline.controller';

export const jobRouter = Router();

jobRouter.use(rejectOrgIdParam);

jobRouter.post('/', authenticate, requireRole('hr'), requireOrgScope, createJob);
jobRouter.get('/', authenticate, listJobs);
jobRouter.get('/org', authenticate, requireRole('hr'), requireOrgScope, listOrgJobs);
jobRouter.get('/:id', authenticate, getJob);
jobRouter.patch('/:id', authenticate, requireRole('hr'), requireOrgScope, updateJob);
jobRouter.put('/:id', authenticate, requireRole('hr'), requireOrgScope, updateJob);
jobRouter.post('/:id/publish', authenticate, requireRole('hr'), requireOrgScope, publishJob);
jobRouter.post('/:id/close', authenticate, requireRole('hr'), requireOrgScope, closeJob);
jobRouter.delete('/:id', authenticate, requireRole('hr'), requireOrgScope, deleteJob);

jobRouter.post('/extract-requirements', authenticate, requireRole('hr'), extractRequirements);
jobRouter.post('/:id/ai-assist', authenticate, requireRole('hr'), requireOrgScope, aiAssistJob);
jobRouter.get('/:id/pipeline', authenticate, requireRole('hr'), requireOrgScope, getJobPipeline);
jobRouter.get('/:id/applications', authenticate, requireRole('hr'), requireOrgScope, getJobApplications);
