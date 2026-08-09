# NextRound Codebase Audit & Security Findings

This document summarizes the technical findings, security vulnerabilities, assessment logic flaws, and architectural issues identified across the NextRound codebase.

---

## 1. Critical Security Vulnerabilities

| # | Severity | Problem | Location | Impact | Fix |
|---:|:---:|---|---|---|---|
| 1 | P0 | **Remote Code Execution (RCE) via Unsandboxed Python / Native Execution** | `apps/api/src/services/coding-executor.service.ts` | Candidate coding submissions run directly on the host API process via `spawnSync('python3', ...)` without process, container, network, or filesystem isolation. | Execute candidate submissions in an isolated container/microVM sandbox (Docker + gVisor, Firecracker, or Judge0/Piston) with read-only filesystem, dropped capabilities, and disabled network. |
| 2 | P0 | **Node `vm` Module Used as Security Sandbox** | `coding-executor.service.ts` (`executeNodeVm`) | JavaScript/TypeScript execution relies on Node's `vm` module, which is explicitly not a security boundary and easily escapable to gain full host access. | Run JS/TS inside the same isolated container environment as other languages; do not rely on Node `vm`. |
| 3 | P0 | **Bypassable AST Blocklist in Python AI Service** | `apps/ai-service/services/code_executor_service.py` | A second code executor relies on AST-based blocklists (`FORBIDDEN_MODULES`), which are trivially bypassed via Python introspection gadgets. | Unify code execution into a single containerized sandbox service instead of maintaining a parallel, insecure implementation. |
| 4 | P0 | **Path Traversal / Arbitrary File Write in Resume Upload** | `apps/api/src/lib/storage.ts` & `apps/api/src/routes/candidate/candidate.routes.ts` | `req.file.originalname` is concatenated directly into storage keys without stripping `..` sequences, allowing arbitrary file writes outside the upload directory. | Ignore client filenames; generate a random UUID filename on the server and sanitize/reject path components. |
| 5 | P0 | **Arbitrary Client Test Cases Accepted** | `apps/api/src/routes/coding/*.ts` | `testCases` are accepted directly from `req.body`, allowing a candidate to submit custom expected outputs and fake a passing result. | Never accept test cases from the client. Fetch canonical test cases from the database based on `problemId`. |
| 6 | P1 | **Token Exposure in LocalStorage** | `apps/web/src/lib/api.ts`, `useInterviewSession.ts` | Auth endpoints set httpOnly cookies but also return `accessToken`/`refreshToken` in JSON responses, which the web app stores in `localStorage` where XSS can steal them. | Rely exclusively on httpOnly cookies and stop returning/storing access tokens in `localStorage`. |
| 7 | P1 | **Loose File-Type Filter on Uploads** | `apps/api/src/routes/candidate/candidate.routes.ts` | Accepts uploads if `!file.mimetype` is falsy or if mimetype merely includes `'stream'`, permitting arbitrary binary payloads. | Validate file contents via magic bytes (e.g. using `file-type`) rather than trusting user-supplied header strings. |
| 8 | P1 | **Timing-Unsafe Secret Comparison** | `apps/api/src/middleware/internalSecret.ts` | Secret header comparison uses standard `!==` string inequality, vulnerable to timing attacks. | Use `crypto.timingSafeEqual`. |
| 9 | P1 | **Deprecated `multer` Dependency with Known CVEs** | `apps/api/package.json` | Uses `multer@^1.4.5-lts.1`, which has documented denial-of-service vulnerabilities. | Upgrade to `multer@2.x` and update multipart parsing calls. |

---

## 2. Assessment Engine & Execution Logic Flaws

| # | Severity | Problem | Why It Is Wrong | Correct Solution |
|---:|:---:|---|---|---|
| 10 | P0 | **Double LLM Generation (Display vs Submission)** | Problem generation is triggered once when viewing and again during submission, causing submissions to be evaluated against a different problem than shown. | Generate the problem once, persist it, and evaluate submissions against that exact snapshot. |
| 11 | P0 | **Hidden Tests Generated Dynamically** | Hidden test sets can change between assessment creation and scoring. | Persist public and hidden test cases together on the assessment snapshot. |
| 12 | P0 | **C++ / Java Results Evaluated on Compilation Success Alone** | Successful compilation or exit code 0 was treated as passing, without comparing actual output against expected output. | Execute compiled binaries with test inputs, capture stdout, and compare against canonical test outputs. |
| 13 | P0 | **Regex-Based TypeScript Type Stripping** | Regex stripping fails on generics, union types, arrow functions, and complex TS syntax. | Transpile TypeScript using the official TS compiler API (`ts.transpileModule`) inside the runner sandbox. |
| 14 | P0 | **Function Stub Sniffing via String Matching** | Uses heuristics like `.includes('return [];')` or `.endsWith('pass')` to guess if code is unimplemented. | Execute code against test harnesses instead of inferring intent from string patterns. |
| 15 | P1 | **Synchronous Execution + Enqueued Queue Dual-Path** | Code executes synchronously while also enqueuing a BullMQ backup job, causing duplicate execution and state races. | Use a single execution model: enqueue jobs and let a dedicated worker manage status transitions. |
| 16 | P1 | **Swallowed Queue & Evaluation Errors** | Failures in queue creation or evaluation updates use `.catch(() => null)`, masking underlying failures. | Record errors explicitly, implement retries, and never swallow failed status updates. |
| 17 | P1 | **Immediate Hire/Reject Decisions at Fixed Threshold** | A single coding score of 70% immediately sets candidate decision to `hire` or `reject`. | Store assessment scores separately; apply policy rules after all candidate stages are completed. |
| 18 | P1 | **Overwritten Assessment Attempts via Upsert** | Re-submitting overwrites previous evaluation records, losing attempt history. | Store each attempt as an immutable submission record. |
| 19 | P1 | **Inconsistent Pass Rate Representation** | API returns percentage (e.g. `80`), while database stores decimal (e.g. `0.8`). | Standardize on decimal `0.0–1.0` or explicitly name fields `passRatePercent`. |
| 20 | P1 | **Prompt Injection Vulnerability in Problem Generator** | Candidate/job input is interpolated directly into LLM prompts without sanitization. | Delimit untrusted inputs as data blocks and validate LLM output against a strict schema. |

