# Checklist 08 — AI Agents: Mock Interview & AI Voice Resume Builder

Implement the candidate-facing self-serve AI tools: Mock Interview Agent and AI Voice Resume Builder.
These are fully independent of live job applications.

---

## A. Mock Interview Agent

### BullMQ Queue (Express)
- [x] `apps/api/src/lib/queues/mock.queue.ts` — define `mock-queue` (low priority)
- [x] Wire `mock-queue` enqueue after mock session ends

### Express Mock Session Endpoints
- [x] `POST /api/v1/mock/sessions` — create a new mock session
  - Body: `{ topic: string, difficulty: 'easy' | 'medium' | 'hard', focus_areas: string[] }`
  - Create `MockSession` record with `status = 'active'`
  - Return `{ sessionId, startsAt }`

- [x] `GET /api/v1/mock/sessions` — list all mock sessions for authenticated candidate
  - Query params: `status`, `page`, `limit`

- [x] `GET /api/v1/mock/sessions/:id` — get session detail including transcript + feedback

- [x] `POST /api/v1/mock/sessions/:id/end` — mark session ended; enqueue `mock-queue` for feedback scoring

- [x] `GET /api/v1/mock/sessions/:id/feedback` — return feedback report (only available after processing)

- [x] `GET /api/v1/mock/topics` — return available topic list (e.g., "System Design", "Data Structures", "Behavioral", "SQL") — this replaces `apps/web/src/lib/interviewTopics.ts`

### Mock Session API Endpoints (AI Service)
- [x] `POST /api/v1/ai/mock/respond` — same shape as interview respond, but with `sessionId` not `interviewId`
  - Uses Mock Interviewer Agent (simpler version — no rubric weighting, coaching-focused)
  - Returns `{ text, audioUrl, questionNumber, isComplete, coachingHint }`

### Python Worker: `apps/ai-service/workers/mock_worker.py`
- [x] Pull from `mock-queue`
- [x] LangGraph Mock Feedback Agent:
  - Node 1: `analyze_transcript` — parse conversation turns
  - Node 2: `score_answers` — assess per topic: clarity, depth, examples used, STAR structure (behavioral), technical accuracy
  - Node 3: `generate_coaching` — write specific coaching narrative per question (what was strong, what to improve, model answer hint)
  - Node 4: `compute_overall_score` — 0–100 practice score
  - Node 5: `suggest_resources` — recommend PrepContent items from Company Prep Library
- [x] Callback: `PATCH /api/v1/internal/mock/sessions/:id/feedback`

- [x] `PATCH /api/v1/internal/mock/sessions/:id/feedback` — persist feedback JSON + score to `MockSession`

### LangGraph: Mock Conversational Agent
File: `apps/ai-service/agents/mock_interviewer_agent.py`

- [x] Same node structure as Interviewer Agent but:
  - Coaching mode: hints are allowed after 2 follow-ups (not evasion flags)
  - Stage: `intro | topic_questions | case_study | closing`
  - No bias audit node (candidate practice session)
  - After each answer: immediately provide a brief coaching hint in parentheses if enabled

### Frontend
- [x] `apps/web/src/app/candidate/mock/new/page.tsx` — fetch real topic list from `GET /api/v1/mock/topics`, configure session, wire `POST /api/v1/mock/sessions`
- [x] `apps/web/src/app/candidate/mock/new/components/CalibrationPanel.tsx` — mic/camera check with real MediaDevices API
- [x] `apps/web/src/app/candidate/mock/[sessionId]/page.tsx` — same voice console as live interview (reuse `InterviewActiveConsole`), wire to mock API endpoints
- [x] `apps/web/src/app/candidate/mock/history/page.tsx` — fetch real session history from `GET /api/v1/mock/sessions`
- [x] `apps/web/src/app/candidate/mock/[sessionId]/feedback/page.tsx` — fetch + render real feedback report: per-question coaching, overall score, improvement areas, resource recommendations

---

## B. AI Voice Resume Builder Agent

### Express Resume Builder Endpoints
- [x] `POST /api/v1/resume-builder/sessions` — create a new resume builder session
  - Create `MockSession` with `type = 'resume_builder'`
  - Return `{ sessionId }`

