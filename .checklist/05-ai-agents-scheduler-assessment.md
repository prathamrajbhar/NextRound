# Checklist 05 — AI Agents: Scheduler, Aptitude & Coding Assessment

Implement the Scheduler Agent, Aptitude Test scoring pipeline, and Coding Assessment sandbox.

---

## A. Scheduler Agent

### BullMQ Setup (Express)
- [x] `apps/api/src/lib/queues/scheduling.queue.ts` — define `scheduling-queue`
- [x] Wire `scheduling-queue` enqueue after `screening_completed` with passing score
- [x] `POST /api/v1/internal/interviews/:id/schedule-slots` — store proposed slots in `Interview` record
- [x] `PATCH /api/v1/internal/interviews/:id/confirmed-slot` — mark selected slot, send confirmation emails

### Python Worker: `apps/ai-service/workers/scheduling_worker.py`
- [x] Pull from `scheduling-queue`
- [x] Fetch job's `availability_hours` from `Organization.settings`
- [x] LangGraph Scheduler Agent:
  - Node 1: `generate_slots` — compute 3 interview time slots within org availability window, 24h ahead minimum
  - Node 2: `format_email` — render scheduling email with slot options and calendar links
  - Node 3: `schedule_reminders` — compute reminder timestamps (24h before, 1h before)
- [x] Callback: `POST /api/v1/internal/interviews/:id/schedule-slots` with 3 slot options

### Express Scheduling Endpoints
- [x] `POST /api/v1/applications/:id/schedule` — candidate confirms a slot
  - Update `Interview.scheduled_at`, `Application.status = 'scheduled'`
  - Send confirmation email + calendar invite
  - Schedule BullMQ reminder jobs (delayed jobs at 24h and 1h prior)

- [x] `POST /api/v1/applications/:id/reschedule` — candidate requests reschedule
  - Re-enqueue `scheduling-queue` with reschedule flag
  - Cap reschedules at 2 per application

- [x] `apps/web/src/app/candidate/applications/[applicationId]/schedule/page.tsx` — render 3 slot options, wire selection to API

---

## B. Aptitude Assessment Pipeline

### BullMQ Setup (Express)
- [x] `apps/api/src/lib/queues/assessment.queue.ts` — define `assessment-queue`
- [x] Wire `assessment-queue` enqueue after interview scheduled OR as standalone stage (if `aptitude_enabled`)
- [x] `PATCH /api/v1/internal/applications/:id/assessment-result` — persist aptitude scores

### Express Aptitude Endpoints
- [x] `GET /api/v1/applications/:id/assessment/aptitude` — return aptitude questions set (seeded per job)
- [x] `POST /api/v1/applications/:id/assessment/aptitude` — submit answers
  - Zod validate: `{ answers: { questionId: string, answer: string }[] }`
  - Enqueue `assessment-queue` for scoring
  - Set `Application.status = 'assessment_pending'`

### Python Worker: `apps/ai-service/workers/aptitude_worker.py`
- [x] Pull from `assessment-queue`
- [x] Fetch question definitions + candidate answers
- [x] Score 4 categories: Logical Reasoning, Numerical Reasoning, Verbal Reasoning, Spatial Reasoning
- [x] Compute weighted aptitude score against `Job.thresholds.aptitude`
- [x] LangGraph Assessment Agent:
  - Node 1: `score_answers` — compute per-category accuracy
  - Node 2: `weight_categories` — apply rubric weightings
  - Node 3: `threshold_check` — pass/fail decision
- [x] Callback: `PATCH /api/v1/internal/applications/:id/assessment-result` with `{ aptitude_score, category_scores, passed }`

### Question Bank
- [x] `apps/api/src/data/aptitude-questions.json` — seed file with 50+ questions across 4 categories
- [x] `GET /api/v1/applications/:id/assessment/aptitude` randomly samples 10–20 questions per category, seeded by `applicationId` for reproducibility

