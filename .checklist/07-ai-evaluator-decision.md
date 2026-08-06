# Checklist 07 — AI Agents: Evaluator, Bias Audit & Decision Agent

Implement the Evaluator + Bias Audit Agent and the Decision Agent — the final two pipeline stages before offer/rejection.

---

## A. BullMQ Setup (Express)

- [x] `apps/api/src/lib/queues/evaluation.queue.ts` — define `evaluation-queue` (critical priority)
- [x] `apps/api/src/lib/queues/decision.queue.ts` — define `decision-queue` (critical priority)
- [x] Wire `evaluation-queue` enqueue from:
  - `PATCH /api/v1/internal/interviews/:id/result` (after interview completed)
  - Manual advance via `PATCH /api/v1/applications/:id/status` (if HR skips a stage)
- [x] Wire `decision-queue` enqueue from:
  - `PATCH /api/v1/internal/evaluations/:id` (after evaluation + bias audit complete)

---

## B. Express Internal Callback Endpoints

- [x] `PATCH /api/v1/internal/evaluations/:id` — persist evaluator output:
  - `composite_score`, `confidence`, `dimension_scores` JSON, `bias_report` JSON
  - Update `Application.status = 'evaluation_completed'`
  - Enqueue `decision-queue` (if confidence >= 0.70)
  - If confidence < 0.70: set `Application.status = 'hold_for_review'`, notify HR

- [x] `PATCH /api/v1/internal/evaluations/:id/decision` — persist Decision Agent output:
  - `decision` (hire | reject | hold_for_review)
  - `decision_rationale` text
  - Update `Application.status` accordingly
  - If `hire` AND `auto_offer = true` AND HR round passed: trigger offer creation + email
  - If `reject`: trigger rejection email

- [x] `POST /api/v1/internal/offers` — create `Offer` record with offer letter content + magic link token

---

## C. LangGraph: Evaluator + Bias Audit Agent

File: `apps/ai-service/agents/evaluator_agent.py`

### State Schema
```python
EvaluatorState:
  application_id: str
  job_rubric: dict
  resume_score: float
  interview_score: dict       # per dimension
  aptitude_score: float
  coding_score: float
  video_transcript: str
  candidate_metadata: dict    # name, email only — NO demographics
  composite_score: float
  confidence: float
  dimension_scores: dict
  bias_report: dict
  is_hold: bool
```

### LangGraph Nodes
- [x] `Node: aggregate_scores` — weighted composite:
  - `composite = resume_weight * resume_score + interview_weight * interview_score + aptitude_weight * aptitude_score + coding_weight * coding_score`
  - Weights taken from `Job.rubric.stage_weights`
  - Compute `confidence` = inverse of score variance (high variance → lower confidence)

- [x] `Node: run_bias_audit` — LLM-as-judge bias check:
  - Gemini prompt: "Review this evaluation for signs of demographic correlation. Flag any dimension where the reasoning mentions school name/prestige, candidate name (cultural origin), graduation year, or other protected-class proxies."
  - Input: dimension scores + reasoning strings (NO raw personal data beyond role-relevant facts)
  - Output: `demographic_anomaly_report: { flagged_dimensions: [], severity: low|medium|high, recommendations: [] }`
  - **Proctor flags (`Interview.proctor_flags`) are explicitly excluded from this input**

- [x] `Node: validate_isolation` — programmatic check:
  - Assert `proctor_flags` are not present in any scoring input
  - Assert no CV signals (face_count, gaze_centered, engagement_index) in composite_score formula
  - If assertion fails: raise `ScoringIsolationError`, log to `AgentLog`, halt pipeline

- [x] `Node: compute_confidence` — confidence < 0.70 sets `is_hold = True`

- [x] `Node: finalize_report` — assemble final `EvaluationReport` JSON

### Conditional Edges
- [x] `aggregate_scores` → `run_bias_audit`
- [x] `run_bias_audit` → `validate_isolation`
- [x] `validate_isolation` → `compute_confidence`
- [x] `compute_confidence` → `finalize_report`
- [x] `finalize_report` → END (callback to Express)

---

## D. LangGraph: Decision Agent

File: `apps/ai-service/agents/decision_agent.py`

