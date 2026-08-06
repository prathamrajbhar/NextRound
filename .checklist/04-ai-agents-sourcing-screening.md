# Checklist 04 — AI Agents: Sourcing, Screening & JD Parser

Implement the first three LangGraph agents end-to-end: JD Parser, Sourcing Agent, and Screening Agent.
Pattern: Express enqueues BullMQ job → Python worker picks up → LangGraph runs → Express internal callback persists result.

---

## A. BullMQ Infrastructure (Express side)

- [x] `apps/api/src/lib/queues/sourcing.queue.ts` — define `sourcing-queue`, export `enqueue(jobId: string)` helper
- [x] `apps/api/src/lib/queues/screening.queue.ts` — define `screening-queue`, export `enqueue(applicationId: string)` helper
- [x] Wire queue enqueue calls:
  - `POST /api/v1/jobs/:id/publish` → enqueue `sourcing-queue`
  - `POST /api/v1/applications` → enqueue `screening-queue`

---

## B. Express Internal Callback Endpoints

- [x] `PATCH /api/v1/internal/jobs/:id/ai-assist-result` — update `Job.description`, `Job.rubric`, `Job.thresholds` from JD Parser output
  - Protected by `requireInternalSecret`
  - Validate payload with Zod

- [x] `PATCH /api/v1/internal/applications/:id/screening-result` — persist screening output:
  - Update `Application.status` → `screening_completed` or `rejected`
  - Create/update `Evaluation` with `resume_score`, `gap_analysis`, `semantic_match_score`
  - If rejected: trigger rejection email via Nodemailer

- [x] `POST /api/v1/internal/sourcing/:jobId/candidates` — store sourced candidate pre-ranking list in `Job` metadata

---

## C. Python AI Workers

### Worker: `apps/ai-service/workers/jd_parser_worker.py`
- [x] Pull job from `sourcing-queue` (BullMQ via Redis stream or polling)
- [x] Fetch raw job title + brief requirements from Express (`GET /api/v1/internal/jobs/:id/raw`)
- [x] LangGraph JD Parser Agent:
  - Node 1: `parse_requirements` — Gemini prompt extracts skills, experience range, salary bounds, rubric dimensions
  - Node 2: `generate_description` — formats full ATS-optimized job description
  - Node 3: `compute_rubric` — generates weighted rubric JSON (weights sum to 100)
  - Node 4: `validate_output` — Pydantic validates against `JobRubricSchema`
- [x] Callback: `PATCH /api/v1/internal/jobs/:id/ai-assist-result` with result JSON

### Worker: `apps/ai-service/workers/sourcing_worker.py`
- [x] Pull job from `sourcing-queue`
- [x] Fetch `Job.rubric` embedding vector from Express
- [x] **BYPASS (ML model not ready):** Query existing `CandidateProfile` table for semantic fit using pgvector cosine similarity instead of external LinkedIn/GitHub scraping
- [x] Score + pre-rank matching candidates
- [x] Callback: `POST /api/v1/internal/sourcing/:jobId/candidates`

### Worker: `apps/ai-service/workers/screening_worker.py`
- [x] Pull job from `screening-queue`
- [x] Fetch `Application` + `CandidateProfile` (resume_url) from Express
- [x] Download resume PDF from S3
- [x] Parse PDF text (PyMuPDF / pdfminer)
- [x] Generate 768-dim embedding via Gemini text embedding API
- [x] Cosine similarity against `Job` rubric embedding
- [x] LangGraph Screening Agent:
  - Node 1: `parse_resume` — extract skills, experience, education, projects
  - Node 2: `score_against_rubric` — score each rubric dimension (0–100)
  - Node 3: `compute_gaps` — identify missing required skills, experience gaps
  - Node 4: `make_decision` — compare weighted score to `Job.thresholds.screening`
  - Node 5: `generate_feedback` — write constructive rejection message if below threshold
- [x] Callback: `PATCH /api/v1/internal/applications/:id/screening-result`

---

## D. Embedding Pipeline

- [x] `apps/ai-service/services/embedding_service.py`:
  - `embed_text(text: str) -> list[float]` — call Gemini `text-embedding-004`, return 768-dim vector
  - `embed_resume(pdf_bytes: bytes) -> list[float]` — parse PDF → chunk → embed → mean-pool
  - `cosine_similarity(a: list, b: list) -> float`

- [x] On `Job` publish: generate embedding from `Job.description + rubric skills`, store in `Job.embedding` via callback
- [x] On resume upload: generate embedding, store in `CandidateProfile.embedding` via `PATCH /api/v1/internal/candidate/:id/embedding`
- [x] Add internal endpoint `PATCH /api/v1/internal/candidate/:id/embedding` for embedding persistence

---

## E. Email Automation (Nodemailer)

- [x] `apps/api/src/services/email.service.ts`:
  - `sendRejectionEmail(candidate, job, gap_analysis)` — feedback-rich rejection
  - `sendApplicationReceived(candidate, job)` — confirmation email on apply
  - `sendSchedulingSlots(candidate, interview, slots)` — 3 slot options

- [x] Wire `sendRejectionEmail` to screening internal callback when `score < threshold`
- [x] Wire `sendApplicationReceived` to `POST /api/v1/applications` success

---

## F. Frontend — JD AI Assist Flow

- [x] `apps/web/src/app/hr/jobs/new/components/AiExtractPanel.tsx`:
  - Button calls `POST /api/v1/jobs/:id/ai-assist`
  - Show spinner + "AI is generating your job description…" state
  - Poll `GET /api/v1/jobs/:id` every 3s until `status` transitions out of `draft_processing`
  - Populate form fields with AI-generated rubric, description, and dimension weights

---

## G. Agent Logging

- [x] All workers must create an `AgentLog` entry via `POST /api/v1/internal/agent-logs` on:
  - Job start: `{ queue, jobId, status: 'running' }`
  - Job success: `{ status: 'completed', output_summary }`
  - Job failure: `{ status: 'failed', error: message, stack }`
- [x] `GET /api/v1/internal/agent-logs` — list recent logs (admin only)

---

## Done When

- Publishing a job triggers sourcing worker; sourced candidate list stored in DB
- Submitting an application triggers screening worker; `Evaluation.resume_score` populated within 30s
- Below-threshold applications automatically receive rejection email
- JD Parser generates a rubric JSON when HR clicks "AI Assist"; fields populate in the UI
- All agent activity is logged to `AgentLog` table
