# NextRound — Product Requirements Document (PRD)

NextRound (HireOS) is an AI-native recruitment marketplace with a zero-human-step hiring pipeline. Companies post jobs on the platform, and candidates create one reusable profile to apply across any company. Autonomous AI agents run the entire hiring process — sourcing, resume screening, aptitude testing, interactive coding assessments, AI voice interviewing, video screening, bias auditing, hiring decision making, digital offer extensions, and post-offer onboarding — with zero manual intervention required. HR managers only view the final pre-vetted shortlist, evaluation transcripts, and bias audit reports.

---

## 1. Problem Statement

1. **Massive Recruiter Inefficiency**: Recruiter time is wasted on repetitive manual tasks: scanning resumes, scheduling calls, conducting introductory interviews, and routing emails (30+ day industry average time-to-hire).
2. **Persistent Hiring Bias**: Human evaluation suffers from conscious and unconscious bias based on candidate names, school prestige, age, gender codes, and geography.
3. **High ATS Cost & Complexity**: Small-to-midsize companies cannot afford enterprise ATS subscriptions or dedicated talent acquisition teams.
4. **Candidate Ghosting & Black Hole**: Candidates submit dozens of applications, wait weeks for responses, and receive zero constructive feedback upon rejection.
5. **Lack of Candidate Readiness Tools**: Candidates have no reliable, company-specific practice environments to prepare for real-world automated or technical interviews.

---

## 2. Product Solution

NextRound operates as a two-sided AI talent marketplace:

- **For Companies (HR Portal)**: Organizations post jobs, configure scoring rubrics and auto-offer thresholds, and receive pre-screened shortlists. AI agents handle sourcing, screening, scheduling, multi-modal assessment, interviewing, evaluating, bias auditing, decision delivery, and offer extensions.
- **For Candidates (Candidate Portal)**: Candidates maintain one universal profile (resume, skills, target roles, GitHub/LinkedIn links), browse open positions across all participating companies, apply with one click, and complete dynamic multi-modal vetting (Voice AI Interview, Aptitude Test, Coding Sandbox, Video Screening). Candidates also access self-serve **Mock Interview Agents** and **Company Prep Libraries**.

---

## 3. Core Objectives & Metrics

| Goal | Metric / Target | Description |
|---|---|---|
| **Zero Human Steps** | 100% pipeline automation | Sourcing to offer letter delivered with 0 recruiter touchpoints required |
| **Fast Time-to-Hire** | < 72 Hours | From application submission to automated decision/offer letter delivery |
| **Bias Transparency** | 100% Audit Coverage | Every evaluation produces a demographic anomaly audit report |
| **Marketplace Liquidity** | Single Profile Reuse | 1 candidate profile applies across all registered platform companies |
| **Candidate Readiness** | Integrated Practice Mode | On-demand mock voice interviews with instant scoring feedback |
| **Data Isolation** | Multi-tenant Security | Strict server-side `org_id` boundaries backed by Prisma 7.9.0 |

---

## 4. User Personas

### A. HR Manager / Talent Lead (Company User)
- Registers organization and manages team member access levels.
- Posts job listings, utilizes AI JD parsing, and sets rubric weightings.
- Views real-time pipeline Kanban, candidate evaluation detail cards, and interview replays.
- Accesses **Sentiment + Stress Analyser** (`/hr/sentiment-analysis`) to review audio tone, speech pace, pitch variation, and Emotional Journey Graphs to distinguish genuine skill gaps from interview nervousness.
- Conducts live 1:1 Human HR Round video calls with candidates after all AI assessments pass threshold, manually marking Pass/Fail.
- Configures auto-offer toggles, platform availability slots, and custom email templates.

### B. Job Candidate (Platform User)
- Builds a platform-wide candidate profile (resume, skills, target compensation, work authorization).
- Uses **AI Voice Resume Builder** (`/candidate/resume-builder`) to complete a 15-minute voice interview with an AI agent to automatically generate a formatted, ATS-compliant resume with quantified bullet points and PDF download options.
- Applies to jobs across multiple companies without re-entering application details.
- Completes automated scheduling, voice interviews, coding sandboxes, aptitude assessments, and final Human HR Round video call.
- Receives automated decisions, digital offer letters with signature pads, or feedback-rich rejection emails.
- Utilizes Mock Interview Console and Company Prep Libraries for skill development.

### C. Compliance Auditor / Admin
- Reviews aggregate bias audit logs, score distribution trends, and proctoring telemetry data.
- Ensures computer vision proctoring signals remain isolated from hiring decision logic.

---

## 5. Technology Stack (Locked 2026 Stable Versions)

| Layer | Technologies & Versions |
|---|---|
| **Frontend Web App** | Next.js 16.2.11 (App Router), React 19.2.8, TypeScript 6.0, Tailwind CSS 4.3.3 (Oxide engine), Lucide React 1.23.0 |
| **Backend REST API** | Express.js 5.2.1, TypeScript 6.0, Zod 4.4.3, Prisma ORM 7.9.0, PostgreSQL 16 + pgvector, Custom JWT Auth |
| **AI & Agent Service** | Python 3.13, FastAPI 0.139.2, Uvicorn 0.50, LangGraph, Gemini API (`google-genai` SDK v2.10) |
| **STT / TTS Audio Engine** | Groq API v1.5 (Whisper-large-v3 STT), Piper / Coqui TTS, WebRTC real-time audio |
| **Client-Side Computer Vision** | MediaPipe (browser-side face detection, multi-person detection, posture/engagement flags) |
| **Task Queue & Caching** | BullMQ 5.80.10 + Redis 8 (async queues for 8 agent pipelines) |
| **Storage & Email** | AWS S3 / MinIO (audio recordings, resume PDFs), Nodemailer 8 (SMTP email automation) |
| **Monorepo Infra** | Turborepo 2.10, Vercel (Frontend), Managed Cloud / VPS (Express, Python, Redis, Postgres) |

