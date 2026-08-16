# NextRound — Complete Database Schema & Entity Specification

All persistent data for NextRound (HireOS) is managed via **PostgreSQL 16** with the **`pgvector` extension** using **Prisma ORM 7.9.0**.

The production schema is located at `packages/database/prisma/schema.prisma`.

---

## 1. Schema Overview & Entity Relationships

```
User ─────────────────────────── Organization
  │                                    │
  ├─ CandidateProfile                  ├─ Job ─────────── Application ─── Interview
  │    └─ MockSession                  │                       │          └─ (proctor_flags)
  │    └─ (resume_url → Storage)       └─ AgentLog             ├─ Evaluation
  │                                                            ├─ Assessment
  │                                                            ├─ CodingSubmission
  │                                                            └─ Offer
PrepContent (platform-wide reference data)
```

---

## 2. Complete `schema.prisma` File

Below is the complete, drop-in Prisma schema definition for `packages/database/prisma/schema.prisma`:

```prisma
// packages/database/prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

enum UserRole {
  hr
  candidate
}

enum JobStatus {
  draft
  active
  paused
  closed
}

enum ApplicationStatus {
  applied
  screening
  screening_completed
  assessment
  interview_scheduled
  interviewed
  evaluation
  hr_round
  decided
  offered
  accepted
  rejected
}

enum HrRoundStatus {
  pending
  scheduled
  passed
  failed
}

enum EvaluationDecision {
  hire
  reject
  hold_for_review
}

enum InterviewStatus {
  scheduled
  in_progress
  completed
  cancelled
}

enum AssessmentType {
  aptitude
  coding
  video
}

enum AssessmentStatus {
  pending
  in_progress
  completed
  expired
}

enum OfferStatus {
  pending
  accepted
  declined
  expired
}

enum AgentStatus {
  running
  completed
  failed
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password_hash String
  role          UserRole
  org_id        String?   // null for candidate users
  created_at    DateTime  @default(now())

  organization      Organization?      @relation(fields: [org_id], references: [id])
  candidate_profile CandidateProfile?

  @@index([email])
  @@index([org_id])
}

model Organization {
  id         String   @id @default(uuid())
  name       String
  logo_url   String?
  industry   String?
  size       String?  // e.g. "1-10", "11-50", "51-200", "201-1000", "1000+"
  settings   Json     @default("{}")
  created_at DateTime @default(now())

  users      User[]
  jobs       Job[]
  agent_logs AgentLog[]
}

model Job {
  id          String    @id @default(uuid())
  org_id      String
  title       String
  description String    @db.Text
  rubric      Json      @default("{}")
  thresholds  Json      @default("{}")
  status      JobStatus @default(draft)
  created_at  DateTime  @default(now())

  organization Organization  @relation(fields: [org_id], references: [id])
  applications Application[]
  agent_logs   AgentLog[]

  @@index([org_id])
  @@index([status])
}

model CandidateProfile {
  id                 String                       @id @default(uuid())
  user_id            String                       @unique
  avatar_url         String?                      // Candidate avatar (preset asset path or base64 data URL)
  resume_url         String?                      // Storage URL to uploaded PDF/DOCX
  linkedin_url       String?
  github_url         String?
  skills             Json                         @default("[]") // string[]
  target_roles       Json                         @default("[]") // string[]
  expected_salary    Int?                         // Annual, USD
  notice_period      String?                      // e.g. "2 weeks", "1 month", "Immediate"
  work_authorization String?                      // e.g. "US Citizen", "H1B", "Requires Sponsorship"
  proud_project      String?                      @db.Text
  work_values        Json                         @default("[]") // string[]
  resume_embedding   Unsupported("vector(768)")?  // pgvector 768-dim (generated from resume text)
  created_at         DateTime                     @default(now())

  user          User          @relation(fields: [user_id], references: [id])
  applications  Application[]
  mock_sessions MockSession[]

  @@index([user_id])
}

model Application {
  id                    String            @id @default(uuid())
  candidate_id          String
  job_id                String
  status                ApplicationStatus @default(applied)
  hr_round_status       HrRoundStatus?
  hr_round_scheduled_at DateTime?
  hr_round_completed_at DateTime?
  applied_at            DateTime          @default(now())

  candidate          CandidateProfile   @relation(fields: [candidate_id], references: [id])
  job                Job                @relation(fields: [job_id], references: [id])
  interview          Interview?
  evaluations        Evaluation[]
  assessments        Assessment[]
  coding_submissions CodingSubmission[]
  offer              Offer?

  @@unique([candidate_id, job_id])
  @@index([job_id])
  @@index([candidate_id])
  @@index([status])
}

model Evaluation {
  id              String              @id @default(uuid())
  application_id  String              @unique
  stage           String              // "screening" | "interview" | "composite"
  resume_score    Float?
  interview_score Float?
  aptitude_score  Float?
  coding_score    Float?
  composite_score Float?
  confidence      Float?              // 0.0 – 1.0
  decision        EvaluationDecision?
  reasoning       String?             @db.Text
  created_at      DateTime            @default(now())


  application Application @relation(fields: [application_id], references: [id])

  @@index([application_id])
}

model Interview {
  id                String          @id @default(uuid())
  application_id    String          @unique
  scheduled_at      DateTime?
  transcript        Json?           // { turns: [{ speaker, text, timestamp_ms }] }
  audio_url         String?         // Storage URL
  proctor_flags     Json?           // periodic CV telemetry snapshots
  engagement_signal Json?           // aggregate engagement metrics
  sentiment_report  Json?           // audio-derived prosody/sentiment report (tone, pitch, speaking rate, pauses, stress, confidence) computed from audio_url only
  video_consent     Boolean         @default(false)
  status            InterviewStatus @default(scheduled)
  created_at        DateTime        @default(now())

  application Application @relation(fields: [application_id], references: [id])

  @@index([application_id])
}

model Assessment {
  id                 String           @id @default(uuid())
  application_id     String
  test_type          AssessmentType
  questions          Json
  responses          Json?
  score              Float?
  category_breakdown Json?            // per-category scores for aptitude
  status             AssessmentStatus @default(pending)
  created_at         DateTime         @default(now())

  application Application @relation(fields: [application_id], references: [id])

  @@index([application_id])
}

model CodingSubmission {
  id                String   @id @default(uuid())
  application_id    String
  language          String   // "javascript" | "typescript" | "python" | "go"
  code              String   @db.Text
  test_results      Json     // per-test pass/fail details
  pass_rate         Float    // 0.0 – 1.0
  execution_time_ms Int?
  memory_mb         Float?
  complexity_score  Float?   // Big-O estimate score
  created_at        DateTime @default(now())

  application Application @relation(fields: [application_id], references: [id])

  @@index([application_id])
}

model Offer {
  id             String      @id @default(uuid())
  application_id String      @unique
  role_title     String
  salary         Int         // Annual, USD
  equity         String?     // e.g. "0.1% - 0.5% over 4 years"
  start_date     DateTime?
  status         OfferStatus @default(pending)
  signature_svg  String?     @db.Text
  valid_until    DateTime?
  created_at     DateTime    @default(now())

  application Application @relation(fields: [application_id], references: [id])

  @@index([application_id])
}

model AgentLog {
  id         String      @id @default(uuid())
  job_id     String?
  org_id     String?
  agent_name String
  action     String
  input      Json?
  output     Json?
  status     AgentStatus @default(running)
  error      String?     @db.Text
  created_at DateTime    @default(now())

  job          Job?          @relation(fields: [job_id], references: [id])
  organization Organization? @relation(fields: [org_id], references: [id])

  @@index([job_id])
  @@index([org_id])
  @@index([agent_name])
}

model MockSession {
  id             String   @id @default(uuid())
  candidate_id   String
  target_company String
  target_role    String
  difficulty     String?  // "entry" | "mid" | "senior" | "staff"
  rubric         Json?
  transcript     Json?
  score          Float?
  feedback       Json?    // { strengths, weaknesses, annotated_transcript }
  created_at     DateTime @default(now())

  candidate CandidateProfile @relation(fields: [candidate_id], references: [id])

  @@index([candidate_id])
}

model PrepContent {
  id             String   @id @default(uuid())
  company_name   String
  role_archetype String
  questions      Json     // [{ question, sample_answer, difficulty, category }]
  culture_notes  String?  @db.Text
  skill_checklist Json?   // string[]
  updated_at     DateTime @updatedAt

  @@unique([company_name, role_archetype])
}
```

