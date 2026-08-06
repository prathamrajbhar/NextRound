# NextRound — Screen Inventory

Complete inventory of all platform screens, grouped by surface. Includes route, purpose, key components, and access control for every screen.

---

## Group A: Public Surface (Unauthenticated)

### A1. Landing Page (`/`)
**Purpose:** Marketing entry point for employers and job seekers.
**Components:** PublicNavbar, Hero Banner with dual CTA ("Post a Job" / "Find a Job"), How-it-Works Step Indicator, Platform Metrics Bar (stat counters), Feature Cards grid, PublicFooter.

### A2. Public Job Catalog (`/jobs`)
**Purpose:** Searchable job board listing open positions across all registered companies.
**Components:** PublicNavbar, Search Bar, Filter Drawer (location, experience range, salary, remote/hybrid), JobCard Grid, Pagination controls.

### A3. Public Job Detail (`/jobs/:jobId`)
**Purpose:** Full job description with apply entry point.
**Components:** Job Header (title, company, location), Rich Text JD Body, Rubric Skill Tags, CompanyLogo card, Sticky "Apply Now" button, Similar Jobs list.

### A4. About Page (`/about`)
**Purpose:** Company vision, bias-free AI methodology, and platform trust overview.
**Components:** Mission Banner, Bias Audit Explainer section, How AI decisions are made, Leadership Team cards.

### A5. Contact Page (`/contact`)
**Purpose:** Enterprise sales inquiries, demo scheduling, and support contact form.
**Components:** Inquiry Form (name, company, email, message, inquiry type), Direct Email links, Sales Calendar widget.

### A6. Pricing Page (`/pricing`)
**Purpose:** Tier breakdown — Free, Pro, Enterprise.
**Components:** Tier Cards (Free / Pro / Enterprise), Feature Comparison Table, FAQ Accordion.

---

## Group B: Authentication & Onboarding

### B1. Sign Up (`/signup`)
**Purpose:** Account creation with role selection.
**Components:** Role Toggle (HR Manager / Job Candidate), Registration Form (Name, Email, Password, Company Name for HR), Terms & Privacy Checkbox, Submit Button.

### B2. Login (`/login`)
**Purpose:** Unified sign-in — role resolved server-side from JWT.
**Components:** Email/Password Fields, Remember Me checkbox, Forgot Password link, Submit Button.

### B3. Password Recovery (`/forgot-password`, `/reset-password`)
**Purpose:** Password reset email request and token validation.
**Components:** Email Input form (forgot), Token Verification + New Password Form (reset), Success Confirmation card.

### B4. Candidate Onboarding Wizard (`/onboarding/candidate`)
**Purpose:** Multi-step profile setup creating the `CandidateProfile` record.
**Steps:**
- Step 1: Resume upload (PDF/DOCX drag-and-drop) + portfolio links (GitHub, LinkedIn)
- Step 2: Tech stack selector, target roles, work preferences (remote/hybrid/onsite)
- Step 3: Expected salary range, notice period, work authorization status, work values
**Components:** Step Progress Indicator, Resume Uploader, Skill Chips Editor, Salary Range Slider, Step Navigation (Back / Continue).

### B5. HR Company Onboarding Wizard (`/onboarding/company`)
**Purpose:** First-time company profile and workspace configuration.
**Steps:**
- Step 1: Organization profile (company name, industry, size, logo upload)
- Step 2: Team member invitations (email + role)
- Step 3: Interview availability timezone picker and business hours configuration
**Components:** Step Progress Indicator, Org Profile Form, Team Invite Input, Timezone Selector.

### B6. Team Invite Acceptance (`/accept-invite?token=...`)
**Purpose:** Accept an HR team invitation link sent by email.
**Components:** Invite Details Card (org name, inviting user), Password Setup Form, Accept Button.

---

## Group C: HR Portal (`/hr/*`)

All HR routes require `role = "hr"`. Data is scoped to `org_id` derived from JWT.

### C1. HR Dashboard (`/hr/dashboard`)
**Purpose:** Workspace overview with active pipeline summary.
**Components:** HrSidebar, Stat Cards (Active Jobs, Candidates in Pipeline, Interviews Today, Pending Offers), Live Agent Activity Stream (real-time `AgentLog` feed), Quick Action Buttons.