### Frontend
- [x] `apps/web/src/components/interview/AptitudeTestConsole.tsx` — fetch real questions, wire answer submission, real-time countdown timer, prevent tab switching (warn on blur)
- [x] `apps/web/src/app/candidate/applications/[applicationId]/assessment/page.tsx` — gate access by `Application.status`, show results post-submission

---

## C. Coding Assessment Pipeline

### BullMQ Setup (Express)
- [x] `apps/api/src/lib/queues/coding.queue.ts` — define `coding-queue`
- [x] `PATCH /api/v1/internal/applications/:id/coding-result` — persist coding scores

### Express Coding Endpoints
- [x] `GET /api/v1/applications/:id/assessment/coding` — return coding problem(s) for this job
- [x] `POST /api/v1/applications/:id/assessment/coding` — submit code solution
  - Zod validate: `{ problemId: string, language: string, code: string }`
  - Enqueue `coding-queue`
  - Return `{ queued: true, submissionId }`

- [x] `GET /api/v1/applications/:id/assessment/coding/:submissionId` — poll submission status + results

### Python Worker: `apps/ai-service/workers/coding_worker.py`
- [x] Pull from `coding-queue`
- [x] **BYPASS ISOLATION SANDBOX (ML model not ready):** Use subprocess with timeout + resource limits instead of full WebAssembly sandbox
  - `subprocess.run(["python3", "-c", code], timeout=10, capture_output=True)`
  - For JS: `subprocess.run(["node", "-e", code], timeout=10)`
  - Memory cap: `resource.setrlimit(resource.RLIMIT_AS, (256MB, 256MB))`
- [x] Run against test suite: compute pass_rate, runtime_ms, memory_mb
- [x] LangGraph Coding Agent:
  - Node 1: `execute_code` — sandbox run against all test cases
  - Node 2: `analyze_complexity` — O(n) analysis via Gemini code review
  - Node 3: `score_submission` — weighted: correctness 60%, efficiency 20%, style 20%
  - Node 4: `generate_feedback` — brief code review comment
- [x] Callback: `PATCH /api/v1/internal/applications/:id/coding-result`

### Problem Bank
- [x] `apps/api/src/data/coding-problems.json` — seed 10+ problems with test cases (input/output pairs) per difficulty
- [x] Problems assignable per job via `Job.rubric.coding_problem_ids`

### Frontend
- [x] `apps/web/src/components/interview/CodingAssessmentConsole.tsx` — fetch real problem, wire Monaco editor submit to API, show real-time test case results after polling
- [x] `apps/web/src/app/candidate/applications/[applicationId]/take-home/page.tsx` — take-home variant: show problem, allow code paste, submit to same endpoint

---

## D. Video Screening Pipeline (Async)

- [x] `GET /api/v1/applications/:id/assessment/video-prompts` — return 3 video prompt questions for this job
- [x] `POST /api/v1/applications/:id/assessment/video` — upload recorded video blob to S3; return `video_url`
- [x] Enqueue `interview-queue` for async transcription (Groq Whisper)
- [x] `PATCH /api/v1/internal/applications/:id/video-transcript` — persist transcript after Whisper processing
- [x] `apps/web/src/app/candidate/applications/[applicationId]/video-screening/page.tsx` — wire MediaRecorder API, upload blob to S3 signed URL, confirm submission

---

## E. Assessment Scorecard in HR View

- [x] `apps/web/src/app/hr/candidates/[applicationId]/components/AssessmentScorecard.tsx` — render real aptitude category scores, coding pass rate, and video screening transcript from API

---

## Done When

- Candidate sees real scheduling slots and can confirm; confirmation email received
- Aptitude test renders real questions from question bank, submits, and shows score within 60 seconds
- Coding problem renders in Monaco editor, code runs against test suite, results appear within 30 seconds
- HR candidate detail page shows real assessment scores (not mock data)
- All assessment workers log to `AgentLog`
