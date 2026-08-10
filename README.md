# NextRound / HireOS 🚀

> **AI-Native Recruitment Marketplace & Zero-Human-Step Hiring Pipeline**

NextRound (HireOS) is an autonomous, end-to-end recruitment marketplace and candidate preparation platform. It automates the entire hiring pipeline—from job description generation and multi-channel sourcing to resume screening, aptitude assessments, isolated code execution, real-time WebRTC voice interviews, and automated offer letter generation—while providing candidates with an interactive AI prep and mock interview studio.

---

## 📐 Monorepo Architecture

The repository is organized as a Turborepo monorepo:

```
NextRound/
├── apps/
│   ├── web/                # Next.js 16 App Router (Public Portal, Candidate Portal, HR Dashboard, Voice Console)
│   ├── api/                # Express.js 5 REST API & BullMQ Job Producers
│   └── ai-service/         # Python FastAPI 0.139 + LangGraph Orchestration Engine
├── packages/
│   ├── database/           # Prisma ORM 7 Schema & PostgreSQL Client Export
│   ├── shared/             # Shared TypeScript Types, Enums, Zod Schemas & API Contracts
│   └── config/             # Workspace ESLint, TypeScript, and Tailwind Configurations
├── docs/                   # Full Technical Specifications (PRD, Architecture, API, Schema, Agents)
└── .checklist/             # Feature Implementation Checklist & Specifications
```

---

## 🛠️ Stack & Technologies

- **Frontend**: Next.js 16.2 (App Router), React 19, TypeScript 6.0, Tailwind CSS 4.3, Lucide React, WebRTC, MediaPipe (Client-side Computer Vision).
- **Backend API**: Express.js 5.2, TypeScript 6.0, Zod 4.4, Prisma ORM 7.9, PostgreSQL 16 with `pgvector`, Custom JWT, BullMQ 5.80.
- **AI Engine**: Python 3.13 / 3.12, FastAPI 0.139, LangGraph, Gemini API (`google-genai` SDK v2.10), Groq API v1.5 (Whisper-large-v3 STT), Piper/Coqui TTS.
- **Infrastructure & Queues**: Turborepo 2.10, Redis 8, Native File Storage, Nodemailer.

---

## ✨ Key Features & Autonomous Agents

### 🤖 8 Core Autonomous Hiring Agents
1. **JD Parser Agent**: Converts raw hiring manager prompts into structured markdown job descriptions and dynamic rubric weights.
2. **Sourcing Agent**: Matches candidate profiles using `pgvector` semantic embedding similarity and dispatches outreach.
3. **Screening Agent**: Evaluates uploaded candidate resumes against job rubrics and extracts skill gaps.
4. **Assessment Agent**: Evaluates aptitude test responses, measures category scores, and records proctoring tab switches.
5. **Coding Sandbox Agent**: Executes candidate Python code inside an isolated subprocess sandbox with 256MB memory cap and 10s execution timeout.
6. **Voice Interviewer Agent**: Conducts multi-turn WebRTC voice interviews with dynamic follow-ups, shallow answer detection, and stage transitions.
7. **Decision & Offer Agent**: Aggregates composite agent scores, generates final decision verdicts (Shortlist / Reject / Offer), and drafts SVG signed offer letters.

### 🎙️ Candidate Practice & Prep Studio
- **AI Voice Resume Builder**: Conversational stage-by-stage voice session generating ATS-optimized markdown & PDF resumes via ReportLab.
- **AI Mock Interviewer**: Interactive practice interview simulator featuring real-time coaching tips (STAR framework, metric quantification).
- **Interactive Voice Assessment Console**: Features voice status orb (`Speaking`, `Listening`, `Analyzing`, `Idle`), live subtitles, and proctoring telemetry HUD.

---

## 🔒 Security & Multi-Tenancy (RBAC)

- **Strict Multi-Tenancy**: Organization data is strictly isolated using JWT-derived `org_id`. HR routes explicitly reject any attempt to pass `org_id` in request body or query parameters (`403 Forbidden`).
- **Proctoring Signal Isolation**: Client-side MediaPipe gaze tracking and face detection signals are logged strictly for HR audit. A programmatic assertion node (`validate_isolation`) raises `ScoringIsolationError` if proctoring signals leak into AI scoring prompts.

