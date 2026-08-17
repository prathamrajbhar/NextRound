# NextRound — AI Agents Reference

Technical specification for all AI agents in the NextRound pipeline. Each agent runs as a LangGraph state machine inside the Python FastAPI service (`apps/ai-service`), consuming jobs from BullMQ via a shared queue worker pattern, and persisting results exclusively through Express internal callback endpoints.

---

## Agent Architecture Pattern

All agents follow the same structural pattern:

```
Express API
  └─ Validates request
  └─ Enqueues { payload } to BullMQ queue
        │
        ▼
BullMQ Worker (Python)
  └─ Picks up job
  └─ Builds LangGraph StateGraph
  └─ Runs agent nodes
  └─ Calls Express /api/v1/internal/* with result
        │
        ▼
Express Internal Endpoint
  └─ Validates X-Internal-Service-Secret header
  └─ Writes to Postgres via Prisma
  └─ Triggers next stage if applicable
```

**LangGraph State Pattern:**
Each agent defines a typed `AgentState` TypedDict passed between nodes. Nodes are pure functions that receive the current state and return a partial state update.

---

## 1. JD Parser Agent

**Purpose:** Parses a raw job description draft and produces a structured rubric with skill tags, dimension weights, and suggested thresholds.

**Trigger:** `POST /api/v1/jobs/:jobId/ai-assist`

**Queue:** `sourcing-queue` (lightweight, uses same queue as sourcing)

**LangGraph Flow:**
```
[parse_jd_text]
    │
    ▼
[extract_skill_tags]
    │
    ▼
[generate_rubric_dimensions]
    │
    ▼
[suggest_thresholds]
    │
    ▼
[format_output]
```

**Node Details:**
- `parse_jd_text` — Extracts raw text from the `Job.description` field, normalizes formatting.
- `extract_skill_tags` — Gemini prompt: identifies required and preferred skills, years of experience, seniority level.
- `generate_rubric_dimensions` — Produces 3–5 weighted scoring dimensions that sum to 100, mapped to the job's domain.
- `suggest_thresholds` — Recommends `thresholds` JSON based on role seniority and industry norms.
- `format_output` — Assembles structured JSON output.

**Inputs:** `{ job_id, description }`

**Output:**
```json
{
  "skill_tags": ["TypeScript", "Node.js", "PostgreSQL"],
  "rubric": {
    "dimensions": [
      { "name": "Technical Mastery", "weight": 40 },
      { "name": "System Design", "weight": 35 },
      { "name": "Communication", "weight": 25 }
    ]
  },
  "thresholds": {
    "screening_min": 60,
    "composite_hire": 72
  }
}
```

**Internal Callback:** Updates `Job.rubric` and `Job.thresholds` directly via Express PATCH handler (not a separate internal endpoint — result returned synchronously in the BullMQ job result).

**DB Modified:** `Job.rubric`, `Job.thresholds`, `AgentLog`

---

## 2. Sourcing Agent

**Purpose:** Discovers and pre-ranks candidate profiles from public sources and the platform's own database for a newly published job.

**Trigger:** `POST /api/v1/jobs/:jobId/publish`

**Queue:** `sourcing-queue`

**LangGraph Flow:**
```
[fetch_job_rubric]
    │
    ▼
[search_platform_profiles]  ──┐
    │                          ├─ parallel branches
[search_external_sources]  ───┘
    │
    ▼
[deduplicate_candidates]
    │
    ▼
[semantic_pre_rank]
    │
    ▼
[create_application_stubs]
```

**Node Details:**
- `fetch_job_rubric` — Loads `Job.rubric` and generates a job rubric embedding vector.
- `search_platform_profiles` — pgvector cosine similarity search against `CandidateProfile.resume_embedding` using the job rubric vector.
- `search_external_sources` — Queries LinkedIn/GitHub public APIs for candidate signals matching skill tags.
- `deduplicate_candidates` — Removes duplicate candidates (platform profile takes precedence over external signal).
- `semantic_pre_rank` — Ranks candidates by semantic match score (0–100).
- `create_application_stubs` — Creates `Application` records with `status: "sourced"` for top-N candidates.

**Inputs:** `{ job_id, org_id }`

**Internal Callback:** `PATCH /api/v1/internal/applications/:id/sourcing-result`

**DB Modified:** `Application` (created), `AgentLog`

---

## 3. Screening Agent

