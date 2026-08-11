# NextRound — Data Dictionary
 
Source: `packages/database/prisma/schema.prisma`
 
---
 
## User
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| email | String | Login email (unique) |
| password_hash | String | Hashed password |
| role | Enum | hr / candidate |
| org_id | UUID | Linked organization |
| profile | Json | Name, avatar, title, etc. |
| created_at | DateTime | Created date |
 
## Organization
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| name | String | Company name |
| logo_url | String | Logo image |
| industry | String | Industry sector |
| size | String | Company size |
| settings | Json | Org settings |
| created_at | DateTime | Created date |
 
## Job
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| org_id | UUID | Owning organization |
| title | String | Job title |
| description | Text | Job description |
| rubric | Json | Evaluation rubric |
| thresholds | Json | Pass/fail thresholds |
| status | Enum | draft/published/active/paused/closed/deleted |
| location | String | Job location |
| salary | String | Salary range |
| experienceLevel | String | Experience required |
| department | String | Department |
| skills | Json | Required skills |
| stages | Json | Pipeline stages |
| assessmentConfig | Json | Assessment setup |
| embedding | Vector | AI embedding for matching |
| created_at | DateTime | Created date |
 
## CandidateProfile
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | Linked user |
| full_name | String | Candidate name |
| headline | String | Professional headline |
| phone | String | Phone number |
| location | String | Location |
| resume_url | String | Resume file |
| raw_resume_text | Text | Extracted resume text |
| parsed_resume | Json | AI-parsed resume |
| linkedin_url | String | LinkedIn link |
| github_url | String | GitHub link |
| portfolio_url | String | Portfolio link |
| bio | Text | Bio |
| skills | Json | Skills list |
| target_roles | Json | Desired roles |
| years_of_experience | Float | Experience (years) |
| work_mode | String | Remote/hybrid/onsite |
| current_ctc | Int | Current salary |
| expected_salary | Int | Expected salary |
| notice_period | String | Notice period |
| work_authorization | String | Visa/work status |
| resume_embedding | Vector | AI embedding for search |
| settings | Json | Candidate preferences |
| created_at | DateTime | Created date |
 
## Application
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| candidate_id | UUID | Applicant |
| job_id | UUID | Job applied to |
| status | Enum | Pipeline stage (applied → offered/rejected/etc.) |
| hr_round_status | Enum | pending/scheduled/passed/failed |
| hr_round_scheduled_at | DateTime | HR round scheduled time |
| hr_round_completed_at | DateTime | HR round completed time |
| applied_at | DateTime | Applied date |
 
## Evaluation
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| application_id | UUID | Related application |
| stage | String | Pipeline stage evaluated |
| resume_score | Float | Resume score |
| interview_score | Float | Interview score |
| aptitude_score | Float | Aptitude score |
| coding_score | Float | Coding score |
| composite_score | Float | Overall score |
| bias_flag | Boolean | Bias detected? |
| decision | Enum | hire/reject/hold_for_review |
| reasoning | Text | Decision explanation |
| created_at | DateTime | Created date |
 
## Interview
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| application_id | UUID | Related application |
| scheduled_at | DateTime | Interview time |
| transcript | Json | Interview transcript |
| audio_url | String | Recording |
| proctor_flags | Json | Cheating flags |
| sentiment_report | Json | Sentiment analysis |
| status | Enum | scheduled/in_progress/completed/cancelled |
| created_at | DateTime | Created date |
 
## Assessment
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| application_id | UUID | Related application (if real job) |
| session_id | UUID | Related mock session (if practice) |
| test_type | Enum | aptitude/coding |
| questions | Json | Question set |
| responses | Json | Candidate answers |
| score | Float | Overall score |
| status | Enum | pending/in_progress/completed/expired |
| created_at | DateTime | Created date |
 
## AptitudeQuestion
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| category | String | Question category |
| difficulty | String | easy/medium/hard |
| question | Text | Question text |
| options | Json | 4 answer choices |
| correct_index | Int | Correct answer (server-only) |
| is_active | Boolean | In use? |
 
