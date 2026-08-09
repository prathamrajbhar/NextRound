# NextRound — REST API Specification

All endpoints are served by `apps/api` (Express.js 5.2.1) and prefixed with `/api/v1`.

**Authentication:** Authenticated requests require a valid JWT passed as an httpOnly cookie or `Authorization: Bearer <token>` header. All HR routes derive `org_id` exclusively from the server-side verified JWT payload — never from request body or query params.

---

## Standard Response Envelope

```json
// Success
{
  "success": true,
  "data": { ... },
  "error": null
}

// Error
{
  "success": false,
  "data": null,
  "error": {
    "code": "STRING_ERROR_CODE",
    "message": "Human readable description",
    "details": null
  }
}
```

---

## JWT Payload Structure

```json
{
  "sub": "user_uuid",
  "role": "hr | candidate",
  "org_id": "org_uuid | null",
  "iat": 1700000000,
  "exp": 1700003600
}
```

`org_id` is `null` for candidates and non-null for HR users. Access tokens expire in 1 hour. Refresh tokens rotate on each use.

---

## 1. Authentication (`/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | Public | Register account. Body: `{ email, password, role: "hr"|"candidate", companyName? }`. Creates `Organization` if `role=hr`. |
| POST | `/auth/login` | Public | Authenticate credentials. Returns user payload, sets httpOnly JWT cookies. |
| POST | `/auth/refresh` | Refresh Cookie | Rotates short-lived access token. |
| POST | `/auth/logout` | Authenticated | Revokes refresh token session and clears auth cookies. |
| POST | `/auth/forgot-password` | Public | Dispatches password reset email with a token. |
| POST | `/auth/reset-password` | Token Payload | Body: `{ token, newPassword }`. Resets user password hash. |
| GET | `/auth/me` | Authenticated | Returns current user record, role, and org scope. |

---

## 2. Organization Management (`/organizations`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/organizations/me` | HR | Fetch caller's organization details, logo, and active settings. |
| PATCH | `/organizations/me` | HR Admin | Update organization name, industry, and logo URL. |
| GET | `/organizations/me/members` | HR | List workspace team members and assigned roles. |
| POST | `/organizations/me/members/invite` | HR Admin | Send invitation email to team member. Body: `{ email, role: "admin"|"viewer" }`. |
| POST | `/organizations/me/members/accept-invite` | Token Payload | Accept team invitation. Body: `{ token }`. Creates user and links to org. |
| PATCH | `/organizations/me/members/:userId` | HR Admin | Modify team member role or revoke access. |
| GET | `/organizations/me/settings` | HR | Fetch availability hours, email templates, auto-offer defaults, threshold defaults. |
| PATCH | `/organizations/me/settings` | HR Admin | Update workspace settings. |

---

## 3. Job Management (`/jobs`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/jobs` | Public | Browse published jobs. Query: `search`, `location`, `company`, `salaryMin`, `page`. |
| GET | `/jobs/:jobId` | Public | Fetch job detail. |
| GET | `/jobs/org` | HR | List all org jobs (`draft`, `active`, `closed`). |
| POST | `/jobs` | HR | Create draft job. Body: `{ title, description }`. |
| POST | `/jobs/:jobId/ai-assist` | HR | Enqueue JD Parser Agent — extracts skills and generates rubric. Returns `{ jobId, status: "queued" }`. |
| PATCH | `/jobs/:jobId` | HR Org Scoped | Update title, description, rubric weights, thresholds, pipeline toggles. |
| POST | `/jobs/:jobId/publish` | HR Org Scoped | Transition status to `active` and enqueue Sourcing Agent. |
| POST | `/jobs/:jobId/pause` | HR Org Scoped | Temporarily pause pipeline advancement for this job. |
| POST | `/jobs/:jobId/close` | HR Org Scoped | Mark job `closed`. No new applications accepted. |
| GET | `/jobs/:jobId/pipeline` | HR Org Scoped | Kanban payload: column counts, candidate cards, recent `AgentLog` stream. |

---

## 4. Candidate Applications (`/applications`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/applications` | Candidate | Apply to job. Body: `{ jobId }`. Creates `Application`, enqueues Screening Agent. |
| GET | `/applications/me` | Candidate | List caller's applications and stage statuses. |
| GET | `/applications/:applicationId` | Candidate Own / HR | Fetch application detail and evaluation breakdown. |
| GET | `/jobs/:jobId/applications` | HR Org Scoped | Tabular candidate list for a specific job. |
| PATCH | `/applications/:applicationId/status` | HR Org Scoped | Manual stage override — advance or reject candidate. |
| POST | `/applications/:applicationId/schedule` | Candidate Own | Confirm selected interview slot. Body: `{ slotId }`. |
| POST | `/applications/:applicationId/reschedule` | Candidate Own | Request new slots. Enqueues Scheduler Agent. |

