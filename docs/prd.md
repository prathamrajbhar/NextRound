# NextRound — Product Requirements Document

NextRound (HireOS) is an AI-native recruitment marketplace where companies post jobs and candidates maintain one reusable profile to apply across any participating company. Autonomous AI agents run the entire hiring pipeline — sourcing, resume screening, aptitude testing, coding assessment, voice interviewing, video screening, decision making, offer extension, and onboarding — with zero required human intervention. HR managers access a pre-vetted shortlist and evaluation transcripts after the pipeline completes.


---

## 1. Problem Statement

| # | Problem | Industry Impact |
|---|---|---|
| 1 | **Recruiter Inefficiency** | Recruiters waste 70–80% of their time on repetitive manual tasks: scanning resumes, scheduling calls, conducting introductory screens, and routing emails. Industry average time-to-hire exceeds 30 days. |
| 2 | **Persistent Hiring Bias** | Human evaluation introduces conscious and unconscious bias based on candidate names, school prestige, age, gender cues, and geography, resulting in legally and ethically compromised outcomes. |
| 3 | **High ATS Cost & Complexity** | Enterprise ATS subscriptions (Greenhouse, Lever, Workday) are prohibitively expensive for small-to-midsize companies and still require significant recruiter headcount to operate. |
| 4 | **Candidate Ghosting & Black Hole** | Candidates submit dozens of applications, wait weeks for responses, and receive zero constructive feedback upon rejection, leading to a broken candidate experience. |
| 5 | **No Candidate Readiness Tools** | Candidates have no reliable, company-specific practice environments to prepare for automated, technical, or AI-conducted interviews before they face them in the real world. |

---

## 2. Product Solution

NextRound is a **two-sided AI talent marketplace**:

**For Companies (HR Portal):** Organizations register, post jobs with AI-assisted JD generation, configure scoring rubrics and auto-offer thresholds, and receive a pre-screened, ranked shortlist. AI agents handle sourcing, screening, scheduling, multi-modal assessment, voice interviewing, evaluation, decision delivery, and offer extension automatically.


**For Candidates (Candidate Portal):** Candidates maintain one universal profile (resume, skills, target roles, GitHub/LinkedIn), browse open positions across all participating companies, apply with one click, and complete dynamic multi-modal vetting. Candidates also access self-serve **Mock Interview Agents** and **Company Prep Libraries** to practice before real applications.

---

## 3. Core Objectives & Success Metrics

| Objective | Metric & Target |
|---|---|
| **Zero Human Steps** | 100% pipeline automation — sourcing to offer delivered with 0 required recruiter touchpoints |
| **Fast Time-to-Hire** | < 72 hours from application submission to automated decision or offer letter delivery |
| **Marketplace Liquidity** | One candidate profile applies across all registered companies with 1-click |

| **Candidate Readiness** | On-demand mock voice interviews with instant scoring feedback, independent of live applications |
| **Multi-Tenant Security** | Strict server-side `org_id` isolation — cross-org data access is technically impossible |

---

## 4. User Personas

### A. HR Manager / Talent Lead

- Registers the organization and manages team member access.
- Posts job listings using the AI JD Assistant and sets rubric dimension weightings.
- Views real-time pipeline Kanban, candidate evaluation detail cards, and interview transcripts/replays.
- Accesses the **Sentiment + Stress Analyser** to review audio tone, speech pace, pitch variation, and Emotional Journey Graphs to distinguish genuine skill gaps from interview nervousness.
- Conducts the final live **Human HR Round** — a 1:1 video call with shortlisted candidates — and manually marks Pass or Fail. This is the only required human step in the pipeline.
- Configures auto-offer toggles, platform availability hours, and custom organization email templates.


### B. Job Candidate

