# NextRound AI Service — ML Model Bypass Registry

This registry documents all 8 machine learning model bypasses implemented across the NextRound architecture. Each entry outlines the feature description, the production-grade ML model, the current LLM/heuristic bypass strategy, labeled data and infrastructure requirements, and the estimated engineering effort to upgrade to a dedicated ML model.

---

## Executive Summary & Bypass Matrix

| ID | Bypassed Feature | Current Bypass Mechanism | Production ML Upgrade Path | Labeled Data & Infra Needed | Est. Upgrade Effort |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A** | Audio Sentiment & Stress | Gemini text transcript analysis + timestamp WPM calculation | `wav2vec2-large-robust-emotion` or `pyAudioAnalysis` prosody extraction | 500+ hrs IEMOCAP/RAVDESS prosody data; GPU inference container | 3-4 Weeks |
| **B** | External Talent Sourcing | `pgvector` candidate search in platform + `source: 'in_platform'` tag | LinkedIn Recruiter API / Scraper + LightGBM ranking model | Historical candidate engagement & hire outcome dataset; Redis feature store | 4-5 Weeks |
| **C** | Code Execution Sandbox | OS `subprocess.run` with `resource.setrlimit` (RLIMIT_AS) & import sanitization | Judge0 CE sidecar service or Firecracker MicroVM per submission | Isolated Linux host kernel; gRPC sandbox runner; multi-language image registry | 2-3 Weeks |
| **D** | ATS Scoring & Layout | Rule-based keyword density & qualification scoring + ReportLab PDF rendering | LayoutLMv3 / Donut layout parser + LambdaMART learning-to-rank model | 10,000+ annotated resume PDFs with recruiter screening labels | 4 Weeks |
| **E** | Video Screening Analysis | Client MediaPipe proctoring telemetry + transcript scoring via Gemini | Client-side TensorFlow.js `fer+` or DeepFace expression model | Expression-annotated video dataset with explicit candidate consent | 3 Weeks |
| **F** | Bias Detection Model | LLM-as-judge (Gemini) auditing evaluation reasoning strings | IBM AI Fairness 360 / Holistic AI Disparate Impact classifier | Anonymized multi-demographic hiring decision dataset across protected classes | 3-4 Weeks |
| **G** | Voice Latency Streaming | Groq Whisper STT + Gemini 2.5 Flash + Piper TTS + text fallback threshold | Token-by-token streaming Gemini response into XTTS-v2 / Deepgram Nova-3 | Low-latency WebRTC SFU gateway (LiveKit / Janus); GPU TTS cluster | 2 Weeks |
| **H** | Vector Embedding Model | Gemini `text-embedding-004` (768-dim) API + deterministic hash vector fallback | Self-hosted `sentence-transformers/all-MiniLM-L6-v2` container | ONNX Runtime / Triton Inference Server; 768-dim PGVector HNSW index | 1 Week |

---

## Detailed ML Bypass Documentation

### Feature A: Audio Prosody, Sentiment & Stress Analysis
- **Code Annotations**:
  - `apps/ai-service/services/sentiment_service.py` -> `# ML_BYPASS: audio prosody/pitch analysis — upgrade to pyAudioAnalysis or wav2vec2 when available`
  - `apps/api/src/routes/sentiment.routes.ts` -> `// ML_BYPASS: audio prosody/pitch analysis — upgrade to pyAudioAnalysis or wav2vec2 when available`
- **Current Bypass Implementation**:
  Speech audio files are processed via Groq Whisper for text transcription. Sentiment and stress levels are derived using a structured Gemini 2.5 Flash prompt analyzing transcript turns for emotional shifts, confidence indicators, and tone. Speech pace (WPM) is estimated from word count divided by estimated audio duration.
- **Production ML Upgrade Path**:
  Deploy `audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim` to extract pitch micro-variance (Hz), voice tremor, speech rate, and acoustic stress directly from 16kHz audio waveforms without relying on text transcripts.
- **Data & Infra Requirements**:
  - IEMOCAP and RAVDESS audio datasets for fine-tuning.
  - NVIDIA T4 / L4 GPU worker node for acoustic feature extraction.

---

### Feature B: External Talent Sourcing & Profile Matching
- **Code Annotations**:
  - `apps/ai-service/agents/sourcing_agent.py` -> `# ML_BYPASS: external sourcing — integrate LinkedIn Recruiter API or scraping pipeline when ready`
  - `apps/api/src/routes/talent-pool.routes.ts` -> `// ML_BYPASS: external sourcing — integrate LinkedIn Recruiter API or scraping pipeline when ready`
- **Current Bypass Implementation**:
  Talent sourcing is scoped to in-platform `CandidateProfile` records stored in PostgreSQL. Job requirements are converted into 768-dim embeddings using Gemini `text-embedding-004` and queried via `pgvector` HNSW cosine similarity search. Sourced candidates are tagged with `source: 'in_platform'`.
- **Production ML Upgrade Path**:
  Integrate external developer profile scrapers (GitHub, LinkedIn Recruiter API) coupled with a LightGBM learning-to-rank model trained on historical interview outcome data.
- **Data & Infra Requirements**:
  - Commercial API access keys (LinkedIn Recruiter / BrightData proxy pool).
  - Feature store (Redis) for candidate skill graph embeddings.

---

### Feature C: Code Execution Sandbox
- **Code Annotations**:
  - `apps/ai-service/services/code_executor_service.py` -> `# ML_BYPASS: WASM sandbox — upgrade to Judge0 CE or Firecracker MicroVM when available`
  - `apps/ai-service/workers/coding_worker.py` -> `# ML_BYPASS: WASM sandbox — upgrade to Judge0 CE or Firecracker MicroVM when available`
