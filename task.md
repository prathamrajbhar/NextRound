# Mock Interview Flow — Implementation Checklist

Source of truth: `MOCK_INTERVIEW_FLOW_SPEC.md`. Each item below is a requirement from the spec. Mark `[x]` only after the requirement is implemented **and** verified end-to-end.

Legend:
- **[ ]** = not started
- **[~]** = in progress
- **[x]** = implemented + verified

---

## A. Database model requirements (spec §6)

- [ ] **A1.** `MockSession` has the spec lifecycle fields: `status` (created → in_progress → ... → completed/abandoned), `current_section`, `generation_seed`, `started_at`, `completed_at`, `final_score`, `final_feedback`, plus existing `candidate_id`, `target_role`, `company`, `difficulty`.
- [ ] **A2.** `Assessment` is linked to `session_id` and carries `test_type`, `status`, `question_schema_version`, `questions`, `responses`, `score`, `category_breakdown`, `current_chunk_index`, `total_question_count`.
- [ ] **A3.** `GeneratedQuestionChunk` model exists: `assessment_id`, `chunk_index`, `chunk_size`, `question_ids`, `questions`, `prompt_version`, `generation_seed`, `content_hash`.
- [ ] **A4.** `CodingProblemSnapshot` model exists: `assessment_id`, `problem_id`, `title`, `description`, `entry_point`, `parameter_schema`, `public_test_cases`, `hidden_test_cases`, `reference_solution_hash`, `problem_version`, `content_hash`.
- [ ] **A5.** `CodingSubmission` is linked to `problem_snapshot_id` and `candidate_id`, with statuses `queued|running|passed|failed|compile_error|runtime_error|timeout|memory_limit|cancelled`, plus `pass_rate`, `execution_time_ms`, `memory_kb`, `result_summary`, `runner_version`, `sandbox_image_digest`, `completed_at`.
- [ ] **A6.** `VideoSubmission` model exists: `session_id`, `candidate_id`, `prompt_id`, `video_url`, `duration_seconds`, `status`, `transcript`, `score`, `feedback`, `completed_at`.

## B. Session lifecycle & create/load (spec §3, §5.1)

- [ ] **B1.** `POST /api/v1/mock/sessions` authenticates the candidate, creates a session with `status=created`, `current_section=aptitude`, stores role/company/difficulty/generation_seed/assessment config, and does NOT generate the whole assessment up-front.
- [ ] **B2.** Only one active session per intended workflow (or an explicit restart); refreshing does not create a second session.
- [ ] **B3.** Session status transitions persist: `created → in_progress → aptitude_in_progress → aptitude_completed → coding_in_progress → coding_completed → video_in_progress → video_processing → video_completed → feedback_processing → completed`, plus `abandoned`.
- [ ] **B4.** Candidate cannot access another candidate's session (403).
- [ ] **B5.** A completed session cannot be submitted again.

## C. Aptitude chunk generation (spec §5.2, §5.3, §5.4)

- [ ] **C1.** `GET .../assessment/aptitude/chunk?chunkIndex&chunkSize` validates indices, verifies ownership, returns the stored chunk if it exists, and generates+stores only the requested chunk if missing.
- [ ] **C2.** Chunk is persisted (GeneratedQuestionChunk) BEFORE being returned; refresh returns the same questions with no new AI generation.
- [ ] **C3.** Correct answers (`correctIndex`), explanations, and internal prompts are stripped from every candidate-facing response.
- [ ] **C4.** `hasMore` is computed from the configured total question count (not hardcoded `true`).
- [ ] **C5.** `POST .../assessment/aptitude/chunk` validates answer schema, verifies every question belongs to the requested chunk, saves answers server-side without trusting a client score.
- [ ] **C6.** Duplicate chunk submissions are rejected/idempotent (clientRequestId).
- [ ] **C7.** Concurrent requests for the same next chunk do not duplicate questions (DB locking / idempotency).
- [ ] **C8.** `POST .../assessment/aptitude` loads questions from DB, computes score server-side from stored correct answers, ignores client-supplied score, marks section complete only when all questions answered.
- [ ] **C9.** Downstream evaluation is queued only after the aptitude transaction succeeds.
- [ ] **C10.** Disable/remove the non-chunk aptitude endpoint for the mock path (spec §10.1) or keep it strictly for non-mock application assessments.

## D. Coding problem & submission (spec §5.5, §5.6, §5.7)