- Creates one platform-wide profile: resume, skills, target compensation, work authorization, proud projects, and work values.
- Uses the **AI Voice Resume Builder** (`/candidate/resume-builder`) to complete a 15-minute voice interview with an AI agent, automatically generating an ATS-compliant resume with quantified bullet points and a PDF download — no manual writing required.
- Applies to jobs across multiple companies without re-entering application details.
- Completes automated scheduling, AI voice interviews, coding sandboxes, aptitude assessments, video screening, and the final Human HR Round video call.
- Receives automated offer letters with a digital signature pad or feedback-rich rejection emails.
- Uses the **Mock Interview Console** and **Company Prep Library** for independent skill development before and after applying.

### C. Compliance Auditor / Platform Admin

- Reviews aggregate bias audit logs across all organizations and score distribution trends.
- Verifies that computer vision proctoring signals from `Interview.proctor_flags` are not present in Decision Agent scoring inputs.
- Accesses platform-wide `AgentLog` streams for pipeline health monitoring and failure inspection.
- Manages platform-level user data requests (GDPR soft deletes, data purge verification).

---

## 5. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16.2.11 (App Router), React 19.2.8, TypeScript 6.0, Tailwind CSS 4.3.3 (Oxide engine), Lucide React 1.23.0 |
| **Backend REST API** | Express.js 5.2.1, TypeScript 6.0, Zod 4.4.3, Prisma ORM 7.9.0, PostgreSQL 16 + pgvector, Custom JWT Auth |
| **AI & Agent Service** | Python 3.13, FastAPI 0.139.2, Uvicorn 0.50, LangGraph, Gemini API (`google-genai` SDK v2.10) |
| **STT / TTS Audio** | Groq API v1.5 (Whisper-large-v3 STT), Piper / Coqui TTS, WebRTC real-time audio |
| **Client-Side CV** | MediaPipe (browser-side face detection, gaze tracking, posture/engagement flags) |
| **Task Queue & Cache** | BullMQ 5.80.10 + Redis 8 (async queue channels for all agent pipelines) |
| **Storage & Email** | Dedicated Storage Service (audio recordings, resume PDFs), Nodemailer 8 (SMTP email automation) |
| **Monorepo** | Turborepo 2.10 managing `apps/web`, `apps/api`, `apps/ai-service`, `packages/*` |

> Stack is locked. Do not substitute any dependency without an explicit team decision.

---

## 6. Business Model

| Tier | Target | Pricing | Limits |
|---|---|---|---|
| **Free** | Startups & SMBs | $0 | 1 active job, 50 candidates/month, basic AI pipeline |
| **Pro** | Growing companies | ~$299/month | 10 active jobs, unlimited candidates, full multi-modal assessment |
| **Enterprise** | Large orgs | Custom | Unlimited jobs, SSO, custom branding, dedicated queue priority |

Candidates always use the platform for free. Monetization is purely on the employer (HR) side.

---

## 7. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Voice Latency** | AI interview turn-taking response < 1.0 second end-to-end |
| **API Latency** | Express non-AI endpoints < 15ms p99 |
| **Resume Processing** | PDF parse + vector embedding generation < 30 seconds |
| **Email Delivery** | Offer/rejection email sent within 2 minutes of Decision Agent completion |
| **Privacy** | MediaPipe CV runs 100% client-side; raw video frames never leave the candidate's device |
| **Multi-Tenant Security** | Server-side `org_id` derived exclusively from JWT payload; never from request body |
| **Uptime** | 99.5% SLA for web API and AI agent workers |
| **Code Execution Safety** | Candidate code submissions run inside isolated, resource-capped sandboxes with timeout limits |

---

## 8. Build Roadmap

### Phase 1 — Core Foundation
**Deliverables:**
- PostgreSQL 16 schema with Prisma 7 ORM (`User`, `Organization`, `Job`, `CandidateProfile`)
- Custom JWT authentication with httpOnly cookie strategy
- Multi-tenant RBAC middleware enforcing `org_id` isolation on all HR routes
- HR job creation UI with AI JD Parser Agent (BullMQ + Python FastAPI)
- Public job catalog with search and filtering

