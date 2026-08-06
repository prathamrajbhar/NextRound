# CLAUDE.md

## Project
- **Name**: NextRound / HireOS
- **Description**: AI-native recruitment marketplace with zero-human-step hiring pipeline (sourcing, screening, voice interview, evaluator + bias audit, decision, offer) and candidate prep/mock interview layer.
- **Documentation**: Full specs in `docs/` — `prd.md` (product), `architecture.md` (system), `features.md` (feature specs + agent triggers), `api.md` (all REST endpoints), `screens.md` (all screens + components), `schema.md` (Prisma schema), `agents.md` (per-agent LangGraph specs).

## Stack (LOCKED — do not substitute)
- **Frontend**: Next.js 16.2.11 (App Router), React 19.2.8, TypeScript 6.0, Tailwind CSS 4.3.3, Lucide React 1.23, WebRTC, MediaPipe (client-side CV)
- **Backend API**: Express.js 5.2.1, TypeScript 6.0, Zod 4.4.3, Prisma ORM 7.9.0, PostgreSQL 16 + pgvector, Custom JWT
- **AI Service**: Python 3.13, FastAPI 0.139.2, Uvicorn 0.50, LangGraph, Gemini API (`google-genai` SDK v2.10), Groq API v1.5 (Whisper-large-v3 STT), Piper/Coqui TTS
- **Infra & Queues**: Turborepo 2.10, BullMQ 5.80.9 + Redis 8, Nodemailer 8, S3/MinIO

## Commands
- `npm run dev` — Start web, api, and ai-service concurrently
- `npm run build` — Build all workspace apps and packages
- `npm run lint` — Lint and typecheck monorepo
- `npm run test` — Execute test suite
- `npx prisma migrate dev` / `npx prisma generate` — Manage DB migrations and client generation

## Folder conventions
- `apps/web`: Next.js 16 App Router frontend (Public, Candidate Portal, HR Portal, Voice Assessment Console)
- `apps/api`: Express.js 5 REST API (`/api/v1`) with BullMQ job producers
- `apps/ai-service`: Python FastAPI 0.139 + LangGraph agent orchestration
- `packages/database`: Prisma 7 schema and database client export
- `packages/shared`: Shared TypeScript types, Zod schemas, API payload contracts
- `packages/config`: Shared ESLint, TypeScript, and Tailwind configurations
- `docs/`: Comprehensive project documentation files
- `.claude/skills/`: Task procedures & skills

## Database
- PostgreSQL 16 + pgvector with Prisma ORM 7.
- Tables: `User`, `Organization`, `Job`, `CandidateProfile`, `Application`, `Evaluation`, `Interview`, `AgentLog`, `MockSession`, `PrepContent`.
- Multi-tenancy: `org_id` scopes HR data; `CandidateProfile` is platform-wide and candidate-owned.

## RBAC (the reviewer talking point)
- Roles: `hr` (org-scoped) vs `candidate` (platform-wide).
- HR access strictly scoped server-side using JWT-derived `org_id`.
- MediaPipe CV runs client-side; proctoring signals are logged for HR audit only and strictly excluded from Decision Agent scoring logic.

## CRUD & forms
- Standard API Envelope: `{ "success": boolean, "data": ..., "error": ... }`.
- Async execution pattern: Express API validates request -> enqueues BullMQ job -> Python AI service processes job -> calls back internal Express webhooks (`/api/v1/internal/*`).

## Config-driven surfaces (extensibility contract)
- Job-level scoring rubrics and thresholds defined via JSON configs in `Job`.
- Organization-level settings: auto-offer toggle, email templates, availability hours.

## Design
- Production-grade dark mode by default with custom HSL color palettes and micro-animations.
- Interactive voice assessment console featuring voice status orb (`Speaking`, `Listening`, `Analyzing`, `Idle`), live subtitles, and proctoring HUD telemetry.

## Coding standards
- TypeScript strict mode (`noImplicitAny`, zero `any` usage).
- Maximum 200 lines per component file; separate concerns into routes, components, lib, hooks, types, services.

## Verification (nothing ships untested)
- Run `npm run lint` and `npm run build` prior to shipping.
- Verify multi-tenant org isolation boundaries and zero CV signal leakage into decision scoring functions.

## Build-day sync — DONE at 9:30 (carpooling)
- All 8 core hiring agents and candidate mock/prep layer integrated and documented.

---

## Skills & Configuration (.claude / .skills)
- **`.claude/skills/`**: Stores auto-loading procedures and task-specific workflows (`design-standards`, `drizzle-schema`, `generic-crud`, `project-type-picker`, `qa-verify`, `rbac-guard`, `reviewer-doc`).
- **`CLAUDE.md`**: Contains core repo facts, locked versions, and section rules. Detailed procedural guidance is kept inside `.claude/skills/` or `docs/` rather than over-inlining in `CLAUDE.md`.

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