---

## 5. Candidate Profile (`/candidates`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/candidates/me` | Candidate | Fetch candidate profile. |
| POST | `/candidates/me/resume` | Candidate | Multipart PDF/DOCX upload. Triggers background parse job. |
| PATCH | `/candidates/me` | Candidate | Update skills, GitHub/LinkedIn URLs, target compensation, work authorization. |
| DELETE | `/candidates/me` | Candidate | GDPR deletion request — soft-deletes profile and queues data purge. |
| POST | `/candidates/me/voice-resume/start` | Candidate | Start an AI Voice Resume Builder session. Returns `{ sessionId, webrtcCredentials }`. |
| POST | `/candidates/me/voice-resume/complete` | Candidate | Mark session complete and trigger resume generation. Body: `{ sessionId }`. |

---

## 6. Voice & WebRTC Interviews (`/interviews`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/interviews/:interviewId` | Candidate / HR | Fetch interview status and configuration. |
| POST | `/interviews/:interviewId/consent` | Candidate Own | Record video/CV consent before session launch. Body: `{ videoConsent: boolean }`. |
| POST | `/interviews/:interviewId/session-token` | Candidate Own | Issue short-lived WebRTC session credentials. |
| GET | `/interviews/:interviewId/transcript` | Candidate / HR | Full interview transcript with timestamps and audio URL. |

---

## 7. Multi-Modal Assessments (`/applications/:id/*`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/applications/:id/assessment` | Candidate Own | Fetch aptitude test questions and timer status. |
| POST | `/applications/:id/assessment` | Candidate Own | Submit aptitude test answers. Enqueues assessment worker. |
| GET | `/applications/:id/take-home` | Candidate Own | Fetch coding problem specs, starter code, and test cases. |
| POST | `/applications/:id/take-home` | Candidate Own | Submit code solution. Body: `{ language, code }`. Enqueues coding worker. |
| GET | `/applications/:id/video-screening` | Candidate Own | Fetch video screening prompts and recording rules. |
| POST | `/applications/:id/video-screening` | Candidate Own | Upload recorded video response (multipart). |

---

## 8. HR Video Call — Human HR Round (`/hr/interview`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/hr/interview/:applicationId` | HR Org Scoped | Fetch HR Round session details, scheduled time, candidate info. |
| POST | `/hr/interview/:applicationId/result` | HR Org Scoped | Submit Pass/Fail decision. Body: `{ decision: "pass"|"fail", notes? }`. Triggers Decision Agent. |

---

## 9. Offers & Onboarding (`/applications/:id/*`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/applications/:id/offer` | Candidate Own / HR | Fetch offer letter details (salary, equity, start date, status, valid_until). |
| POST | `/applications/:id/offer/accept` | Candidate Own | Accept offer. Body: `{ signatureSvg }`. Sets `Offer.status → "accepted"`. |
| POST | `/applications/:id/offer/decline` | Candidate Own | Decline offer. Optional body: `{ feedbackNote }`. |
| GET | `/applications/:id/onboarding` | Candidate Own / HR | Fetch onboarding task checklist and submission status. |
| POST | `/applications/:id/onboarding/tasks/:taskId` | Candidate Own | Upload document or submit task response (multipart). |

---

## 10. Evaluations & Decisions (`/evaluations`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/evaluations/:applicationId` | Candidate / HR | Composite score breakdown, dimension scores, and decision rationale. |
| POST | `/evaluations/:applicationId/decision/approve` | HR Org Scoped | Approve a `hold_for_review` decision and trigger offer dispatch. |
| POST | `/evaluations/:applicationId/decision/override` | HR Org Scoped | Override AI decision. Body: `{ decision: "hire"|"reject", reasoningNote }`. |

---

## 11. HR Talent Pool (`/organizations/me/talent-pool`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/organizations/me/talent-pool` | HR Org Scoped | Query passive candidate pool. Params: `q`, `skills`, `minExp`. |
| POST | `/organizations/me/talent-pool/bookmark` | HR Org Scoped | Bookmark candidate. Body: `{ candidateId }`. |
| POST | `/organizations/me/talent-pool/outreach` | HR Org Scoped | Trigger outreach sequence. Body: `{ candidateId, jobId }`. |

---

