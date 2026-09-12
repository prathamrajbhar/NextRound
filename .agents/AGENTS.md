# Agent Behavioral Rules

- **Auto Commit & Push**: Whenever a task or feature implementation/fix is completed and verified, automatically stage, commit, and push the changes to git.
- **No Fallbacks**: Never add any mock, static, or fallback logic for APIs, generation, or services. If an API fails, propagate the error; do not implement a fallback.
- **Clean Production Grade Code**: Always write clean, robust, strictly-typed production-grade code. No hacky patches, no pseudo-code, and no temporary shortcuts.
- **Never Wipe or Clean Database Without Permission**: Under no circumstances should the database ever be wiped, cleaned, truncated, or reset unless the user explicitly commands it in that exact prompt. Never run seed, migration resets, or delete operations that clear database tables autonomously.

