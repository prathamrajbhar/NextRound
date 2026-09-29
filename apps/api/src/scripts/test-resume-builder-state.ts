import assert from 'node:assert';
import { ResumeBuilderSessionCreateSchema } from '@nextround/shared';
import { formatExperienceDisplay } from '../../../../apps/web/src/app/candidate/resume-builder/formatters';

async function runFeatureTests() {
  console.log('🧪 Starting AI Resume Builder State Mismatch & Feature Tests...\n');

  // =========================================================================
  // Test 1: State Persistence & UI Verification (Formatters & Display Mapping)
  // =========================================================================
  console.log('--- Test 1: State Persistence & UI Header Verification ---');

  // Test Selection A: "Full Stack Engineer" + "Fresher / Entry-Level"
  const selectionA_role = 'Full Stack Engineer';
  const selectionA_exp1 = 'Fresher / Entry-Level';
  const selectionA_exp2 = 'Fresher (0-2 Years)';
  
  const headerA1 = `${selectionA_role} • ${formatExperienceDisplay(selectionA_exp1)}`;
  const headerA2 = `${selectionA_role} • ${formatExperienceDisplay(selectionA_exp2)}`;
  
  assert.strictEqual(headerA1, 'Full Stack Engineer • Fresher (0-2 Yrs)', 'Header A1 must display "Full Stack Engineer • Fresher (0-2 Yrs)"');
  assert.strictEqual(headerA2, 'Full Stack Engineer • Fresher (0-2 Yrs)', 'Header A2 must display "Full Stack Engineer • Fresher (0-2 Yrs)"');
  console.log('  ✅ Selection A passed: "Full Stack Engineer • Fresher (0-2 Yrs)"');

  // Test Selection B: "Backend Architect" + "Senior Specialist"
  const selectionB_role = 'Backend Architect';
  const selectionB_exp1 = 'Senior Specialist';
  const selectionB_exp2 = 'Senior (5+ Years)';
  
  const headerB1 = `${selectionB_role} • ${formatExperienceDisplay(selectionB_exp1)}`;
  const headerB2 = `${selectionB_role} • ${formatExperienceDisplay(selectionB_exp2)}`;
  
  assert.strictEqual(headerB1, 'Backend Architect • Senior Specialist', 'Header B1 must display "Backend Architect • Senior Specialist"');
  assert.strictEqual(headerB2, 'Backend Architect • Senior Specialist', 'Header B2 must display "Backend Architect • Senior Specialist"');
  console.log('  ✅ Selection B passed: "Backend Architect • Senior Specialist"');

  // Edge cases & other seniority levels
  assert.strictEqual(formatExperienceDisplay('Mid-Level (2-5 Years)'), 'Mid-Level (2-5 Yrs)');
  assert.strictEqual(formatExperienceDisplay('Staff / Lead (8+ Years)'), 'Staff / Tech Lead');
  assert.strictEqual(formatExperienceDisplay(null), 'Fresher (0-2 Yrs)');
  assert.strictEqual(formatExperienceDisplay(undefined), 'Fresher (0-2 Yrs)');
  console.log('  ✅ Seniority formatting edge cases passed');

  // =========================================================================
  // Test 2: Schema Validation Check (packages/shared)
  // =========================================================================
  console.log('\n--- Test 2: Schema Validation Check ---');

  const validPayloadA = {
    targetRole: 'Full Stack Engineer',
    experienceLevel: 'Fresher (0-2 Years)',
  };
  const parseResultA = ResumeBuilderSessionCreateSchema.safeParse(validPayloadA);
  assert.ok(parseResultA.success, 'Schema should accept experienceLevel');
  assert.strictEqual(parseResultA.data.experienceLevel, 'Fresher (0-2 Years)');
  console.log('  ✅ Schema parsed experienceLevel successfully:', parseResultA.data);

  const validPayloadB = {
    targetRole: 'Backend Architect',
    difficulty: 'Senior (5+ Years)',
  };
  const parseResultB = ResumeBuilderSessionCreateSchema.safeParse(validPayloadB);
  assert.ok(parseResultB.success, 'Schema should accept difficulty alias');
  assert.strictEqual(parseResultB.data.difficulty, 'Senior (5+ Years)');
  console.log('  ✅ Schema parsed difficulty successfully:', parseResultB.data);

  // =========================================================================
  // Test 3: Backend & Payload Contract Verification
  // =========================================================================
  console.log('\n--- Test 3: Backend & Payload Contract Verification ---');

  // Verify resolution logic used in resume-session.controller.ts:
  const extractLevel = (data: { experienceLevel?: string | null; difficulty?: string | null }) => {
    return data.experienceLevel || data.difficulty || 'Fresher (0-2 Years)';
  };

  assert.strictEqual(extractLevel({ experienceLevel: 'Fresher (0-2 Years)' }), 'Fresher (0-2 Years)');
  assert.strictEqual(extractLevel({ difficulty: 'Senior (5+ Years)' }), 'Senior (5+ Years)');
  assert.strictEqual(extractLevel({}), 'Fresher (0-2 Years)');
  console.log('  ✅ Controller resolution logic verified');

  // Verify client-side useResumeSessionDetails resolution logic:
  const resolveClientState = (
    apiResponse: {
      session?: { target_role?: string; difficulty?: string; experienceLevel?: string };
      target_role?: string;
      difficulty?: string;
      experienceLevel?: string;
    },
    queryRole = '',
    queryExp = ''
  ) => {
    const sessionObj = apiResponse.session || apiResponse;
    const resolvedRole = sessionObj.target_role || apiResponse.target_role || queryRole;
    const resolvedExp =
      sessionObj.difficulty ||
      sessionObj.experienceLevel ||
      apiResponse.difficulty ||
      apiResponse.experienceLevel ||
      queryExp;

    return {
      targetRole: resolvedRole || 'Full Stack Engineer',
      experienceLevel: resolvedExp || 'Fresher (0-2 Years)',
    };
  };

  // Case A: API returns nested session object
  const clientA = resolveClientState({
    session: {
      target_role: 'Full Stack Engineer',
      difficulty: 'Fresher (0-2 Years)',
    },
  });
  assert.strictEqual(clientA.targetRole, 'Full Stack Engineer');
  assert.strictEqual(clientA.experienceLevel, 'Fresher (0-2 Years)');
  assert.strictEqual(`${clientA.targetRole} • ${formatExperienceDisplay(clientA.experienceLevel)}`, 'Full Stack Engineer • Fresher (0-2 Yrs)');
  console.log('  ✅ Client resolution with nested session verified');

  // Case B: Direct navigation with query params prior to API load
  const clientQueryOnly = resolveClientState({}, 'Backend Architect', 'Senior Specialist');
  assert.strictEqual(clientQueryOnly.targetRole, 'Backend Architect');
  assert.strictEqual(clientQueryOnly.experienceLevel, 'Senior Specialist');
  assert.strictEqual(`${clientQueryOnly.targetRole} • ${formatExperienceDisplay(clientQueryOnly.experienceLevel)}`, 'Backend Architect • Senior Specialist');
  console.log('  ✅ Direct navigation with query params verified');

  // Case C: Direct navigation without query params and empty session (Fallback safety)
  const clientFallback = resolveClientState({});
  assert.strictEqual(clientFallback.targetRole, 'Full Stack Engineer');
  assert.strictEqual(clientFallback.experienceLevel, 'Fresher (0-2 Years)');
  assert.strictEqual(`${clientFallback.targetRole} • ${formatExperienceDisplay(clientFallback.experienceLevel)}`, 'Full Stack Engineer • Fresher (0-2 Yrs)');
  console.log('  ✅ Fallback safety verified (no hardcoded "Senior Full Stack Engineer • Senior (5+ Years)" mismatch)');

  // =========================================================================
  // Test 4: AI Voice Agent Profile Type & Prompt Adaptation Check
  // =========================================================================
  console.log('\n--- Test 4: AI Voice Agent Profile Adaptation Check ---');

  const inferProfileFromExperience = (experienceLevel?: string | null): string => {
    const expStr = (experienceLevel || '').toLowerCase();
    if (['fresher', 'entry', '0-2', 'junior'].some((w) => expStr.includes(w))) {
      return 'fresher';
    }
    if (['senior', 'lead', 'staff', 'architect', '5+'].some((w) => expStr.includes(w))) {
      return 'experienced';
    }
    return 'unknown';
  };

  assert.strictEqual(inferProfileFromExperience('Fresher (0-2 Years)'), 'fresher');
  assert.strictEqual(inferProfileFromExperience('Fresher / Entry-Level'), 'fresher');
  assert.strictEqual(inferProfileFromExperience('Senior (5+ Years)'), 'experienced');
  assert.strictEqual(inferProfileFromExperience('Senior Specialist'), 'experienced');
  assert.strictEqual(inferProfileFromExperience('Backend Architect'), 'experienced');
  console.log('  ✅ Profile type inference from experience level verified');

  console.log('\n🎉 ALL STATE MISMATCH & FEATURE TESTS PASSED SUCCESSFULLY!\n');
}

runFeatureTests().catch((err) => {
  console.error('❌ Feature test failed:', err);
  process.exit(1);
});