---

## ⚙️ Prerequisites

Before setting up NextRound, ensure you have installed:

- **Node.js**: v20.x or v22.x
- **npm**: v10.x+
- **Python**: v3.12 or v3.13
- **PostgreSQL**: v16+ (with `pgvector` extension enabled)
- **Redis**: v7+ or v8+ (running on `localhost:6379`)

---

## 🚀 Setup & Installation

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/Pratham200Rajbhar/NextRound.git
cd NextRound

# Install all monorepo dependencies
npm install
```

### 2. Configure Environment Variables (`.env`)

Create a `.env` file at the root directory (or update existing `.env`):

```env
# PostgreSQL Database
DATABASE_URL="postgresql://postgres:apple@localhost:5432/nextround?schema=public"

# Redis Queue
REDIS_URL="redis://localhost:6379"

# API & Auth Secrets (Must be at least 32 characters)
JWT_SECRET="super_secret_jwt_key_nextround_hireos_2026_production_secure_min32chars"
INTERNAL_SERVICE_SECRET="internal_service_secret_nextround_hireos_2026_production_key_32chars"

# LLM & Voice API Keys
GEMINI_API_KEY="your_gemini_api_key_here"
GROQ_API_KEY="your_groq_api_key_here"

# Services Ports & Base URLs
PORT=4000
AI_SERVICE_URL="http://localhost:8000"
EXPRESS_API_BASE_URL="http://localhost:4000/api/v1"

# Frontend Configuration
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
NEXT_PUBLIC_AI_SERVICE_URL="http://localhost:8000"
```

### 3. Setup Database Schema & Seed Data

Ensure PostgreSQL is running and database `nextround` exists:

```bash
# Create database extension pgvector if needed
psql -U postgres -d nextround -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run Prisma migrations & generate Prisma Client
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Setup Python AI Service Virtual Environment

```bash
cd apps/ai-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

cd ../..
```

---

## 💻 Running the Application

You can launch all monorepo applications concurrently using Turborepo:

```bash
# Start Web (Port 3000), API (Port 4000), and AI Service (Port 8000)
npm run dev
```

Alternatively, you can run services individually:

- **Frontend Web Portal**:
  ```bash
  npm run dev --workspace=nextround-frontend
  # Access at http://localhost:3000
  ```

- **Express REST API**:
  ```bash
  npm run dev --workspace=@nextround/api
  # Access at http://localhost:4000/api/v1
  ```

- **Python AI Service**:
  ```bash
  cd apps/ai-service
  source venv/bin/activate
  uvicorn main:app --reload --port 8000
  # Access documentation at http://localhost:8000/docs
  ```

---

## 🧪 Verification & Testing

NextRound includes comprehensive unit and integration test suites across all packages (105+ unit tests):

```bash
# Run tests across entire monorepo
npm run test

# Run individual test suites
npm run test --workspace=@nextround/shared      # Shared Zod Schemas Vitest Suite (20 tests)
npm run test --workspace=nextround-frontend     # Web Utilities Vitest Suite (11 tests)
npm run test --workspace=@nextround/api          # Express API Jest Suite (29 tests)

# Run Python AI Service Pytest Suite
cd apps/ai-service
python3 -m pytest                                # AI Service Pytest Suite (45 tests)
```

To run linting and typechecks:

```bash
npm run lint
npm run build
```

---

## 📚 Technical Documentation & Specs

Detailed technical specifications are located in the `docs/` folder:

- [`docs/prd.md`](docs/prd.md): Product Requirements Document & Feature Specs.
- [`docs/architecture.md`](docs/architecture.md): System Architecture, Data Flow & Security Boundaries.
- [`docs/api.md`](docs/api.md): Complete REST API Specification & Payloads.
- [`docs/schema.md`](docs/schema.md): Database ERD & Prisma Models.
- [`docs/agents.md`](docs/agents.md): LangGraph Specs for all 8 Autonomous Agents.
- [`docs/screens.md`](docs/screens.md): Wireframes & Screen Component Inventory.

---

## 📄 License

MIT License © 2026 NextRound / HireOS Team.
