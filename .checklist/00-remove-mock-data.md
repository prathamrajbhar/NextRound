# Checklist 00 — Remove All Mock Data & Placeholders

Replace every hardcoded mock/placeholder in `apps/web` with real API calls.
Work file-by-file. Each item = one import to rip out and one real `fetch` / hook to wire in.

---

## A. Core Mock Data Files (delete after all consumers are migrated)

- [x] `apps/web/src/lib/mockData.ts` — top-level re-export barrel; delete after all imports removed
- [x] `apps/web/src/lib/mockData/index.ts` — central mock barrel; delete after migration
- [x] `apps/web/src/lib/mockData/jobs.ts` — mock job listings
- [x] `apps/web/src/lib/mockData/candidates.ts` — mock candidate profiles
- [x] `apps/web/src/lib/mockData/applications.ts` — mock applications
- [x] `apps/web/src/lib/mockData/applicationsPart2.ts` — extended mock applications
- [x] `apps/web/src/lib/mockData/interviews.ts` — mock interview records
- [x] `apps/web/src/lib/mockData/assessments.ts` — mock aptitude + coding results
- [x] `apps/web/src/lib/mockData/analytics.ts` — mock funnel/metrics data
- [x] `apps/web/src/lib/mockData/offers.ts` — mock offer letters
- [x] `apps/web/src/lib/mockData/organization.ts` — mock org & team data
- [x] `apps/web/src/lib/mockData/sentimentAnalysis.ts` — mock sentiment/stress data
- [x] `apps/web/src/lib/mockData/mockSessions.ts` — mock mock-interview sessions
- [x] `apps/web/src/lib/mockData/prep.ts` — mock company prep library content
- [x] `apps/web/src/lib/mockData/resumeBuilder.ts` — mock resume builder state
- [x] `apps/web/src/lib/mockData/talent.ts` — mock talent pool data
- [x] `apps/web/src/lib/mockData/helpers.ts` — mock helper generators
- [x] `apps/web/src/lib/mockData/types.ts` — migrate types to `packages/shared`
- [x] `apps/web/src/lib/mockData/extendedTypes.ts` — migrate extended types to `packages/shared`
- [x] `apps/web/src/lib/mockSetupHelpers.ts` — mock setup utilities; delete

---

## B. HR Portal Pages — Replace Mock with API

