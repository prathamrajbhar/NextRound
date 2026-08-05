# NextRound — Feature Specifications

NextRound (HireOS) provides an end-to-end, multi-modal recruitment platform powered by 8 autonomous hiring agents and candidate practice tools.

---

## 1. Job Creation & AI Rubric Generation (HR)

- **AI Job Description Assistant**: HR inputs raw job requirements; AI formats the JD, extracts key skill tags, experience ranges, and salary bounds.
- **Automated Rubric Engine**: Generates a weighted scoring rubric across customizable dimensions (e.g., Technical Mastery 40%, Problem Solving 30%, Communication 30%).
- **Configurable Pipeline Rules**: Job-level toggles for minimum passing score thresholds, auto-offer toggles, question counts, and enabled assessment modalities.

---

## 2. Sourcing Agent

- **Multi-Source Talent Search**: Scrapes public candidate signals across LinkedIn, GitHub, and AngelList while prioritizing existing platform profiles.
- **Deduplication Engine**: Prevents repetitive candidate outreach across companies on the platform.
- **Pre-Ranking Pool**: Ranks initial candidates by semantic fit before resume submission.

---

## 3. Screening Agent (Resume RAG)

- **PDF/DOCX Parser**: Extracts structured history, technical skills, education, and project accomplishments.
- **pgvector Cosine Embedding Match**: Converts resumes into vector embeddings and matches against job rubrics using semantic vector similarity.
- **Gap Analysis**: Identifies explicit candidate skill deficiencies relative to position requirements.
- **Instant Rejection Routing**: Automatically dispatches feedback-rich rejection emails to applicants below threshold score.

---

## 4. Scheduler Agent

- **Zero-Email Scheduling**: Sends candidate scheduling links synced with company platform availability hours.
- **3-Slot Auto-Proposer**: Offers candidates 3 optimized interview time options.
- **Automated Reminders & Rescheduling**: Sends SMS/email reminders (24h and 1h prior) and handles automated slot re-proposal on reschedule requests.

---

## 5. Interviewer Agent & Voice Console

- **Full-Screen Immersive Console**: Cinematic voice interview viewport featuring a pulsing Voice Status Orb (`Speaking`, `Listening`, `Analyzing`, `Idle`).
- **Dynamic Conversational Loop (Human-like Unscripted Interviewing)**:
  - **No Fixed Question Scripts**: Replaces static, sequential question trees with a fully adaptive human-like dialogue loop.
  - **Active Listening & Context Buffer**: Maintains the full live transcript history, candidate resume, and job rubric in memory to process responses in context.
  - **Organic Follow-ups & Deep-Dives**: Evaluates candidate answers in real time. If a candidate mentions a specific project, metric, or technical architecture (e.g., Redis rate limiting), the agent pivots immediately to ask a deep-dive follow-up on that exact topic.
  - **Challenging Vague Responses**: Gently detects evasive or generic answers and asks clarifying follow-ups (e.g., probing for specific architectural decisions or metrics) before moving on.
  - **Natural Transitions**: Smoothly shifts between interview stages (`Introduction` → `Core Vetting` → `Deep-Dive` → `Wrap-up`) based on topic saturation rather than strict timer limits.
- **Real-Time Subtitles & Teleprompter**: Caption overlay at bottom of screen with collapsible side teleprompter drawer.
- **Proctoring HUD Overlay**: Real-time camera feed overlay displaying head orientation, face detection count, and voice clarity.

---

## 6. Multi-Modal Assessment Consoles

### A. Aptitude Test Console (`/assessment`)
- Timed assessment covering 4 cognitive categories: Logical Reasoning, Verbal Ability, Quantitative Aptitude, and Technical Core Concepts.
- Real-time countdown timer, category navigation tabs, and instant scoring breakdown.

### B. Coding Assessment Console (`/take-home`)
- Full browser code editor supporting JavaScript, TypeScript, Python, and Go.
- Custom test case execution, automated syntax validation, runtime memory/time profiling, and complexity scoring.

### C. Video Screening Console (`/video-screening`)
- Asynchronous video prompt responses with camera preview, auto-transcription, and proctoring telemetry.