---

## 6. Data Model Architecture (Prisma 7 Entities)

```
User: id, email, password_hash, role (hr | candidate), org_id (nullable), created_at
Organization: id, name, logo_url, industry, size, settings (json), created_at
Job: id, org_id, title, description, rubric (json), thresholds (json), status (draft|active|closed), created_at
CandidateProfile: id, user_id, resume_url, linkedin_url, github_url, skills (json), target_roles (json), expected_salary, notice_period, work_authorization, proud_project, work_values (json), created_at
Application: id, candidate_id, job_id, status (applied|screening|interview_scheduled|interviewed|hr_round|decided|offered|accepted), hr_round_status (pending|scheduled|passed|failed), hr_round_scheduled_at, hr_round_completed_at, applied_at
Evaluation: id, application_id, stage, resume_score, interview_score, composite_score, bias_flag, bias_report (json), decision (hire|reject|hold), reasoning
Interview: id, application_id, scheduled_at, transcript (json), audio_url, proctor_flags (json), engagement_signal (json), video_consent (bool), status
Assessment: id, application_id, test_type (aptitude|coding|video), questions (json), responses (json), score, status
CodingSubmission: id, application_id, language, code, test_results (json), pass_rate, execution_time_ms
Offer: id, application_id, role_title, salary, equity, start_date, status (pending|accepted|declined), signature_svg, valid_until
AgentLog: id, job_id, agent_name, action, input (json), output (json), status, created_at
MockSession: id, candidate_id, target_company, target_role, rubric (json), transcript (json), score, feedback (json), created_at
PrepContent: id, company_name, role_archetype, questions (json), culture_notes, updated_at
```

---

## 7. Non-Functional Requirements

- **Latency**: Voice AI interview turn-taking response latency < 1.0 second; Express API non-AI response latency < 15ms.
- **Processing Time**: Resume parsing and vector embedding generated in < 30 seconds.
- **Email Delivery**: Automated offer/rejection notification emails sent within 2 minutes of decision generation.
- **Privacy & Consent**: MediaPipe computer vision processing runs 100% client-side; explicit video consent required before session initialization.
- **Multi-Tenant Security**: Strict server-side `org_id` verification on all HR queries via JWT payload; cross-org data access strictly forbidden.
- **High Availability**: 99.5% uptime target for web API and agent workers.

---

## 8. Build Roadmap (5-Month Phased Rollout)

- **Month 1 — Core Foundation**: Postgres schema + Prisma 7 ORM setup, custom JWT auth, multi-tenant organization boundaries, HR job creation UI, JD Parser Agent.
- **Month 2 — Sourcing & Screening**: Sourcing Agent, resume parser, pgvector semantic search RAG pipeline, public job catalog, application tracking primitives.
- **Month 3 — Voice & Computer Vision**: WebRTC voice interview room, Scheduler Agent, Groq Whisper STT + Piper/Coqui TTS engine, client-side MediaPipe proctoring integration.
- **Month 4 — Multi-Modal Vetting & Intelligence**: Aptitude Test Console, Coding Sandbox, Evaluator + Bias Audit Agent, Decision Agent, Offer letter extension & digital signatures, Mock Interview Agent.
- **Month 5 — Analytics & Polish**: Analytics Agent, PDF report generation, candidate progress tracking, Talent Pool search console, end-to-end integration verification.

---

## 9. Risk Analysis & Mitigation Matrix

| Risk | Potential Impact | Technical Mitigation |
|---|---|---|
| **LLM Decision Errors** | Incorrect candidate hiring decisions | Confidence threshold gates route low-confidence outputs to "Hold for Review"; structured JSON schemas prevent hallucinated outputs. |
| **Voice Latency Spikes** | Poor candidate interview experience | Automatic fallback to chat-style text-only interview mode if audio latency exceeds 3 seconds. |
| **Computer Vision Bias** | Ethical / legal compliance risks | MediaPipe flags are logged strictly for HR audit review and explicitly excluded from Decision Agent scoring functions. |
| **Unrestricted Code Execution** | Security vulnerability in coding assessment | Code submissions executed inside isolated, resource-capped WebAssembly / sandbox environments with short execution timeouts. |
| **Two-Sided Cold Start** | Initial lack of job listings | Seed platform with pre-populated demo company accounts, jobs, and candidate profiles. |

---

## 10. Success Criteria

1. End-to-end execution of a candidate application through sourcing, resume screening, voice interview, coding assessment, bias audit, decision, and offer letter generation with zero human interventions across multiple companies.
2. Verified multi-tenant data isolation preventing Organization A from querying Organization B data.
3. Candidate candidate profile reusable across multiple company postings with 1-click apply.
4. Client-side MediaPipe proctoring telemetry stored without influencing Decision Agent composite scores.
5. Functional Mock Interview Console providing instant feedback to candidates independent of live job postings.