- [x] `apps/web/src/app/hr/dashboard/page.tsx` — replace mock KPIs/pipeline stats with `GET /api/v1/hr/dashboard`
- [x] `apps/web/src/app/hr/jobs/page.tsx` — replace mock job list with `GET /api/v1/jobs`
- [x] `apps/web/src/app/hr/jobs/new/page.tsx` — replace mock rubric defaults with real form POST to `POST /api/v1/jobs`
- [x] `apps/web/src/app/hr/jobs/new/components/JobBasicsCard.tsx` — remove mock defaults
- [x] `apps/web/src/app/hr/jobs/new/components/AiExtractPanel.tsx` — wire `POST /api/v1/jobs/:id/ai-assist`
- [x] `apps/web/src/app/hr/jobs/new/components/PipelineConfigCard.tsx` — remove mock toggle states
- [x] `apps/web/src/app/hr/jobs/new/components/RubricWeightingCard.tsx` — remove mock weight defaults
- [x] `apps/web/src/app/hr/jobs/[jobId]/edit/page.tsx` — replace mock job data with `GET /api/v1/jobs/:id`
- [x] `apps/web/src/app/hr/jobs/[jobId]/pipeline/page.tsx` — replace mock pipeline kanban with `GET /api/v1/jobs/:id/pipeline`
- [x] `apps/web/src/app/hr/jobs/[jobId]/pipeline/components/CandidateCard.tsx` — remove mock candidate data
- [x] `apps/web/src/app/hr/jobs/[jobId]/pipeline/components/CandidateProfileDrawer.tsx` — wire `GET /api/v1/applications/:id`
- [x] `apps/web/src/app/hr/jobs/[jobId]/candidates/page.tsx` — replace mock candidate list with `GET /api/v1/jobs/:id/applications`
- [x] `apps/web/src/app/hr/candidates/[applicationId]/page.tsx` — replace mock eval data with `GET /api/v1/applications/:id`
- [x] `apps/web/src/app/hr/candidates/[applicationId]/components/CandidateHeader.tsx` — remove mock profile
- [x] `apps/web/src/app/hr/candidates/[applicationId]/components/AssessmentScorecard.tsx` — remove mock scores
- [x] `apps/web/src/app/hr/candidates/[applicationId]/components/SkillsScorecard.tsx` — remove mock skills
- [x] `apps/web/src/app/hr/candidates/[applicationId]/components/DecisionControl.tsx` — wire `POST /api/v1/evaluations/:id/decision`
- [x] `apps/web/src/app/hr/candidates/[applicationId]/interview/page.tsx` — replace mock transcript with `GET /api/v1/interviews/:id/transcript`
- [x] `apps/web/src/app/hr/interview/[applicationId]/page.tsx` — remove mock session data; wire real WebRTC session token
- [x] `apps/web/src/app/hr/analytics/page.tsx` — replace mock charts with `GET /api/v1/hr/analytics`
- [x] `apps/web/src/app/hr/analytics/_components/AnalyticsKpiCards.tsx` — remove mock KPI values
- [x] `apps/web/src/app/hr/analytics/_components/StageBreakdownChart.tsx` — remove mock funnel data
- [x] `apps/web/src/app/hr/sentiment-analysis/page.tsx` — replace mock sentiment with `GET /api/v1/hr/sentiment/:interviewId`
- [x] `apps/web/src/app/hr/talent-pool/page.tsx` — replace mock talent list with `GET /api/v1/hr/talent-pool`
- [x] `apps/web/src/app/hr/notifications/page.tsx` — replace mock notifications with `GET /api/v1/notifications`
- [x] `apps/web/src/app/hr/profile/page.tsx` — replace mock profile with `GET /api/v1/auth/me`
- [x] `apps/web/src/app/hr/settings/page.tsx` — replace mock org settings with `GET /api/v1/organizations/:id/settings`
- [x] `apps/web/src/app/hr/settings/_components/GeneralSettingsTab.tsx` — remove mock org data
- [x] `apps/web/src/app/hr/settings/_components/EmailTemplatesTab.tsx` — remove mock templates
- [x] `apps/web/src/app/hr/settings/_components/TeamTab.tsx` — wire `GET /api/v1/organizations/:id/members`
- [x] `apps/web/src/app/hr/settings/_components/NotificationsTab.tsx` — remove mock preferences
- [x] `apps/web/src/app/hr/settings/_components/AppearanceTab.tsx` — remove mock theme data

---

## C. Candidate Portal Pages — Replace Mock with API

- [x] `apps/web/src/app/candidate/dashboard/page.tsx` — replace mock stats/activity with `GET /api/v1/candidate/dashboard`
- [x] `apps/web/src/app/candidate/jobs/page.tsx` — replace mock job feed with `GET /api/v1/jobs` (public)
- [x] `apps/web/src/app/candidate/jobs/[jobId]/page.tsx` — replace mock job detail with `GET /api/v1/jobs/:id`
- [x] `apps/web/src/app/candidate/jobs/[jobId]/_components/JobHeaderCard.tsx` — remove mock company data
- [x] `apps/web/src/app/candidate/applications/page.tsx` — replace mock apps list with `GET /api/v1/candidate/applications`
- [x] `apps/web/src/app/candidate/applications/[applicationId]/page.tsx` — wire `GET /api/v1/applications/:id`
- [x] `apps/web/src/app/candidate/applications/[applicationId]/_components/ApplicationHeaderBanner.tsx` — remove mock status
- [x] `apps/web/src/app/candidate/applications/[applicationId]/schedule/page.tsx` — wire `GET + POST /api/v1/applications/:id/schedule`
- [x] `apps/web/src/app/candidate/applications/[applicationId]/assessment/page.tsx` — wire `GET /api/v1/applications/:id/assessment`
- [x] `apps/web/src/app/candidate/applications/[applicationId]/video-screening/page.tsx` — remove mock prompts
- [x] `apps/web/src/app/candidate/applications/[applicationId]/take-home/page.tsx` — remove mock take-home data
- [x] `apps/web/src/app/candidate/applications/[applicationId]/offer/page.tsx` — wire `GET /api/v1/applications/:id/offer`
- [x] `apps/web/src/app/candidate/applications/[applicationId]/onboarding/page.tsx` — wire `GET /api/v1/applications/:id/onboarding`
- [x] `apps/web/src/app/candidate/profile/page.tsx` — replace mock profile with `GET /api/v1/candidate/profile`
- [x] `apps/web/src/app/candidate/resume-builder/page.tsx` — replace mock builder state; wire session API
- [x] `apps/web/src/app/candidate/resume-builder/_components/SetupStage.tsx` — remove mock defaults
- [x] `apps/web/src/app/candidate/resume-builder/_components/InterviewStage.tsx` — wire AI voice session
- [x] `apps/web/src/app/candidate/resume-builder/_components/ResumeStage.tsx` — wire `GET /api/v1/resume-builder/:sessionId/result`
- [x] `apps/web/src/app/candidate/resume-builder/_components/InsightsDrawer.tsx` — remove mock insights
- [x] `apps/web/src/app/candidate/mock/new/page.tsx` — replace mock topic list; wire `POST /api/v1/mock/sessions`
- [x] `apps/web/src/app/candidate/mock/new/components/CalibrationPanel.tsx` — remove mock calibration data
- [x] `apps/web/src/app/candidate/mock/[sessionId]/page.tsx` — wire live session state via API
- [x] `apps/web/src/app/candidate/mock/history/page.tsx` — replace mock history with `GET /api/v1/mock/sessions`
- [x] `apps/web/src/app/candidate/mock/[sessionId]/feedback/page.tsx` — wire `GET /api/v1/mock/sessions/:id/feedback`
- [x] `apps/web/src/app/candidate/hr-round/[applicationId]/page.tsx` — remove mock session; wire real WebRTC token
- [x] `apps/web/src/app/candidate/notifications/page.tsx` — wire `GET /api/v1/notifications`
- [x] `apps/web/src/app/candidate/settings/page.tsx` — wire `GET/PATCH /api/v1/candidate/settings`

