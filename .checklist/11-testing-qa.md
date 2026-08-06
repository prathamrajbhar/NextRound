# Checklist 11 — Testing & Quality Assurance

End-to-end test plan covering unit tests, integration tests, E2E pipeline verification, security checks, and performance validation.

---

## A. Backend Unit Tests (Express API)

- [x] Setup Jest + ts-jest for `apps/api`; configure `jest.config.ts`
- [x] **Auth middleware tests:**
  - [x] `authenticate` rejects missing cookie with 401
  - [x] `authenticate` rejects expired JWT with 401
  - [x] `requireRole('hr')` rejects candidate token with 403
  - [x] `requireOrgScope` attaches `req.orgId` from JWT (not from body)
  - [x] `requireInternalSecret` rejects wrong/missing header with 403

- [x] **RBAC isolation tests (multi-tenant):**
  - [x] HR from Org A cannot fetch jobs from Org B (returns 404, not 403)
  - [x] HR from Org A cannot fetch applications from Org B
  - [x] Candidate cannot access any `/hr/*` route (returns 403)
  - [x] Internal endpoints return 403 without secret header

- [x] **Auth endpoint tests:**
  - [x] `POST /auth/register` creates User + Organization, returns tokens
  - [x] `POST /auth/login` with wrong password returns 401
  - [x] `POST /auth/refresh` with valid refresh token rotates both tokens
  - [x] `POST /auth/logout` clears cookies

- [x] **Job CRUD tests:**
  - [x] `POST /api/v1/jobs` creates job scoped to `req.orgId` (not body org_id)
  - [x] `GET /api/v1/jobs` returns only published jobs to unauthenticated users
  - [x] `GET /api/v1/jobs` returns all statuses to org-scoped HR
  - [x] `DELETE /api/v1/jobs/:id` soft-deletes (status = 'deleted')

- [x] **Application tests:**
  - [x] Candidate cannot apply to the same job twice (returns 409)
  - [x] Candidate cannot apply to a closed job (returns 400)
  - [x] `POST /api/v1/applications` enqueues `screening-queue` job

- [x] **Zod validation tests:**
  - [x] Each endpoint returns 400 with field errors on invalid input
  - [x] Missing required fields return descriptive error messages

---

## B. Python AI Service Unit Tests (pytest)

- [x] Setup `pytest` + `pytest-asyncio` for `apps/ai-service`
- [x] **Embedding service tests:**
  - [x] `embed_text()` returns 768-dim vector
  - [x] `cosine_similarity()` returns 1.0 for identical vectors, < 0.1 for unrelated text

- [x] **JD Parser Agent tests:**
  - [x] Given raw job title → outputs rubric with weights summing to 100
  - [x] Invalid input → node raises `ValidationError`, logged to AgentLog

- [x] **Screening Agent tests:**
  - [x] Resume with all required skills → `score >= threshold` → status `screening_completed`
  - [x] Resume with missing skills → `score < threshold` → status `rejected`
  - [x] `gap_analysis` lists all missing required skills

- [x] **Evaluator Agent tests:**
  - [x] `validate_isolation` node fails if `proctor_flags` present in scoring inputs
  - [x] `validate_isolation` node fails if `engagement_index` in composite formula
  - [x] Composite score = weighted sum of component scores (deterministic)

- [x] **Decision Agent tests:**
  - [x] `score >= hire_threshold AND confidence >= 0.70` → decision = `hire`
  - [x] `score < reject_threshold` → decision = `reject`
  - [x] `confidence < 0.70` → decision = `hold_for_review`

- [x] **Mock worker tests:**
  - [x] Feedback report contains per-question coaching for all turns
  - [x] Overall score is within 0–100 range

- [x] **Sentiment service tests (bypass):**
  - [x] Transcript with 10 turns → 10 sentiment records returned
  - [x] Each record has: `tone`, `stress_score (0-100)`, `pace_estimate`

---

## C. Integration Tests (API + DB)

- [x] Use test PostgreSQL database (separate `DATABASE_URL` for test env)
- [x] Use `testcontainers` or Docker Compose for isolated test DB + Redis
- [x] Seed test data: 2 test organizations, 3 HR users, 5 candidates, 3 jobs

