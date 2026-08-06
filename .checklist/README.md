# NextRound — Checklist Index

Complete build checklist for taking NextRound from UI scaffold to fully functional product.
Work through these **in order** — each checklist depends on the previous.

---

## Checklist Order & Dependency Map

```
00 → Remove Mock Data          (can run in parallel with 01)
01 → Workspace Setup           (prerequisite for everything)
     ↓
02 → Auth & RBAC               (prerequisite for all data access)
     ↓
03 → CRUD: Jobs & Applications  (prerequisite for AI agents)
     ↓
04 → AI: Sourcing & Screening   ←──┐
05 → AI: Scheduler & Assessment ←──┤  (run 04–08 sequentially)
06 → AI: Voice Interview        ←──┤
07 → AI: Evaluator & Decision   ←──┤
08 → AI: Mock & Resume Builder  ←──┘
     ↓
09 → Analytics, Sentiment, Talent Pool
     ↓
10 → ML Bypass Plan             (ongoing — document as you build)
     ↓
11 → Testing & QA               (run at end + throughout)
```

---

## File Reference

| # | File | Focus |
|---|------|-------|
| [00](./00-remove-mock-data.md) | `00-remove-mock-data.md` | Rip out all mock data files and hardcoded placeholders |
| [01](./01-workspace-setup.md) | `01-workspace-setup.md` | Turbo monorepo, packages, Express scaffold, FastAPI scaffold |
| [02](./02-auth-and-rbac.md) | `02-auth-and-rbac.md` | JWT auth, httpOnly cookies, RBAC, org scoping |
| [03](./03-crud-jobs-applications.md) | `03-crud-jobs-applications.md` | Jobs, Applications, Organizations, Candidate Profile CRUD |
| [04](./04-ai-agents-sourcing-screening.md) | `04-ai-agents-sourcing-screening.md` | JD Parser, Sourcing Agent, Screening Agent, BullMQ |
| [05](./05-ai-agents-scheduler-assessment.md) | `05-ai-agents-scheduler-assessment.md` | Scheduler Agent, Aptitude, Coding Sandbox, Video Screening |
| [06](./06-ai-voice-interview.md) | `06-ai-voice-interview.md` | WebRTC, Groq Whisper STT, Piper TTS, LangGraph Interviewer |
| [07](./07-ai-evaluator-decision.md) | `07-ai-evaluator-decision.md` | Evaluator, Bias Audit, Decision Agent, Offer/Rejection emails |
| [08](./08-ai-mock-resume-builder.md) | `08-ai-mock-resume-builder.md` | Mock Interview Agent, AI Voice Resume Builder, PDF gen |
| [09](./09-analytics-sentiment-talent.md) | `09-analytics-sentiment-talent.md` | Analytics Agent, Sentiment Analyser, Talent Pool search |
| [10](./10-ml-bypass-plan.md) | `10-ml-bypass-plan.md` | Document all ML bypasses and upgrade paths |
| [11](./11-testing-qa.md) | `11-testing-qa.md` | Unit tests, integration tests, E2E verification, security |

---

## Progress Tracker

Mark items as you complete each checklist:

- [x] `00` — Mock data removed
- [x] `01` — Workspace bootstrapped; `npm run dev` starts all services
- [x] `02` — Auth works; login/register/logout + role guards active
- [x] `03` — CRUD complete; jobs and applications persisted in DB
- [x] `04` — Sourcing + Screening agents processing via BullMQ
- [x] `05` — Scheduling, Aptitude, Coding pipeline functional
- [x] `06` — Voice interview end-to-end (speak → transcript → AI response → audio)
- [x] `07` — Evaluation, bias audit, decision, offer/rejection emails sent
- [x] `08` — Mock interview feedback + resume PDF generation working
- [x] `09` — Analytics charts live, sentiment analyser, talent pool search
- [x] `10` — All bypasses documented with `# ML_BYPASS:` comments
- [x] `11` — All tests pass; 7 PRD success criteria verified

---

## Key Constraints (never violate)

1. **Stack is locked** — no substitute dependencies
2. **`org_id` from JWT only** — never from request body or query params
3. **Proctor flags excluded from scoring** — CV signals in `Interview.proctor_flags` only, never in `Evaluation`
4. **Python service never writes to DB directly** — all DB writes via Express internal callbacks
5. **Max 200 lines per component file**
6. **TypeScript strict mode — zero `any`**
7. **All ML bypasses marked `# ML_BYPASS:` in code**