---

## 3. Configuration & API Route Issues

| # | Severity | Problem | Where | Fix |
|---:|:---:|---|---|---|
| 21 | P1 | **Env Var Name Mismatch** | `.env.example` defines `JWT_REFRESH_SECRET`, but `apps/api/src/lib/jwt.ts` checks `REFRESH_TOKEN_SECRET`. | Align key names across `.env.example` and code logic. |
| 22 | P1 | **Hardcoded Fallback Secrets** | `jwt.ts` and `internalSecret.ts` contain baked-in default secret strings. | Throw immediately at startup if secrets are missing in non-development environments. |
| 23 | P1 | **Rate Limiting Only Configured on Auth Routes** | Expensive AI and code execution routes have no rate limiting in `app.ts`. | Apply a global API rate limiter and strict endpoint limiters for code execution and AI generation. |
| 24 | P1 | **Duplicated Route Logic (PUT/PATCH `/jobs/:id`)** | Byte-for-byte duplicated handlers in `job.routes.ts:237-340`. | Extract a shared update handler function. |
| 25 | P2 | **Duplicated API Base URL Fallback** | Hardcoded `NEXT_PUBLIC_API_BASE_URL` strings across web components. | Centralize configuration in a single `lib/config.ts`. |
| 26 | P2 | **Missing Prisma `onDelete` Cascades** | Relations like Application, Evaluation, and CodingSubmission lack explicit `onDelete` rules. | Explicitly define `onDelete: Cascade` or `onDelete: Restrict` in `schema.prisma`. |
| 27 | P2 | **Brittle Sandbox Telemetry Logs** | Executor logs fake sandbox parameters (`"[Native Sandbox] Target Environment: Linux x86_64"`) when no sandbox exists. | Remove misleading logs and log actual execution environment metrics. |
| 28 | P3 | **Stray TODO/FIXME Annotations & `: any` Usage** | 30+ TODO comments and `any` types scattered across API routes. | Convert TODOs to tracked issues and replace `any` with strict Zod/Prisma types. |

---

## 4. Recommended Target Architecture

| Step | Action |
|---:|---|
| 1 | **Immutable Problem Snapshot**: Persist generated assessment problems (with typed public & hidden tests) in the database prior to display. |
| 2 | **Minimal Submission API**: Candidate submits only `code`, `language`, `problemId`, and an `idempotencyKey`. |
| 3 | **Transactional Outbox**: Save submission record and job event within a single database transaction. |
| 4 | **Isolated Sandbox Worker**: Dedicated worker executes submission inside a secure microVM/container with restricted CPU, memory, PIDs, read-only FS, and disabled networking. |
| 5 | **Typed Output Comparison**: Compare stdout/return values against stored test outputs using language-neutral comparators. |
| 6 | **Audit Trail & Scoring**: Log immutable submission attempt records and update candidate stage score without automated hiring state mutation. |

---

## 5. Implementation Priority

1. **Immediate (P0)**:
   - Sandbox code execution (remove host execution & Node `vm`).
   - Fix resume upload path traversal (`storage.ts`).
   - Eliminate dynamic problem regeneration on submission.
   - Enforce server-side test case loading.

2. **Short-Term (P1)**:
   - Remove `localStorage` token storage; use httpOnly cookies.
   - Add global and code-execution rate limiting.
   - Fix secret key env var mismatch & fallback secrets.
   - Upgrade `multer` and validate file magic bytes.

3. **Medium-Term (P2/P3)**:
   - Unify code execution services and remove duplicate AST-based executor.
   - Standardize error handling and Prisma cascade rules.
   - Clean up stray TODOs, DRY violations, and TypeScript `any` types.