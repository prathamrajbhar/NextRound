# Agent Behavioral Rules

- **Auto Commit & Push**: Whenever a task or feature implementation/fix is completed and verified, automatically stage, commit, and push the changes to git.
- **No Fallbacks**: Never add any mock, static, or fallback logic for APIs, generation, or services. If an API fails, propagate the error; do not implement a fallback.