- [x] **End-to-end application flow:**
  - [x] Candidate registers → creates profile → applies to job → application in DB with status `applied`
  - [x] Screening queue job processes → `Evaluation.resume_score` populated → status updated
  - [x] Scheduling slots returned → candidate confirms slot → `Interview.scheduled_at` set

- [x] **End-to-end decision flow:**
  - [x] High-score application → evaluation → decision `hire` → Offer record created
  - [x] Low-score application → evaluation → decision `reject` → rejection email queued

- [x] **Internal callback security:**
  - [x] All `/internal/*` endpoints reject requests without `X-Internal-Service-Secret`
  - [x] Internal callbacks with wrong payload shape return 400

---

## D. E2E Pipeline Verification (Manual + Automated)

- [x] **Success Criteria 1 (from PRD):** Application advances from `applied` → `sourcing` → `screening_completed` → `scheduled` → `interview_completed` → `evaluation_completed` → `offered` with **zero human interventions** (auto_offer enabled job)
- [x] **Success Criteria 2:** Multi-tenant isolation — Organization A HR token cannot query Organization B resources
- [x] **Success Criteria 3:** Single `CandidateProfile` applies to 3 different jobs across 2 organizations using 1-click apply
- [x] **Success Criteria 4:** `Interview.proctor_flags` exist in DB but are absent from all `Evaluation` scoring inputs (check DB schema + decision agent input payload)
- [x] **Success Criteria 5:** Mock Interview delivers feedback report with coaching independent of any live application
- [x] **Success Criteria 6:** Resume Builder produces downloadable ATS PDF from voice session
- [x] **Success Criteria 7:** HR Round gate works — offer only released after HR marks `pass`

---

## E. Security Testing

- [x] **JWT tampering:** Modify `org_id` claim in JWT → verify API returns 403 (signature invalid)
- [x] **IDOR test:** Candidate A attempts `GET /api/v1/applications/:id` where `:id` belongs to Candidate B → returns 404
- [x] **org_id injection:** HR submits `{ org_id: "other_org_uuid" }` in request body → verify DB record uses JWT org_id
- [x] **Internal endpoint exposure:** `GET /api/v1/internal/agent-logs` from browser without secret → 403
- [x] **Rate limit test:** 15 rapid `POST /auth/login` requests → 429 after 10th
- [x] **XSS:** Submit `<script>alert(1)</script>` in job description → verify HTML-escaped in UI
- [x] **SQL injection:** Submit `'; DROP TABLE users; --` in search params → verify Prisma parameterization prevents it
- [x] **CV signal leak:** Confirm `engagement_index` and `face_count` columns are absent from `Evaluation` table and `DecisionAgent` input payload

---

## F. Performance Testing

- [x] **API latency target:** `GET /api/v1/jobs` p99 < 15ms (warm, with DB connection pooled)
- [x] **Resume embedding:** PDF parse + embed < 30 seconds (Gemini API latency included)
- [x] **Voice round-trip:** STT + LLM + TTS < 1.0 second total (local network)
- [x] **Decision agent:** Evaluation → decision → offer email < 2 minutes
- [x] Load test: 50 concurrent `POST /api/v1/applications` — no race conditions creating duplicate applications

---

## G. Frontend Quality Checks

- [x] `npm run build` passes with zero TypeScript errors (strict mode)
- [x] `npm run lint` passes with zero ESLint warnings
- [x] No `any` types in any `.ts` or `.tsx` file (`grep -r ": any" apps/web/src` returns 0)
- [x] No mock data imports in any page or component (`grep -r "from.*mockData" apps/web/src` returns 0)
- [x] All pages have loading states (Skeleton or spinner) for async data
- [x] All pages have error states for failed API calls
- [x] All pages have empty states when API returns zero results

---

## H. CI Pipeline

- [x] Create `.github/workflows/ci.yml` (or equivalent):
  - Install deps (npm ci + pip install -r requirements.txt)
  - `npm run lint` (frontend + backend TypeScript)
  - `npm run build` (all workspaces)
  - `pytest apps/ai-service/tests/` (Python unit tests)
  - Jest unit tests for `apps/api`
  - Print `ML_BYPASS` count from grep

---

## Done When

- All unit tests pass: `npm run test` and `pytest` both exit 0
- All 7 PRD success criteria verified manually
- Security tests pass: no IDOR, no org_id injection, no CV signal leak
- `npm run build` and `npm run lint` pass clean
- No mock data imports remain anywhere in `apps/web/src`
