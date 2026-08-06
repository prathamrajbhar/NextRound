# Checklist 01 — Workspace & Infrastructure Setup

Bootstrap every service from scratch so `npm run dev` starts all three apps fully wired.

---

## A. Monorepo Root

- [x] Create `package.json` at repo root with Turborepo workspaces config (`apps/*`, `packages/*`)
- [x] Create `turbo.json` with `build`, `dev`, `lint`, `test` pipeline entries and correct task dependencies
- [x] Create root `.env.example` documenting all required env vars across all services
- [x] Create root `.gitignore` (node_modules, .next, __pycache__, .env, dist, .turbo)
- [x] Create `npm run dev` that concurrently starts `apps/web`, `apps/api`, `apps/ai-service`

---

## B. Shared Packages — `packages/database`

- [x] Initialize `packages/database/package.json` with `name: "@nextround/database"`
- [x] Create `packages/database/prisma/schema.prisma` with all models from `docs/schema.md`:
  - [x] `User` model (id, email, password_hash, role, org_id, created_at)
  - [x] `Organization` model (id, name, slug, settings JSON, auto_offer, created_at)
  - [x] `Job` model (id, org_id, title, description, rubric JSON, thresholds JSON, pipeline toggles, status, embedding vector)
  - [x] `CandidateProfile` model (id, user_id, resume_url, skills, embedding vector, target_role, compensation)
  - [x] `Application` model (id, job_id, candidate_id, status enum, scores JSON, created_at)
  - [x] `Evaluation` model (id, application_id, composite_score, confidence, bias_report JSON, decision)
  - [x] `Interview` model (id, application_id, type, transcript, proctor_flags JSON, engagement_signal, audio_url)
  - [x] `AgentLog` model (id, queue, job_id, status, error, created_at)
  - [x] `MockSession` model (id, candidate_id, topic, feedback JSON, score, created_at)
  - [x] `PrepContent` model (id, org_id, job_id, content_type, content JSON)
- [x] Enable `pgvector` extension in schema (`extensions = [pgvector]`)
- [x] Add HNSW index on `Job.embedding` and `CandidateProfile.embedding` (768-dim)
- [x] Run `npx prisma migrate dev --name init` against local PostgreSQL 16
- [x] Run `npx prisma generate` to emit typed client
- [x] Export `PrismaClient` singleton from `packages/database/src/index.ts`

---

## C. Shared Packages — `packages/shared`

- [x] Initialize `packages/shared/package.json` with `name: "@nextround/shared"`
- [x] Create TypeScript interfaces for all API request/response shapes (from `docs/api.md`)
- [x] Create Zod schemas mirroring every API payload (login, register, job create, application, evaluation, etc.)
- [x] Export shared enum definitions: `ApplicationStatus`, `UserRole`, `DecisionType`, `InterviewType`, `AssessmentCategory`
- [x] Create `ApiEnvelope<T>` type: `{ success: boolean; data: T; error?: string }`
- [x] Wire tsconfig extends from `packages/config/tsconfig.base.json`

---

## D. Shared Packages — `packages/config`

- [x] Initialize `packages/config/package.json` with `name: "@nextround/config"`
- [x] Create `packages/config/tsconfig.base.json` (strict mode, ES2022, noImplicitAny, no any)
- [x] Create `packages/config/eslint.config.mjs` (shared ESLint rules for TS + React)
- [x] Create `packages/config/tailwind.config.ts` preset (dark mode, custom HSL palette)

---

## E. Backend API — `apps/api` Scaffold

- [x] Initialize `apps/api/package.json` with all locked deps: Express 5.2.1, TypeScript 6, Zod 4.4.3, Prisma 7.9, BullMQ 5.80.9, Nodemailer 8, jsonwebtoken, bcryptjs, multer, @aws-sdk/client-s3
- [x] Create `apps/api/tsconfig.json` extending `packages/config`
- [x] Create `apps/api/src/index.ts` — Express app entry: middleware setup, route mounting, port 4000
- [x] Create `apps/api/src/lib/prisma.ts` — import singleton from `@nextround/database`
- [x] Create `apps/api/src/lib/redis.ts` — Redis client singleton (ioredis)
- [x] Create `apps/api/src/lib/bullmq.ts` — queue factory for all 10 BullMQ channels
- [x] Create `apps/api/src/lib/jwt.ts` — sign/verify access + refresh tokens
- [x] Create `apps/api/src/lib/mailer.ts` — Nodemailer SMTP transport setup
- [x] Create `apps/api/src/lib/s3.ts` — S3/MinIO client, upload/download helpers
- [x] Create `apps/api/src/middleware/auth.ts` — JWT cookie extraction + verification
- [x] Create `apps/api/src/middleware/rbac.ts` — role guard (`requireRole('hr' | 'candidate')`)
- [x] Create `apps/api/src/middleware/orgScope.ts` — derive + attach `org_id` from JWT; never from body
- [x] Create `apps/api/src/middleware/internalSecret.ts` — validate `X-Internal-Service-Secret` header
- [x] Create `apps/api/src/middleware/errorHandler.ts` — global Express error handler returning `ApiEnvelope`
- [x] Create `.env` with: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `INTERNAL_SERVICE_SECRET`, `SMTP_*`, `S3_*`, `GEMINI_API_KEY`, `GROQ_API_KEY`
- [x] Add `apps/api/src/app.ts` dev script with `ts-node-dev` or `tsx --watch`

---

## F. AI Service — `apps/ai-service` Scaffold

- [x] Create `apps/ai-service/requirements.txt` with locked deps: fastapi==0.139.2, uvicorn==0.50, langgraph, google-genai==2.10, groq==1.5, piper-tts or coqui-tts, httpx, pydantic, redis, python-multipart, boto3
- [x] Create `apps/ai-service/pyproject.toml` (or `setup.py`) with Python 3.13 target
- [x] Create `apps/ai-service/main.py` — FastAPI app entry, router mounting, startup event
- [x] Create `apps/ai-service/.env` with: `GEMINI_API_KEY`, `GROQ_API_KEY`, `INTERNAL_SERVICE_SECRET`, `EXPRESS_API_BASE_URL`, `REDIS_URL`, `S3_*`
- [x] Create `apps/ai-service/core/config.py` — pydantic Settings loading from env
- [x] Create `apps/ai-service/core/redis_client.py` — async Redis connection
- [x] Create `apps/ai-service/core/http_client.py` — async httpx client for Express callbacks
- [x] Create `apps/ai-service/workers/` directory — one BullMQ-compatible worker file per queue
- [x] Register FastAPI startup event to launch all BullMQ worker threads

---

## G. Frontend — `apps/web` Wiring

- [x] Create `apps/web/src/lib/api.ts` — base `fetch` wrapper with JWT cookie, `ApiEnvelope<T>` typing, error handling
- [x] Create `apps/web/.env.local` with `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1`
- [x] Verify `apps/web/tsconfig.json` extends `packages/config` base
- [x] Update `apps/web/next.config.ts` — add API proxy rewrite rule (or confirm CORS)

---

## H. Dev Startup Verification

- [x] `npm run dev` starts all three apps without errors
- [x] `GET http://localhost:4000/api/v1/health` returns `{ success: true, data: { status: "ok" } }`
- [x] `GET http://localhost:3000` loads Next.js home page
- [x] `GET http://localhost:8000/health` returns FastAPI health response
- [x] PostgreSQL connection verified via Prisma `$connect()`
- [x] Redis connection verified via BullMQ ping
