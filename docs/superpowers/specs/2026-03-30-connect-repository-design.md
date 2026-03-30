# Connect Repository to Existing Tickets

**Date:** 2026-03-30

## Problem

Tickets created without a repository linked cannot use Cloud Develop. Users must re-create the ticket. There's also no way to switch repos on an existing ticket.

## Solution

Add a `PATCH /tickets/:id/repository` endpoint and a repo/branch display in the OverviewCard with a connect/change dialog.

## Backend

**Endpoint:** `PATCH /tickets/:id/repository`

- **Body:** `{ repositoryFullName: string, branchName: string }`
- **Guard:** Reject if ticket status is `executing` (active session would break)
- **Logic:** Resolve GitHub token from team's workspace integration → fetch commit SHA via GitHub API → build `RepositoryContext` → call `aec.setRepositoryContext()` → save
- **Pattern:** Follow the existing `PATCH /tickets/:id/tags` pattern (specialized endpoint, not generic update)
- **Reuse:** `buildRepositoryContext` helper from `CreateTicketUseCase`

## Frontend

### 1. OverviewCard — repo display

- **Connected:** Show `owner/repo · branch` with pencil icon to change
- **Not connected:** Show "Connect repository" link (same style as "assign developer")

### 2. Connect/Change dialog

- `Dialog` component (not blade) containing:
  - `RepositorySelector` (reused from wizard — lists `selectedRepositories` from settings store)
  - `BranchSelector` (reused from wizard — fetches branches via tickets store)
  - Save button → calls `PATCH /tickets/:id/repository`
- On save: optimistic update in tickets store, refresh ticket

### 3. Develop button guard

- When `repositoryContext` is null, disable the Develop button
- Show tooltip: "Connect a repository to start development"

## What's NOT included

- No new use case class — controller handles directly
- No migration — `setRepositoryContext()` already exists on AEC domain
- No new components — reuse existing selectors and Dialog
- No repo validation (existence check) — handled at session start
- No branch change history
- No multi-repo support

## Guard rails

- `executing` status blocks repo changes (active session protection)
- Connecting/switching repo is metadata only — no token cost