- **Current Bypass Implementation**:
  Python candidate submissions are executed using Python's `subprocess.run` inside restricted child processes with Linux `resource.setrlimit` enforcing memory caps (256MB) and execution timeouts (10 seconds), combined with regex AST import sanitization.
- **Production ML Upgrade Path**:
  Upgrade to Judge0 CE or Firecracker MicroVM sandboxing, executing submissions inside isolated ephemeral rootfs containers with network namespaces disabled.
- **Data & Infra Requirements**:
  - Kubernetes cluster with KVM virtualisation enabled for Firecracker microVMs.

---

### Feature D: ATS Scoring & Resume Layout Parser
- **Code Annotations**:
  - `apps/ai-service/services/resume_builder_service.py` -> `# ML_BYPASS: ATS ML scorer — replace with trained LambdaMART ranker on resume-outcome data`
  - `apps/ai-service/workers/screening_worker.py` -> `# ML_BYPASS: ATS ML scorer — replace with trained LambdaMART ranker on resume-outcome data`
- **Current Bypass Implementation**:
  Resume parsing and ATS scoring combine rule-based keyword density calculations, qualification matching, and ReportLab PDF template generation.
- **Production ML Upgrade Path**:
  Deploy LayoutLMv3 or Donut for OCR-free resume document visual structure parsing and a LambdaMART ranker trained on historic hiring decisions.
- **Data & Infra Requirements**:
  - 10,000+ labeled resume PDFs paired with recruiter screening pass/fail labels.

---

### Feature E: Video Screening & Engagement Analysis
- **Code Annotations**:
  - `apps/web/src/components/interview/InterviewActiveConsole.tsx` -> `// ML_BYPASS: video engagement ML — upgrade to fer+ or DeepFace for expression analysis (with consent)`
  - `apps/ai-service/agents/screening_agent.py` -> `# ML_BYPASS: video engagement ML — upgrade to fer+ or DeepFace for expression analysis (with consent)`
- **Current Bypass Implementation**:
  Client-side MediaPipe handles proctoring checks (gaze tracking, face count, tab switches) subject to explicit candidate consent (`POST /api/v1/interviews/:id/consent`). Candidate evaluation scoring relies exclusively on transcript text analysis, strictly excluding proctoring signals.
- **Production ML Upgrade Path**:
  Incorporate client-side TensorFlow.js `fer+` facial expression analysis to compute real-time candidate engagement and visual clarity indices (strictly requiring candidate opt-in).
- **Data & Infra Requirements**:
  - Client-side WebGL acceleration and opt-in consent UI workflow.

---

### Feature F: Dedicated Bias Audit Classifier
- **Code Annotations**:
  - `apps/ai-service/agents/bias_audit_agent.py` -> `# ML_BYPASS: dedicated bias classifier — upgrade to IBM AI Fairness 360 or Holistic AI when available`
- **Current Bypass Implementation**:
  Bias detection employs Gemini 2.5 Flash as an LLM-as-judge to analyze score distribution patterns and evaluation justification text for demographic bias indicators, enforced by a programmatic `validate_isolation` assertion node.
- **Production ML Upgrade Path**:
  Integrate IBM AI Fairness 360 or Holistic AI toolkit to calculate Disparate Impact Ratios and Statistical Parity Difference across demographic cohorts.
- **Data & Infra Requirements**:
  - Anonymized demographic data pipeline for post-hire audit compliance.

---

### Feature G: Conversational Voice Latency Pipeline (UPGRADED TO PRODUCTION VOICE PIPELINE)
- **Code Annotations**:
  - `apps/ai-service/services/stt_service.py` -> Groq Whisper STT audio transcription (`whisper-large-v3-turbo`).
  - `apps/ai-service/services/tts_service.py` -> Edge TTS neural speech synthesis & sentence streaming chunk generator.
  - `apps/ai-service/routes/voice_routes.py` -> REST & streaming endpoints (`/transcribe`, `/tts`, `/respond`, `/voice-stream`).
- **Implementation Status**: **PROD-READY / UPGRADED**
  Full end-to-end voice pipeline: Groq Whisper STT transcribes candidate speech, LangGraph agent generates dialogue, and Edge TTS synthesizes natural MP3 audio data URLs & sentence audio streams for sub-500ms voice interaction playback.
- **Production ML Upgrade Path**: Fully implemented via Groq Whisper API, Edge TTS neural synthesis, and SSE audio streaming.
- **Data & Infra Requirements**: Async audio processing & chunked SSE response generators.


---

### Feature H: Vector Embedding Model (UPGRADED TO PRODUCTION ONNX ENGINE)
- **Code Annotations**:
  - `apps/ai-service/services/embedding_service.py` -> Self-hosted ONNX vector embedding engine (`BAAI/bge-base-en-v1.5` via FastEmbed 0.8.0 / ONNX Runtime 1.26.0).
  - `apps/ai-service/routes/embedding_routes.py` -> REST endpoint `POST /api/v1/embeddings/generate`.
- **Implementation Status**: **PROD-READY / UPGRADED**
  Generates 768-dimensional normalized float vectors locally using self-hosted FastEmbed ONNX container engine (`BAAI/bge-base-en-v1.5`), with fallback to Gemini `text-embedding-004` API and deterministic 768-dim vector hashing.
- **Production ML Upgrade Path**: Fully implemented via ONNX Runtime & FastEmbed 0.8.0.
- **Data & Infra Requirements**: CPU/GPU ONNX Runtime execution provider (ONNX Runtime v1.26.0).

