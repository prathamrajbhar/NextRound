# @nextround/web

Next.js 16 (App Router) frontend for NextRound / HireOS.

## Areas

- **Public** — job listings, about, pricing, contact
- **Candidate Portal** — jobs, applications, assessments, interviews, mock prep, resume builder, offers
- **HR Portal** — jobs, candidates, pipeline, interviews, sentiment analysis, analytics, talent pool
- **Voice Assessment Console** — live voice interview UI with status orb, subtitles, and proctoring HUD

## Development

Run the full stack from the repo root:

```bash
npm run dev
```

Type-check and lint this app:

```bash
npm run typecheck --workspace=@nextround/web
npm run lint --workspace=@nextround/web
```

API client contracts, Zod schemas, and shared types live in `packages/shared`. Database models live in `packages/database`.