### State Schema
```python
DecisionState:
  application_id: str
  composite_score: float
  confidence: float
  job_thresholds: dict        # { hire: 80, reject: 50, auto_offer: 90 }
  auto_offer: bool
  hr_round_passed: bool
  decision: str               # hire | reject | hold_for_review
  offer_letter_content: str
  rejection_email_content: str
  decision_rationale: str
```

### LangGraph Nodes
- [x] `Node: threshold_match` — compare `composite_score` to `job_thresholds`:
  - `score >= thresholds.hire AND confidence >= 0.70` → `hire`
  - `score < thresholds.reject` → `reject`
  - `confidence < 0.70` → `hold_for_review`
  - Everything else → `hold_for_review`

- [x] `Node: draft_offer` (conditional, if decision = `hire`):
  - Gemini generates personalized offer letter (role, salary band, start date placeholder, company name)
  - Generate magic link token (UUID) for digital signature

- [x] `Node: draft_rejection` (conditional, if decision = `reject`):
  - Gemini generates constructive rejection email referencing specific skill gaps from `gap_analysis`
  - Encourages candidate to use Mock Interview console to improve

- [x] `Node: draft_hold_notice` (conditional, if decision = `hold_for_review`):
  - Generate HR alert message with confidence score and recommended action

- [x] `Node: emit_decision` — callback to `PATCH /api/v1/internal/evaluations/:id/decision`

### Conditional Edges
- [x] `threshold_match` → `draft_offer` | `draft_rejection` | `draft_hold_notice`
- [x] All draft nodes → `emit_decision` → END

---

## E. Offer & Rejection Flows (Express + Nodemailer)

- [x] `apps/api/src/services/email.service.ts` — add:
  - `sendOfferEmail(candidate, job, offer, magicLink)` — digital offer letter with signature CTA
  - `sendConstructiveRejection(candidate, job, gaps, mockConsoleUrl)` — feedback-rich rejection
  - `sendHRHoldAlert(hrUsers, candidate, application, confidence)` — HR notification for `hold_for_review`

- [x] `POST /api/v1/applications/:id/offer/sign` — candidate signs offer:
  - Validate magic link token, mark `Offer.signed = true`, `Offer.signed_at = now()`
  - Update `Application.status = 'hired'`
  - Send onboarding checklist email

- [x] `GET /api/v1/applications/:id/offer` — return offer details for candidate offer page

---

## F. Frontend — Evaluation & Decision Display

- [x] `apps/web/src/app/hr/candidates/[applicationId]/components/AssessmentScorecard.tsx` — render real composite score + dimension breakdown + bias report badge
- [x] `apps/web/src/app/hr/candidates/[applicationId]/components/DecisionControl.tsx` — show real decision status; allow HR to override `hold_for_review` via `PATCH /api/v1/evaluations/:id/hr-override`
- [x] `apps/web/src/app/candidate/applications/[applicationId]/offer/page.tsx` — fetch offer letter content, render digital signature canvas, wire `POST /api/v1/applications/:id/offer/sign`
- [x] `apps/web/src/app/candidate/applications/[applicationId]/onboarding/page.tsx` — show onboarding checklist after offer signed

---

## G. Bias Audit Display (HR)

- [x] `GET /api/v1/evaluations/:id/bias-report` — return `demographic_anomaly_report` JSON (HR only, org-scoped)
- [x] HR candidate detail page: render bias audit section with flagged dimensions, severity badge, and recommendations
- [x] Visual indicator: green (no flags), yellow (low severity), red (high severity)

---

## H. Hold-for-Review HR Workflow

- [x] `GET /api/v1/hr/hold-queue` — list all `hold_for_review` applications for org
- [x] `PATCH /api/v1/evaluations/:id/hr-override` — HR approves (`hire`) or rejects (`reject`) a held application
  - Triggers appropriate email (offer or rejection) after override

---

## Done When

- Full pipeline: resume_score + interview_score + aptitude_score + coding_score → composite_score → decision
- Bias audit runs on every evaluation; `demographic_anomaly_report` stored and visible to HR
- `proctor_flags` are provably absent from all scoring inputs (verified by `validate_isolation` node)
- Auto-offer candidate receives offer email with signature link within 2 minutes of Decision Agent completion
- Rejected candidate receives constructive feedback email with specific skill gap details
- Low-confidence applications routed to `hold_for_review`; HR sees alert and can override
