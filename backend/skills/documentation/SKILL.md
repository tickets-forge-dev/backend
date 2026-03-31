---
name: documentation
description: JSDoc for public APIs, README updates, inline comments where logic isn't obvious
---

# Documentation

Document what matters. Don't document the obvious.

## Rules

1. **Public functions get JSDoc** — params, return type, brief description
2. **README updated** — if you add a feature, update the README
3. **Comments explain WHY** — not what the code does (the code shows that)
4. **No stale comments** — if you change code, update or delete the comment
5. **Types are documentation** — good interfaces reduce the need for comments
6. **Examples in JSDoc** — for complex functions, add `@example`

## Before Committing

Check documentation coverage:
```bash
bash scripts/check-docs.sh
```

## What to Document

- Public API functions (exported)
- Non-obvious business logic (the "why")
- Configuration options
- Error conditions and edge cases
- Module purpose (top-of-file comment for complex modules)

## What NOT to Document

- Self-explanatory code (`// increment counter` above `counter++`)
- Getters/setters
- Framework boilerplate
- Obvious type annotations
