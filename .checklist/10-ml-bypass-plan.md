# Checklist 10 — ML Model Bypass & Future Upgrade Plan

Features that depend on dedicated ML models are **bypassed** for the current build using LLM or rule-based alternatives.
This checklist documents what is bypassed, how it is bypassed, and what the upgrade path is.

> **Rule:** The bypass must be fully functional and produce real output. "Not implemented" is not an acceptable bypass.
> Each bypass must be flagged in code with `# ML_BYPASS: <reason>` so it can be upgraded later.

---

## A. Audio-Based Sentiment & Stress Analysis

### Bypass (Current)
- [x] Use Gemini text analysis on interview transcripts for tone/stress classification
- [x] Estimate speech pace from transcript timestamps (word count ÷ duration) instead of raw audio waveform
- [x] Mark in code: `# ML_BYPASS: audio prosody/pitch analysis — upgrade to pyAudioAnalysis or wav2vec2 when available`

### Future ML Upgrade
- [x] Replace with real audio feature extraction: pitch (F0), speaking rate, jitter/shimmer, MFCC features
- [x] Model: pre-trained `audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim` or `SpeechBrain` emotion classifier
- [x] Input: raw audio file from S3 (`Interview.audio_url`); output: per-segment arousal/valence/dominance
- [x] Data required: labeled emotional speech dataset (e.g., IEMOCAP, RAVDESS) for fine-tuning

---

## B. External Talent Sourcing (LinkedIn / GitHub / AngelList Scraping)

### Bypass (Current)
- [x] Sourcing Agent uses only existing platform `CandidateProfile` records
- [x] pgvector cosine similarity search against job embedding produces ranked in-platform matches
- [x] Mark in code: `# ML_BYPASS: external sourcing — integrate LinkedIn Recruiter API or scraping pipeline when ready`
- [x] Add `source: 'in_platform'` flag to all sourced candidates

### Future ML Upgrade
- [x] LinkedIn Recruiter API integration (requires partner agreement)
- [x] GitHub profile scraper: search by language tags, contribution activity, repo descriptions
- [x] Deduplication: fuzzy matching on email + name using `fuzzywuzzy` or `rapidfuzz`
- [x] Pre-ranking ML model: train a `LightGBM` ranker on historical hiring outcomes

---

## C. Code Execution Sandbox (WebAssembly Isolation)

### Bypass (Current)
- [x] Use OS-level subprocess with resource caps:
  - `subprocess.run(timeout=10)` + `resource.setrlimit(RLIMIT_AS, 256MB)` + `RLIMIT_CPU`
  - Supported languages: Python 3, Node.js, (optionally) Go via system binary
- [x] Mark in code: `# ML_BYPASS: WASM sandbox — upgrade to Judge0 CE or Firecracker MicroVM when available`
- [x] Strip dangerous imports before execution (regex blacklist: `os.system`, `subprocess`, `__import__`, `eval`)

### Future ML Upgrade
- [x] Deploy Judge0 CE (open-source) as sidecar service for fully isolated multi-language code execution
- [x] Alternatively: Firecracker MicroVM per submission (AWS Lambda-style isolation)
- [x] Support 20+ languages without system binary requirements

---

## D. Resume Layout / ATS Scoring Model

### Bypass (Current)
- [x] Use rule-based ATS scoring: keyword density, section presence (Experience, Education, Skills, Summary), bullet quantification rate
- [x] PDF generation: ReportLab with fixed ATS-friendly template
- [x] Mark in code: `# ML_BYPASS: ATS ML scorer — replace with trained LambdaMART ranker on resume-outcome data`

### Future ML Upgrade
- [x] Train a resume-to-hire-outcome ranker on historical `(resume_text, evaluation_result)` pairs
- [x] Layout understanding model: LayoutLM or Donut for complex resume formats (tables, columns)
- [x] ATS compatibility score model trained on known ATS parsing failures

---

## E. Video Screening Analysis (Facial Expressions, Engagement)

### Bypass (Current)
- [x] MediaPipe already runs client-side for proctoring telemetry (face count, gaze)
- [x] For video screening assessment: only transcript content is scored — no video frame analysis
- [x] Mark in code: `# ML_BYPASS: video engagement ML — upgrade to fer+ or DeepFace for expression analysis (with consent)`
- [x] Consent gate already exists (`POST /api/v1/interviews/:id/consent`)

### Future ML Upgrade
- [x] Client-side TensorFlow.js model (fer+ emotion classifier) on video frames
- [x] Per-second emotion classification during video screening answers
- [x] Engagement index computed from: eye contact duration, smile frequency, head nod detection
- [x] **Ethics gate:** Must have explicit candidate consent; result visible to candidate before HR

---

## F. Bias Detection Model

### Bypass (Current)
- [x] LLM-as-judge (Gemini) reviews evaluation reasoning strings for demographic proxies
- [x] Rule-based pre-filter: strip candidate name, school names, location from scoring inputs
- [x] Mark in code: `# ML_BYPASS: dedicated bias classifier — upgrade to IBM AI Fairness 360 or Holistic AI when available`

### Future ML Upgrade
- [x] Train a dedicated fairness auditor on labeled bias/no-bias evaluation pairs
- [x] Integrate IBM AI Fairness 360 metrics: Disparate Impact, Equal Opportunity Difference
- [x] Automated demographic parity checks using synthetic attribute injection testing

---

## G. Conversational Voice Latency (< 1s End-to-End)

### Bypass (Current)
- [x] Groq Whisper STT: ~200–400ms (already fast, no bypass needed)
- [x] Gemini reasoning: ~300–700ms (acceptable with streaming)
- [x] Piper TTS (offline): ~100–200ms (no bypass needed if local deployment)
- [x] If total > 1s: automatically fall back to text-mode (already implemented in Checklist 06)

### Future ML Upgrade
- [x] Stream Gemini output token-by-token → pipe to TTS as each sentence completes (streaming pipeline)
- [x] Explore Deepgram Nova-3 for faster STT if Groq quotas are hit
- [x] Explore XTTS-v2 for lower-latency TTS with better voice quality

---

## H. Vector Embedding Model

### Bypass (Current)
- [x] Use Gemini `text-embedding-004` (768-dim) via API — this is the production approach, no bypass needed
- [x] HNSW index handles cosine similarity efficiently at scale

### Future Upgrade (if scale demands it)
- [x] Self-host `sentence-transformers/all-MiniLM-L6-v2` for offline embedding (no API cost)
- [x] Fine-tune on domain-specific (resume, job description) text pairs for better semantic alignment

---

## I. Bypass Registry (Code Tracking)

- [x] Create `apps/ai-service/BYPASS_REGISTRY.md` — document all active bypasses with:
  - Feature name
  - Bypass method
  - Production upgrade path
  - Estimated effort to upgrade

- [x] All bypass code comments follow standard: `# ML_BYPASS: <feature> — <upgrade path>`
- [x] CI lint rule: grep for `ML_BYPASS` and print count in build summary (never fail build on it)

---

## Done When

- Every bypassed feature produces real, usable output (no placeholder responses)
- All bypass points are documented in `BYPASS_REGISTRY.md`
- All bypass code has `# ML_BYPASS:` comments
- The system works end-to-end using only bypassed versions (no "coming soon" dead ends)
