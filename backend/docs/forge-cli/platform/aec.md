---
title: "The AEC (Agent Execution Contract)"
excerpt: "The core artifact in Forge — a verified, machine-readable spec that both humans and AI agents can execute."
category: "Platform"
---


The AEC is the core artifact in Forge. It's not just a ticket — it's a structured, validated contract that describes exactly what needs to be built, how to verify it, and what the boundaries are.

An AEC works for both humans and AI agents. A developer can read it and implement the feature. An AI assistant can parse it and generate code. The format is the same either way.

## What an AEC Contains

### Acceptance Criteria

Written in BDD format (Given/When/Then) so they're directly testable:

```gherkin
Given a user visits /login
When they enter valid credentials
Then they are redirected to /dashboard and a session token is set

Given a user visits /login
When they enter invalid credentials
Then they see an "Invalid email or password" error and no session is created
```

These aren't vague requirements like "user can log in." They're precise, testable conditions with explicit inputs and expected outputs.

### File Changes

Every file that needs to be created, modified, or deleted:

```
+ src/auth/auth.controller.ts        (create)
+ src/auth/auth.service.ts           (create)
+ src/auth/auth.guard.ts             (create)
+ src/auth/dto/login.dto.ts          (create)
~ src/app.module.ts                  (modify — import AuthModule)
~ src/config/routes.ts               (modify — add /login, /logout routes)
```

Each entry includes notes explaining what changes and why.

### API Contracts

Endpoint definitions with request/response shapes:

```
POST /api/v1/auth/login
  Request:  { email: string, password: string }
  Response: { token: string, expiresAt: string }
  Errors:   401 Invalid credentials, 429 Rate limited

POST /api/v1/auth/logout
  Request:  (none — uses session token)
  Response: 204 No Content
```

### Technical Context

Patterns and conventions detected from the codebase:

- Framework and language versions
- Existing architectural patterns (e.g., repository pattern, use cases)
- Naming conventions for files, classes, and functions
- Related modules and dependencies
- Test patterns to follow

### Assumptions & Scope

**In scope:**
- Login and logout flows
- Session token management
- Rate limiting on auth endpoints

**Out of scope:**
- Password reset flow
- Multi-factor authentication
- Social OAuth providers

**Assumptions:**
- Firebase Auth handles token refresh
- Existing rate-limit middleware can be reused

### Readiness Score

A 0–100 score calculated from weighted validation results:

| Dimension | Weight | Example Score |
|-----------|--------|---------------|
| Acceptance criteria completeness | High | 90 |
| File change mapping | Medium | 85 |
| API contract definition | Medium | 80 |
| Scope clarity | Low | 95 |
| Technical context | Low | 70 |

The overall score is a weighted average. A ticket needs a score of **75 or higher** to be forged.

> :blue_book: The readiness score gates execution. If the spec isn't clear enough to implement, Forge won't let it through.

## Two Enrichment Paths

### Developer Enrichment (Recommended)

The developer uses the Forge CLI or MCP tools to add real codebase context:

1. **`forge review <id>`** — The AI asks the developer targeted questions about the implementation
2. The developer answers with specifics: which patterns to follow, which files to modify, edge cases to handle
3. Q&A pairs are submitted to the PM for review
4. The PM re-bakes the spec, incorporating developer context
5. Final approval produces a superior AEC

This path produces the best specs because it combines PM intent with developer expertise.

### Auto-Enrichment

The AI analyzes a connected Git repository directly from the web UI:

1. PM connects a repository in the ticket
2. AI scans the codebase for relevant patterns, conventions, and dependencies
3. Tech spec is generated automatically

Faster and easier, but less precise. Best for straightforward changes where codebase patterns are well-established.

## Example AEC

Here's an abbreviated AEC showing each section:

```yaml
title: Add user authentication
type: feature
priority: high
status: forged
readinessScore: 87

acceptanceCriteria:
  - given: "a user visits /login"
    when: "they enter valid credentials"
    then: "they are redirected to /dashboard"
  - given: "a user visits /login"
    when: "they enter invalid credentials"
    then: "they see an error message"

fileChanges:
  - path: "src/auth/auth.controller.ts"
    action: create
    notes: "Login and logout endpoints"
  - path: "src/app.module.ts"
    action: modify
    notes: "Import AuthModule"

apiContracts:
  - method: POST
    path: "/api/v1/auth/login"
    request: { email: string, password: string }
    response: { token: string, expiresAt: string }

assumptions:
  - "Firebase Auth handles token refresh"
  - "Existing rate-limit middleware is reusable"

scope:
  in: ["Login/logout flows", "Session management"]
  out: ["Password reset", "MFA", "Social OAuth"]

technicalContext:
  framework: "NestJS 10"
  patterns: ["Clean Architecture", "Repository pattern"]
  conventions: "PascalCase for classes, camelCase for methods"
```

## AEC Properties Reference

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier (prefixed `aec_`) |
| `teamId` | string | Owning team |
| `createdBy` | string | PM who created the ticket |
| `assignedTo` | string | Developer assigned to execute |
| `status` | enum | Current lifecycle status |
| `title` | string | 3–500 characters |
| `description` | string | Freeform context from the PM |
| `type` | enum | `feature`, `bug`, or `task` |
| `priority` | enum | `low`, `medium`, `high`, `urgent` |
| `readinessScore` | number | 0–100 validation score |
| `acceptanceCriteria` | string[] | BDD-format criteria |
| `assumptions` | string[] | What we're assuming is true |
| `techSpec` | object | Full technical specification |
| `codeSnapshot` | object | Codebase state at forge time |
| `apiSnapshot` | object | API state at forge time |
| `validationResults` | object[] | Weighted validation checks |
| `reviewSession` | object | Developer Q&A pairs |
| `designReferences` | object[] | Figma, Loom, or other design links |
| `attachments` | object[] | Uploaded files (max 5) |
| `driftDetectedAt` | date | When spec became stale (if applicable) |
| `driftReason` | string | Why the spec drifted |