### C2. Job Management (`/hr/jobs`)
**Purpose:** Organization job listing with status controls.
**Components:** HrSidebar, Job Table (title, status, candidates count, created date), Status Filter Tabs (All / Active / Draft / Closed), "Create Job" Button.

### C3. Job Editor (`/hr/jobs/new`, `/hr/jobs/:jobId/edit`)
**Purpose:** AI-assisted job description composition and rubric configuration.
**Components:** Rich Text Editor, AI Assist Suggestion Drawer (auto-extracted skills and rubric weights), Rubric Dimension Weight Sliders (must sum to 100), Threshold Inputs (per stage), Pipeline Toggle Switches (aptitude_enabled, coding_enabled, video_screening_enabled, auto_offer), Save Draft / Publish Buttons.

### C4. Pipeline Kanban (`/hr/jobs/:jobId/pipeline`)
**Purpose:** Visual board tracking candidates across all pipeline stages.
**Columns:** Sourced → Screened → Assessment → Interview → HR Round → Decided → Offered
**Components:** HrSidebar, Kanban Column Headers with candidate counts, CandidateCards with score badges and stage status, Streaming Agent Log Drawer (real-time activity), Candidate Detail Flyout panel.

### C5. Candidate Table (`/hr/jobs/:jobId/candidates`)
**Purpose:** Filterable tabular candidate view with bulk actions.
**Components:** HrSidebar, Candidate Data Table (name, email, stage, scores, applied date), Column Customizer, Stage Filter Tabs, Bulk Select + Action Bar, Export CSV button.

### C6. Candidate Evaluation Detail (`/hr/candidates/:applicationId`)
**Purpose:** Full breakdown of candidate evaluation for HR review.
**Components:** HrSidebar, Score Overview card (composite score, confidence, decision), Dimension Bar Charts (per rubric dimension score), Gap Analysis Card (missing skills list), Bias Audit Report Panel, Interview Replay link, Decision Card (current decision + override option), Evaluation Timeline.

### C7. HR Talent Pool (`/hr/talent-pool`)
**Purpose:** Global passive candidate search and outreach.
**Components:** HrSidebar, Search Input with skill tag filters, Candidate Profile Drawer (summary, skills, portfolio links), Bookmark Button, Outreach Sequence Trigger Button.

### C8. Interview Replay (`/hr/candidates/:applicationId/interview`)
**Purpose:** Audio replay and timestamped transcript inspection.
**Components:** HrSidebar, Waveform Audio Player, Auto-scrolling Timestamped Transcript, Proctor Flag Markers on timeline, Question-by-Question Score panels.

### C9. Analytics Dashboard (`/hr/analytics`)
**Purpose:** Weekly hiring funnel analytics and bias metrics.
**Components:** HrSidebar, Hiring Funnel Chart (stage drop-off), Time-to-Hire Trend Line, Score Distribution Histogram, Bias Audit Score Stability Chart, Date Range Selector, PDF Report Download Button.

### C10. Org Settings (`/hr/settings`)
**Purpose:** Organization management, team, email templates, and availability configuration.
**Tabs:** General (name, logo, industry) | Team (member list, invite, role edit, revoke) | Email Templates (offer, rejection, scheduling templates) | Availability (business hours, timezone) | Billing (plan, usage).
**Components:** HrSidebar, Settings Tabs, Form fields per tab, Save Button.

### C11. HR Notifications (`/hr/notifications`)
**Purpose:** Real-time alerts for pipeline events.
**Events:** Shortlist ready, decision hold requiring approval, interview completed, offer accepted/declined.
**Components:** HrSidebar, Alert Feed (sorted by recency), Filter Toggles (by type), Click-through navigation to relevant screen.

### C12. HR Video Call Console (`/hr/interview/:applicationId`)
**Purpose:** Live 1:1 human-to-human video call — final HR Round gating.
**Components:** HrSidebar, Dual WebRTC Video Grid (HR + Candidate), Candidate Info Panel (name, role, composite score summary), Evaluation Form (Pass/Fail radio, Notes textarea), Submit Decision Button, Call Controls (Mute, Video Toggle, End Call).

### C13. Sentiment + Stress Analyser (`/hr/sentiment-analysis`)
**Purpose:** Audio biomarker inspection and candidate nervousness evaluation.
**Components:** HrSidebar, Candidate Selector Dropdown, Vocal Biomarker Engine Cards (tone harmony, WPM, pitch variation, pause frequency), Interactive Emotional Journey Timeline Graph, Synchronized Transcript (line-by-line with emotion badges: `[Confident]`, `[Hesitant]`, `[Stressed]`), AI Recommendation Callout (nervousness vs. skill gap assessment).

