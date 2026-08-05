# NextRound — Complete Screen Inventory

Exhaustive inventory of all platform user interfaces, grouped by surface, route, purpose, and UI components.

---

## Group A: Public Surface (Unauthenticated)

### A1. Landing Page (`/`)
- **Purpose**: Marketing entry point for both employers and job seekers.
- **Components**: Navigation Bar, Hero Banner with dual CTA ("Post Job" / "Find Job"), How-it-Works Step Indicator, Platform Metrics Bar, Feature Cards, Footer.

### A2. Public Job Catalog (`/jobs`)
- **Purpose**: Searchable job board listing open positions across all registered companies.
- **Components**: Search Bar, Filter Drawer (location, experience, salary, remote), Job Card Grid, Pagination controls.

### A3. Public Job Detail Page (`/jobs/:jobId`)
- **Purpose**: Detailed job description view with entry point to apply.
- **Components**: Job Header, Rich Text JD Body, Rubric Skill Tags, Company Card, Sticky "Apply Now" button, Similar Jobs list.

### A4. About Page (`/about`)
- **Purpose**: Company vision, bias-free AI hiring methodology, and platform trust overview.
- **Components**: Mission Banner, Bias Audit Explainer, Leadership Team section.

### A5. Contact Page (`/contact`)
- **Purpose**: Enterprise sales inquiries, demo scheduling requests, and support contact form.
- **Components**: Inquiry Form, Direct Email links, Sales Calendar widget.

### A6. Pricing Page (`/pricing`)
- **Purpose**: Tier breakdown (Free tier active, Pro/Enterprise preview).
- **Components**: Tier Cards, Feature Comparison Table, FAQ Accordion.

---

## Group B: Authentication & Onboarding

### B1. Sign Up (`/signup`)
- **Purpose**: Account creation with role selection (HR Manager vs Candidate).
- **Components**: Role Toggle, Registration Form (Name, Email, Password, Company Name for HR), Terms Checkbox.

### B2. Login (`/login`)
- **Purpose**: Single sign-in form resolving role context server-side from JWT token.
- **Components**: Email/Password fields, Remember Me checkbox, Password Reset link.

### B3. Password Recovery (`/forgot-password`, `/reset-password`)
- **Purpose**: Password reset email request and token validation form.
- **Components**: Email Input, Token Verification Form, Password Reset Confirmation.

### B4. Candidate Onboarding (`/onboarding/candidate`)
- **Purpose**: Multi-step setup wizard creating `CandidateProfile`.
- **Components**: Step 1 (Resume & Portfolio Links), Step 2 (Tech Stack & Work Preferences), Step 3 (Expected Salary, Notice Period, Work Values).

### B5. HR Company Onboarding (`/onboarding/company`)
- **Purpose**: First-time company profile and workspace configuration.
- **Components**: Org Profile Form, Team Member Invitations, Interview Availability Timezone Picker.

---

## Group C: HR Portal (`/hr/*`)

### C1. HR Dashboard (`/hr/dashboard`)
- **Purpose**: Workspace overview displaying active hiring pipelines and summary statistics.
- **Components**: Navigation Sidebar, Stat Cards (Active Jobs, In Pipeline, Interviews, Offers), Live Agent Activity Stream.

### C2. Job Management (`/hr/jobs`)
- **Purpose**: Organization job listing table with status controls.
- **Components**: Job Table, Status Filters (Active/Draft/Closed), "Create Job" button.

### C3. Job Editor (`/hr/jobs/new`, `/hr/jobs/:jobId/edit`)
- **Purpose**: AI-assisted job description composition and rubric weight editor.
- **Components**: Rich Text Editor, AI Assist Suggestion Drawer, Rubric Weight Sliders, Threshold & Auto-Offer Toggles.

### C4. Pipeline Kanban (`/hr/jobs/:jobId/pipeline`)
- **Purpose**: Visual pipeline board tracking candidates across Sourced, Screened, Interview, and Decided stages.
- **Components**: Kanban Columns, Candidate Cards with Score Badges, Streaming Agent Log Drawer.

### C5. Candidate Table (`/hr/jobs/:jobId/candidates`)
- **Purpose**: Filterable tabular candidate view supporting bulk actions.
- **Components**: Candidate Data Table, Column Customizer, Stage Filters, Export CTA.

### C6. Candidate Evaluation Detail (`/hr/candidates/:applicationId`)
- **Purpose**: In-depth breakdown of candidate score, transcript, gap analysis, and bias audit report.
- **Components**: Score Overview, Dimension Bar Charts, Gap Analysis Card, Bias Audit Report Panel, Interview Replay Link, Decision Card.