---

## 3. Key JSON Payload Structures

### 3.1 `Organization.settings`
```json
{
  "availability_hours": {
    "timezone": "America/New_York",
    "mon": ["09:00", "18:00"],
    "tue": ["09:00", "18:00"],
    "wed": ["09:00", "18:00"],
    "thu": ["09:00", "18:00"],
    "fri": ["09:00", "18:00"]
  },
  "email_templates": {
    "rejection": "Dear {{candidate_name}}, ...",
    "offer": "Dear {{candidate_name}}, ...",
    "scheduling": "Hi {{candidate_name}}, please pick a time..."
  },
  "auto_offer": false,
  "default_thresholds": {
    "screening_min": 60,
    "interview_min": 65,
    "composite_min": 70
  }
}
```

### 3.2 `Job.rubric`
```json
{
  "dimensions": [
    { "name": "Technical Mastery", "weight": 40 },
    { "name": "Problem Solving", "weight": 30 },
    { "name": "Communication", "weight": 30 }
  ],
  "aptitude_enabled": true,
  "coding_enabled": true,
  "auto_offer": false,
  "question_count": 8
}
```

### 3.3 `Job.thresholds`
```json
{
  "screening_min": 60,
  "aptitude_min": 65,
  "coding_min": 60,
  "interview_min": 65,
  "composite_hire": 72,
  "composite_hold": 60
}


### 3.5 `Interview.transcript`
```json
{
  "turns": [
    {
      "speaker": "ai",
      "text": "Tell me about a system you designed at scale.",
      "timestamp_ms": 0
    },
    {
      "speaker": "candidate",
      "text": "At my last role I designed a Redis-backed rate limiter...",
      "timestamp_ms": 4200
    }
  ],
  "duration_ms": 1800000,
  "stage_markers": [
    { "stage": "introduction", "start_ms": 0 },
    { "stage": "core_vetting", "start_ms": 120000 }
  ]
}
```

### 3.6 `Interview.proctor_flags` (CV Telemetry Array)
```json
[
  {
    "timestamp_ms": 30000,
    "face_count": 1,
    "gaze_centered": true,
    "multiple_faces_detected": false,
    "engagement_index": 88
  }
]
```

### 3.7 `Interview.sentiment_report` (Audio-Derived Prosody Report)
Written by the AI sentiment service via `PATCH /api/v1/internal/interviews/:id/sentiment` after interview evaluation. Computed **only** from `Interview.audio_url` (pitch via autocorrelation on decoded PCM, speaking rate/pauses via word-level transcription timings). The stored transcript is never used. Shape:
```json
{
  "interviewId": "uuid",
  "status": "completed",
  "source": "audio",
  "audioUrl": "https://.../interview.webm",
  "overall": {
    "tone": "calm | steady | anxious | stressed",
    "stressScore": 34,
    "confidenceScore": 66,
    "clarityScore": 78
  },
  "audio": {
    "speakingRateWpm": 141.2,
    "avgPauseDurationSec": 1.05,
    "pausesPerMinute": 9.4,
    "longPauseCount": 2,
    "pitchMeanHz": 162.5,
    "pitchStdDevHz": 21.3,
    "tremorPercent": 11,
    "steadyPercent": 89,
    "durationSec": 610.5
  },
  "journey": [
    {
      "timeLabel": "00:00",
      "minute": 0,
      "confidence": 70,
      "stress": 30,
      "hesitation": 18,
      "emotionLabel": "Neutral"
    }
  ],
  "summaryNarrative": "Audio prosody analysis of the candidate's voice detected..."
}
```
When audio is missing, unreachable, or undecodable the report is `{ "status": "unavailable", "reason": "..." }` and is **not** persisted (honest empty state).

---

## 4. `pgvector` Configuration & Cosine Similarity Search

The `pgvector` extension provides native vector similarity search inside PostgreSQL.

### 4.1 Native Extension Enablement
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4.2 HNSW Vector Index Creation
```sql
CREATE INDEX ON "CandidateProfile" USING hnsw (resume_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### 4.3 Cosine Similarity Search Query Example (Screening Agent)
```sql
SELECT cp.id, cp.resume_url, cp.skills,
       1 - (cp.resume_embedding <=> $1::vector) AS similarity_score
FROM "CandidateProfile" cp
JOIN "Application" a ON a.candidate_id = cp.id
WHERE a.job_id = $2
ORDER BY similarity_score DESC
LIMIT 50;
```

Embeddings are **768-dimensional**, generated by the Python AI service using the Gemini embedding model and stored via internal Express callbacks (`/api/v1/internal/*`).

---

## 5. Multi-Tenant Database Security Design

Every HR query in `apps/api` strictly includes an `org_id` filter derived directly from the server-side verified JWT token payload — user-supplied `org_id` values in request bodies or URL parameters are explicitly ignored.

### Express Middleware Enforcement Pattern
```typescript
// middleware/orgScope.ts
import { Request, Response, NextFunction } from "express";

export function requireOrgScope(req: Request, res: Response, next: NextFunction) {
  const orgId = req.jwtPayload?.org_id; // Derived from verified JWT only
  if (!orgId) {
    return res.status(403).json({ success: false, error: { code: "FORBIDDEN" } });
  }
  req.orgId = orgId;
  next();
}

// Handler execution
export async function getOrgJobs(req: Request, res: Response) {
  const jobs = await prisma.job.findMany({
    where: { org_id: req.orgId } // Scoped strictly to verified org_id
  });
  return res.json({ success: true, data: jobs });
}
```

---

## 6. Database Commands & Lifecycle

```bash
# Generate Prisma Client
npx prisma generate --schema=packages/database/prisma/schema.prisma

# Create and apply dev migration
npx prisma migrate dev --schema=packages/database/prisma/schema.prisma --name init

# Deploy migrations in production
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

# Visual Database GUI Browser (Prisma Studio)
npx prisma studio --schema=packages/database/prisma/schema.prisma
```
