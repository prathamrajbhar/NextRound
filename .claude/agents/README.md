# Hardcode/Mock-Elimination Agent Team

## Setup

1. Copy all four `.md` files into your project's `.claude/agents/` directory:
   ```
   your-project/.claude/agents/auditor.md
   your-project/.claude/agents/builder.md
   your-project/.claude/agents/qa-reviewer.md
   your-project/.claude/agents/tester.md
   ```
2. Start (or restart) your Claude Code session in that project — a brand-new `agents/` directory needs a restart to be picked up; edits to existing files are picked up automatically within a few seconds.
3. Confirm they loaded with `/agents`.

## Running the pipeline

Claude Code will auto-delegate to these agents based on their `description` fields, but for a multi-phase pipeline like this, it's more reliable to invoke them explicitly, in order, from your main session:

```
Use the auditor agent to scan this codebase and produce the hardcoded/mock/placeholder report.
```

Review the report, then:

```
Use the builder agent to fix the first 3 items in the auditor's report, one at a time. 
Stop and ask me if any of them need a real credential or endpoint that doesn't exist yet.
```

After the builder finishes a batch:

```
Use the qa-reviewer agent to verify the builder's last batch of changes.
```

If approved:

```
Use the tester agent to write/update tests for the approved batch and run the full suite.
```

Then repeat with the next batch from the Auditor's checklist.

## Notes

- These agents run **sequentially by design** (each depends on the previous phase's output), so you're driving the handoffs from the main conversation rather than letting Claude parallelize them.
- The Auditor is read-only (`Read, Grep, Glob` — no `Edit`/`Write`) so it can't accidentally start fixing things.
- The Builder and QA/Tester agents are instructed to **stop and ask you** rather than invent fake credentials or endpoints — expect them to interrupt the pipeline when a real API/secret is genuinely missing. That's intended behavior, not a failure.
- If your project is large, ask the Auditor to scope to one feature/directory at a time rather than the whole repo in one pass — keeps each phase's output reviewable.
