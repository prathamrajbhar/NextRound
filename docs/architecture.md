# NextRound — Technical Architecture

NextRound uses a decoupled 4-tier architecture: a Next.js frontend, an Express.js REST API, a BullMQ/Redis async queue, and a Python FastAPI AI service. Long-running AI agent workloads are fully isolated from fast user-facing API responses.

---

## 1. Monorepo Structure

```
NextRound/
├── apps/
│   ├── web/              # Next.js 16.2.11 App Router frontend
│   ├── api/              # Express.js 5.2.1 REST API
│   └── ai-service/       # Python 3.13 FastAPI + LangGraph agents
├── packages/
│   ├── database/         # Prisma 7.9 schema + generated client export
│   ├── shared/           # TypeScript types, Zod schemas, API payload contracts
│   └── config/           # Shared ESLint, TypeScript, and Tailwind configurations
├── docs/                 # Project documentation
├── CLAUDE.md             # Repo conventions and coding standards
└── turbo.json            # Turborepo pipeline configuration
```

**Turborepo** (`turbo.json`) manages build, dev, lint, and test pipelines across all workspaces. Running `npm run dev` from the root starts all three app services concurrently.

---

## 2. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Next.js 16.2.11 App Router (apps/web)                  │
│  Public Portal · Candidate Portal · HR Portal           │
│  WebRTC · MediaPipe CV (client-side) · Monaco Editor    │
└────────────────────────────┬────────────────────────────┘
                             │ HTTPS / REST (JWT Auth)
                             ▼
┌─────────────────────────────────────────────────────────┐
│  Express.js 5.2.1 Core REST API (apps/api)              │
│  Auth · RBAC · CRUD · Validation (Zod) · BullMQ Enqueue │
└───────────┬─────────────────────────────┬───────────────┘
            │ Prisma 7.9 ORM              │ Enqueue Job
            ▼                             ▼