### D. Offer Letter & Onboarding Workflow (`/offer`, `/onboarding`)
- Digital offer letter view displaying salary breakdown, equity package, start date, and interactive signature canvas.
- Post-offer document upload portal, emergency contact collection, and background check authorization forms.

---

## 7. Evaluator + Bias Audit Agent

- **LLM-as-Judge Scoring**: Evaluates interview transcripts and assessment submissions against job rubric dimensions.
- **Blind Demographic Bias Audit**: Scans aggregate evaluation patterns for systematic scoring disparities across gender-coded names, age indicators, and school prestige.
- **Audit Report Attachment**: Attaches a detailed bias audit report to every candidate application evaluation card.

---

## 8. Decision Agent

- **Threshold Matching Logic**: Evaluates composite application score against job-configured thresholds.
- **Outcome Classification**: Categorizes candidates into `Hire`, `Reject`, or `Hold for Review`.
- **Automated Offer / Rejection Delivery**: Generates personalized offer letters or constructive rejection emails matching organization branding.

---

## 8.5. Human HR Round

- **Human-to-Human Video Call**: After all automated AI assessment stages pass the job threshold (aptitude test, coding assessment, video screening, and AI voice interview), a live 1:1 video call is scheduled between the candidate and an HR representative.
- **Zero AI Participation**: No AI agent participates in or scores this round; it is purely a human interaction.
- **Manual HR Evaluation & Gating**: HR manually conducts the video call and marks the round result as `Pass` or `Fail` via the HR Video Call Console.
- **Conditional Offer Release**: Only after HR marks `Pass` does the Decision Agent trigger and release the official digital offer letter. Marking `Fail` dispatches a polite rejection email.

---

## 9. Analytics Agent & Reporting

- **Hiring Funnel Analytics**: Visualizes candidate progression across Sourced, Screened, Assessment, Interview, Decided, and Hired stages.
- **Time-to-Hire & Score Trend Charts**: Tracks role-by-role velocity and bias audit score stability over time.
- **PDF Report Generation**: Exports complete weekly hiring reports for executive review.

---

## 10. Candidate Portal & Self-Serve Prep

- **Universal Candidate Profile**: One profile containing resume, portfolio URLs, skills, and target compensation used across all platform job applications.
- **Mock Interview Console**: On-demand practice voice interviews tailored to target companies and job roles with instant AI coaching feedback.
- **Company Prep Library**: AI-generated interview question banks, culture guides, and archetype skill checklists.
- **Progress & Skill Analytics**: Historical score trends highlighting candidate improvement across weak technical dimensions over time.

---

## 11. HR Talent Pool Console (`/hr/talent-pool`)

- Global candidate discovery search with AI keyword matching and filter tags.
- Passive candidate bookmarking and direct email outreach sequence triggers.

---

## 12. AI Voice Resume Builder (`/candidate/resume-builder`)

- **15-Minute Conversational Voice Interview**: Candidates complete a 15-minute voice interview with an AI agent — no forms or manual writing required.
- **Production-Grade Call Interface**: 2-sided video/voice call room featuring glowing 3D AI Voice Orb, local WebCam preview, eye-contact telemetry (`Eye Contact: 98%`), and audio spectrum visualizers.
- **Live Background ATS Extraction**: Real-time extraction of quantified bullet points ("78% latency reduction", "2.5M DAU scale"), skills, and leadership achievements as the candidate speaks.
- **ATS Resume Studio**: Generates a single-column, ATS-friendly resume with an **ATS Compliance Score** gauge (96/100), template theme options (Classic ATS, Modern Minimal, Executive), copy plain text, and PDF download.

---

## 13. Sentiment + Stress Analyser (`/hr/sentiment-analysis`)

- **Vocal Biomarker Engine**: Real-time analysis of candidate audio tone harmony, speech pace (WPM), pitch micro-variations, and pause patterns during AI voice interviews.
- **Emotional Journey Graph**: Interactive visual timeline tracking confidence, stress, and hesitation levels across interview topics.
- **Synchronized HR Transcript**: Line-by-line transcript annotated with real-time emotion markers (`[Confident]`, `[Hesitant]`, `[Stressed]`) and pitch/pace metrics.
- **Skill Gap vs. Interview Nervousness Evaluator**: AI recommendation callouts distinguishing temporary interview nervousness from genuine technical skill gaps for HR decision-making.