---

## D. Public & Auth Pages — Remove Placeholders

- [x] `apps/web/src/app/(public)/jobs/page.tsx` — wire `GET /api/v1/jobs` (public, unauthenticated)
- [x] `apps/web/src/app/(public)/jobs/[jobId]/page.tsx` — wire `GET /api/v1/jobs/:id` (public)
- [x] `apps/web/src/app/(public)/pricing/page.tsx` — replace hardcoded tier limits if config-driven
- [x] `apps/web/src/app/(auth)/login/page.tsx` — wire `POST /api/v1/auth/login`
- [x] `apps/web/src/app/(auth)/signup/page.tsx` — wire `POST /api/v1/auth/register`
- [x] `apps/web/src/app/(auth)/forgot-password/page.tsx` — wire `POST /api/v1/auth/forgot-password`
- [x] `apps/web/src/app/(auth)/reset-password/[token]/page.tsx` — wire `POST /api/v1/auth/reset-password`
- [x] `apps/web/src/app/onboarding/company/page.tsx` — wire `POST /api/v1/organizations`
- [x] `apps/web/src/app/onboarding/candidate/page.tsx` — wire `POST /api/v1/candidate/profile`

---

## E. Shared Components — Remove Mock Dependencies

- [x] `apps/web/src/components/ui/NotificationDropdown.tsx` — wire `GET /api/v1/notifications`
- [x] `apps/web/src/components/ui/JobCard.tsx` — verify props come from API shape, not mock types
- [x] `apps/web/src/hooks/useInterviewSession.ts` — replace mock session logic with real WebRTC + API calls
- [x] `apps/web/src/lib/interviewScorer.ts` — move scoring logic to API; delete if purely frontend mock
- [x] `apps/web/src/lib/interviewTopics.ts` — replace static list with `GET /api/v1/mock/topics`

---

## F. Interview Console

- [x] `apps/web/src/app/interview/[interviewId]/page.tsx` — wire `GET /api/v1/interviews/:id/session-token`; replace mock flow
- [x] `apps/web/src/components/interview/InterviewActiveConsole.tsx` — remove mock turn data; wire real STT/TTS stream
- [x] `apps/web/src/components/interview/InterviewCheckScreen.tsx` — remove mock device check results
- [x] `apps/web/src/components/interview/AptitudeTestConsole.tsx` — wire `GET /api/v1/applications/:id/assessment/aptitude`
- [x] `apps/web/src/components/interview/CodingAssessmentConsole.tsx` — wire `POST /api/v1/applications/:id/assessment/coding`

---

## Done When

- `grep -r "from.*mockData\|from.*lib/mock" apps/web/src/app` returns zero results
- `grep -r "from.*mockData\|from.*lib/mock" apps/web/src/components` returns zero results
- `grep -r "from.*mockData\|from.*lib/mock" apps/web/src/hooks` returns zero results
- All mock data files deleted from `apps/web/src/lib/mockData/`
- `npm run build` passes with no mock-related dead imports
