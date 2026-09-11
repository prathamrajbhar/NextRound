import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

export async function getApplicationOnboarding(req: Request, res: Response, next: NextFunction) {
  try {
    const appId = req.params.id as string;

    const application = await prisma.application.findUnique({
      where: { id: appId },
      include: {
        candidate: { include: { user: true } },
        job: { include: { organization: true } },
        offer: true,
      },
    });

    if (!application || application.candidate.user_id !== req.user!.userId) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (
      application.status !== 'decided' &&
      application.status !== 'offered' &&
      application.status !== 'accepted'
    ) {
      return res.status(404).json({ success: false, error: 'Onboarding is not active for this application stage' });
    }

    const candidateName = application.candidate.user.email.split('@')[0];
    const startDate = application.offer?.start_date
      ? application.offer.start_date.toISOString().split('T')[0]
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const defaultTasks = [
      {
        id: 'task-1',
        title: 'Sign Digital Offer Letter & NDA',
        description: 'Review compensation package and submit electronic signature',
        category: 'paperwork',
        owner: 'New Hire',
        status: application.offer?.status === 'accepted' ? 'completed' : 'pending',
        dueDate: startDate,
      },
      {
        id: 'task-2',
        title: 'Submit Tax & Identity Verification Documents',
        description: 'Upload W-4/I-9 or national ID documents for HR background check',
        category: 'paperwork',
        owner: 'New Hire',
        status: 'pending',
        dueDate: startDate,
      },
      {
        id: 'task-3',
        title: 'Select Work Hardware & Peripheral Setup',
        description: 'Configure developer laptop (MacBook Pro / ThinkPad) and monitor accessories',
        category: 'equipment',
        owner: 'IT',
        status: 'in_progress',
        dueDate: startDate,
      },
      {
        id: 'task-4',
        title: 'Complete Corporate Email & SSO Security Provisioning',
        description: 'Set up 2FA, 1Password vault, and GitHub team permissions',
        category: 'access',
        owner: 'IT',
        status: 'pending',
        dueDate: startDate,
      },
      {
        id: 'task-5',
        title: 'Day-1 Intro Sync with Onboarding Buddy',
        description: 'Meet your assigned engineering peer for architecture overview',
        category: 'social',
        owner: 'HR',
        status: 'pending',
        dueDate: startDate,
      },
    ];

    const completedCount = defaultTasks.filter((taskItem) => taskItem.status === 'completed').length;
    const progressPercent = Math.round((completedCount / defaultTasks.length) * 100);

    const onboardingRecord = {
      id: `onboard-${application.id}`,
      applicationId: application.id,
      candidateName,
      candidateAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidateName}`,
      jobTitle: application.job.title,
      orgName: application.job.organization.name,
      startDate,
      buddyName: null,
      managerName: null,
      progressPercent,
      tasks: defaultTasks,
    };

    return res.json({
      success: true,
      data: onboardingRecord,
    });
  } catch (error) {
    return next(error);
  }
}
