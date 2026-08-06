# Checklist 06 — AI Agents: Voice Interview (LangGraph + WebRTC + STT/TTS)

Implement the real-time voice interview pipeline: WebRTC room, Groq Whisper STT, Gemini reasoning, Piper/Coqui TTS, and the Dynamic Conversational Loop Interviewer Agent.

---

## A. Interview Session Setup (Express)

- [x] `POST /api/v1/interviews/:id/consent` — record candidate video consent: `{ videoConsent: true }`
  - Update `Interview.consent_given = true`, `Interview.consent_at = now()`
  - Required before session token issued

- [x] `POST /api/v1/interviews/:id/session-token` — issue WebRTC session credentials
  - Validate consent given
  - Generate ephemeral TURN/STUN credentials (or return ICE server config)
  - Return `{ iceServers, sessionToken, interviewId }`

- [x] `POST /api/v1/interviews/:id/end` — mark interview as ended
  - Update `Interview.ended_at = now()`, `Application.status = 'interview_completed'`
  - Enqueue `evaluation-queue`

- [x] `PATCH /api/v1/interviews/:id/proctoring` — receive periodic MediaPipe telemetry from browser
  - Body: `{ face_count, gaze_centered, engagement_index, multiple_faces_detected }`
  - Append to `Interview.proctor_flags` (append-only JSON array)
  - **NEVER include this data in any scoring payload** — strictly audit-only

---

## B. FastAPI Voice Endpoints (AI Service)

- [x] `POST /api/v1/ai/interview/transcribe` — receive audio chunk (WebM/Opus blob), call Groq Whisper-large-v3, return `{ transcript: string, confidence: float }`
  - Target: < 500ms response

- [x] `POST /api/v1/ai/interview/respond` — main conversational turn endpoint:
  - Body: `{ interviewId, transcript, turnNumber, candidateProfileId, jobId }`
  - Runs LangGraph Dynamic Conversational Loop (see C below)
  - Returns `{ text: string, audioUrl?: string, stage: string, isComplete: bool }`

- [x] `POST /api/v1/ai/interview/tts` — convert AI response text to audio
  - Uses Piper TTS (offline) or Coqui TTS
  - Returns audio stream (WAV/MP3) or upload to S3 and return URL
  - Target: < 500ms for < 100 word responses

---

## C. LangGraph: Dynamic Conversational Loop Interviewer Agent

File: `apps/ai-service/agents/interviewer_agent.py`

### State Schema
```python
InterviewerState:
  interview_id: str
  job_rubric: dict           # dimension weights
  candidate_resume: str      # parsed resume text
  conversation_history: list # [{role, content, turn}]
  current_stage: str         # intro | technical | behavioral | project | closing
  scores_so_far: dict        # dimension → running score
  turn_number: int
  is_complete: bool
  follow_up_depth: int       # how many follow-ups on current topic
  evasion_flags: list        # questions where candidate evaded
```

### LangGraph Nodes
- [x] `Node: load_context` — fetch job rubric + candidate resume from state; initialize stage = `intro`
- [x] `Node: evaluate_last_answer` — Gemini grades last answer against rubric dimension (0–10 score, completeness, technical depth, evasion detection)
- [x] `Node: decide_next_action` — conditional edge logic:
  - If answer incomplete/evasive AND `follow_up_depth < 2` → `follow_up`
  - If stage complete → `advance_stage`
  - If `turn_number >= 20` OR all stages done → `close_interview`
- [x] `Node: generate_question` — Gemini generates organic next question for current stage
- [x] `Node: generate_follow_up` — Gemini generates targeted follow-up probing evasion/incompleteness
- [x] `Node: advance_stage` — transition to next stage, reset `follow_up_depth`
- [x] `Node: close_interview` — generate closing statement, set `is_complete = True`
- [x] `Node: finalize_scores` — aggregate `scores_so_far` into `interview_score` per rubric dimension

### Conditional Edges
- [x] `evaluate_last_answer` → `decide_next_action`
- [x] `decide_next_action` → `follow_up` | `generate_question` | `close_interview`
- [x] `close_interview` → END

