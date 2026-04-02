# Project Repository Configuration — Design Spec

**Date:** 2026-04-01
**Status:** Approved
**Branch:** feat/project-repos

## Problem

Repositories are currently configured at the user level (workspace). Each user picks repos in their personal Settings, and those appear in the ticket creation wizard. This causes:

- No project-level consistency — different team members see different repos
- No role enforcement — "backend" vs "frontend" labels are UI-only metadata
- Preview doesn't know which repo is the web client
- New team members must manually configure their repos to match the team

## Solution

Add project-level repository configuration to teams. Team owners configure which repos belong to the project, assign roles, and set default branches. These repos become the source of truth for ticket creation, development, and preview.

## Data Model

### TeamRepository (new value object)

```typescript
interface TeamRepository {
  repositoryFullName: string;  // "owner/repo"
  role: 'backend' | 'frontend' | 'shared';
  defaultBranch: string;       // Auto-detected from GitHub, overridable
  profileId?: string;          // Link to project profile scan
  addedBy: string;             // User ID of who added it
  addedAt: Date;
}
```

### Storage

Stored as an array in the existing team document at `/teams/{teamId}`:

```
{
  ...existing team fields,
  repositories: [
    { repositoryFullName: "forge-dev/backend", role: "backend", defaultBranch: "main", ... },
    { repositoryFullName: "forge-dev/client", role: "frontend", defaultBranch: "main", ... }
  ]
}
```

No subcollection needed — repo lists are small (typically 1-3 repos per project).

## API Endpoints

All endpoints require authentication + team membership. Write operations require owner role.

### GET /teams/:teamId/repositories

Returns the project's configured repositories with profile status.

Response:
```json
{
  "repositories": [
    {
      "repositoryFullName": "forge-dev/backend",
      "role": "backend",
      "defaultBranch": "main",
      "profileStatus": "ready",
      "techStack": ["typescript", "nestjs"],
      "addedBy": "user_abc",
      "addedAt": "2026-03-15T10:00:00Z"
    }
  ]
}
```

### POST /teams/:teamId/repositories

Add a repo to the project. Owner only.

Body:
```json
{
  "repositoryFullName": "forge-dev/client",
  "role": "frontend",
  "defaultBranch": "main"
}
```

Behavior:
- Validates repo exists and is accessible via workspace GitHub token
- Auto-detects default branch from GitHub if not provided
- Triggers project profile scan if not already profiled
- Returns the created TeamRepository with profile status

### PATCH /teams/:teamId/repositories/:encodedRepoFullName

Update role or default branch. Owner only. `encodedRepoFullName` uses `--` as separator (e.g., `forge-dev--client`).

Body (all optional):
```json
{
  "role": "shared",
  "defaultBranch": "develop"
}
```

### DELETE /teams/:teamId/repositories/:encodedRepoFullName

Remove a repo from the project. Owner only.

## Frontend Components

### Repositories Tab

New tab in project settings page (`/teams/[teamId]?tab=repositories`), between Members and Settings.

**Layout:** Clean list (Linear-style). Each row contains:
- GitHub icon + full repo name
- Tech stack tags (from profile, e.g., "TypeScript, NestJS")
- Role badge (colored: purple=backend, blue=frontend, teal=shared)
- Profile status dot (green=ready, amber=scanning, gray=not scanned)
- Actions menu (owner only): Change role, Change branch, Remove

**Footer:** "+ Add repository" button (owner only)

**Members view:** Same list, read-only (no actions menu, no add button)

### Add Repository Dialog

Triggered by "+ Add repository". Shows:
- Dropdown of repos from workspace's GitHub App installation
- Excludes repos already added to the project
- Each option shows: repo name + profile status (green dot = profiled, gray = not yet)
- Role picker: backend / frontend / shared (pill buttons)
- Branch: auto-detected from GitHub default, editable
- Confirm button

On confirm: calls POST endpoint, triggers profile scan if needed, adds to list.

### CodebaseStep (Wizard) Changes

Current behavior: loads user's personal `selectedRepositories` from settings store.

New behavior:
1. On mount, check if current team has configured repos (`useTeamStore` → team.repositories)
2. If team repos exist: pre-fill wizard repo selectors from team repos
   - Primary repo = first team repo (or repo with `role` matching ticket type)
   - Secondary repo = second team repo (if exists)
   - Roles pre-filled from team config
   - Branches default to team's `defaultBranch`
3. If no team repos: fall back to current behavior (user's personal selections)
4. User can remove repos or skip codebase step entirely
5. User cannot add repos outside the team's configured list (dropdown only shows team repos)

### Preview Integration

When user clicks Preview:
1. Check team repos for one with `role === 'frontend'`
2. If found: use that repo + its default branch for preview
3. If not found: fall back to ticket's `repositoryContext` (current behavior)
4. If ticket has an implementation branch: prefer that over the default branch

## Authorization

- **List repos:** Any team member
- **Add/update/remove repos:** Team owner only
- **Ticket creation:** Any team member can use team repos
- **Repo validation:** CreateTicketUseCase checks submitted repos are in team's allowed list (when team repos are configured)

## Migration

No migration required — fully additive:
- Existing teams: `repositories` field is undefined/empty → current behavior preserved
- Existing tickets: keep their per-ticket `repositoryContext` unchanged
- Gradual adoption: team repos become defaults only when an admin configures them
- User-level `selectedRepositories` remains for users without a team (personal workspace)

## Files to Create/Modify

### Backend (new)
- `backend/src/teams/domain/TeamRepository.ts` — Value object
- `backend/src/teams/presentation/controllers/team-repositories.controller.ts` — REST endpoints

### Backend (modify)
- `backend/src/teams/domain/TeamSettings.ts` — Add `repositories` field
- `backend/src/teams/domain/Team.ts` — Add repository accessors
- `backend/src/teams/infrastructure/persistence/FirestoreTeamRepository.ts` — Persist repos
- `backend/src/teams/presentation/controllers/teams.controller.ts` — Wire new controller
- `backend/src/teams/teams.module.ts` — Register new controller
- `backend/src/tickets/application/use-cases/CreateTicketUseCase.ts` — Validate against team repos

### Frontend (new)
- `client/src/teams/components/RepositoriesTab.tsx` — Tab component
- `client/src/teams/components/AddRepositoryDialog.tsx` — Add repo dialog

### Frontend (modify)
- `client/app/(main)/teams/[teamId]/page.tsx` — Add Repositories tab
- `client/src/teams/stores/team.store.ts` — Add repo CRUD actions
- `client/src/teams/services/team.service.ts` — Add repo API methods
- `client/src/tickets/components/wizard/CodebaseStep.tsx` — Pre-fill from team repos
- `client/src/preview/components/PreviewPanel.tsx` — Use frontend-role repo for preview

## Scope Boundaries

**In scope:**
- CRUD for team repos with roles and default branches
- Auto-population in ticket creation wizard
- Preview uses frontend-role repo
- Profile scan trigger on repo add

**Out of scope (future):**
- Enforcing repos as mandatory (currently repos are defaults, not locks)
- Per-repo access control within a team (all members see all team repos)
- Branch protection rules
- Webhook-based repo sync (manual refresh for now)
