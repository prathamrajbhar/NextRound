-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('hr', 'candidate');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('draft', 'published', 'active', 'paused', 'closed', 'deleted');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('applied', 'screening', 'screening_completed', 'assessment', 'interview_scheduled', 'interviewed', 'evaluation', 'hr_round', 'decided', 'offered', 'accepted', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "HrRoundStatus" AS ENUM ('pending', 'scheduled', 'passed', 'failed');

-- CreateEnum
CREATE TYPE "EvaluationDecision" AS ENUM ('hire', 'reject', 'hold_for_review');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('aptitude', 'coding');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('pending', 'in_progress', 'completed', 'expired');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "SocialSource" AS ENUM ('github', 'linkedin');

-- CreateEnum
CREATE TYPE "SocialSyncStatus" AS ENUM ('pending', 'synced', 'failed', 'not_found', 'removed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "org_id" TEXT,
    "reset_token_hash" TEXT,
    "reset_token_expiry" TIMESTAMP(3),
    "profile" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rubric" JSONB NOT NULL DEFAULT '{}',
    "thresholds" JSONB NOT NULL DEFAULT '{}',
    "status" "JobStatus" NOT NULL DEFAULT 'draft',
    "location" TEXT,
    "salary" TEXT,
    "experienceLevel" TEXT,
    "department" TEXT,
    "skills" JSONB,
    "stages" JSONB,
    "assessmentConfig" JSONB,
    "embedding" vector(768),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT,
    "headline" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "timezone" TEXT,
    "avatar_url" TEXT,
    "resume_url" TEXT,
    "raw_resume_text" TEXT,
    "parsed_resume" JSONB NOT NULL DEFAULT '{}',
    "social_data" JSONB NOT NULL DEFAULT '{}',
    "linkedin_url" TEXT,
    "github_url" TEXT,
    "portfolio_url" TEXT,
    "bio" TEXT,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "target_roles" JSONB NOT NULL DEFAULT '[]',
    "years_of_experience" DOUBLE PRECISION,
    "work_mode" TEXT,
    "current_ctc" INTEGER,
    "target_locations" JSONB NOT NULL DEFAULT '[]',
    "expected_salary" INTEGER,
    "notice_period" TEXT,
    "work_authorization" TEXT,
    "proud_project" TEXT,
    "work_values" JSONB NOT NULL DEFAULT '[]',
    "availability" JSONB NOT NULL DEFAULT '{}',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "resume_embedding" vector(768),
    "data_consent" BOOLEAN NOT NULL DEFAULT false,
    "data_consent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialProfileSync" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "source" "SocialSource" NOT NULL,
    "username" TEXT NOT NULL,
    "status" "SocialSyncStatus" NOT NULL DEFAULT 'pending',
    "raw_data" JSONB,
    "normalized_data" JSONB,
    "error" TEXT,
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialProfileSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateEmbedding" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(768) NOT NULL,
    "content_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'applied',
    "hr_round_status" "HrRoundStatus",
    "hr_round_scheduled_at" TIMESTAMP(3),
    "hr_round_completed_at" TIMESTAMP(3),
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "resume_score" DOUBLE PRECISION,
    "interview_score" DOUBLE PRECISION,
    "aptitude_score" DOUBLE PRECISION,
    "coding_score" DOUBLE PRECISION,
    "composite_score" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "decision" "EvaluationDecision",
    "reasoning" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "transcript" JSONB,
    "audio_url" TEXT,
    "proctor_flags" JSONB,
    "engagement_signal" JSONB,
    "sentiment_report" JSONB,
    "status" "InterviewStatus" NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "application_id" TEXT,
    "session_id" TEXT,
    "test_type" "AssessmentType" NOT NULL,
    "questions" JSONB NOT NULL,
    "responses" JSONB,
    "score" DOUBLE PRECISION,
    "category_breakdown" JSONB,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'pending',
    "question_schema_version" INTEGER NOT NULL DEFAULT 1,
    "current_chunk_index" INTEGER NOT NULL DEFAULT 0,
    "total_question_count" INTEGER NOT NULL DEFAULT 0,
    "chunk_submissions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AptitudeQuestion" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct_index" INTEGER NOT NULL,
    "explanation" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AptitudeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingProblem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT NOT NULL DEFAULT 'Data Structures',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starter_code" JSONB NOT NULL DEFAULT '{}',
    "entry_point" TEXT NOT NULL DEFAULT 'solution',
    "param_schema" JSONB NOT NULL DEFAULT '[]',
    "return_type" TEXT NOT NULL DEFAULT 'any',
    "public_tests" JSONB NOT NULL DEFAULT '[]',
    "hidden_tests" JSONB NOT NULL DEFAULT '[]',
    "reference_solution" JSONB,
    "seed" TEXT,
    "checksum" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodingProblem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingSubmission" (
    "id" TEXT NOT NULL,
    "application_id" TEXT,
    "candidate_id" TEXT,
    "problem_id" TEXT,
    "problem_snapshot_id" TEXT,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "idempotency_key" TEXT,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "test_results" JSONB NOT NULL DEFAULT '[]',
    "pass_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pass_rate_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pass_rate_ratio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "execution_time_ms" INTEGER,
    "memory_mb" DOUBLE PRECISION,
    "memory_kb" INTEGER,
    "complexity_score" DOUBLE PRECISION,
    "status" TEXT DEFAULT 'created',
    "complexity" TEXT,
    "ai_feedback" TEXT,
    "stdout_stderr" TEXT,
    "code_hash" TEXT,
    "runner_version" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "CodingSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedQuestionChunk" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "chunk_size" INTEGER NOT NULL,
    "question_ids" JSONB NOT NULL DEFAULT '[]',
    "questions" JSONB NOT NULL,
    "prompt_version" TEXT NOT NULL DEFAULT 'v1',
    "generation_seed" TEXT,
    "content_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedQuestionChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingProblemSnapshot" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT,
    "session_id" TEXT NOT NULL,
    "problem_id" TEXT,
    "slug" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT,
    "entry_point" TEXT NOT NULL DEFAULT 'solution',
    "parameter_schema" JSONB NOT NULL DEFAULT '[]',
    "return_type" TEXT NOT NULL DEFAULT 'any',
    "public_test_cases" JSONB NOT NULL DEFAULT '[]',
    "hidden_test_cases" JSONB NOT NULL DEFAULT '[]',
    "starter_code" JSONB NOT NULL DEFAULT '{}',
    "reference_solution_hash" TEXT,
    "problem_version" INTEGER NOT NULL DEFAULT 1,
    "content_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodingProblemSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "role_title" TEXT NOT NULL,
    "salary" INTEGER NOT NULL,
    "equity" TEXT,
    "start_date" TIMESTAMP(3),
    "status" "OfferStatus" NOT NULL DEFAULT 'pending',
    "signature_svg" TEXT,
    "offer_letter_content" TEXT,
    "magic_link_token" TEXT,
    "valid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentLog" (
    "id" TEXT NOT NULL,
    "job_id" TEXT,
    "org_id" TEXT,
    "agent_name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "status" "AgentStatus" NOT NULL DEFAULT 'running',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockSession" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "target_company" TEXT NOT NULL,
    "target_role" TEXT NOT NULL,
    "difficulty" TEXT,
    "type" TEXT NOT NULL DEFAULT 'mock',
    "status" TEXT NOT NULL DEFAULT 'created',
    "current_section" TEXT NOT NULL DEFAULT 'aptitude',
    "generation_seed" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "final_score" DOUBLE PRECISION,
    "final_feedback" JSONB,
    "topic" TEXT,
    "focus_areas" JSONB,
    "rubric" JSONB,
    "transcript" JSONB,
    "score" DOUBLE PRECISION,
    "feedback" JSONB,
    "generated_resume" JSONB,
    "resume_pdf_url" TEXT,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrepContent" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "role_archetype" TEXT NOT NULL,
    "job_id" TEXT,
    "org_id" TEXT,
    "questions" JSONB NOT NULL,
    "culture_notes" TEXT,
    "skill_checklist" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrepContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentBookmark" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "job_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalentBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProctoringSession" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "assessment_id" TEXT,
    "application_id" TEXT,
    "mock_session_id" TEXT,
    "session_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "policy_version" TEXT NOT NULL,
    "consent_version" TEXT NOT NULL,
    "recording_url" TEXT,
    "recording_duration_ms" INTEGER,
    "recording_size_bytes" INTEGER,
    "risk_score" DOUBLE PRECISION,
    "summary_json" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "last_heartbeat_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProctoringSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProctoringEvidence" (
    "id" TEXT NOT NULL,
    "proctoring_session_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size_bytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProctoringEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProctoringEvent" (
    "id" TEXT NOT NULL,
    "proctoring_session_id" TEXT NOT NULL,
    "client_event_id" TEXT NOT NULL,
    "client_sequence" INTEGER NOT NULL,
    "server_sequence" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "client_timestamp" TIMESTAMP(3) NOT NULL,
    "server_received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_elapsed_ms" INTEGER NOT NULL,
    "payload_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProctoringEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProctoringViolation" (
    "id" TEXT NOT NULL,
    "proctoring_session_id" TEXT NOT NULL,
    "rule_code" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "occurrence_count" INTEGER NOT NULL DEFAULT 1,
    "first_seen_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "reviewer_id" TEXT,
    "review_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProctoringViolation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebRTCSignal" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "message" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebRTCSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_org_id_idx" ON "User"("org_id");

-- CreateIndex
CREATE INDEX "User_reset_token_hash_idx" ON "User"("reset_token_hash");

-- CreateIndex
CREATE INDEX "Job_org_id_idx" ON "Job"("org_id");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_user_id_key" ON "CandidateProfile"("user_id");

-- CreateIndex
CREATE INDEX "CandidateProfile_user_id_idx" ON "CandidateProfile"("user_id");

-- CreateIndex
CREATE INDEX "SocialProfileSync_candidate_id_idx" ON "SocialProfileSync"("candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "SocialProfileSync_candidate_id_source_key" ON "SocialProfileSync"("candidate_id", "source");

-- CreateIndex
CREATE INDEX "CandidateEmbedding_candidate_id_idx" ON "CandidateEmbedding"("candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateEmbedding_candidate_id_source_type_section_key" ON "CandidateEmbedding"("candidate_id", "source_type", "section");

-- CreateIndex
CREATE INDEX "Application_job_id_idx" ON "Application"("job_id");

-- CreateIndex
CREATE INDEX "Application_candidate_id_idx" ON "Application"("candidate_id");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Application_candidate_id_job_id_key" ON "Application"("candidate_id", "job_id");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_application_id_key" ON "Evaluation"("application_id");

-- CreateIndex
CREATE INDEX "Evaluation_application_id_idx" ON "Evaluation"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "Interview_application_id_key" ON "Interview"("application_id");

-- CreateIndex
CREATE INDEX "Interview_application_id_idx" ON "Interview"("application_id");

-- CreateIndex
CREATE INDEX "Assessment_application_id_idx" ON "Assessment"("application_id");

-- CreateIndex
CREATE INDEX "Assessment_session_id_idx" ON "Assessment"("session_id");

-- CreateIndex
CREATE INDEX "AptitudeQuestion_category_difficulty_is_active_idx" ON "AptitudeQuestion"("category", "difficulty", "is_active");

-- CreateIndex
CREATE INDEX "AptitudeQuestion_is_active_idx" ON "AptitudeQuestion"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "CodingProblem_slug_key" ON "CodingProblem"("slug");

-- CreateIndex
CREATE INDEX "CodingProblem_slug_idx" ON "CodingProblem"("slug");

-- CreateIndex
CREATE INDEX "CodingProblem_difficulty_is_active_idx" ON "CodingProblem"("difficulty", "is_active");

-- CreateIndex
CREATE INDEX "CodingProblem_is_active_idx" ON "CodingProblem"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "CodingSubmission_idempotency_key_key" ON "CodingSubmission"("idempotency_key");

-- CreateIndex
CREATE INDEX "CodingSubmission_application_id_idx" ON "CodingSubmission"("application_id");

-- CreateIndex
CREATE INDEX "CodingSubmission_candidate_id_idx" ON "CodingSubmission"("candidate_id");

-- CreateIndex
CREATE INDEX "CodingSubmission_problem_id_idx" ON "CodingSubmission"("problem_id");

-- CreateIndex
CREATE INDEX "CodingSubmission_problem_snapshot_id_idx" ON "CodingSubmission"("problem_snapshot_id");

-- CreateIndex
CREATE INDEX "CodingSubmission_idempotency_key_idx" ON "CodingSubmission"("idempotency_key");

-- CreateIndex
CREATE INDEX "CodingSubmission_status_idx" ON "CodingSubmission"("status");

-- CreateIndex
CREATE INDEX "GeneratedQuestionChunk_assessment_id_idx" ON "GeneratedQuestionChunk"("assessment_id");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedQuestionChunk_assessment_id_chunk_index_key" ON "GeneratedQuestionChunk"("assessment_id", "chunk_index");

-- CreateIndex
CREATE INDEX "CodingProblemSnapshot_session_id_idx" ON "CodingProblemSnapshot"("session_id");

-- CreateIndex
CREATE INDEX "CodingProblemSnapshot_assessment_id_idx" ON "CodingProblemSnapshot"("assessment_id");

-- CreateIndex
CREATE UNIQUE INDEX "CodingProblemSnapshot_session_id_key" ON "CodingProblemSnapshot"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_application_id_key" ON "Offer"("application_id");

-- CreateIndex
CREATE INDEX "Offer_application_id_idx" ON "Offer"("application_id");

-- CreateIndex
CREATE INDEX "Offer_magic_link_token_idx" ON "Offer"("magic_link_token");

-- CreateIndex
CREATE INDEX "AgentLog_job_id_idx" ON "AgentLog"("job_id");

-- CreateIndex
CREATE INDEX "AgentLog_org_id_idx" ON "AgentLog"("org_id");

-- CreateIndex
CREATE INDEX "AgentLog_agent_name_idx" ON "AgentLog"("agent_name");

-- CreateIndex
CREATE INDEX "MockSession_candidate_id_idx" ON "MockSession"("candidate_id");

-- CreateIndex
CREATE INDEX "MockSession_type_idx" ON "MockSession"("type");

-- CreateIndex
CREATE INDEX "MockSession_status_idx" ON "MockSession"("status");

-- CreateIndex
CREATE INDEX "PrepContent_job_id_idx" ON "PrepContent"("job_id");

-- CreateIndex
CREATE INDEX "PrepContent_org_id_idx" ON "PrepContent"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "PrepContent_company_name_role_archetype_key" ON "PrepContent"("company_name", "role_archetype");

-- CreateIndex
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "TalentBookmark_org_id_idx" ON "TalentBookmark"("org_id");

-- CreateIndex
CREATE INDEX "TalentBookmark_candidate_id_idx" ON "TalentBookmark"("candidate_id");

-- CreateIndex
CREATE INDEX "TalentBookmark_job_id_idx" ON "TalentBookmark"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "TalentBookmark_org_id_candidate_id_key" ON "TalentBookmark"("org_id", "candidate_id");

-- CreateIndex
CREATE INDEX "ProctoringSession_candidate_id_idx" ON "ProctoringSession"("candidate_id");

-- CreateIndex
CREATE INDEX "ProctoringSession_assessment_id_idx" ON "ProctoringSession"("assessment_id");

-- CreateIndex
CREATE INDEX "ProctoringSession_application_id_idx" ON "ProctoringSession"("application_id");

-- CreateIndex
CREATE INDEX "ProctoringSession_mock_session_id_idx" ON "ProctoringSession"("mock_session_id");

-- CreateIndex
CREATE INDEX "ProctoringEvidence_proctoring_session_id_idx" ON "ProctoringEvidence"("proctoring_session_id");

-- CreateIndex
CREATE INDEX "ProctoringEvidence_kind_idx" ON "ProctoringEvidence"("kind");

-- CreateIndex
CREATE INDEX "ProctoringEvent_proctoring_session_id_idx" ON "ProctoringEvent"("proctoring_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProctoringEvent_proctoring_session_id_client_event_id_key" ON "ProctoringEvent"("proctoring_session_id", "client_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProctoringEvent_proctoring_session_id_server_sequence_key" ON "ProctoringEvent"("proctoring_session_id", "server_sequence");

-- CreateIndex
CREATE INDEX "ProctoringViolation_proctoring_session_id_idx" ON "ProctoringViolation"("proctoring_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProctoringViolation_proctoring_session_id_rule_code_key" ON "ProctoringViolation"("proctoring_session_id", "rule_code");

-- CreateIndex
CREATE INDEX "WebRTCSignal_application_id_idx" ON "WebRTCSignal"("application_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialProfileSync" ADD CONSTRAINT "SocialProfileSync_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEmbedding" ADD CONSTRAINT "CandidateEmbedding_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "MockSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSubmission" ADD CONSTRAINT "CodingSubmission_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSubmission" ADD CONSTRAINT "CodingSubmission_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "CodingProblem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSubmission" ADD CONSTRAINT "CodingSubmission_problem_snapshot_id_fkey" FOREIGN KEY ("problem_snapshot_id") REFERENCES "CodingProblemSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedQuestionChunk" ADD CONSTRAINT "GeneratedQuestionChunk_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingProblemSnapshot" ADD CONSTRAINT "CodingProblemSnapshot_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "MockSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingProblemSnapshot" ADD CONSTRAINT "CodingProblemSnapshot_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentLog" ADD CONSTRAINT "AgentLog_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentLog" ADD CONSTRAINT "AgentLog_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockSession" ADD CONSTRAINT "MockSession_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepContent" ADD CONSTRAINT "PrepContent_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepContent" ADD CONSTRAINT "PrepContent_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentBookmark" ADD CONSTRAINT "TalentBookmark_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentBookmark" ADD CONSTRAINT "TalentBookmark_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentBookmark" ADD CONSTRAINT "TalentBookmark_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctoringSession" ADD CONSTRAINT "ProctoringSession_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctoringSession" ADD CONSTRAINT "ProctoringSession_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctoringSession" ADD CONSTRAINT "ProctoringSession_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctoringSession" ADD CONSTRAINT "ProctoringSession_mock_session_id_fkey" FOREIGN KEY ("mock_session_id") REFERENCES "MockSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctoringEvidence" ADD CONSTRAINT "ProctoringEvidence_proctoring_session_id_fkey" FOREIGN KEY ("proctoring_session_id") REFERENCES "ProctoringSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctoringEvent" ADD CONSTRAINT "ProctoringEvent_proctoring_session_id_fkey" FOREIGN KEY ("proctoring_session_id") REFERENCES "ProctoringSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctoringViolation" ADD CONSTRAINT "ProctoringViolation_proctoring_session_id_fkey" FOREIGN KEY ("proctoring_session_id") REFERENCES "ProctoringSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
