# Multi-Repository Support — Design Spec

**Date:** 2026-03-31
**Status:** Draft

## Overview

Tickets can be linked to multiple repositories, each with its own branch. Development sessions target one repo at a time. The first repo attached is the primary (used for the default PR).

## Current State

```typescript
AEC._repositoryContext: RepositoryContext | null  // single repo
```

## Target State

```typescript
AEC._repositories: RepositoryEntry[]  // array of repos
```

```typescript
interface RepositoryEntry {
  repositoryFullName: string;    // "owner/repo"
  branchName: string;            // source branch ("main")
  commitSha: string;             // HEAD at attach time
  isDefaultBranch: boolean;
  isPrimary: boolean;            // first attached = primary
  role?: string;                 // optional: "backend" | "frontend" | "shared"
  selectedAt: Date;
}
```

## Decisions

| Decision | Choice |
|----------|--------|
| Development model | One repo per session — user picks which repo in the blade |
| Primary repo | First attached is primary, user can change |
| Backward compatibility | `repositoryContext` getter returns primary repo for existing code |
| Migration | Existing single-repo tickets auto-wrapped into array on read |

## Changes By Layer

### Domain

**`AEC.ts`:**
- `_repositoryContext: RepositoryContext | null` → `_repositories: RepositoryEntry[]`
- `setRepositoryContext()` → `addRepository()` / `removeRepository()` / `setPrimaryRepository()`
- Keep `get repositoryContext()` as backward-compat getter returning the primary
- Add `get repositories()` returning the full array

**`RepositoryEntry.ts`** (new, replaces RepositoryContext for the array items):
- Same fields as RepositoryContext + `isPrimary` + `role`
- `RepositoryContext` kept as-is for backward compatibility, used by the getter

### Infrastructure

**`AECMapper.ts`:**
- Read: if Firestore doc has `repositoryContext` (old), wrap in array
- Read: if doc has `repositories` (new), use directly
- Write: always write `repositories` array

### Presentation (Backend)

**`tickets.controller.ts` response:**
- Add `repositories: RepositoryEntry[]` to the response
- Keep `repositoryContext` for backward compat (returns primary)

### Frontend — Ticket Detail

**`page.tsx` header:**
- Show multiple repo chips: `backend · frontend · shared`
- Click any to change/remove, "+" to add
- Primary has a subtle indicator

**`OverviewCard.tsx`:**
- Removed repo row (already done) — repos are in the header

**`RepositorySelector.tsx`:**
- Already exists for single repo — extend to add/remove from array
- Add role selector (optional)

### Frontend — Develop Blade

**`DevelopButton.tsx`:**
- If multiple repos: show a repo picker dropdown before "Start Development"
- If one repo: same as today, no picker
- Selected repo passed to `startSession`

**`DevelopSessionBlade.tsx` / `SessionMonitorView.tsx`:**
- Pass selected `repoFullName` to `startSession`

### Frontend — Wizard

**Wizard repo step:**
- Allow selecting multiple repos
- First selected = primary
- Each repo gets its own branch selector

### Backend — Sessions

**`sessions.controller.ts`:**
- Accept `repoIndex` or `repoFullName` query param to specify which repo to develop against
- Default: primary repo

**`StartSessionUseCase.ts`:**
- Look up the selected repo from the ticket's `repositories` array
- Pass that repo's `fullName` and `branchName` to the sandbox

**`E2BSandboxAdapter.ts`:**
- No change needed — already receives a single repo URL and branch

## Migration

Existing tickets with `repositoryContext: { ... }` get auto-migrated on read:

```typescript
// In AECMapper
if (doc.repositoryContext && !doc.repositories) {
  return [{ ...doc.repositoryContext, isPrimary: true }];
}
```

No batch migration needed. Lazy migration on read.

## API Changes

**PATCH `/tickets/:id`** — new field:
```typescript
{
  repositories: [
    { repositoryFullName: "owner/backend", branchName: "main", isPrimary: true, role: "backend" },
    { repositoryFullName: "owner/frontend", branchName: "main", role: "frontend" }
  ]
}
```

**POST `/sessions/:ticketId/start?repo=owner/frontend`** — specify which repo to develop.

## UI Mockup

**Ticket header with multiple repos:**
```
# Show Ticket ID · backend · frontend · + Add repo · dan ayalon
```

**Develop blade with repo picker (only when > 1 repo):**
```
┌─────────────────────────────────┐
│ Start development               │
│                                 │
│ Repository                      │
│ ┌─ owner/backend ──────── ▾ ┐  │
│                                 │
│ ⚙ Skills      Auto · 2 rec ▾  │
│                                 │
│ ▶ Start Development         →  │
└─────────────────────────────────┘
```

## Out of Scope

- Multi-repo sandbox (cloning multiple repos in one session)
- Cross-repo file references in specs
- Auto-detecting repo relationships (monorepo detection)