- [ ] **D1.** `GET .../assessment/coding` generates the problem once per session, persists a full `CodingProblemSnapshot`, and returns the same snapshot on refresh.
- [ ] **D2.** Hidden tests are stored server-only and never returned to the browser; public tests returned without hidden inputs/expected outputs.
- [ ] **D3.** Exact entry point and parameter schema are persisted.
- [ ] **D4.** `POST .../assessment/coding` rejects client-provided test cases/expected outputs; validates language, code size, and submission limits; loads the exact persisted snapshot.
- [ ] **D5.** Submission creates a `CodingSubmission(status=queued)` and queues exactly one execution job; returns a submission ID.
- [ ] **D6.** Duplicate submissions with the same idempotency key create one submission.
- [ ] **D7.** `GET .../assessment/coding/{submissionId}` verifies ownership, returns safe status/messages only (no hidden tests), supports statuses `queued|running|passed|failed|compile_error|runtime_error|timeout|memory_limit|cancelled`.

## E. Sandbox isolation (spec §1, §2, §9)

- [ ] **E1.** Code executes only in an isolated sandbox worker, never host-level in the API process (spec §10.5).
- [ ] **E2.** Network access disabled in sandbox.
- [ ] **E3.** Secrets/env unavailable in sandbox.
- [ ] **E4.** CPU, memory, process, filesystem, and output limits work.
- [ ] **E5.** Compile errors, runtime errors, wrong answers, and timeouts are recorded with the right statuses.
- [ ] **E6.** C++/Java runners actually run the candidate's test cases (current C++ runner just prints "Passed", Java just compiles).
- [ ] **E7.** Infinite-loop submissions terminate with `timeout`.

## F. Video prompts & submission (spec §5.8, §5.9)

- [ ] **F1.** `GET .../assessment/video-prompts` persists prompts once per session; refresh does not regenerate.
- [ ] **F2.** Prompts validated (count, length, category, role relevance) and AI-generated (every question AI-generated per spec §10.7) — or prompts sourced from a persisted, validated generator.
- [ ] **F3.** `POST .../assessment/video` verifies uploaded object belongs to candidate, validates duration/type, saves metadata before queueing, queues transcription+evaluation asynchronously (no request blocking).
- [ ] **F4.** VideoSubmission status is visible (transcription/evaluation progress), results stored.
- [ ] **F5.** Duplicate video submission prevented (idempotency).
- [ ] **F6.** If the video worker is unavailable, session stays `video_processing` (never falsely marked complete).

## G. Final feedback (spec §5.10, §2)

- [ ] **G1.** `POST /api/v1/mock/sessions/{sessionId}/complete` verifies required sections have terminal states; prevents completion while a section is processing.
- [ ] **G2.** Session marked `feedback_processing` before queueing; final feedback job queued exactly once (idempotent).
- [ ] **G3.** Final feedback aggregates aptitude + coding + video scores, strengths/weaknesses based on actual results.
- [ ] **G4.** Session marked `completed` only after final feedback is persisted; final score persisted.
- [ ] **G5.** `POST .../end` (current ad-hoc endpoint) either conforms to the spec lifecycle or is replaced by `complete`.

## H. AI generation contract (spec §7)

- [ ] **H1.** Every live question/problem/prompt is generated or selected through the approved AI generation service — not static JSON files, not fabricated feedback.
- [ ] **H2.** All generators return structured data validated by schema (no greedy-regex parsing of arbitrary text).
- [ ] **H3.** Duplicate question IDs and duplicate normalized question text are rejected; validators check question count, option count, `correctIndex`.
- [ ] **H4.** Coding test cases run against a trusted reference solution; mismatched expected outputs rejected.
- [ ] **H5.** Prompt version and content hash persisted for every generated item.
- [ ] **H6.** Answer data removed from all candidate-facing responses.

## I. API contract & runtime safety (spec §5, §10.8)

- [ ] **I1.** Runtime Zod schemas exist for all candidate-facing mock endpoints (create session, chunk GET/POST, aptitude submit, coding GET/POST/poll, video prompts GET, video POST, complete).
- [ ] **I2.** All endpoints verify candidate ownership via the session/application (403 on cross-candidate access).
- [ ] **I3.** Browser never receives correct answers, hidden tests, API secrets, or internal stack traces.

## J. End-to-end verification (spec §8, §9)

- [ ] **J1.** Full flow drives green in the running app: create session → aptitude chunks (persisted, `hasMore` correct) → aptitude submit (server score) → coding problem (same on refresh, hidden tests safe) → code submit → poll → video prompts → video submit → complete → final feedback.
- [ ] **J2.** Checklist scenarios pass: chunk refresh no regen, duplicate chunk idempotent, concurrent chunk single-generation, client `correctIndex` ignored, custom coding tests rejected, idempotent coding submit, infinite loop → timeout, no env in sandbox, no network, cross-candidate 403, invalid AI JSON handled, duplicate questions rejected, worker failure not falsely complete, final feedback idempotent.

## K. Verification gates (spec §11 Definition of done)

- [ ] **K1.** `npm run lint` and `npm run build` pass.
- [ ] **K2.** Multi-tenant / org isolation and zero hidden-data leakage verified.
- [ ] **K3.** Retry, concurrent, hidden-answer-leakage, sandbox-escape, and worker-failure tests written and passing (spec §10.10).