- [x] `GET /api/v1/resume-builder/:sessionId` — get session state (stage, transcript, generated_resume)

- [x] `POST /api/v1/resume-builder/:sessionId/end` — mark session complete; enqueue resume generation

- [x] `GET /api/v1/resume-builder/:sessionId/result` — return generated resume JSON + PDF download URL

- [x] `POST /api/v1/ai/resume-builder/respond` — AI Service conversational endpoint for resume builder
  - 15-minute voice interview covering: work history, projects, skills, education, achievements, metrics
  - Returns next question + progress percentage

### Python Worker: `apps/ai-service/workers/resume_builder_worker.py`
- [x] Pull job (resume generation) from `mock-queue` (reuse, or create `resume-queue`)
- [x] LangGraph Resume Builder Agent:
  - Node 1: `parse_transcript` — extract structured data: companies, roles, dates, responsibilities, metrics, skills, education
  - Node 2: `quantify_bullets` — Gemini rewrites experience statements with metrics ("Led team of 5" → "Led a cross-functional team of 5 engineers, reducing deployment time by 40%")
  - Node 3: `generate_resume` — assemble ATS-optimized resume JSON (sections: summary, experience, education, skills, projects)
  - Node 4: `format_pdf` — render resume JSON to PDF using WeasyPrint or ReportLab; upload to S3
  - Node 5: `update_profile` — optionally sync extracted skills to `CandidateProfile`
- [x] Callback: `PATCH /api/v1/internal/resume-builder/:sessionId/result`

### Resume Builder Conversational Agent
File: `apps/ai-service/agents/resume_builder_agent.py`

- [x] Stage-driven Q&A: `intro` → `work_history (last 3 roles)` → `skills_deep_dive` → `projects` → `education` → `closing`
- [x] For each role: prompt for company, title, tenure, team size, key achievements, metrics
- [x] Extract quantitative signals: percentages, dollar amounts, team sizes, timeframes
- [x] No scoring, no rubric — pure information extraction

### PDF Generation
- [x] **BYPASS (ML model not ready):** Use ReportLab or WeasyPrint for PDF instead of custom ML layouter
- [x] `apps/ai-service/services/pdf_generator.py` — render resume JSON to styled PDF matching standard ATS template
- [x] Upload PDF to S3; return public URL (or presigned URL with expiry)

### Frontend
- [x] `apps/web/src/app/candidate/resume-builder/page.tsx` — wire `POST /api/v1/resume-builder/sessions` on start
- [x] `apps/web/src/app/candidate/resume-builder/_components/SetupStage.tsx` — collect name, target role, years of experience (remove mock defaults)
- [x] `apps/web/src/app/candidate/resume-builder/_components/InterviewStage.tsx` — use same voice console WebRTC components, wire to `POST /api/v1/ai/resume-builder/respond`
- [x] `apps/web/src/app/candidate/resume-builder/_components/ResumeStage.tsx` — fetch `GET /api/v1/resume-builder/:sessionId/result`, render resume preview, wire PDF download button
- [x] `apps/web/src/app/candidate/resume-builder/_components/InsightsDrawer.tsx` — display extracted skills and metrics from session (from real API response)

---

## C. Company Prep Library

- [x] `GET /api/v1/prep/:orgId` — return prep content for a company (public or scoped)
  - Returns: question banks, interview tips, role-specific guides, company culture notes
- [x] `GET /api/v1/prep/jobs/:jobId` — return job-specific prep content
- [x] `POST /api/v1/internal/prep/generate` — AI generates prep content for a new job (enqueued by sourcing agent)
- [x] `apps/ai-service/workers/prep_content_worker.py`:
  - Gemini generates 20 likely interview questions per rubric dimension
  - Stores in `PrepContent` table via callback

---

## Done When

- Candidate can start a mock interview, complete 5+ turns, receive feedback report with per-question coaching
- Resume builder completes 15-minute voice session → generates downloadable PDF resume
- PDF resume has quantified bullets and ATS-compatible structure
- Topic list on mock new session page is fetched from API (not static file)
- Prep library shows real AI-generated questions for a job