### Phase 2 — Sourcing & Screening
**Deliverables:**
- Sourcing Agent: multi-source candidate discovery with deduplication
- Resume upload endpoint + PDF/DOCX parser
- pgvector embedding generation and cosine similarity search pipeline
- Screening Agent: rubric-matched scoring, gap analysis, auto-rejection emails
- Candidate 1-click apply flow and application status tracking

### Phase 3 — Voice & Computer Vision
**Deliverables:**
- WebRTC voice interview room with mic/cam pre-check and video consent flow
- Scheduler Agent: 3-slot auto-proposer, email reminders, rescheduling
- Groq Whisper-large-v3 STT integration for real-time transcription
- Piper/Coqui TTS integration for AI voice responses
- Dynamic Conversational Loop Interviewer Agent (LangGraph)
- Client-side MediaPipe proctoring HUD with telemetry transmission

### Phase 4 — Multi-Modal Vetting & Intelligence
**Deliverables:**
- Aptitude Test Console (4 cognitive categories, real-time timer)
- Coding Sandbox Console (Monaco editor, multi-language, isolated test execution)
- Video Screening Console (async video prompts + auto-transcription)
- Evaluator Agent (LLM-as-judge composite scoring)
- Decision Agent (threshold matching, auto-offer/rejection, Nodemailer delivery)
- Digital Offer Letter with signature canvas and onboarding checklist
- Mock Interview Agent (practice voice sessions with instant feedback)
- AI Voice Resume Builder Agent (15-minute voice → ATS resume generation)
- Human HR Round video call console

### Phase 5 — Analytics & Polish
**Deliverables:**
- Analytics Agent: weekly funnel metrics, time-to-hire trends

- PDF report generation and export
- Sentiment + Stress Analyser dashboard
- Candidate progress tracking and skill improvement charts
- HR Talent Pool search console with passive candidate bookmarking
- Company Prep Library with AI-generated question banks
- End-to-end integration verification across all agent pipelines

---

## 9. Risk Analysis & Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| **LLM Decision Errors** | Incorrect hiring outcomes | Confidence threshold gates (`< 0.70`) route low-confidence outputs to `hold_for_review`; structured JSON schemas prevent hallucinated outputs |
| **Voice Latency Spikes** | Poor interview experience | Automatic fallback to chat-style text-only interview mode if audio round-trip latency exceeds 3 seconds |
| **CV Proctoring Bias** | Ethical / legal risk | MediaPipe flags logged to `Interview.proctor_flags` strictly for HR review; programmatically excluded from all Decision Agent scoring inputs |
| **Unsafe Code Execution** | Security vulnerability | Code submissions run inside isolated, resource-capped WebAssembly sandbox with hard execution timeouts |
| **Two-Sided Cold Start** | No listings, no candidates | Seed platform with pre-populated demo company accounts, active jobs, and candidate profiles |
| **Schema Drift (Dual Write)** | Data consistency bugs | Python AI service never writes to Postgres directly; all DB writes go through Express internal callback endpoints |

---

## 10. Success Criteria

1. A candidate application advances from submission → sourcing → screening → aptitude → coding → video screening → voice interview → decision → offer letter with **zero human interventions**.

2. Multi-tenant isolation verified: Organization A cannot query any resource belonging to Organization B.
3. A single `CandidateProfile` applies to multiple job postings across different companies using 1-click apply.
4. Client-side MediaPipe proctoring telemetry is stored in `Interview.proctor_flags` and is **absent** from Decision Agent scoring inputs.
5. The Mock Interview Console delivers instant AI coaching feedback independent of any live job application.
6. The AI Voice Resume Builder produces a downloadable, ATS-compliant PDF resume from a voice interview session.
7. The Human HR Round video call is successfully gated — offer letter is only released after HR marks `Pass`.