**Purpose:** Evaluates a candidate's resume against the job rubric using semantic vector search and structured LLM analysis to produce a resume score, gap analysis, and auto-rejection decision.

**Trigger:** `POST /api/v1/applications` (candidate applies)

**Queue:** `screening-queue`

**LangGraph Flow:**
```
[load_resume_and_job]
    │
    ▼
[parse_resume_text]
    │
    ▼
[generate_resume_embedding]
    │
    ▼
[cosine_similarity_match]
    │
    ▼
[llm_gap_analysis]
    │
    ▼
[compute_resume_score]
    │
    ▼
[auto_rejection_check]
```

**Node Details:**
- `load_resume_and_job` — Fetches `CandidateProfile.resume_url` from storage service, downloads PDF/DOCX.
- `parse_resume_text` — Extracts structured text (skills, work history, education, projects) using PDF parser.
- `generate_resume_embedding` — Generates 768-dim embedding using the local FastEmbed ONNX model `BAAI/bge-base-en-v1.5`.
- `cosine_similarity_match` — Runs pgvector query: `1 - (resume_embedding <=> job_rubric_embedding)` → `semantic_match_score`.
- `llm_gap_analysis` — Gemini prompt: compares extracted resume skills against job rubric dimensions, identifies missing skills.
- `compute_resume_score` — Weighted combination of `semantic_match_score` and LLM dimension alignment.
- `auto_rejection_check` — Compares `resume_score` against `Job.thresholds.screening_min`. Flags for rejection if below.

**Inputs:** `{ application_id, candidate_id, job_id }`

**Internal Callback:** `PATCH /api/v1/internal/applications/:id/screening-result`

**Callback Payload:**
```json
{
  "resume_score": 74.2,
  "semantic_match_score": 0.81,
  "gap_analysis": ["Docker", "Kubernetes"],
  "auto_reject": false
}
```

**DB Modified:** `Evaluation.resume_score`, `Application.status`, `AgentLog`

**On auto-reject:** Express triggers Nodemailer rejection email immediately after callback.

---

## 4. Scheduler Agent

**Purpose:** Generates 3 optimal interview time slots based on company availability settings and sends scheduling emails to the candidate.

**Trigger:** Enqueued by Screening Agent callback when `auto_reject = false` and `resume_score >= screening_min`

**Queue:** `scheduling-queue`

**LangGraph Flow:**
```
[load_org_availability]
    │
    ▼
[compute_candidate_timezone]
    │
    ▼
[generate_slot_options]
    │
    ▼
[create_interview_record]
    │
    ▼
[send_scheduling_email]
    │
    ▼
[schedule_reminders]
```

**Node Details:**
- `load_org_availability` — Reads `Organization.settings.availability_hours` and timezone.
- `compute_candidate_timezone` — Detects candidate timezone from profile or uses org default.
- `generate_slot_options` — Produces 3 non-overlapping slots within availability windows, avoiding existing bookings.
- `create_interview_record` — Creates `Interview` record with proposed slots.
- `send_scheduling_email` — Triggers Nodemailer email with 3 slot options and a booking link.
- `schedule_reminders` — Schedules 24h and 1h reminder emails via BullMQ delayed jobs.

**Inputs:** `{ application_id, job_id, org_id, candidate_id }`

**Internal Callback:** `POST /api/v1/internal/interviews/:id/schedule-slots`

**Callback Payload:**
```json
{
  "slots": [
    { "id": "slot_1", "datetime": "2026-08-10T14:00:00Z", "timezone": "America/New_York" },
    { "id": "slot_2", "datetime": "2026-08-11T10:00:00Z", "timezone": "America/New_York" },
    { "id": "slot_3", "datetime": "2026-08-12T16:00:00Z", "timezone": "America/New_York" }
  ]
}
```

**DB Modified:** `Interview` (created with scheduled_at after candidate confirms), `AgentLog`

---

## 5. Interviewer Agent

**Purpose:** Conducts a fully adaptive, human-like voice interview using a Dynamic Conversational Loop — no fixed question scripts.

**Trigger:** Candidate joins `/interview/:interviewId` after consent and session token issuance

**Queue:** `interview-queue` (post-interview processing only — the agent runs in real-time, not via queue)

**Real-Time Loop (not a queue job):**

The Interviewer Agent runs as a long-lived FastAPI WebSocket handler during the interview session:

```
[initialize_agent_state]
    │
    ▼
[load_context]        ← resume + job rubric + rubric dimensions
    │
    ▼
    ┌─────────────────────────────────────────────┐
    │         DYNAMIC CONVERSATIONAL LOOP         │
    │                                             │
    │  [receive_stt_transcript_chunk]             │
    │            │                                │
    │            ▼                                │
    │  [analyze_response_quality]                 │
    │    - completeness vs rubric dimension       │
    │    - vague/evasive detection                │
    │    - specific claim extraction              │
    │            │                                │
    │            ▼                                │
    │  [decide_next_action]                       │
    │    - deep_dive_follow_up                    │
    │    - clarification_probe                    │
    │    - dimension_transition                   │
    │    - stage_transition                       │
    │    - wrap_up                                │
    │            │                                │
    │            ▼                                │
    │  [generate_response_text] ← Gemini 2.10    │
    │            │                                │
    │            ▼                                │
    │  [tts_synthesis] ← Piper/Coqui             │
    │            │                                │
    │            ▼                                │
    │  [stream_audio_to_webrtc]                   │
    │            │                                │
    │            └──── repeat until wrap_up ──────┘
    │
    ▼
[finalize_transcript]
    │
    ▼
[upload_audio_to_storage]
    │
    ▼
[enqueue_evaluation]
```

**LangGraph State:**
```python
class InterviewState(TypedDict):
    interview_id: str
    candidate_resume: dict
    job_rubric: dict
    transcript: list[dict]       # all turns so far
    current_stage: str           # introduction | core_vetting | deep_dive | wrap_up
    dimension_coverage: dict     # rubric dimension → coverage score (0.0-1.0)
    pending_follow_up: str | None
    is_complete: bool
```

**Voice Pipeline Latency Target:** < 1.0 second end-to-end (STT chunk → LangGraph decision → TTS output start)

**Inputs (real-time):** `{ interview_id, candidate_resume, job_rubric, stt_stream }`

**Post-Interview Queue Job (interview-queue):**
- Assembles final `transcript` JSON
- Uploads audio recording to storage service
- Returns `audio_url`

**Internal Callback:** `PATCH /api/v1/internal/interviews/:id/complete`

**Callback Payload:**
```json
{
  "transcript": { "turns": [...], "duration_ms": 1800000 },
  "audio_url": "storage://nextround-audio/interview_abc123.mp3",
  "proctor_flags": [...],
  "engagement_signal": { "average_engagement": 84, "gaze_consistency": 0.91 }
}
```

**DB Modified:** `Interview.transcript`, `Interview.audio_url`, `Interview.proctor_flags`, `Interview.status → "completed"`, `AgentLog`

**Triggers next:** Enqueues `evaluation-queue` job.

---

## 6. Assessment Agent

**Purpose:** Evaluates aptitude test submissions (4 cognitive categories) and coding sandbox submissions (isolated execution + complexity analysis).

**Trigger (Aptitude):** Candidate submits aptitude test → `POST /api/v1/applications/:id/assessment`

**Trigger (Coding):** Candidate submits code → `POST /api/v1/applications/:id/take-home`

**Queue:** `assessment-queue` (aptitude) | `coding-queue` (coding)

### 6A. Aptitude Sub-Agent Flow:
```
[load_questions_and_responses]
    │
    ▼
[score_per_category]
    │  - Logical Reasoning (objective scoring)
    │  - Verbal Ability (objective scoring)
    │  - Quantitative Aptitude (objective scoring)
    │  - Technical Core Concepts (objective scoring)
    ▼
[compute_weighted_aptitude_score]
    │
    ▼
[callback_result]
```

**Internal Callback:** `PATCH /api/v1/internal/applications/:id/assessment-result`

**Callback Payload:**
```json
{
  "score": 71.5,
  "category_breakdown": {
    "logical_reasoning": 80,
    "verbal_ability": 65,
    "quantitative": 72,
    "technical": 69
  }
}
```

### 6B. Coding Sub-Agent Flow:
```
[load_submission_and_test_cases]
    │
    ▼
[execute_in_sandbox]
    │  - Language: JS/TS/Python/Go
    │  - Resource cap: 512MB RAM, 10s timeout
    │  - Run against visible + hidden test cases
    ▼
[measure_performance]
    │  - execution_time_ms
    │  - memory_mb
    ▼
[estimate_complexity]
    │  - LLM analysis of code structure
    │  - Big-O estimate
    ▼
[compute_coding_score]
    │  - pass_rate * 60 + complexity_score * 40
    ▼
[callback_result]
```

