# NextRound / HireOS — Pending Work & Future ML Upgrade Roadmap 📋

> **Document Status**: Active  
> **Last Updated**: August 6, 2026  
> **Purpose**: Documents all pending work, bypassed machine learning pipelines, infrastructure requirements, and future technical upgrades for the NextRound (HireOS) recruitment platform.

---

## 🎯 Executive Strategy & Bypass Architecture

To ensure a zero-human-step recruitment platform that operates reliably out of the box without requiring expensive GPU clusters or specialized ML infrastructure during initial development, **complex standalone machine learning models have been intentionally bypassed**. 

The current system replaces these heavy ML models with:
1. **LLM-as-a-Judge**: Gemini 2.5 Flash for reasoning, scoring, resume screening, bias auditing, and conversational voice turn generation.
2. **PostgreSQL + `pgvector`**: 768-dimensional semantic embedding search for internal candidate-job matching.
3. **Client-Side Vision**: MediaPipe via browser WebGL for face detection and gaze tracking (strictly isolated from scoring logic).
4. **Subprocess Isolation**: Standard OS process sandboxing with strict CPU/memory limits for candidate code evaluation.

All bypassed ML components are tagged with `# ML_BYPASS:` in the source code and registered in `BYPASS_REGISTRY.md`. They are ready to be upgraded to dedicated standalone ML models in future phases.

---

## 🔬 Bypassed ML Models & Standalone Implementation Roadmap

Below is the complete inventory of the 8 machine learning models currently bypassed, along with their production upgrade paths, data requirements, and estimated engineering efforts:

### 1. 🎙️ Audio Prosody, Pitch & Acoustic Stress Analysis
- **Current Bypass**: Text-based sentiment analysis using Gemini LLM on interview transcripts, combined with word-per-minute (WPM) speech pace calculations.
- **Pending ML Upgrade**: Deploy `wav2vec2-large-robust-emotion` or `pyAudioAnalysis` to extract pitch micro-variance (Hz), voice tremor, and acoustic stress directly from raw 16kHz audio waveforms without relying on text transcripts.
- **Data & Infra Needed**: 500+ hours of IEMOCAP / RAVDESS prosody datasets; GPU worker container.
- **Estimated Effort**: 3–4 Weeks.
- **Source Files**: `apps/ai-service/services/sentiment_service.py`, `apps/api/src/routes/sentiment.routes.ts`.

---

### 2. 🌐 External Talent Sourcing & Profile Scraper Ranker
- **Current Bypass**: Candidate sourcing is scoped to internal platform `CandidateProfile` records in PostgreSQL via `pgvector` cosine similarity. Sourced candidates are tagged as `source: 'in_platform'`.
- **Pending ML Upgrade**: Integrate external profile scrapers (LinkedIn Recruiter API, GitHub API, BrightData proxy pool) coupled with a `LightGBM` learning-to-rank model trained on historical candidate hiring outcomes.
- **Data & Infra Needed**: Commercial scraping proxy credits; Redis feature store for candidate skill graphs.
- **Estimated Effort**: 4–5 Weeks.
- **Source Files**: `apps/ai-service/agents/sourcing_agent.py`, `apps/api/src/routes/talent-pool.routes.ts`.

---

### 3. 🛡️ Ephemeral MicroVM Code Execution Sandbox
- **Current Bypass**: Python candidate submissions execute in restricted child processes using OS `subprocess.run` with Linux `resource.setrlimit` enforcing 256MB RAM caps, 10s CPU timeouts, and AST regex import sanitization.
- **Pending ML Upgrade**: Upgrade to Judge0 CE sidecar service or Firecracker MicroVMs executing submissions inside isolated ephemeral rootfs containers with network namespaces disabled.
- **Data & Infra Needed**: KVM-enabled Linux kernel host; gRPC sandbox runner; multi-language Docker image registry.
- **Estimated Effort**: 2–3 Weeks.
- **Source Files**: `apps/ai-service/services/code_executor_service.py`, `apps/ai-service/workers/coding_worker.py`.

---

### 4. 📄 Visual Resume Document Layout Parser & ATS Ranker
- **Current Bypass**: Resume evaluation combines rule-based keyword density calculations, qualification matching via Gemini LLM, and ReportLab PDF layout generation.
- **Pending ML Upgrade**: Deploy OCR-free visual document layout parser (`LayoutLMv3` / `Donut`) for structural resume parsing and a `LambdaMART` ranking model trained on historic recruiter screening decisions.
- **Data & Infra Needed**: 10,000+ annotated candidate resume PDFs paired with recruiter pass/fail outcome labels.
- **Estimated Effort**: 4 Weeks.
- **Source Files**: `apps/ai-service/services/resume_builder_service.py`, `apps/ai-service/workers/screening_worker.py`.

---

### 5. 👁️ Client-Side Video Facial Expression ML Model
- **Current Bypass**: Client-side MediaPipe handles basic gaze tracking and face counts subject to candidate consent (`POST /api/v1/interviews/:id/consent`). Proctoring signals are logged strictly for HR audit and programmatically excluded from scoring.
- **Pending ML Upgrade**: Incorporate client-side TensorFlow.js `fer+` or `DeepFace` expression model to compute candidate visual clarity and engagement indices (strictly opt-in).
- **Data & Infra Needed**: Facial expression video dataset; client WebGL acceleration.
- **Estimated Effort**: 3 Weeks.
- **Source Files**: `apps/web/src/components/interview/InterviewActiveConsole.tsx`, `apps/ai-service/agents/screening_agent.py`.

