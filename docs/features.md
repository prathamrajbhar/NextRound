# NextRound — Feature Specifications

End-to-end feature reference for NextRound's AI hiring pipeline, candidate portal, and all supporting tools.

---

## 1. Job Creation & AI Rubric Generation

**Surface:** HR Portal — `/hr/jobs/new`, `/hr/jobs/:jobId/edit`

**What it does:**
- HR enters a raw job title and brief requirements. The AI JD Assistant formats the full job description, extracts skill tags, experience ranges, salary bounds, and recommended rubric weights.
- The Automated Rubric Engine generates a weighted scoring rubric across configurable dimensions (e.g., Technical Mastery 40%, Problem Solving 30%, Communication 30%).
- HR can adjust all dimension weights, minimum passing thresholds per stage, and pipeline toggle flags (which assessment modalities are enabled for this job).

**Trigger:** HR clicks "AI Assist" → `POST /api/v1/jobs/:jobId/ai-assist`

**Queue:** `sourcing-queue` (enqueued after job is published, not during draft creation)

**DB records created:** `Job` (draft), `AgentLog` entry per agent invocation

**Config-driven fields on `Job`:**
- `rubric` (JSON): dimension names, weights (must sum to 100)
- `thresholds` (JSON): minimum passing score per stage, auto-offer threshold
- Pipeline toggles: `aptitude_enabled`, `coding_enabled`, `video_screening_enabled`, `auto_offer`

---

## 2. Sourcing Agent

**Surface:** Background — triggered on job publish

**What it does:**
- Searches public candidate signals across LinkedIn, GitHub, and AngelList, prioritizing candidates who already have platform profiles.
- Deduplication engine prevents the same candidate from being contacted multiple times across companies.
- Pre-ranks discovered candidates by semantic fit against the job rubric before any resume submission.

**Trigger:** HR clicks "Publish" → `POST /api/v1/jobs/:jobId/publish`

**Queue:** `sourcing-queue`

**Internal callback:** `PATCH /api/v1/internal/applications/:id/sourcing-result`

**DB records modified:** `Application` (created for matched candidates), `AgentLog`

---

## 3. Screening Agent (Resume RAG)

**Surface:** Background — triggered on application submission

**What it does:**
- Parses uploaded PDF or DOCX resume, extracting structured work history, skills, education, and project accomplishments.
- Converts the resume text into a 768-dimensional vector embedding and performs cosine similarity search against the job rubric embedding stored in pgvector.
- Produces a `resume_score`, a `gap_analysis` array (skills present in rubric but absent from resume), and a `semantic_match_score`.
- If `resume_score < Job.thresholds.screening_min`, dispatches a feedback-rich rejection email and sets `Application.status = "rejected"`.

**Trigger:** Candidate submits application → `POST /api/v1/applications`

**Queue:** `screening-queue`

**Internal callback:** `PATCH /api/v1/internal/applications/:id/screening-result`

**DB records modified:** `Application.status`, `Evaluation` (created with `resume_score`), `AgentLog`

---

## 4. Scheduler Agent

**Surface:** Background — triggered after screening passes

**What it does:**
- Reads `Organization.settings.availability_hours` to compute available interview slots.
- Generates 3 optimized interview time slot proposals and sends a scheduling email to the candidate.
- Sends automated email reminders at 24 hours and 1 hour before the scheduled interview.
- On candidate reschedule request, regenerates new slot proposals automatically.

**Trigger:** Screening score passes threshold → enqueued from Screening Agent callback

**Queue:** `scheduling-queue`

**Internal callback:** `POST /api/v1/internal/interviews/:id/schedule-slots`

**DB records modified:** `Interview` (created with scheduled_at, status: "scheduled"), `AgentLog`

---

## 5. Interviewer Agent & Voice Console

**Surface:** Candidate — `/interview/:interviewId` | HR — `/hr/candidates/:applicationId/interview` (replay)

### 5.1 Pre-Join Check & Consent
- Before entering the interview room, the candidate completes a hardware pre-check: microphone volume test, camera preview, and explicit video consent recording.
- `POST /api/v1/interviews/:id/consent { videoConsent: boolean }` — interview cannot start without `videoConsent: true`.
- `POST /api/v1/interviews/:id/session-token` — issues short-lived WebRTC credentials.

### 5.2 Dynamic Conversational Loop
The Interviewer Agent replaces static question scripts with a fully adaptive dialogue:

- **Active Listening**: Maintains the full live transcript buffer, candidate resume, and job rubric in LangGraph state across the entire session.
- **Organic Follow-ups**: When a candidate mentions a specific project, metric, or architecture (e.g., "Redis rate limiting"), the agent immediately pivots to probe that claim before moving on.
- **Vague Answer Detection**: Gently identifies evasive or generic answers and requests specific examples, metrics, or architectural decisions.
- **Natural Stage Transitions**: Moves between interview stages (`Introduction` → `Core Vetting` → `Deep-Dive` → `Wrap-up`) based on topic saturation, not timer limits.
- **Voice Pipeline**: Candidate speech → WebRTC → Groq Whisper-large-v3 STT → LangGraph → Gemini 2.10 reasoning → Piper/Coqui TTS → WebRTC audio → candidate (< 1.0s end-to-end).

### 5.3 Proctoring HUD
- MediaPipe runs client-side (WebAssembly). Computes: face count, gaze orientation, head posture, engagement index.
- Periodic telemetry JSON transmitted to Express and stored in `Interview.proctor_flags` for HR audit only.
- CV signals are **never** passed to the Evaluator or Decision Agent.

### 5.4 Fallback Mode
- If STT/TTS round-trip latency exceeds 3 seconds, the frontend switches to chat-style text-only mode automatically. The same LangGraph agent continues running; only the I/O modality changes.

**Trigger:** Candidate joins interview at scheduled time

**Queue:** `interview-queue` (post-interview processing: transcript assembly, audio S3 upload)

**Internal callback:** `PATCH /api/v1/internal/interviews/:id/complete`

**DB records modified:** `Interview.transcript`, `Interview.audio_url`, `Interview.proctor_flags`, `Interview.status → "completed"`, `AgentLog`

---

## 6. Multi-Modal Assessment Consoles

### 6.1 Aptitude Test Console
**Route:** `/candidate/applications/:applicationId/assessment`

- Timed assessment covering 4 cognitive categories: Logical Reasoning, Verbal Ability, Quantitative Aptitude, and Technical Core Concepts.
- Category navigation tabs allow candidates to move between sections freely until submission.
- Real-time countdown timer. On timer expiry, current selections are auto-submitted.
- Results processed by the Assessment Agent asynchronously.

**Queue:** `assessment-queue`

**Internal callback:** `PATCH /api/v1/internal/applications/:id/assessment-result`

**DB records modified:** `Assessment` (score, category_breakdown JSON), `AgentLog`

### 6.2 Coding Assessment Console
**Route:** `/candidate/applications/:applicationId/take-home`

- Full browser code editor (Monaco/CodeMirror) supporting JavaScript, TypeScript, Python, and Go.
- Problem description panel with input/output examples and constraints.
- "Run Tests" executes the submission against visible test cases in an isolated sandbox with real-time output. "Submit" triggers the final evaluation against hidden test cases.
- Metrics captured: pass rate, execution time (ms), memory usage (MB), Big-O complexity estimate.

**Queue:** `coding-queue`

**Internal callback:** `PATCH /api/v1/internal/applications/:id/coding-result`

**DB records modified:** `CodingSubmission` (code, language, test_results, pass_rate), `Assessment`, `AgentLog`

### 6.3 Video Screening Console
**Route:** `/candidate/applications/:applicationId/video-screening`

- Asynchronous video prompt responses — candidates record video answers to 2–4 prompt questions on their own schedule.
- Camera preview, recording controls, and auto-transcription of recorded responses.
- MediaPipe proctoring HUD active during recording.
- Recorded video is uploaded to S3. Auto-transcription is used for downstream evaluation.

**Queue:** `assessment-queue` (video transcript scoring)

**Internal callback:** `PATCH /api/v1/internal/applications/:id/video-screening-result`

**DB records modified:** `Assessment` (video transcript, score), `AgentLog`

---

## 7. Evaluator + Bias Audit Agent

**Surface:** Background — triggered after all enabled assessment stages complete

**What it does:**
- **Composite Scoring**: Aggregates `resume_score`, `interview_score`, aptitude category scores, and coding `pass_rate` using the job rubric's dimension weights to produce a single `composite_score` (0–100) and confidence level (0–1).
- **LLM-as-Judge**: Evaluates the full interview transcript against each rubric dimension with a structured JSON output schema to prevent hallucinated scores.
- **Blind Demographic Bias Audit**: Scans aggregate evaluation patterns for systematic scoring disparities — comparing scores against candidates with similar resumes but different demographic signals (names, school prestige, geography). Produces a `bias_report` JSON.
- **Audit Report**: Attached to every candidate's `Evaluation` record, viewable by HR from the Candidate Evaluation Detail screen.