**Internal Callback:** `PATCH /api/v1/internal/applications/:id/coding-result`

**Callback Payload:**
```json
{
  "pass_rate": 0.875,
  "execution_time_ms": 142,
  "memory_mb": 18.4,
  "complexity_score": 82,
  "test_results": [
    { "test_id": "t1", "passed": true, "output": "42" },
    { "test_id": "t2", "passed": false, "expected": "7", "actual": "null" }
  ]
}
```

**DB Modified:** `Assessment`, `CodingSubmission`, `AgentLog`

---

## 7. Evaluator Agent

**Purpose:** Aggregates all stage scores into a composite evaluation and produces a final confidence-rated score.

**Trigger:** All enabled assessment stages complete (last callback triggers `evaluation-queue` enqueue)

**Queue:** `evaluation-queue`

**LangGraph Flow:**
```
[load_all_stage_scores]
    │
    ▼
[llm_interview_transcript_scoring]
    │  - Gemini 2.10 as judge
    │  - Scores each rubric dimension (0-100) from transcript
    │  - Uses structured JSON output schema (no hallucination)
    │
    ▼
[aggregate_composite_score]
    │  - Weighted sum: resume (20%) + interview (40%) + aptitude (20%) + coding (20%)
    │  - Weights adjusted if some stages are disabled
    │
    ▼
[confidence_estimation]
    │  - Based on transcript completeness, answer specificity, score variance
    │
    ▼
[callback_result]
```

**Inputs:** `{ application_id, job_id, interview_transcript, all stage scores }`

**Internal Callback:** `PATCH /api/v1/internal/evaluations/:id`

**Callback Payload:**
```json
{
  "composite_score": 76.4,
  "confidence": 0.83,
  "interview_score": 78.0,
  "dimension_scores": {
    "Technical Mastery": 82,
    "Problem Solving": 74,
    "Communication": 78
  },
  "reasoning": "Candidate demonstrated strong TypeScript knowledge..."
}
```

**DB Modified:** `Evaluation` (all score fields), `AgentLog`

**Triggers next:** Enqueues `decision-queue` job.

---

## 8. Decision Agent

**Purpose:** Applies threshold logic to the composite evaluation score, classifies the hiring outcome, and executes automated offer or rejection delivery.

**Trigger:** `evaluation-queue` callback writes evaluation → `decision-queue` enqueued (if HR Round passed)

**Queue:** `decision-queue`

**LangGraph Flow:**
```
[load_evaluation_and_thresholds]
    │
    ▼
[confidence_gate]
    │  if confidence < 0.70 → hold_for_review
    ▼
[threshold_match]
    │  if composite >= hire_threshold → hire
    │  if composite >= hold_threshold → hold_for_review
    │  else → reject
    ▼
[generate_decision_content]
    │  - hire: draft offer letter (role, salary, equity, start date)
    │  - reject: draft constructive rejection email with gap analysis
    │  - hold: create HR notification
    ▼
[callback_result]
    │
    ▼
[trigger_email_delivery]  ← Express handles via Nodemailer
```

**Inputs:** `{ evaluation_id, application_id, job_id, hr_round_status }`

**Internal Callback:** `PATCH /api/v1/internal/evaluations/:id/decision`

**Callback Payload:**
```json
{
  "decision": "hire",
  "offer_draft": {
    "role_title": "Senior Backend Engineer",
    "salary": 180000,
    "equity": "0.1% over 4 years",
    "start_date": "2026-09-15"
  },
  "rejection_email_body": null
}
```

**DB Modified:** `Evaluation.decision`, `Offer` (created on hire), `Application.status`, `AgentLog`

**Post-callback (Express):**
- `hire + auto_offer = true`: creates `Offer`, sends offer email via Nodemailer
- `reject`: sends rejection email via Nodemailer
- `hold_for_review`: creates HR notification, blocks auto-offer

---

## 9. Analytics Agent

**Purpose:** Aggregates weekly hiring pipeline metrics and generates PDF executive reports for HR analytics dashboards.

**Trigger:** Weekly cron (`analytics-queue`) or on-demand via `GET /api/v1/analytics/org/report.pdf`

**Queue:** `analytics-queue`

