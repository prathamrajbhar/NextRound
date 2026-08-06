# Checklist 03 — CRUD: Jobs, Applications & Organizations

All standard create/read/update/delete endpoints for the core data models.
Every HR endpoint must use `org_id` from JWT — never from request body.

---

## A. Organizations CRUD

- [x] `GET /api/v1/organizations/:id` — fetch org details (HR only, `org_id` scoped)
- [x] `PATCH /api/v1/organizations/:id` — update org profile (name, logo_url, size, industry, availability_hours)
- [x] `GET /api/v1/organizations/:id/settings` — fetch org settings JSON (auto_offer, email_templates, notification_prefs)
- [x] `PATCH /api/v1/organizations/:id/settings` — update org settings
- [x] `GET /api/v1/organizations/:id/members` — list HR team members for this org
- [x] `POST /api/v1/organizations/:id/members/invite` — invite a new HR team member (sends email)
- [x] `DELETE /api/v1/organizations/:id/members/:userId` — remove team member

---

## B. Jobs CRUD

- [x] `POST /api/v1/jobs` — create job in `draft` status
  - Zod: title, description, rubric, thresholds, pipeline toggles (aptitude_enabled, coding_enabled, video_screening_enabled, auto_offer)
  - Scoped to `req.orgId`; job returned with generated `id`

- [x] `GET /api/v1/jobs` — list jobs (public: `status=published` only; HR: all statuses scoped to org)
  - Query params: `status`, `search`, `page`, `limit`

- [x] `GET /api/v1/jobs/:id` — get single job (public if published; HR if org-scoped)

- [x] `PATCH /api/v1/jobs/:id` — update job draft (HR only, org-scoped)
  - Cannot update `org_id` or `status` directly

- [x] `POST /api/v1/jobs/:id/publish` — set `status = 'published'`; enqueue `sourcing-queue` job

- [x] `POST /api/v1/jobs/:id/close` — set `status = 'closed'`; no further applications accepted

- [x] `DELETE /api/v1/jobs/:id` — soft delete (set `status = 'deleted'`); HR + org-scoped only

- [x] `POST /api/v1/jobs/:id/ai-assist` — enqueue AI JD Parser job to `sourcing-queue`; return `{ queued: true, jobId }`

- [x] `GET /api/v1/jobs/:id/pipeline` — return kanban pipeline view: applications grouped by `status` stage

- [x] `GET /api/v1/jobs/:id/applications` — list all applications for a job (HR, org-scoped)

---

## C. Applications CRUD

- [x] `POST /api/v1/applications` — candidate submits application
  - Body: `{ jobId }`
  - Validate job is `published` and candidate hasn't already applied
  - Create `Application` with `status = 'applied'`
  - Enqueue `screening-queue` job

- [x] `GET /api/v1/applications/:id` — get application detail
  - HR: allowed if `job.org_id === req.orgId`
  - Candidate: allowed if `application.candidate_id === req.user.id`
  - Returns full evaluation data, interview refs, assessment scores

- [x] `GET /api/v1/candidate/applications` — list all applications for authenticated candidate

- [x] `PATCH /api/v1/applications/:id/status` — HR manual status override (advance or hold)

- [x] `POST /api/v1/applications/:id/schedule` — candidate selects from offered time slots
  - Body: `{ slotId }` — mark slot confirmed, trigger confirmation emails

- [x] `POST /api/v1/applications/:id/withdraw` — candidate withdraws application (set `status = 'withdrawn'`)

---

## D. Candidate Profile CRUD

- [x] `GET /api/v1/candidate/profile` — get authenticated candidate's profile
- [x] `PATCH /api/v1/candidate/profile` — update profile (skills, target_role, compensation, values, work_auth)
- [x] `POST /api/v1/candidate/profile/resume` — upload resume PDF to S3; parse + store `resume_url`; enqueue embedding generation
- [x] `GET /api/v1/candidate/dashboard` — return stats: applications count by status, next interview date, pending actions

---

## E. HR Dashboard & Pipeline

- [x] `GET /api/v1/hr/dashboard` — return KPIs for org: active jobs, total applicants, stage distribution, avg time-to-hire, recent activity feed
- [x] `GET /api/v1/hr/analytics` — return detailed analytics: weekly funnel, stage conversion rates, bias score trends, time-to-hire chart data

---

## F. Notifications

- [x] `GET /api/v1/notifications` — list notifications for authenticated user (HR or candidate)
- [x] `PATCH /api/v1/notifications/:id/read` — mark notification as read
- [x] `POST /api/v1/notifications/read-all` — mark all as read

---

## G. User Settings

- [x] `GET /api/v1/hr/profile` — get HR user profile
- [x] `PATCH /api/v1/hr/profile` — update HR profile (name, avatar, timezone)
- [x] `GET /api/v1/candidate/settings` — get candidate account settings
- [x] `PATCH /api/v1/candidate/settings` — update candidate settings (email_notifications, privacy, timezone)

---

## H. Frontend — Wire All CRUD Pages

- [x] `apps/web/src/app/hr/jobs/page.tsx` — fetch jobs list from API, render real `JobCard` list, loading/empty states
- [x] `apps/web/src/app/hr/jobs/new/page.tsx` — form submits to `POST /api/v1/jobs`, then `POST /api/v1/jobs/:id/ai-assist`, shows queue pending state
- [x] `apps/web/src/app/hr/jobs/[jobId]/edit/page.tsx` — fetch job, populate form, submit `PATCH /api/v1/jobs/:id`
- [x] `apps/web/src/app/hr/jobs/[jobId]/pipeline/page.tsx` — fetch pipeline data, render Kanban with real statuses
- [x] `apps/web/src/app/hr/jobs/[jobId]/candidates/page.tsx` — fetch application list with scores
- [x] `apps/web/src/app/hr/candidates/[applicationId]/page.tsx` — fetch full application + evaluation detail
- [x] `apps/web/src/app/hr/dashboard/page.tsx` — fetch dashboard KPIs, render real charts
- [x] `apps/web/src/app/hr/settings/page.tsx` — fetch org settings, submit patches per tab
- [x] `apps/web/src/app/candidate/jobs/page.tsx` — fetch public job feed
- [x] `apps/web/src/app/candidate/jobs/[jobId]/page.tsx` — fetch job detail; wire 1-click apply button to `POST /api/v1/applications`
- [x] `apps/web/src/app/candidate/applications/page.tsx` — fetch candidate application list
- [x] `apps/web/src/app/candidate/applications/[applicationId]/page.tsx` — fetch application status timeline
- [x] `apps/web/src/app/candidate/profile/page.tsx` — fetch profile, wire update form + resume upload

---

## I. API Response Standards

- [x] All responses use `ApiEnvelope<T>`: `{ success: boolean, data: T, error?: string }`
- [x] All list endpoints return `{ success: true, data: { items: T[], total: number, page: number, limit: number } }`
- [x] All 4xx errors return `{ success: false, error: "human readable message" }`
- [x] All Zod validation errors return 400 with field-level messages

---

## Done When

- HR can create, publish, and close a job; it appears in the public job feed
- Candidate can apply with one click; application appears in candidate applications list and HR pipeline
- All CRUD operations return real database data; no mock imports remain in these pages
- Multi-tenant: HR from Org A cannot fetch jobs or applications from Org B (verified via API call with swapped org token)