### C14. HR Profile (`/hr/profile`)
**Purpose:** HR user's own account management.
**Components:** HrSidebar, Profile form (name, email, avatar), Password change form.

---

## Group D: Candidate Portal (`/candidate/*`)

All candidate routes require `role = "candidate"`. Data scoped to authenticated user's own records only.

### D1. Candidate Dashboard (`/candidate/dashboard`)
**Purpose:** Overview of active applications, upcoming interviews, and recommended actions.
**Components:** CandidateSidebar, Application Status Cards (per active application), Action Required Banners (e.g., "Complete assessment", "Interview in 2 hours"), Recommended Jobs Strip, Mock Session CTA.

### D2. Applications List (`/candidate/applications`)
**Purpose:** All submitted applications across companies.
**Components:** CandidateSidebar, Application Table (company, role, stage, applied date), Status Badges (Applied, Screening, Assessment, Interview, HR Round, Decided, Offered, Rejected).

### D3. Application Status Detail (`/candidate/applications/:applicationId`)
**Purpose:** Stage-by-stage progress for a specific application.
**Components:** CandidateSidebar, Horizontal Stage Timeline, Stage Status Cards (with score if available), Next Action CTA (e.g., "Take Assessment", "Join Interview"), company info panel.

### D4. Interview Scheduler (`/candidate/applications/:applicationId/schedule`)
**Purpose:** Select one of 3 proposed interview time slots.
**Components:** CandidateSidebar, 3× Slot Option Cards (date, time, timezone), Reschedule Request Modal, Add to Calendar Button (iCal download).

### D5. Aptitude Test Console (`/candidate/applications/:applicationId/assessment`)
**Purpose:** Timed 4-category cognitive and technical assessment.
**Components:** CandidateSidebar, Category Navigation Tabs (Logical Reasoning, Verbal Ability, Quantitative, Technical), Question Container with Radio Selectors, Real-time Countdown Timer, Progress Indicator, Submit Modal (confirm before final submit).
**Implementation:** `src/components/interview/AptitudeTestConsole.tsx`

### D6. Coding Assessment Console (`/candidate/applications/:applicationId/take-home`)
**Purpose:** Interactive multi-language coding environment.
**Components:** CandidateSidebar, Problem Description Panel, Monaco/CodeMirror Code Editor, Language Selector, Test Case Console (stdout, stderr, expected vs. actual), "Run Tests" Button, "Submit" Button, Pass Rate display.
**Implementation:** `src/components/interview/CodingAssessmentConsole.tsx`

### D7. Video Screening Console (`/candidate/applications/:applicationId/video-screening`)
**Purpose:** Asynchronous video prompt recording and submission.
**Components:** CandidateSidebar, Webcam Preview Box, Prompt Question Card, Recording Controls (Start, Pause, Re-record), Recording Progress Timer, Transcript Preview, Submit Button.

### D8. Candidate HR Round Room (`/candidate/hr-round/:applicationId`)
**Purpose:** Pre-call waiting room and live 1:1 WebRTC video call with HR.
**Components:** CandidateSidebar, Hardware Pre-Check Modal (camera preview, mic volume meter), Scheduled Call Time Indicator, "Join Call" Button, Live WebRTC Video Viewport, Call Controls (Mute Mic, Toggle Video, Leave Call).

### D9. Offer Letter Console (`/candidate/applications/:applicationId/offer`)
**Purpose:** Interactive offer review and digital acceptance.
**Components:** CandidateSidebar, Offer Summary Card (Role, Salary, Equity, Start Date, Benefits), PDF Viewer, Digital Signature Canvas, Accept Button, Decline Button, Offer Expiry Countdown.

### D10. Onboarding Checklist (`/candidate/applications/:applicationId/onboarding`)
**Purpose:** Post-offer document submission portal.
**Components:** CandidateSidebar, Task Checklist (checkboxes per task), Document Upload Cards (drag-and-drop), Emergency Contact Form, Background Check Authorization checkbox, Overall Progress Bar.