## 12. Analytics (`/analytics`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/analytics/org` | HR Org Scoped | Funnel stats, time-to-hire, score distribution. Query: `range` (e.g., `7d`, `30d`). |
| GET | `/analytics/org/report.pdf` | HR Org Scoped | Generate and download weekly executive PDF report. |


---

## 13. Candidate Prep Library (`/candidate/prep`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/candidate/prep` | Candidate | List available company prep libraries. Query: `company`, `role`. |
| GET | `/candidate/prep/:companyName/:roleArchetype` | Candidate | Fetch prep detail: question bank, culture notes, skill checklist. |

---

## 14. Mock Interview Sessions (`/candidate/mock`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/candidate/mock/sessions` | Candidate | Create mock session. Body: `{ targetCompany, targetRole, difficulty }`. Returns `{ sessionId }`. |
| GET | `/candidate/mock/sessions/:sessionId` | Candidate Own | Fetch session status and config. |
| GET | `/candidate/mock/sessions/:sessionId/feedback` | Candidate Own | Fetch completed feedback report (score, strengths, weaknesses, annotated transcript). |
| GET | `/candidate/mock/sessions` | Candidate | List all historical mock sessions with scores. |

---

## 15. Internal Callback APIs (`/api/v1/internal/*`)

Secured endpoints callable exclusively by the Python AI service via `X-Internal-Service-Secret` header. All other requests are rejected with `403`.

| Method | Path | Description |
|---|---|---|
| PATCH | `/internal/applications/:id/sourcing-result` | Write sourced candidate pool ranking. |
| PATCH | `/internal/applications/:id/screening-result` | Write resume score, gap analysis, semantic match score. |
| POST | `/internal/interviews/:id/schedule-slots` | Save 3 proposed interview slot options from Scheduler Agent. |
| PATCH | `/internal/interviews/:id/complete` | Save final transcript, audio storage URL, proctor flags, engagement telemetry. |
| PATCH | `/internal/applications/:id/assessment-result` | Save aptitude category score breakdown. |
| PATCH | `/internal/applications/:id/coding-result` | Save code pass rate, execution timing, memory, complexity score. |
| PATCH | `/internal/applications/:id/video-screening-result` | Save video transcript and screening score. |
| PATCH | `/internal/evaluations/:id` | Save composite score, confidence level, bias report JSON. |
| PATCH | `/internal/evaluations/:id/decision` | Write final decision and drafted offer/rejection email body. |
| POST | `/internal/analytics/:orgId/weekly-report` | Save aggregated weekly hiring metrics. |
| PATCH | `/internal/mock-sessions/:sessionId/complete` | Save practice session transcript, score, coaching feedback. |
| POST | `/internal/candidates/me/voice-resume/complete` | Save generated resume PDF URL to `CandidateProfile`. |
| POST | `/internal/prep-content` | Upsert AI-generated company prep question bank. |
| POST | `/internal/agent-logs` | Persist structured agent execution log entry. |

---

## 16. Rate Limiting

| Route Group | Limit | Window |
|---|---|---|
| `POST /auth/login` | 10 requests | 15 minutes per IP |
| `POST /auth/signup` | 5 requests | 1 hour per IP |
| `POST /auth/forgot-password` | 3 requests | 1 hour per IP |
| `POST /applications` | 20 requests | 1 hour per user |
| `POST /jobs/:jobId/ai-assist` | 5 requests | 1 hour per org |
| All other authenticated routes | 200 requests | 1 minute per user |

---

## 17. Error Code Reference

| Code | HTTP | Description |
|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | Email or password incorrect. |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT access token expired — refresh required. |
| `AUTH_REFRESH_INVALID` | 401 | Refresh token invalid or revoked. |
| `ORG_SCOPE_VIOLATION` | 403 | Attempted to access a resource outside the caller's organization. |
| `FORBIDDEN` | 403 | Role does not permit this action. |
| `VALIDATION_ERROR` | 400 | Request body failed Zod schema validation. `details` contains field-level errors. |
| `NOT_FOUND` | 404 | Requested resource does not exist or is not accessible to caller. |
| `INTERVIEW_CONSENT_REQUIRED` | 403 | Attempted session entry before video/CV consent was submitted. |
| `OFFER_EXPIRED` | 409 | Offer `valid_until` deadline has passed — cannot accept. |
| `RESUME_PARSE_FAILED` | 422 | Resume PDF/DOCX extraction failed after all fallback attempts. |
| `QUEUE_JOB_FAILED` | 500 | Background AI worker job failed after max retries. |
| `RATE_LIMITED` | 429 | Rate limit exceeded. `Retry-After` header included in response. |
