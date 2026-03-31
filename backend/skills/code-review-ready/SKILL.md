---
name: code-review-ready
description: Produce clean, well-documented code with clear commits that reviewers can approve fast
---

# Code Review Ready

Every change you make should be reviewable by a human developer in minutes, not hours.

## Before Writing Code

Check existing conventions:
```bash
bash scripts/lint-check.sh --detect
```

Review `reference/commit-conventions.md` for the project's commit style.

## Rules

1. **Small, focused commits** — one logical change per commit
2. **Descriptive commit messages** — what changed and why, not how
3. **No commented-out code** — delete it, git remembers
4. **No debugging artifacts** — remove console.log, print(), TODO hacks
5. **Self-documenting names** — functions and variables explain themselves
6. **Comments explain why, not what** — the code shows what, comments explain decisions
7. **Consistent formatting** — match the existing code style exactly

## During Implementation

After each logical change:
```bash
bash scripts/lint-check.sh
```

## Commit Message Format

```
<type>: <description>

[optional body — explain why, not what]
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
