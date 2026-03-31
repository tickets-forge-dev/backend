---
name: error-handling
description: Typed errors, graceful failures, retry patterns — no silent swallowing
---

# Error Handling

Every error must be typed, logged, and handled gracefully. No silent failures.

## Rules

1. **Type your errors** — custom error classes, not string messages
2. **Fail fast** — validate early, throw immediately on bad input
3. **Catch at boundaries** — controllers catch and translate to HTTP, UI catches and shows toast
4. **Never swallow errors** — `catch {}` without logging is a bug
5. **User-facing messages** — friendly for users, detailed for logs
6. **Retry transient failures** — network errors, rate limits, timeouts
7. **Circuit breaker for external services** — don't hammer a failing dependency
8. **Structured error responses** — `{ statusCode, message, error }` consistently

## Patterns

Review `reference/error-patterns.md` for typed error examples.

## During Implementation

For every `try/catch`:
- Is the error logged with context (what operation, what input)?
- Is the user getting a helpful message?
- Is there a recovery path (retry, fallback, graceful degradation)?