### D11. Candidate Profile (`/candidate/profile`)
**Purpose:** Manage universal platform profile.
**Components:** CandidateSidebar, Resume Uploader (replaces current resume), Skill Chips Editor (add/remove skills), GitHub/LinkedIn URL Inputs, Target Salary/Role Inputs, Work Authorization Select, Profile Completeness Progress Indicator.

### D12. Mock Interview Setup (`/candidate/mock/new`)
**Purpose:** Launch a practice interview session.
**Components:** CandidateSidebar, Target Company Autocomplete, Target Role Selector, Seniority Level Dropdown, Difficulty Dropdown, "Start Mock Interview" Button.

### D13. Mock Interview Room (`/candidate/mock/:sessionId`)
**Purpose:** Practice voice interview console — identical UX to live interview.
**Components:** Practice Mode Banner (top notification), Voice Status Orb (Speaking / Listening / Analyzing / Idle), Subtitle Feed, Proctoring Telemetry HUD, Mute/End Call controls.

### D14. Mock Feedback (`/candidate/mock/:sessionId/feedback`)
**Purpose:** Instant coaching feedback after practice session.
**Components:** CandidateSidebar, Score Summary Card, Dimension Score Bars, Strengths Narrative, Weaknesses & Improvement Areas Narrative, Annotated Transcript (with per-line coaching comments).

### D15. Mock History (`/candidate/mock/history`)
**Purpose:** Historical practice session score trends.
**Components:** CandidateSidebar, Session History Table (company, role, date, score), Score Progress Line Chart over time.

### D16. Prep Library Catalog (`/candidate/prep`)
**Purpose:** Browse AI-generated company interview prep guides.
**Components:** CandidateSidebar, Search Bar, Company Cards grid (logo, name, available archetypes), Archetype Filter Tags (e.g., "Backend Engineer", "Product Manager").

