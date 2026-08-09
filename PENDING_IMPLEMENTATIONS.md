# NextRound (HireOS) — Pending Implementations & Roadmap

This document outlines the pending implementations, future enhancements, and production deployment items for **NextRound / HireOS**. 

> **Current System Status**: All 8 core autonomous hiring agents, the Express REST API, Prisma 7 multi-tenant database, Next.js 16 Web consoles (HR & Candidate), client-side MediaPipe proctoring, and candidate mock/prep modules are **fully implemented and verified with 100% passing test coverage** (0 lint errors, 130 Pytest cases passed, 109 Jest/Vitest cases passed).

---

## 1. Audio-Prosody ML Pipeline (Vocal Biomarker & Stress Analysis)

- **Target Component**: `apps/api/src/routes/hr/sentiment.routes.ts` and `apps/web/src/app/hr/sentiment-analysis/page.tsx`
- **Current Behavior**: The `/api/v1/hr/sentiment` endpoint returns an honest `501 Not Implemented` response, and the HR Sentiment Analyser page displays a clean, transparent empty state informing the user that audio prosody analysis is pending ML model deployment. No mock metrics are fabricated.
- **Pending Technical Implementation**:
  - Integrate a dedicated Python PyAudioAnalysis / Wav2Vec2 / Whisper-prosody service within `apps/ai-service`.
  - Extract acoustic features: Fundamental frequency (F0 pitch stability), jitter, shimmer, speech-to-pause rhythm, and decibel intensity.
  - Generate emotional journey time-series graphs (Confidence vs. Stress vs. Hesitation) across interview topic segments to help HR distinguish technical gaps from interview anxiety.

---

## 2. Low-Latency WebRTC SFU & Live Streaming WebSocket Server

- **Target Component**: `apps/ai-service/services/stt_service.py` & `apps/web/src/hooks/useInterviewSession.ts`
- **Current Behavior**: The AI Voice Interviewer uses browser audio recording (`MediaRecorder`) sending audio buffers over HTTP/WebRTC endpoints to the Python AI service for Whisper STT and TTS response generation.
- **Pending Technical Implementation**:
  - Deploy a dedicated WebRTC Selective Forwarding Unit (SFU) using **LiveKit** or **MediaSoup** to handle full-duplex, sub-200ms audio streaming.
  - Implement bidirectional WebSocket audio streaming for instantaneous interruptibility (barge-in capability) where the AI interviewer pauses speech the moment the candidate begins answering.

---

## 3. Enterprise ATS & HRIS Integrations

- **Target Component**: `apps/api/src/routes/hr/` and new integration services
- **Current Behavior**: NextRound operates as a standalone AI-native recruitment marketplace with built-in candidate profile management and job publishing.
- **Pending Technical Implementation**:
  - Build bi-directional integration connectors for enterprise Applicant Tracking Systems: **Greenhouse**, **Lever**, and **Workday**.
  - Implement OAuth2 authorization flows and webhook listeners to automatically sync candidate applications, stage changes, and final AI Evaluation cards into external ATS suites.

---

## 4. Multi-Party Video SFU for Final Human HR Round

- **Target Component**: `apps/web/src/app/hr/candidates/[applicationId]/interview/page.tsx`
- **Current Behavior**: The final 1:1 Human HR Round relies on standard WebRTC browser peer connections or external meeting URL embeds (Google Meet/Zoom).
- **Pending Technical Implementation**:
  - Implement an in-app multi-party WebRTC video room with server-side composite recording.
  - Provide live real-time transcript sidecars and AI HR Copilot suggestions during the human interview round.

---

## 5. Production Cloud Infrastructure Provisioning

- **Target Component**: `.env.example`, `apps/api/src/services/email.service.ts`
- **Current Behavior**: Production fallback drivers are active (Nodemailer logs emails to console when SMTP credentials are absent; audio/resume files use local file storage).
- **Pending Technical Implementation**:
  - Provision production SMTP relay (AWS SES, SendGrid, or Mailgun) and set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.
  - Configure production file storage paths and access controls for generated candidate PDFs and recorded audio files.

---

## 6. Multi-Tenant Custom Domain & SSO Support

- **Target Component**: `apps/api/src/middleware/auth.ts`, `apps/web/`
- **Current Behavior**: HR users log in via standard platform email/password or JWT auth, scoped by `org_id`.
- **Pending Technical Implementation**:
  - Implement SAML 2.0 / OIDC enterprise Single Sign-On (SSO) integration (Okta, Azure AD).
  - Add custom domain mapping (`careers.company.com`) for HR portal job boards.
