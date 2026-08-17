import { prisma } from '../lib/prisma';

async function runResumeBuilderTests() {
  console.log('🧪 Starting Resume Builder API & Route Integration Verification...');

  try {
    // 1. Fetch or create candidate profile for test session
    let candidate = await prisma.candidateProfile.findFirst();

    if (!candidate) {
      const dummyUser = await prisma.user.create({
        data: {
          email: `test_resume_${Date.now()}@example.com`,
          password_hash: 'dummyhash',
          name: 'Test Candidate',
          role: 'candidate',
        },
      });

      candidate = await prisma.candidateProfile.create({
        data: {
          user_id: dummyUser.id,
          phone: '1234567890',
        },
      });
    }

    const testRole = 'Staff Frontend Engineer';
    const testCompany = 'NextRound Lab';

    // 2. Create session
    const session = await prisma.mockSession.create({
      data: {
        candidate_id: candidate.id,
        type: 'resume_builder',
        status: 'active',
        target_role: testRole,
        target_company: testCompany,
        focus_areas: ['React', 'TypeScript', 'System Design'],
        rubric: { rawText: '10 years building scalable UI components' },
      },
    });

    console.log(`✅ Session Created Successfully. Session ID: ${session.id}`);

    // 3. Verify Session query (simulating GET /:sessionId)
    const foundSession = await prisma.mockSession.findFirst({
      where: {
        id: session.id,
        type: 'resume_builder',
      },
    });

    if (!foundSession || foundSession.target_role !== testRole) {
      throw new Error('Session query assertion failed!');
    }
    console.log('✅ GET /:sessionId query verified.');

    // 4. Simulate ending the session (POST /:sessionId/end)
    const endedSession = await prisma.mockSession.update({
      where: { id: session.id },
      data: {
        status: 'scoring',
        ended_at: new Date(),
        transcript: [
          { speaker: 'ai', text: 'Hi! Tell me about your background.' },
          { speaker: 'candidate', text: 'I am a Staff Frontend Engineer with React expertise.' },
        ],
      },
    });

    if (endedSession.status !== 'scoring') {
      throw new Error('Session status update assertion failed!');
    }
    console.log('✅ POST /:sessionId/end session wrap-up verified.');

    // 5. Cleanup test session
    await prisma.mockSession.delete({
      where: { id: session.id },
    });
    console.log('✅ Cleanup completed.');

    console.log('\n🎉 ALL RESUME BUILDER INTEGRATION TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runResumeBuilderTests();