**Trigger:** All enabled assessment stages complete → enqueued from last stage callback

**Queue:** `evaluation-queue`

**Internal callback:** `PATCH /api/v1/internal/evaluations/:id`

**DB records modified:** `Evaluation` (composite_score, confidence, bias_report, bias_flag), `AgentLog`

---

## 8. Human HR Round

**Surface:** HR — `/hr/interview/:applicationId` | Candidate — `/candidate/hr-round/:applicationId`

**What it does:**
- After all automated AI assessment stages pass the job's configured thresholds (aptitude, coding, video screening, voice interview), a live 1:1 video call is scheduled between the candidate and an HR representative.
- No AI agent participates in or scores this round. It is purely a human interaction.
- The candidate joins a WebRTC waiting room with a hardware pre-check (camera preview, mic volume meter) before the HR representative admits them.
- HR conducts the video call and submits a Pass or Fail decision via the evaluation form in the HR Video Call Console.
- **Conditional offer release**: The Decision Agent is triggered only after HR marks `Pass`. Marking `Fail` immediately dispatches a polite rejection email.

**Trigger:** HR manually marks candidate ready for HR Round via Pipeline Kanban

**DB records modified:** `Application.hr_round_status`, `Application.hr_round_scheduled_at`, `Application.hr_round_completed_at`

---

## 9. Decision Agent

**Surface:** Background — triggered after Evaluation + HR Round completion

**What it does:**
- Compares `Evaluation.composite_score` against `Job.thresholds.hire_threshold`.
- Classifies outcome as `hire`, `reject`, or `hold_for_review` (confidence < 0.70).
- For `hire` decisions where `Job.auto_offer = true`: creates an `Offer` record and dispatches a digital offer letter via Nodemailer with a signature magic link.
- For `reject` decisions: dispatches a constructive, personalized rejection email.
- For `hold_for_review`: creates an HR notification and blocks auto-offer until HR manually approves or overrides.
- HR can always manually override any AI decision via `POST /api/v1/evaluations/:applicationId/decision/override`.

**Trigger:** `evaluation-queue` callback completion + HR Round `Pass` result

**Queue:** `decision-queue`

**Internal callback:** `PATCH /api/v1/internal/evaluations/:id/decision`

**DB records modified:** `Evaluation.decision`, `Offer` (created on hire), `Application.status → "offered" | "rejected"`, `AgentLog`

---

## 10. Analytics Agent & Reporting

**Surface:** HR Portal — `/hr/analytics`

**What it does:**
- Aggregates weekly hiring funnel metrics: candidates per stage (Sourced → Screened → Assessment → Interview → Decided → Hired).
- Tracks role-by-role time-to-hire velocity and composite score distribution trends.
- Monitors bias audit score stability over time to detect drift.
- Generates downloadable PDF executive reports on demand.

**Trigger:** Weekly cron schedule (every Monday 00:00 UTC) or on-demand via `GET /api/v1/analytics/org/report.pdf`

**Queue:** `analytics-queue`

**Internal callback:** `POST /api/v1/internal/analytics/:orgId/weekly-report`

**DB records modified:** Aggregated metric rows, PDF stored in S3, `AgentLog`

---

## 11. Offer Letter & Onboarding

**Surface:** Candidate — `/candidate/applications/:applicationId/offer`, `/candidate/applications/:applicationId/onboarding`

**What it does:**
- **Offer Letter View**: Displays salary breakdown, equity package, start date, benefits summary. Embeds a digital signature canvas.
- **Accept**: `POST /api/v1/applications/:id/offer/accept { signatureSvg }` — saves SVG signature, updates `Offer.status → "accepted"`, `Application.status → "accepted"`.
- **Decline**: `POST /api/v1/applications/:id/offer/decline` — with optional feedback note.
- **Onboarding Checklist**: Post-acceptance document upload portal — emergency contact form, background check authorization, document upload tasks.
- `Offer.valid_until` deadline enforced — expired offers cannot be accepted.

---

## 12. Mock Interview Agent

**Surface:** Candidate — `/candidate/mock/new`, `/candidate/mock/:sessionId`, `/candidate/mock/:sessionId/feedback`