### D17. Prep Library Detail (`/candidate/prep/:companyName/:roleArchetype`)
**Purpose:** Company-specific interview prep content.
**Components:** CandidateSidebar, Question Bank Accordion (expandable Q&A), Culture Tips Panel, Skill Checklist, "Start Mock Interview" CTA (pre-loads this company's rubric).

### D18. AI Voice Resume Builder (`/candidate/resume-builder`)
**Purpose:** 15-minute voice session → ATS-compliant resume generation.
**Components:** CandidateSidebar, Target Role Configuration Card, Production 2-Sided Voice/Video Interview Room (Glowing 3D AI Voice Orb, Local Webcam Preview, Eye-Contact Telemetry display, Audio Spectrum Visualizers), Live Extracted Points Drawer (real-time bullet point extraction), Formatted ATS Paper Preview, ATS Compliance Score Gauge (0–100), Template Theme Switcher (Classic ATS / Modern Minimal / Executive), Copy Plain Text button, PDF Download button.

### D19. Candidate Notifications (`/candidate/notifications`)
**Purpose:** Notification feed for application and interview events.
**Components:** CandidateSidebar, Notification Feed (sorted by recency), Filter Toggles (by type), Click-through navigation.

### D20. Candidate Settings (`/candidate/settings`)
**Purpose:** Account preferences and notification settings.
**Components:** CandidateSidebar, Account Settings (email, password change), Notification Preferences toggles, Privacy Settings (data export, account deletion request).

---

## Group E: Shared Interview & Assessment Consoles

### E1. Live Voice Interview Console (`/interview/:interviewId`)
**Purpose:** Full-screen immersive AI voice interview room.
**Components:** Pre-Join Hardware Check Modal (mic test, camera preview), Video Consent Modal, Voice Status Orb (`Speaking` / `Listening` / `Analyzing` / `Idle`), Real-Time Subtitle Overlay, Collapsible Teleprompter Drawer, Proctoring Telemetry HUD (face count, gaze indicator, voice clarity), Mute / End Call controls.
**Implementation:** `src/components/interview/InterviewCheckScreen.tsx`, `src/components/interview/InterviewActiveConsole.tsx`

### E2. Text-Only Fallback Console
**Purpose:** Automatic chat-mode fallback when voice latency exceeds 3 seconds.
**Trigger:** Frontend detects STT/TTS round-trip > 3s and switches automatically.
**Components:** Chat Bubble Interface (alternating candidate/AI messages), Text Input Field with Send button, Connection Status Alert Banner.

---

## Group F: UI Primitives (`src/components/ui/`)

All reusable base components used across the platform.

| Component | File | Description |
|---|---|---|
| `Button` | `Button.tsx` | Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`, `success`. Sizes: `sm`, `md`, `lg`. Loading spinner state. |
| `Input` | `Input.tsx` | Label, left/right icon slots, error text, glassmorphism styling. |
| `Select` | `Select.tsx` | Custom-styled accessible select wrapper. |
| `Card` | `Card.tsx` | Container with `CardHeader`, `CardTitle`, `CardDescription`, `CardFooter` sub-components. |
| `Badge` | `Badge.tsx` | Status badges with intent mapping: `active`, `pending`, `rejected`, `offered`, `draft`. |
| `Modal` | `Modal.tsx` | Accessible portal-mounted modal with backdrop click and ESC listener. |
| `Tabs` | `Tabs.tsx` | `TabsList`, `TabsTrigger`, `TabsContent` — accessible tab switcher. |
| `Tooltip` | `Tooltip.tsx` | Hover/focus popover tooltip. |
| `Table` | `Table.tsx` | Styled data table with `TableHead`, `TableBody`, `TableRow`, `TableCell`. |
| `Skeleton` | `Skeleton.tsx` | Skeleton loading placeholders: `CardSkeleton`, `TableSkeleton`. |
| `EmptyState` | `EmptyState.tsx` | Empty state with icon, message, and optional CTA button. |
| `Autocomplete` | `Autocomplete.tsx` | Typeahead search input with dropdown suggestions (used in mock setup, talent pool). |
| `JobCard` | `JobCard.tsx` | Public job listing card with company logo, title, tags, and apply CTA. |
| `CompanyLogo` | `CompanyLogo.tsx` | Company logo display with fallback initials avatar. |
| `RadarChart` | `RadarChart.tsx` | Spider/radar chart for displaying rubric dimension score breakdowns. |
| `ClusterPlot` | `ClusterPlot.tsx` | 2D scatter/cluster plot for candidate score distribution visualization. |
| `NotificationDropdown` | `NotificationDropdown.tsx` | Global notification bell dropdown with unread count badge. |
| `ThemeToggle` | `ThemeToggle.tsx` | Dark/light mode toggle button using `ThemeContext`. |
| `Toast System` | via `ToastContext.tsx` | Global toast notification provider and `useToast()` hook. |

---

## Group G: Interview Components (`src/components/interview/`)

| Component | File | Description |
|---|---|---|
| `InterviewCheckScreen` | `InterviewCheckScreen.tsx` | Pre-join hardware check: mic test, camera preview, video consent modal. |
| `InterviewActiveConsole` | `InterviewActiveConsole.tsx` | Full-screen live interview room: Voice Orb, subtitles, proctoring HUD, call controls. |
| `AptitudeTestConsole` | `AptitudeTestConsole.tsx` | Full aptitude test UI: category tabs, question rendering, countdown timer. |
| `CodingAssessmentConsole` | `CodingAssessmentConsole.tsx` | Full coding console: Monaco editor, test case runner, output panel. |

---

## Group H: Shared Layout Components (`src/components/`)

| Component | File | Description |
|---|---|---|
| `HrSidebar` | `HrSidebar.tsx` | HR portal left navigation sidebar with active state highlighting. |
| `CandidateSidebar` | `CandidateSidebar.tsx` | Candidate portal left navigation sidebar. |
| `PublicNavbar` | `PublicNavbar.tsx` | Top navigation bar for public-facing pages with auth CTAs. |
| `PublicFooter` | `PublicFooter.tsx` | Site footer for public pages. |
| `RoleSwitcher` | `RoleSwitcher.tsx` | Dev/demo utility to switch between HR and Candidate role contexts. |

---

## Group I: Screen-to-Role Access Matrix

| Screen Group | Public | Candidate | HR |
|---|---|---|---|
| Group A (Public) | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Group B (Auth) | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Group C (HR Portal) | 🚫 Forbidden | 🚫 Forbidden | ✅ Org Scoped |
| Group D (Candidate Portal) | 🚫 Forbidden | ✅ Own Data Only | 🚫 Forbidden |
| Group E (Live Consoles) | 🚫 Forbidden | ✅ Session Scoped | 🚫 Replay Only |
| Group F/G/H (Components) | Internal — not a route | Internal — not a route | Internal — not a route |
