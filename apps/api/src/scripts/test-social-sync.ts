import { prisma } from '../lib/prisma';
import { syncCandidateSocialProfiles, persistSocialSyncOutcome } from '../services/social-sync.service';
import { logger } from '../lib/logger';

// Configure logging level
logger.level = 'debug';

async function warmupDatabase(retries = 5, delayMs = 3000): Promise<void> {
  console.log('🔌 Warming up database / checking connection...');
  for (let i = 1; i <= retries; i++) {
    try {
      // Run a simple lightweight query to wake up Neon serverless compute
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database is awake and connected!');
      return;
    } catch (err) {
      console.warn(`⚠️ Database warmup attempt ${i}/${retries} failed: ${err instanceof Error ? err.message : String(err)}`);
      if (i === retries) {
        throw new Error('Could not connect to database after maximum retries. Neon compute might be down.');
      }
      console.log(`Waiting ${delayMs / 1000}s before next attempt...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function main() {
  console.log('🚀 Starting Social Sync integration test...');
  let testUser: any = null;

  try {
    // 1. Warm up the database first to handle Neon serverless compute sleeping / cold starts
    await warmupDatabase();

    // 2. Perform synchronization
    const githubUser = 'prathamrajbhar';
    const linkedinUser = 'prathamrajbhar';

    console.log(`Fetching profile sync for GitHub: ${githubUser} and LinkedIn: ${linkedinUser}...`);
    const socialData = await syncCandidateSocialProfiles(githubUser, linkedinUser);

    console.log('Sync response received. Analyzing syncs list:');
    console.log(JSON.stringify(socialData.syncs, null, 2));

    // 3. Verify sync outcomes structurally
    const githubSync = socialData.syncs.find((s) => s.source === 'github');
    const linkedinSync = socialData.syncs.find((s) => s.source === 'linkedin');

    if (!githubSync) {
      throw new Error('❌ Test Failed: GitHub sync outcome was not returned.');
    }
    if (!linkedinSync) {
      throw new Error('❌ Test Failed: LinkedIn sync outcome was not returned.');
    }

    console.log('✅ GitHub and LinkedIn outcomes returned.');

    // 4. Create temporary test candidate
    const testEmail = `temp-test-candidate-${Date.now()}@example.com`;
    console.log(`Setting up test user with email: ${testEmail}...`);

    testUser = await prisma.user.create({
      data: {
        email: testEmail,
        password_hash: 'hashedpassword',
        role: 'candidate',
      },
    });

    const testCandidate = await prisma.candidateProfile.create({
      data: {
        user_id: testUser.id,
        full_name: 'Test Candidate',
        data_consent: true,
        data_consent_at: new Date(),
      },
    });

    console.log(`✅ Test User and Candidate Profile created. Candidate ID: ${testCandidate.id}`);

    // 5. Verify DB storage
    console.log('Persisting sync outcomes to the database...');
    for (const outcome of socialData.syncs) {
      await persistSocialSyncOutcome(testCandidate.id, outcome);
      console.log(`✅ Persisted ${outcome.source} outcome.`);
    }

    // 6. Query DB to verify persistence and values
    console.log('Verifying DB entries...');
    const dbSyncs = await prisma.socialProfileSync.findMany({
      where: { candidate_id: testCandidate.id },
    });

    if (dbSyncs.length !== 2) {
      throw new Error(`❌ Test Failed: Expected 2 DB entries, found ${dbSyncs.length}`);
    }

    for (const sync of dbSyncs) {
      console.log(`Checking DB record for source: ${sync.source}`);
      if (sync.status !== 'synced') {
        console.warn(`⚠️ Warning: Sync status is '${sync.status}' instead of 'synced'. Scraper message: ${sync.error}`);
      } else {
        console.log(`✅ ${sync.source} status is 'synced'.`);
      }

      if (!sync.username) {
        throw new Error(`❌ Test Failed: DB record for ${sync.source} has empty username.`);
      }

      if (sync.status === 'synced' && !sync.normalized_data) {
        throw new Error(`❌ Test Failed: DB record for ${sync.source} has status 'synced' but no normalized_data.`);
      }

      console.log(`✅ Verified DB entry for ${sync.source}`);
    }

    console.log('🎉 Integration tests completed successfully!');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    process.exitCode = 1;
  } finally {
    // 7. Cleanup test records
    if (testUser) {
      console.log('Cleaning up test records from database...');
      try {
        await prisma.user.delete({ where: { id: testUser.id } });
        console.log('✅ Cleanup complete.');
      } catch (cleanupErr) {
        console.error('❌ Failed to clean up test user:', cleanupErr);
      }
    }
    await prisma.$disconnect();
  }
}

main();