## CodingProblem
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| slug | String | Unique code |
| title | String | Problem title |
| description | Text | Problem statement |
| difficulty | String | Difficulty level |
| category | String | Topic (Arrays, Trees, etc.) |
| starter_code | Json | Starter code per language |
| public_tests / hidden_tests | Json | Test cases |
| is_active | Boolean | In use? |
 
## CodingSubmission
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| application_id | UUID | Related application |
| problem_id | UUID | Problem attempted |
| language | String | Language used |
| code | Text | Submitted code |
| test_results | Json | Test outcomes |
| pass_rate_percent | Float | % tests passed |
| execution_time_ms | Int | Runtime |
| ai_feedback | Text | AI feedback on code |
| status | String | Submission status |
| created_at | DateTime | Submitted date |
 
## GeneratedQuestionChunk
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| assessment_id | UUID | Parent assessment |
| chunk_index | Int | Chunk order |
| questions | Json | AI-generated questions |
| created_at | DateTime | Created date |
 
## CodingProblemSnapshot
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| session_id | UUID | Mock session |
| title / description | String/Text | Problem content |
| difficulty | String | Difficulty level |
| public_test_cases / hidden_test_cases | Json | Test cases |
| starter_code | Json | Starter code |
| created_at | DateTime | Created date |
 
## Offer
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| application_id | UUID | Related application |
| role_title | String | Offered role |
| salary | Int | Offered salary |
| status | Enum | pending/accepted/declined/expired |
| offer_letter_content | Text | Offer letter |
| valid_until | DateTime | Expiry date |
| created_at | DateTime | Created date |
 
## AgentLog
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| job_id / org_id | UUID | Related job/org |
| agent_name | String | AI agent name |
| action | String | Action performed |
| status | Enum | running/completed/failed |
| error | Text | Error message |
| created_at | DateTime | Created date |
 
## MockSession
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| candidate_id | UUID | Practicing candidate |
| target_company | String | Practice target company |
| target_role | String | Practice target role |
| status | String | Session lifecycle state |
| current_section | String | Current section |
| final_score | Float | Final score |
| final_feedback | Json | Final feedback |
| created_at | DateTime | Created date |
 
## PrepContent
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| company_name | String | Target company |
| role_archetype | String | Target role type |
| questions | Json | Sample interview questions |
| culture_notes | Text | Culture info |
| updated_at | DateTime | Last updated |
 
## Notification
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | Recipient |
| title | String | Notification title |
| message | Text | Notification body |
| read | Boolean | Read status |
| created_at | DateTime | Sent date |
 
## TalentBookmark
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| org_id | UUID | Bookmarking org |
| candidate_id | UUID | Bookmarked candidate |
| job_id | UUID | Related job |
| notes | Text | Recruiter notes |
| created_at | DateTime | Bookmarked date |
 
## ProctoringSession
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| candidate_id | UUID | Monitored candidate |
| session_type | String | aptitude/coding/interview |
| status | String | active/paused/ended |
| started_at / ended_at | DateTime | Session window |
| created_at | DateTime | Created date |
 
## ProctoringEvent
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| proctoring_session_id | UUID | Parent session |
| kind | String | tab_hidden, fullscreen_exit, heartbeat, etc. |
| severity | String | info/warning/low/medium/high |
| client_timestamp | DateTime | Event time |
| created_at | DateTime | Logged date |
 
## ProctoringViolation
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| proctoring_session_id | UUID | Parent session |
| rule_code | String | Violation rule triggered |
| severity | String | low/medium/high |
| occurrence_count | Int | Times triggered |
| status | String | Review status |
| created_at | DateTime | Created date |
 
---
 
## Enums
 
| Enum | Values |
|---|---|
| UserRole | hr, candidate |
| JobStatus | draft, published, active, paused, closed, deleted |
| ApplicationStatus | applied, screening, screening_completed, assessment, interview_scheduled, interviewed, evaluation, hr_round, decided, offered, accepted, rejected, withdrawn |
| HrRoundStatus | pending, scheduled, passed, failed |
| EvaluationDecision | hire, reject, hold_for_review |
| InterviewStatus | scheduled, in_progress, completed, cancelled |
| AssessmentType | aptitude, coding |
| AssessmentStatus | pending, in_progress, completed, expired |
| OfferStatus | pending, accepted, declined, expired |
| AgentStatus | running, completed, failed |