**What it does:**
- Candidate selects a target company, role, and difficulty level to launch a practice session.
- The Mock Interview Agent runs the same Dynamic Conversational Loop as the live Interviewer Agent, but with rubrics sourced from `PrepContent` rather than a real `Job` record.
- At session end, the agent produces an instant feedback report: score breakdown, identified strengths, areas for improvement, and an annotated session transcript.
- Historical sessions are tracked in `MockSession` for skill progress trending over time.

**Trigger:** Candidate clicks "Start Mock Interview" → `POST /api/v1/candidate/mock/sessions`

**Queue:** `mock-queue`

**Internal callback:** `PATCH /api/v1/internal/mock-sessions/:sessionId/complete`

**DB records modified:** `MockSession` (transcript, score, feedback), `AgentLog`

---

## 13. AI Voice Resume Builder

**Surface:** Candidate — `/candidate/resume-builder`

**What it does:**
- Candidate configures target role and seniority level, then enters a 15-minute voice interview with an AI agent — no forms or manual writing required.
- **Production-grade call interface**: 2-sided voice/video room featuring a glowing 3D AI Voice Orb, local webcam preview, eye-contact telemetry display, and audio spectrum visualizers.
- **Live background extraction**: As the candidate speaks, structured data is extracted in real time — quantified bullet points ("78% latency reduction", "2.5M DAU scale"), skills, leadership achievements, and project outcomes.
- **ATS Resume Studio**: After the session, generates a single-column ATS-friendly resume with an ATS Compliance Score gauge (target: 96/100), template theme options (Classic ATS, Modern Minimal, Executive), copy plain text, and PDF download.

**Trigger:** Candidate initiates session → `POST /api/v1/candidates/me/voice-resume/start`

**Queue:** `mock-queue` (reuses mock infrastructure)

**Internal callback:** `POST /api/v1/internal/candidates/me/voice-resume/complete`

**DB records modified:** `CandidateProfile.resume_url` (updated with generated PDF), `AgentLog`

---

## 14. HR Talent Pool Console

**Surface:** HR Portal — `/hr/talent-pool`

**What it does:**
- Global candidate discovery search across all platform candidates with AI keyword matching and skill tag filtering.
- Passive candidate bookmarking — saved to organization's talent pool with a note.
- Direct email outreach sequence trigger — sends a personalized outreach email to a bookmarked candidate for a specific job.

**API:** `GET /api/v1/organizations/me/talent-pool`, `POST /api/v1/organizations/me/talent-pool/bookmark`, `POST /api/v1/organizations/me/talent-pool/outreach`

---

## 15. Sentiment + Stress Analyser

**Surface:** HR Portal — `/hr/sentiment-analysis`

**What it does:**
- **Vocal Biomarker Engine**: Analyses candidate interview audio for tone harmony, speech pace (WPM), pitch micro-variations, and pause patterns.
- **Emotional Journey Graph**: Interactive visual timeline tracking confidence, stress, and hesitation levels across interview topics and timestamps.
- **Synchronized HR Transcript**: Line-by-line interview transcript annotated with real-time emotion markers (`[Confident]`, `[Hesitant]`, `[Stressed]`) and per-line pitch/pace metrics.
- **AI Recommendation Callouts**: Distinguishes temporary interview nervousness from genuine technical skill gaps — directly informs HR decision-making before the Human HR Round.

**Data source:** `Interview.transcript`, `Interview.audio_url` — processed post-interview by the Evaluator Agent.

---

## 16. Company Prep Library

**Surface:** Candidate — `/candidate/prep`, `/candidate/prep/:companyId/:roleArchetype`

**What it does:**
- AI-generated interview question banks organized by company and job role archetype.
- Culture notes, hiring process overviews, and archetype-specific skill checklists.
- "Start Mock" CTA launches a Mock Interview Agent session pre-loaded with the selected company's rubric.

**Internal trigger:** `POST /api/v1/internal/prep-content` — AI agent generates and updates prep content on a scheduled basis.

**DB records:** `PrepContent` (company_name, role_archetype, questions JSON, culture_notes)

---

## 17. Candidate Notifications

**Surface:** Candidate — `/candidate/notifications` (notification dropdown in sidebar)

**What it does:**
- Real-time notification feed for: application status changes, interview scheduling confirmations, assessment result availability, offer letter delivery, and HR Round scheduling.
- `NotificationDropdown` UI component in `src/components/ui/NotificationDropdown.tsx`.
- Action items are clickable, navigating directly to the relevant screen.
