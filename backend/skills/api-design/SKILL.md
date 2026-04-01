---
name: api-design
description: RESTful conventions — proper status codes, validation, consistent response shapes
---

# API Design

Build APIs that are consistent, predictable, and well-documented.

## Before Writing Code

Check existing API patterns:
```bash
bash scripts/validate-api.sh --scan
```

Review `reference/rest-patterns.md` for conventions.

## Rules

1. **Resource-oriented URLs** — `/users/:id/posts` not `/getUserPosts`
2. **Correct HTTP methods** — GET reads, POST creates, PUT/PATCH updates, DELETE removes
3. **Correct status codes** — 201 for created, 204 for no content, 400 for bad input, 404 for not found, 409 for conflict
4. **Validate all input** — DTOs with class-validator or zod, reject early
5. **Consistent response shape** — always `{ data, meta }` or `{ error, message }`
6. **Pagination for lists** — `?page=1&limit=20` or cursor-based
7. **Idempotent operations** — PUT and DELETE should be safe to retry
8. **Version if public** — `/api/v1/` for external APIs

## During Implementation

For every new endpoint:
```bash
bash scripts/validate-api.sh
```