### C7. HR Talent Pool (`/hr/talent-pool`)
- **Purpose**: Global candidate search console for passive sourcing.
- **Components**: Search Input, Skill Tag Filters, Candidate Profile Drawer, Bookmark Action button, Outreach Sequence Trigger.

### C8. Interview Replay (`/hr/candidates/:applicationId/interview`)
- **Purpose**: Audio replay and timestamped transcript inspection.
- **Components**: Waveform Audio Player, Auto-scrolling Transcript, Proctor Flag Markers, Question-by-Question Scores.

### C9. Analytics Dashboard (`/hr/analytics`)
- **Purpose**: Weekly funnel analytics and bias audit metrics.
- **Components**: Funnel Chart, Time-to-Hire Trend, Score Distribution, PDF Report Exporter.

### C10. Org Settings (`/hr/settings`)
- **Purpose**: Organization management, team roles, email templates, and availability hours.
- **Components**: Settings Tabs (General, Team, Email Templates, Availability, Billing).

### C11. Notifications (`/hr/notifications`)
- **Purpose**: Real-time alerts for shortlists, decision holds, and interview completions.
- **Components**: Alert Feed, Filter Toggles, Click-through Navigation.

### C12. HR Video Call Console (`/hr/interview/:applicationId`)
- **Purpose**: Live 1:1 human-to-human video call between HR and candidate for final stage gating.
- **Components**: Video Grid, Evaluation Form (Pass/Fail radio buttons, Notes box), Submit Decision button.

### C13. Sentiment + Stress Analyser (`/hr/sentiment-analysis`)
- **Purpose**: Audio biomarker inspection, Emotional Journey Graph timeline, and candidate nervousness evaluator.
- **Components**: Candidate Selector, Biomarkers Engine Cards, Interactive Heatmap Timeline Graph, Synchronized Vocal Transcript with Emotion Badges & HR AI Insights.

---

## Group D: Candidate Portal (`/candidate/*`)

### D1. Candidate Dashboard (`/candidate/dashboard`)
- **Purpose**: Overview of active job applications, interview schedules, and recommended mock sessions.
- **Components**: Application Status Cards, Action Required Banners, Recommended Jobs Strip.

### D2. Applications List (`/candidate/applications`)
- **Purpose**: List of all submitted job applications across companies.
- **Components**: Application Table, Status Badges (Applied, Assessment, Interview, HR Round, Decided, Offered).

### D3. Application Status Detail (`/candidate/applications/:applicationId`)
- **Purpose**: Stage progress timeline for a specific application.
- **Components**: Horizontal Timeline, Stage Status Card, Next Action CTA.

### D4. Interview Scheduler (`/candidate/applications/:applicationId/schedule`)
- **Purpose**: Selects one of 3 proposed interview slots.
- **Components**: Slot Selector Cards, Reschedule Request Modal, Add to Calendar Button.

### D5. Aptitude Test Console (`/candidate/applications/:applicationId/assessment`)
- **Purpose**: Timed cognitive and technical assessment.
- **Components**: Category Tabs, Question Container, Radio Option Selectors, Countdown Timer, Submit Modal.

### D6. Coding Assessment Console (`/candidate/applications/:applicationId/take-home`)
- **Purpose**: Interactive coding environment for software engineering applications.
- **Components**: Problem Description Panel, Code Editor (Monaco/CodeMirror), Test Case Console, Run Tests / Submit buttons.

### D7. Video Screening Console (`/candidate/applications/:applicationId/video-screening`)
- **Purpose**: Asynchronous video prompt responses.
- **Components**: Webcam Preview Box, Prompt Card, Recording Controls, Transcript Preview.

### D7.5. Candidate HR Round Room (`/candidate/hr-round/:applicationId`)
- **Purpose**: Pre-call waiting room and live 1:1 WebRTC video call console with HR representative.
- **Components**: Hardware Pre-Check Modal (camera preview, mic volume meter), Call Scheduled Time Indicator, "Join Call" Button, Live WebRTC Video Viewport, Call Controls (Mute Mic, Video Toggle, Leave Call).

### D8. Offer Letter Console (`/candidate/applications/:applicationId/offer`)
- **Purpose**: Interactive offer letter review and acceptance.
- **Components**: Offer Summary (Salary, Equity, Start Date), PDF Viewer, Digital Signature Canvas, Accept / Decline buttons.