---

### 6. ⚖️ Dedicated Statistical Bias Classifier
- **Current Bypass**: Gemini LLM-as-a-Judge evaluates score justification text for demographic bias indicators, enforced by a programmatic `validate_isolation` assertion node.
- **Pending ML Upgrade**: Integrate IBM AI Fairness 360 or Holistic AI toolkit to calculate Disparate Impact Ratios and Statistical Parity Difference across demographic cohorts.
- **Data & Infra Needed**: Anonymized multi-demographic hiring decision dataset across protected classes.
- **Estimated Effort**: 3–4 Weeks.
- **Source Files**: `apps/ai-service/agents/bias_audit_agent.py`, `apps/ai-service/agents/evaluator_agent.py`.

---

### 7. ⚡ Sub-500ms WebRTC Voice Streaming Cluster
- **Current Bypass**: Voice interactions use Groq Whisper for STT, Gemini Flash for dialogue generation, and Piper/Coqui for TTS. If latency exceeds 1.5s, the system gracefully falls back to text mode or browser `window.speechSynthesis`.
- **Pending ML Upgrade**: Full token-by-token streaming from Gemini into `XTTS-v2` or `Deepgram Nova-3` for real-time sub-500ms conversational audio.
- **Data & Infra Needed**: WebRTC SFU Server (LiveKit / Janus gateway); GPU-backed TTS worker pool.
- **Estimated Effort**: 2 Weeks.
- **Source Files**: `apps/ai-service/agents/interviewer_agent.py`, `apps/ai-service/services/tts_service.py`, `apps/ai-service/routes/voice_routes.py`.

---

### 8. 📦 Self-Hosted Offline Sentence Transformer Embeddings
- **Current Bypass**: Generates 768-dimensional embeddings using Gemini `text-embedding-004` API with deterministic SHA-256 token hashing fallback when external API connections are offline.
- **Pending ML Upgrade**: Deploy self-hosted ONNX Runtime serving `sentence-transformers/all-MiniLM-L6-v2` for offline, zero-latency vector embedding generation.
- **Data & Infra Needed**: ONNX Runtime container image with CPU/GPU acceleration.
- **Estimated Effort**: 1 Week.
- **Source Files**: `apps/ai-service/services/embedding_service.py`, `apps/api/src/routes/talent-pool.routes.ts`.

---

## 🏗️ Pending Infrastructure & Production Deployment Work

Beyond the machine learning upgrade roadmap, the following platform infrastructure tasks are pending for full enterprise cloud deployment:

### 1. Enterprise Cloud Infrastructure & Orchestration
- [ ] **Docker Containers**: Write production Dockerfiles for `apps/web`, `apps/api`, and `apps/ai-service`.
- [ ] **Kubernetes / Helm**: Build Kubernetes deployment manifests and Helm charts for auto-scaling FastAPI AI workers based on BullMQ queue depth.
- [ ] **Managed Redis Cluster**: Configure HA Redis Sentinel cluster for production BullMQ queue durability.

### 2. Real-Time Communication & Media Infra
- [ ] **LiveKit WebRTC Gateway**: Deploy dedicated LiveKit SFU server to manage multi-party audio streaming for live HR observer panels.
- [ ] **S3 / MinIO Storage**: Configure production MinIO / AWS S3 buckets for storing candidate resume PDFs, video recording artifacts, and SVG signed offer letters.

### 3. Production Email & Webhook Integrations
- [ ] **Production SMTP**: Replace Nodemailer mock transport with SendGrid, AWS SES, or Postmark API keys for transactional emails (application confirmations, interview invites, offer letters).
- [ ] **HR Notification Webhooks**: Implement outbound webhooks and Slack/Microsoft Teams app integrations for instant HR candidate alerts.

---

## 📊 Summary of Bypassed vs Ready System Capabilities

| Feature Category | Current Implementation (Bypassed / Built) | Future Production Upgrade Target |
|---|---|---|
| **Core Hiring Pipeline** | ✅ Fully Functional (All 8 Agents Active) | Production Kubernetes Scaling |
| **Authentication & RBAC** | ✅ Strict Org Isolation (`403 Forbidden`) | OAuth2 / SSO (Okta, Google Workspace) |
| **Code Sandbox** | ✅ OS Subprocess with Memory/Time Limits | Firecracker MicroVM / Judge0 CE |
| **Candidate Sourcing** | ✅ PostgreSQL `pgvector` Internal Search | LinkedIn Recruiter API + LightGBM Ranker |
| **Voice Assessment** | ✅ Groq STT + Gemini + Web Speech Fallback | XTTS-v2 Low-Latency WebRTC Streaming |
| **Bias Auditing** | ✅ LLM-as-a-Judge + `validate_isolation` Node | IBM AI Fairness 360 Disparate Impact Classifier |
| **Document Generation** | ✅ ReportLab ATS PDF & SVG Offer Signer | LayoutLMv3 Visual Document Parser |

---

*This document serves as the official roadmap for transitioning NextRound from its current functional Gemini/Heuristic architecture into a fully self-hosted, custom-trained ML pipeline.*