┌────────────────────────┐    ┌───────────────────────────┐
│ PostgreSQL 16          │    │ BullMQ 5.80 + Redis 8     │
│ + pgvector extension   │    │ 10 async queue channels   │
│ (Single source of truth│    │ Exponential backoff retry │
└───────────▲────────────┘    └────────────┬──────────────┘
            │ Internal Callbacks           │ Pulls Jobs
            │ /api/v1/internal/*           ▼
            └──────────────────┬──────────────────────────┐
                               │ Python 3.13 AI Engine    │
                               │ FastAPI 0.139.2          │
                               │ LangGraph Agent Graphs   │
                               └────────────┬─────────────┘
                                            │ External APIs
                      ┌─────────────────────┼──────────────────────┐
                      ▼                     ▼                      ▼
              Gemini API v2.10      Groq Whisper STT        pgvector Cosine
              (Reasoning/Scoring)   + Piper/Coqui TTS       Vector Search
```

---

## 3. Service Responsibilities

### 3.1 Next.js 16.2.11 Frontend (`apps/web`)

- Implements all UI using the App Router with server and client components.
- Manages WebRTC audio/video connections for voice interviews and HR video calls.
- Runs MediaPipe computer vision models client-side (WebAssembly) for proctoring telemetry.
- Hosts Monaco/CodeMirror interactive coding editor for the coding assessment console.
- Communicates exclusively with `apps/api` — never calls the Python service directly.

### 3.2 Express.js 5.2.1 REST API (`apps/api`)

- Handles all synchronous request/response cycles: authentication, RBAC enforcement, CRUD, and validation.
- Derives `org_id` from the verified JWT payload on every HR request; never from user-supplied params.
- Reads and writes all Postgres data via Prisma 7.9 — the **only** service that touches the database directly.
- Enqueues long-running tasks into BullMQ. Express never executes LLM calls directly.
- Exposes secured `/api/v1/internal/*` endpoints exclusively for Python AI service callbacks.

### 3.3 BullMQ 5.80 + Redis 8 (Async Queue)

- Decouples API request latency from AI processing time (LLM calls can take 5s–3min).
- Manages 10 queue channels with dedicated worker concurrency settings.
- Failed jobs retry with exponential backoff (3 attempts max) before logging to `AgentLog`.

### 3.4 Python 3.13 AI Service (`apps/ai-service`)

- Executes LangGraph state machine agent graphs for all AI pipeline stages.
- Performs Gemini 2.10 reasoning and local resume vector embedding generation (FastEmbed ONNX `BAAI/bge-base-en-v1.5`).
- Runs isolated code execution sandboxes for coding assessment submissions.
- Does **not** write to Postgres directly — all DB persistence flows through Express internal callbacks.

### 3.5 Shared Packages

| Package | Contents |
|---|---|
| `packages/database` | Prisma 7.9 schema (`schema.prisma`), generated Prisma client, and typed DB helper exports |
| `packages/shared` | TypeScript interfaces, Zod schemas matching all API payloads, shared enum definitions |
| `packages/config` | Shared `eslint.config.mjs`, `tsconfig.base.json`, and Tailwind config preset |

---

## 4. End-to-End Execution Workflows

### Workflow 1: Application Submission & Resume Screening
```
Candidate → Next.js: POST /api/v1/applications { jobId }
Express: Creates Application record (status: "applied")
Express → BullMQ: Enqueues job to "screening-queue"
BullMQ → Python AI: Screening worker picks up job
Python: Parses resume PDF → generates 768-dim vector embedding
Python: Cosine similarity match against Job rubric vector
Python: Computes resume_score, gap_analysis, semantic_match_score
Python → Express: PATCH /api/v1/internal/applications/:id/screening-result
Express → Prisma: Updates Application.status → "screening_completed"
Express → Prisma: Creates Evaluation record with resume_score
If score < threshold:
  Express → Nodemailer: Sends feedback-rich rejection email
```

### Workflow 2: Scheduling
```
Express: After screening passes, enqueues "scheduling-queue"
Python Scheduler Agent: Generates 3 optimized time slots
Python → Express: POST /api/v1/internal/interviews/:id/schedule-slots
Express → Nodemailer: Sends scheduling email with slot options to candidate
Candidate → Next.js: POST /api/v1/applications/:id/schedule { slotId }
Express → Nodemailer: Sends confirmation + reminder schedule (24h, 1h prior)
```

### Workflow 3: WebRTC Voice Interview & Real-Time Proctoring
```
Candidate → Next.js: Opens /interview/:interviewId
Next.js: POST /api/v1/interviews/:id/consent { videoConsent: true }
Next.js: POST /api/v1/interviews/:id/session-token → receives WebRTC credentials
Next.js: Initializes MediaPipe client-side CV (browser WebAssembly)
Candidate speaks → WebRTC audio → Groq Whisper-large-v3 STT → live transcript
LangGraph Interviewer Agent (Dynamic Conversational Loop):
  1. Reads live transcript buffer + candidate resume + job rubric
  2. Evaluates answer completeness, technical depth, evasive claims
  3. Generates organic follow-up or stage transition via Gemini 2.10
Gemini text → Piper/Coqui TTS → WebRTC audio stream → candidate (<1.0s latency)
MediaPipe (browser): Computes gaze/face/posture flags
Next.js → Express: Sends periodic telemetry { face_count, gaze_centered, engagement_index }
Express → Prisma: Appends to Interview.proctor_flags (for HR audit only)
Interview End → Express: Enqueues "evaluation-queue"
```

### Workflow 4: Multi-Modal Assessment
```
Aptitude Test:
  Candidate submits answers → Express → BullMQ "assessment-queue"
  Python: Scores 4 categories, computes weighted aptitude score
  Python → Express: PATCH /api/v1/internal/applications/:id/assessment-result

Coding Assessment:
  Candidate submits code → Express → BullMQ "coding-queue"
  Python: Executes code in isolated sandbox against test suite
  Python: Measures pass rate, runtime, memory, complexity
  Python → Express: PATCH /api/v1/internal/applications/:id/coding-result
```

### Workflow 5: Evaluation & Decision
```
BullMQ → Python: "evaluation-queue" worker
Python: Aggregates resume_score + interview_score + aptitude_score + coding_score
Python → Express: PATCH /api/v1/internal/evaluations/:id
Express → Prisma: Updates Evaluation with composite_score, confidence

BullMQ → Python: "decision-queue" worker
Python: Compares composite_score against Job.thresholds
Python: Produces decision (hire | reject | hold_for_review)
If confidence < 0.70: decision = "hold_for_review"
Python → Express: PATCH /api/v1/internal/evaluations/:id/decision

If decision = "hire" AND Job.auto_offer = true AND HR Round passed:
  Express → Prisma: Creates Offer record
  Express → Nodemailer: Sends digital offer letter with signature magic link
  Express → Prisma: Application.status → "offered"

If decision = "reject":
  Express → Nodemailer: Sends constructive rejection email
```

### Workflow 6: Human HR Round
```
After ALL AI stages pass threshold:
  Express → Nodemailer: Notifies HR of shortlisted candidate
  HR marks candidate for HR Round via pipeline Kanban
  Express → BullMQ: "scheduling-queue" for HR Round slot
  Candidate joins /candidate/hr-round/:applicationId (WebRTC video call)
  HR joins /hr/interview/:applicationId (video call console)
  HR manually conducts interview, submits Pass/Fail via evaluation form
  POST /api/v1/hr/interview/:applicationId/result { decision: "pass" | "fail" }
  If "pass": triggers Decision Agent offer release
  If "fail": dispatches rejection email immediately
```

---

## 5. Security & Multi-Tenancy

### JWT Token Structure
```json
{
  "sub": "user_uuid",
  "role": "hr | candidate",
  "org_id": "org_uuid | null",
  "iat": 1700000000,
  "exp": 1700003600
}
```

Access tokens are short-lived (1 hour). Refresh tokens are rotated on each use and stored in httpOnly cookies.

### RBAC Isolation Rules

- **`org_id` derivation**: Every HR route middleware extracts `org_id` from the verified JWT payload. `org_id` supplied in request body or query params is explicitly ignored and discarded.
- **HR route guard**: All `/hr/*` routes require `role = "hr"` AND a non-null `org_id` in the JWT.
- **Candidate data ownership**: `CandidateProfile` is platform-wide and candidate-owned. An `Application` record grants the specific organization scoped, read-only access to that application's evaluation data.
- **Cross-org access**: Technically impossible — all HR Prisma queries include a `WHERE org_id = [jwt.org_id]` filter applied in middleware before the handler runs.

### Internal Callback Security

All endpoints under `/api/v1/internal/*` reject any request that does not include a valid `X-Internal-Service-Secret` header. This shared secret is set via environment variable and is never exposed to the frontend.

---

## 6. Async Queue Channels

| Queue | Purpose | Priority |
|---|---|---|
| `sourcing-queue` | LinkedIn/GitHub talent search, profile deduplication, pre-ranking | Low |
| `screening-queue` | Resume PDF parsing, vector embedding generation, rubric scoring | High |
| `scheduling-queue` | Slot generation, email outreach, calendar booking, reminders | Medium |
| `assessment-queue` | Aptitude test category scoring and weighted score computation | High |
| `coding-queue` | Isolated code execution, unit test runner, complexity analysis | High |
| `interview-queue` | Post-interview transcript assembly, audio file persistence | High |
| `evaluation-queue` | Composite score aggregation and final evaluation | Critical |
| `decision-queue` | Threshold matching, offer/rejection drafting, email delivery | Critical |
| `analytics-queue` | Weekly funnel metric aggregation, PDF report generation | Low |
| `mock-queue` | Practice session feedback scoring and coaching narrative | Low |

All queues use exponential backoff retry: 3 attempts before the job is marked as failed and logged to `AgentLog`.

---

## 7. Computer Vision & Proctoring Data Isolation

- **Browser-only execution**: MediaPipe models run inside the candidate's browser using WebAssembly. Raw video frames never leave the client device and never reach any server.
- **Telemetry payload only**: The frontend transmits periodic JSON telemetry: `{ face_count: 1, gaze_centered: true, engagement_index: 88, multiple_faces_detected: false }`.
- **Storage**: Telemetry is persisted in `Interview.proctor_flags` and `Interview.engagement_signal` for post-hoc HR audit review via the Interview Replay screen.
- **Scoring isolation boundary**: CV signals are **programmatically absent** from all inputs to the Evaluator Agent and Decision Agent scoring functions. This is enforced at the code level, not merely by policy.

---

## 8. Storage Topology

| Store | Purpose |
|---|---|
| **PostgreSQL 16** | Relational data: users, organizations, jobs, applications, evaluations, interviews, assessments, offers |
| **pgvector extension** | 768-dimensional cosine similarity search on resume and job rubric embeddings (HNSW index) |
| **Storage Service** | Encrypted object storage for uploaded resume PDFs, recorded interview audio files, generated PDF reports |
| **Redis 8** | BullMQ job queue state, retry tracking, and job result caching |

---

## 9. Resilience & Failover

| Scenario | Failover Behavior |
|---|---|
| **Voice latency > 3 seconds** | Frontend automatically transitions to chat-style text-only interview mode (same LangGraph agent, text input/output only) |
| **LLM confidence < 0.70** | Evaluation decision is automatically tagged `hold_for_review`; HR receives an alert to manually approve or override |
| **Queue job fails max retries** | Job is dead-lettered; an `AgentLog` entry is created with `status: "failed"`; HR admin receives a notification |
| **Storage upload failure** | Audio file upload retried 3x; on failure, transcript-only evaluation proceeds without audio replay |