### D9. Onboarding Checklist (`/candidate/applications/:applicationId/onboarding`)
- **Purpose**: Post-offer document submission portal.
- **Components**: Task Checklist, Document Upload Cards, Emergency Contact Form.

### D10. Candidate Profile (`/candidate/profile`)
- **Purpose**: Manage universal profile details.
- **Components**: Resume Uploader, Skill Chips Editor, Target Salary/Role Inputs, Profile Completeness Indicator.

### D11. Mock Interview Setup (`/candidate/mock/new`)
- **Purpose**: Practice interview session launcher.
- **Components**: Target Company Autocomplete, Role Selector, Difficulty Dropdown, Start Button.

### D12. Mock Interview Room (`/candidate/mock/:sessionId`)
- **Purpose**: Practice mode voice interview console.
- **Components**: Practice Mode Banner, Voice Status Orb, Subtitle Feed, Proctor Telemetry HUD.

### D13. Mock Feedback (`/candidate/mock/:sessionId/feedback`)
- **Purpose**: Instant coaching feedback report following practice.
- **Components**: Score Cards, Strengths & Weaknesses Narrative, Annotated Transcript.

### D14. Mock History (`/candidate/mock/history`)
- **Purpose**: Historical practice session score trends.
- **Components**: Session History Table, Score Progress Chart.

### D15. Prep Library (`/candidate/prep`)
- **Purpose**: Catalog of company-specific prep guides.
- **Components**: Search Bar, Company Cards, Archetype Filters.

### D16. Prep Detail (`/candidate/prep/:companyId/:roleArchetype`)
- **Purpose**: Question banks and company culture guides.
- **Components**: Question Bank Accordion, Culture Tips Panel, "Start Mock" CTA.

### D17. AI Voice Resume Builder (`/candidate/resume-builder`)
- **Purpose**: 15-minute voice interview session & live ATS resume generation.
- **Components**: Target Role Configuration Card, Production 2-Sided Voice/Video Interview Room (Glowing AI Voice Orb, Camera Stream, Mic controls), Live Extracted Points Drawer, Formatted ATS Paper Preview, ATS Compliance Score Gauge (96/100), Theme Switcher, PDF Download button.

---

## Group E: Shared Interview & Assessment Consoles

### E1. Live Voice Interview Console (`/interview/:interviewId`)
- **Purpose**: Full-screen immersive AI voice interview room.
- **Components**: Pre-join Check (Mic/Cam check + Video Consent Modal), Voice Status Orb (`Speaking`, `Listening`, `Analyzing`, `Idle`), Subtitles Overlay, Proctoring Telemetry HUD, Mute/End Call controls.

### E2. Text-Only Fallback Console
- **Purpose**: Automatic fallback mode when voice network latency exceeds 3 seconds.
- **Components**: Chat Bubble Interface, Text Input Field, Connection Status Alert Banner.

---

## Group F: UI Primitives Library (`src/components/ui/`)

1. **Button**: Variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, `success`), sizes (`sm`, `md`, `lg`), loading spinner states.
2. **Input / Textarea**: Label, left/right icon slots, error text, glassmorphism styling.
3. **Select**: Custom-styled accessible select wrapper.
4. **Card**: Modular container (`CardHeader`, `CardTitle`, `CardDescription`, `CardFooter`).
5. **Badge**: Status badges with intent mapping (`active`, `pending`, `rejected`, `offered`).
6. **Modal**: Accessible portal-mounted modal dialog with backdrop click and ESC listener.
7. **Tabs**: Tab switcher (`TabsList`, `TabsTrigger`, `TabsContent`).
8. **Tooltip**: Hover/focus popover tooltip.
9. **Skeleton**: Skeleton loaders (`CardSkeleton`, `TableSkeleton`).
10. **EmptyState**: Empty state placeholder with icon, message, and CTA.
11. **Toast System**: Global toast notification context provider (`useToast`).

---

## Group G: Screen-to-Role Access Control Matrix

| Screen Group | Public | Candidate | HR Admin |
|---|---|---|---|
| Group A (Public) | Allowed | Allowed | Allowed |
| Group B (Auth) | Allowed | Allowed | Allowed |
| Group C (HR Portal) | Forbidden | Forbidden | Allowed (Org Scoped) |
| Group D (Candidate Portal) | Forbidden | Allowed (Own Data) | Forbidden |
| Group E (Live Consoles) | Forbidden | Allowed (Session Scoped) | Forbidden (Replay Only) |