### Gemini Prompt Engineering
- [x] System prompt anchored to job rubric + candidate resume — no generic interview questions
- [x] Explicit instruction: do NOT ask about age, gender, nationality, school prestige, personal life
- [x] Output format: strict JSON `{ question: string, reasoning: string, stage: string, score_update: dict }`

---

## D. WebRTC Frontend (Interview Console)

File: `apps/web/src/app/interview/[interviewId]/page.tsx`
File: `apps/web/src/components/interview/InterviewActiveConsole.tsx`

- [x] On mount: call `POST /api/v1/interviews/:id/consent` → show consent modal first
- [x] Call `POST /api/v1/interviews/:id/session-token` → get ICE config
- [x] Initialize WebRTC peer connection with ICE servers
- [x] Initialize MediaPipe (WebAssembly) for proctoring:
  - Face detection (face_count, multiple faces)
  - Gaze estimation (gaze_centered)
  - Engagement index
  - Send telemetry every 5 seconds to `PATCH /api/v1/interviews/:id/proctoring`
- [x] Start audio capture via `getUserMedia({ audio: true })`
- [x] Voice Activity Detection (VAD): detect speech start/end, segment audio chunks
- [x] On speech end: POST audio blob to `POST /api/v1/ai/interview/transcribe` → show live subtitle
- [x] On transcript received: POST to `POST /api/v1/ai/interview/respond` → receive AI text response
- [x] Pipe AI text to `POST /api/v1/ai/interview/tts` → play audio response via WebAudio API
- [x] Voice status orb states: `Speaking` (candidate) → `Listening` (silence detection) → `Analyzing` (AI processing) → `Idle`
- [x] Fallback: if round-trip latency > 3s, switch to chat-mode input (text box, same API endpoint)
- [x] On interview complete (`isComplete: true`): call `POST /api/v1/interviews/:id/end`

### Proctoring HUD (client-side only)
- [x] Render face detection overlay (green/red bounding box)
- [x] Show engagement index bar
- [x] Warning banner if `multiple_faces_detected = true`
- [x] Warning banner if `gaze_centered = false` for > 5 consecutive readings

---

## E. Interview Transcript Persistence

- [x] `apps/ai-service/workers/interview_worker.py` — pull from `interview-queue`:
  - Assemble full transcript from turn-by-turn records
  - Upload concatenated audio to S3 (`Interview.audio_url`)
  - Store full transcript JSON in `Interview.transcript`
  - Compute final `interview_score` per rubric dimension from agent's `scores_so_far`
  - Callback: `PATCH /api/v1/internal/interviews/:id/result`

- [x] `PATCH /api/v1/internal/interviews/:id/result` — persist final transcript + interview_score + audio_url

---

## F. HR Interview Replay

- [x] `apps/web/src/app/hr/candidates/[applicationId]/interview/page.tsx` — fetch real transcript, render turn-by-turn conversation, audio player for recording, proctoring telemetry timeline
- [x] `GET /api/v1/interviews/:id/transcript` — return transcript array + audio_url + proctor_flags (HR only, org-scoped)

---

## G. HR Video Round Console

- [x] `apps/web/src/app/hr/interview/[applicationId]/page.tsx` — WebRTC video call console for HR
  - HR joins same WebRTC room as candidate via separate peer connection
  - `POST /api/v1/hr/interview/:applicationId/result` — HR submits `{ decision: 'pass' | 'fail', notes }` after call
  - If `pass`: trigger Decision Agent (offer release path)
  - If `fail`: dispatch rejection email immediately

- [x] `apps/web/src/app/candidate/hr-round/[applicationId]/page.tsx` — candidate WebRTC call interface, status-gated (only accessible when `Application.status = 'hr_round_scheduled'`)

---

## Done When

- Full interview loop completes: candidate speaks → transcript appears → AI responds (audio) → next question
- Proctoring HUD shows live face/gaze signals; telemetry stored in `Interview.proctor_flags`
- Voice latency < 1.0s end-to-end on local network
- Fallback to chat mode works when audio round-trip exceeds 3s
- HR can replay interview transcript and audio after completion
- HR video round submit triggers offer or rejection flow