**LangGraph Flow:**
```
[load_org_pipeline_data]
    │
    ▼
[compute_funnel_metrics]
    │  - candidates per stage, drop-off rates
    │  - time-to-hire per stage
    │  - score distributions
    │
    ▼
[generate_pdf_report]

    │  - Charts, tables, executive summary
    │  - Upload to storage service
    ▼
[callback_result]
```

**Internal Callback:** `POST /api/v1/internal/analytics/:orgId/weekly-report`

**DB Modified:** Analytics rows (if applicable), PDF URL stored, `AgentLog`

---

## 10. Mock Interview Agent

**Purpose:** Runs the same Dynamic Conversational Loop as the Interviewer Agent for candidate practice sessions, using `PrepContent` rubrics instead of real job rubrics.

**Trigger:** `POST /api/v1/candidate/mock/sessions`

**Queue:** `mock-queue` (post-session feedback processing only — real-time loop same as Interviewer Agent)

**LangGraph Flow:** Identical to Interviewer Agent (#5), except:
- State initialized from `PrepContent` (target company + role archetype rubric)
- No `Interview` record created — uses `MockSession` instead
- Proctor telemetry is not transmitted (no MediaPipe required for practice mode)
- After session end: generates instant feedback report (strengths, weaknesses, annotated transcript)

**Internal Callback:** `PATCH /api/v1/internal/mock-sessions/:sessionId/complete`

**Callback Payload:**
```json
{
  "transcript": { "turns": [...] },
  "score": 68.5,
  "feedback": {
    "strengths": ["Clear communication", "Strong system design reasoning"],
    "weaknesses": ["Vague on Redis implementation specifics", "No metrics cited for project impact"],
    "annotated_transcript": [
      { "turn_index": 4, "speaker": "candidate", "text": "...", "coaching_note": "Add specific metrics here." }
    ]
  }
}
```

**DB Modified:** `MockSession`, `AgentLog`

---

## 11. AI Voice Resume Builder Agent

**Purpose:** Conducts a structured 15-minute voice interview to extract candidate work history, skills, and achievements, then generates an ATS-compliant formatted resume PDF.

**Trigger:** `POST /api/v1/candidates/me/voice-resume/start`

**Queue:** `mock-queue` (post-session resume generation)

**LangGraph Flow (Real-Time):**

Same Dynamic Conversational Loop as Interviewer Agent, but with a resume-extraction objective:

```
[initialize_resume_extraction_state]
    │
    ▼
    ┌──────────────────────────────────────────────┐
    │        RESUME EXTRACTION LOOP                │
    │                                              │
    │  [receive_candidate_speech]                  │
    │            │                                 │
    │            ▼                                 │
    │  [extract_structured_data_in_realtime]       │
    │    - quantified achievements ("78% reduction")│
    │    - skill signals                           │
    │    - role titles, company names, dates       │
    │    - leadership signals                      │
    │            │                                 │
    │            ▼                                 │
    │  [generate_follow_up_or_probe]               │
    │    - "Can you give a specific metric?"       │
    │    - "What was the team size?"               │
    │            │                                 │
    │            └──── repeat ─────────────────────┘
    │
    ▼
[assemble_resume_data]
    │
    ▼
[format_ats_resume]       ← Gemini 2.10 with strict single-column template
    │
    ▼
[compute_ats_compliance_score]
    │
    ▼
[generate_pdf]            ← PDF generation (reportlab or weasyprint)
    │
    ▼
[upload_to_storage]
    │
    ▼
[callback_result]
```

**Post-Session Queue Job:**
- Generates formatted ATS resume from extracted data
- Computes ATS compliance score (keyword density, formatting, section completeness)
- Renders PDF and uploads to storage service
- Returns `resume_url` and `ats_score`

**Internal Callback:** `POST /api/v1/internal/candidates/me/voice-resume/complete`

**Callback Payload:**
```json
{
  "candidate_id": "uuid",
  "resume_url": "storage://nextround-resumes/candidate_uuid_ats_resume.pdf",
  "ats_score": 96,
  "extracted_data": {
    "skills": ["TypeScript", "Node.js", "Redis"],
    "experience": [
      {
        "company": "Acme Corp",
        "role": "Senior Backend Engineer",
        "duration": "2023–2026",
        "bullets": ["Reduced API latency by 78% via Redis caching layer"]
      }
    ]
  }
}
```

**DB Modified:** `CandidateProfile.resume_url`, `CandidateProfile.skills`, `AgentLog`
