# Checklist 09 — Analytics, Sentiment Analysis & Talent Pool

Implement HR analytics pipeline, Sentiment + Stress Analyser, Analytics Agent, and Talent Pool search.

---

## A. Analytics Agent

### BullMQ Queue (Express)
- [x] `apps/api/src/lib/queues/analytics.queue.ts` — define `analytics-queue` (low priority)
- [x] Schedule weekly enqueue via Bull cron: every Monday 00:00 UTC, enqueue for all active orgs

### Express Analytics Endpoints
- [x] `GET /api/v1/hr/analytics` — return analytics dashboard data for org:
  - Weekly applicant funnel (applied → screening → assessment → interview → evaluation → hire)
  - Stage conversion rates (% passing each gate)
  - Average time-to-hire (days from application to offer)
  - Bias score stability trend (weekly avg severity over last 8 weeks)
  - Top rejection reasons (aggregated from `gap_analysis` across all applications)
  - Source breakdown (direct apply vs sourced vs referral)
  - Query params: `from`, `to`, `jobId` (filter by job)

- [x] `GET /api/v1/hr/analytics/export` — trigger PDF report generation; return download URL

### Python Worker: `apps/ai-service/workers/analytics_worker.py`
- [x] Pull from `analytics-queue`
- [x] Aggregate from Postgres via Express internal API (worker never reads DB directly):
  - `GET /api/v1/internal/analytics/raw?orgId=:id&from=:date&to=:date`
- [x] LangGraph Analytics Agent:
  - Node 1: `aggregate_funnel` — count applications at each status per week
  - Node 2: `compute_conversions` — stage conversion rates
  - Node 3: `compute_time_to_hire` — avg days per stage, overall avg
  - Node 4: `analyze_bias_trends` — aggregate bias report severity scores
  - Node 5: `generate_narrative` — Gemini writes 3-5 sentence executive summary of weekly trends
  - Node 6: `export_pdf` — generate weekly PDF report (ReportLab), upload to S3
- [x] Callback: `POST /api/v1/internal/analytics/reports` — store report URL in DB

### Frontend
- [x] `apps/web/src/app/hr/analytics/page.tsx` — fetch from `GET /api/v1/hr/analytics`, render real charts
- [x] `apps/web/src/app/hr/analytics/_components/AnalyticsKpiCards.tsx` — render real KPI values (total applicants, hire rate, avg time-to-hire, bias flags)
- [x] `apps/web/src/app/hr/analytics/_components/StageBreakdownChart.tsx` — render real funnel data
- [x] Wire PDF export button to `GET /api/v1/hr/analytics/export`

---

## B. Sentiment + Stress Analyser

### Express Sentiment Endpoints
- [x] `GET /api/v1/hr/sentiment/:interviewId` — return sentiment analysis for an interview:
  - Per-turn: tone classification (confident, hesitant, stressed, enthusiastic)
  - Speech pace (words per minute per turn)
  - Pitch variation index
  - Emotional Journey Graph data (timeline of sentiment scores)
  - Stress peak moments (turn numbers with highest stress markers)

### Python Sentiment Service
File: `apps/ai-service/services/sentiment_service.py`

- [x] **BYPASS (ML model not ready):** Use Gemini text analysis for sentiment instead of dedicated audio ML model
  - Input: interview transcript text (per turn)
  - Gemini prompt: "Classify the emotional tone of this answer on a scale: confident/enthusiastic/neutral/hesitant/stressed. Estimate relative speech pace: fast/normal/slow. Output JSON."
  - **Future ML upgrade:** Replace with audio waveform analysis (pitch, prosody, speaking rate from raw audio)

- [x] `analyze_sentiment_from_transcript(transcript: list[dict]) -> SentimentReport`
  - Per-turn: `{ turn, tone, stress_score (0-100), pace_wpm_estimate, key_markers: [] }`
  - Aggregate: `emotional_journey_timeline`, `avg_stress`, `peak_stress_turn`, `confidence_trend`

- [x] Run sentiment analysis during `interview_worker.py` processing (append to interview result callback)
- [x] Store `Interview.sentiment_report` JSON via internal callback

### Frontend
- [x] `apps/web/src/app/hr/sentiment-analysis/page.tsx` — fetch `GET /api/v1/hr/sentiment/:interviewId`:
  - Emotional Journey Graph (line chart: stress score over turn timeline)
  - Per-turn breakdown table: tone badge, pace indicator, stress score
  - Aggregate KPIs: avg confidence, peak stress moment, tone distribution pie chart
  - Summary note: "Use this to identify interview nervousness vs. genuine skill gaps — not for scoring"

---

## C. Talent Pool (HR Passive Candidate Search)

### Express Talent Pool Endpoints
- [x] `GET /api/v1/hr/talent-pool` — search all `CandidateProfile` records with pgvector similarity
  - Query params: `query` (free text), `skills[]`, `min_experience`, `location`, `work_auth`
  - Embed `query` text → cosine similarity against `CandidateProfile.embedding`
  - Return ranked list with match scores

- [x] `POST /api/v1/hr/talent-pool/bookmark` — bookmark a candidate for a job
  - Body: `{ candidateProfileId, jobId, notes }`
  - Create `TalentBookmark` record (add to schema if needed)

- [x] `GET /api/v1/hr/talent-pool/bookmarks` — list bookmarked candidates for org

- [x] `DELETE /api/v1/hr/talent-pool/bookmarks/:id` — remove bookmark

- [x] `POST /api/v1/hr/talent-pool/outreach` — send outreach email to a passive candidate
  - Use org's custom outreach template from `Organization.settings.email_templates`
  - Rate limit: max 5 outreach emails per candidate per org per 30 days

### Frontend
- [x] `apps/web/src/app/hr/talent-pool/page.tsx` — wire search input to `GET /api/v1/hr/talent-pool?query=...`, render real ranked candidate cards, wire bookmark and outreach buttons

---

## D. Notifications System (Real-Time)

- [x] All notification creation points in Express:
  - Application received (candidate)
  - Screening result (candidate)
  - Interview scheduled (candidate)
  - Interview reminder 24h before (candidate)
  - Interview reminder 1h before (candidate)
  - Offer received (candidate)
  - New application for job (HR)
  - Candidate reached `hold_for_review` (HR)
  - Bias flag high severity (HR)
  - Agent job failed (HR admin)

- [x] `apps/api/src/services/notification.service.ts` — `createNotification(userId, title, body, link, type)` — insert to `Notification` table (add to schema)
- [x] Wire notifications to `NotificationDropdown` component via `GET /api/v1/notifications`
- [x] **Optional real-time:** Add Server-Sent Events (SSE) endpoint `GET /api/v1/notifications/stream` for live unread count badge

---

## E. Internal Raw Data Endpoint (for Analytics Worker)

- [x] `GET /api/v1/internal/analytics/raw` — return raw aggregable data for org:
  - Applications with status history timestamps
  - Evaluation composite scores
  - Bias report severities
  - Time-to-hire deltas
  - Protected by `requireInternalSecret`

---

## Done When

- HR analytics page shows real weekly funnel chart populated from actual application data
- Sentiment analyser shows emotional journey graph for a completed interview
- Talent pool search returns ranked candidates by vector similarity
- Bookmarking a passive candidate works; outreach email is sent
- Notification bell shows real unread count and notification list
