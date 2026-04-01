# Project Repository Configuration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add project-level repository configuration so teams can define which repos belong to their project, assign roles (backend/frontend/shared), and auto-populate ticket creation.

**Architecture:** Extend the existing Team domain with a `repositories` array in TeamSettings. New REST endpoints for CRUD. Frontend: new Repositories tab in project settings, wizard integration for auto-population, preview integration for frontend-role repo.

**Tech Stack:** NestJS (backend), React/Next.js (frontend), Firestore (persistence), Zustand (state)

**Spec:** `docs/superpowers/specs/2026-04-01-project-repos-design.md`

---

### Task 1: TeamRepository Value Object (Backend Domain)

**Files:**
- Create: `backend/src/teams/domain/TeamRepository.ts`

- [ ] **Step 1: Create the TeamRepository value object**

```typescript
// backend/src/teams/domain/TeamRepository.ts

/**
 * TeamRepository — Value Object
 *
 * Represents a repository configured for a team/project.
 * Immutable: modifications return new instances.
 */

export type RepositoryRole = 'backend' | 'frontend' | 'shared';

export class TeamRepository {
  readonly repositoryFullName: string;
  readonly role: RepositoryRole;
  readonly defaultBranch: string;
  readonly profileId: string | null;
  readonly addedBy: string;
  readonly addedAt: Date;

  private constructor(
    repositoryFullName: string,
    role: RepositoryRole,
    defaultBranch: string,
    profileId: string | null,
    addedBy: string,
    addedAt: Date,
  ) {
    this.repositoryFullName = repositoryFullName;
    this.role = role;
    this.defaultBranch = defaultBranch;
    this.profileId = profileId;
    this.addedBy = addedBy;
    this.addedAt = addedAt;
  }

  static create(
    repositoryFullName: string,
    role: RepositoryRole,
    defaultBranch: string,
    addedBy: string,
    profileId?: string,
  ): TeamRepository {
    if (!repositoryFullName || !repositoryFullName.includes('/')) {
      throw new Error('repositoryFullName must be in format "owner/repo"');
    }
    return new TeamRepository(
      repositoryFullName,
      role,
      defaultBranch,
      profileId ?? null,
      addedBy,
      new Date(),
    );
  }

  static reconstitute(
    repositoryFullName: string,
    role: RepositoryRole,
    defaultBranch: string,
    profileId: string | null,
    addedBy: string,
    addedAt: Date,
  ): TeamRepository {
    return new TeamRepository(repositoryFullName, role, defaultBranch, profileId, addedBy, addedAt);
  }

  withRole(role: RepositoryRole): TeamRepository {
    return new TeamRepository(this.repositoryFullName, role, this.defaultBranch, this.profileId, this.addedBy, this.addedAt);
  }

  withDefaultBranch(branch: string): TeamRepository {
    return new TeamRepository(this.repositoryFullName, this.role, branch, this.profileId, this.addedBy, this.addedAt);
  }

  withProfileId(profileId: string): TeamRepository {
    return new TeamRepository(this.repositoryFullName, this.role, this.defaultBranch, profileId, this.addedBy, this.addedAt);
  }

  toObject() {
    return {
      repositoryFullName: this.repositoryFullName,
      role: this.role,
      defaultBranch: this.defaultBranch,
      profileId: this.profileId,
      addedBy: this.addedBy,
      addedAt: this.addedAt.toISOString(),
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/teams/domain/TeamRepository.ts
git commit -m "feat(teams): add TeamRepository value object"
```

---

### Task 2: Extend TeamSettings with Repositories

**Files:**
- Modify: `backend/src/teams/domain/TeamSettings.ts`

- [ ] **Step 1: Add repositories field to TeamSettings**

Add `repositories` as a readonly array and update factory methods:

```typescript
// Add import at top
import { TeamRepository } from './TeamRepository';

// Add to class:
readonly repositories: TeamRepository[];

// Update private constructor to accept repositories:
private constructor(
  defaultWorkspaceId: string | undefined,
  allowMemberInvites: boolean,
  repositories: TeamRepository[] = [],
) {
  this.defaultWorkspaceId = defaultWorkspaceId;
  this.allowMemberInvites = allowMemberInvites;
  this.repositories = repositories;
}

// Update static create:
static create(
  defaultWorkspaceId?: string,
  allowMemberInvites: boolean = true,
  repositories: TeamRepository[] = [],
): TeamSettings {
  return new TeamSettings(defaultWorkspaceId, allowMemberInvites, repositories);
}

// Update static default:
static default(): TeamSettings {
  return new TeamSettings(undefined, true, []);
}

// Update fluent setters to carry repositories:
withDefaultWorkspace(workspaceId: string): TeamSettings {
  return new TeamSettings(workspaceId, this.allowMemberInvites, this.repositories);
}

withMemberInvites(allowed: boolean): TeamSettings {
  return new TeamSettings(this.defaultWorkspaceId, allowed, this.repositories);
}

// Add new fluent setter:
withRepositories(repositories: TeamRepository[]): TeamSettings {
  return new TeamSettings(this.defaultWorkspaceId, this.allowMemberInvites, repositories);
}

// Update toObject:
toObject() {
  return {
    defaultWorkspaceId: this.defaultWorkspaceId,
    allowMemberInvites: this.allowMemberInvites,
    repositories: this.repositories.map(r => r.toObject()),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/teams/domain/TeamSettings.ts
git commit -m "feat(teams): extend TeamSettings with repositories array"
```

---

### Task 3: Update Firestore Persistence

**Files:**
- Modify: `backend/src/teams/infrastructure/persistence/FirestoreTeamRepository.ts`

- [ ] **Step 1: Update the mapper to handle repositories**

In the `mapToTeam()` method, add repository reconstitution from Firestore data:

```typescript
// In mapToTeam(), update the TeamSettings.create call:
const repositories = (data.settings?.repositories || []).map((r: any) =>
  TeamRepository.reconstitute(
    r.repositoryFullName,
    r.role,
    r.defaultBranch,
    r.profileId ?? null,
    r.addedBy,
    r.addedAt ? (r.addedAt.toDate ? r.addedAt.toDate() : new Date(r.addedAt)) : new Date(),
  ),
);

const settings = TeamSettings.create(
  data.settings?.defaultWorkspaceId,
  data.settings?.allowMemberInvites ?? true,
  repositories,
);
```

Add the import at top:
```typescript
import { TeamRepository } from '../../domain/TeamRepository';
```

- [ ] **Step 2: Verify save already handles toObject() serialization**

The existing `save()` method calls `team.toObject()` which chains through `settings.toObject()` → `repositories.map(r => r.toObject())`. No changes needed to save — it serializes automatically.

- [ ] **Step 3: Commit**

```bash
git add backend/src/teams/infrastructure/persistence/FirestoreTeamRepository.ts
git commit -m "feat(teams): persist team repositories in Firestore"
```

---

### Task 4: Repository CRUD Endpoints (Backend Controller)

**Files:**
- Create: `backend/src/teams/presentation/controllers/team-repositories.controller.ts`
- Modify: `backend/src/teams/teams.module.ts`

- [ ] **Step 1: Create the controller**

```typescript
// backend/src/teams/presentation/controllers/team-repositories.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { TeamRepository as TeamRepo } from '../../domain/TeamRepository';
import type { RepositoryRole } from '../../domain/TeamRepository';

// Inject the Firestore team repository
import { Inject } from '@nestjs/common';
import { TEAM_REPOSITORY } from '../../application/ports/TeamRepository.port';
import type { TeamRepository } from '../../application/ports/TeamRepository.port';

@Controller('teams/:teamId/repositories')
@UseGuards(FirebaseAuthGuard)
export class TeamRepositoriesController {
  constructor(
    @Inject(TEAM_REPOSITORY)
    private readonly teamRepository: TeamRepository,
  ) {}

  @Get()
  async listRepositories(
    @Param('teamId') teamId: string,
    @Req() req: any,
  ) {
    const team = await this.teamRepository.findById(teamId);
    if (!team) throw new NotFoundException('Team not found');

    return {
      success: true,
      repositories: team.getSettings().repositories.map(r => r.toObject()),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addRepository(
    @Param('teamId') teamId: string,
    @Body() body: { repositoryFullName: string; role: RepositoryRole; defaultBranch?: string },
    @Req() req: any,
  ) {
    const userId = req.user.uid;
    const team = await this.teamRepository.findById(teamId);
    if (!team) throw new NotFoundException('Team not found');
    if (!team.isOwnedBy(userId)) throw new ForbiddenException('Only the project owner can add repositories');

    const settings = team.getSettings();
    const existing = settings.repositories.find(r => r.repositoryFullName === body.repositoryFullName);
    if (existing) throw new BadRequestException('Repository already added to this project');

    const newRepo = TeamRepo.create(
      body.repositoryFullName,
      body.role,
      body.defaultBranch || 'main',
      userId,
    );

    const updatedSettings = settings.withRepositories([...settings.repositories, newRepo]);
    const updatedTeam = team.updateSettings(updatedSettings);
    await this.teamRepository.save(updatedTeam);

    return { success: true, repository: newRepo.toObject() };
  }

  @Patch(':repoName')
  async updateRepository(
    @Param('teamId') teamId: string,
    @Param('repoName') encodedRepoName: string,
    @Body() body: { role?: RepositoryRole; defaultBranch?: string },
    @Req() req: any,
  ) {
    const userId = req.user.uid;
    const repoFullName = encodedRepoName.replace('--', '/');
    const team = await this.teamRepository.findById(teamId);
    if (!team) throw new NotFoundException('Team not found');
    if (!team.isOwnedBy(userId)) throw new ForbiddenException('Only the project owner can update repositories');

    const settings = team.getSettings();
    const idx = settings.repositories.findIndex(r => r.repositoryFullName === repoFullName);
    if (idx === -1) throw new NotFoundException('Repository not found in this project');

    let repo = settings.repositories[idx];
    if (body.role) repo = repo.withRole(body.role);
    if (body.defaultBranch) repo = repo.withDefaultBranch(body.defaultBranch);

    const updatedRepos = [...settings.repositories];
    updatedRepos[idx] = repo;
    const updatedSettings = settings.withRepositories(updatedRepos);
    const updatedTeam = team.updateSettings(updatedSettings);
    await this.teamRepository.save(updatedTeam);

    return { success: true, repository: repo.toObject() };
  }

  @Delete(':repoName')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRepository(
    @Param('teamId') teamId: string,
    @Param('repoName') encodedRepoName: string,
    @Req() req: any,
  ) {
    const userId = req.user.uid;
    const repoFullName = encodedRepoName.replace('--', '/');
    const team = await this.teamRepository.findById(teamId);
    if (!team) throw new NotFoundException('Team not found');
    if (!team.isOwnedBy(userId)) throw new ForbiddenException('Only the project owner can remove repositories');

    const settings = team.getSettings();
    const filtered = settings.repositories.filter(r => r.repositoryFullName !== repoFullName);
    if (filtered.length === settings.repositories.length) throw new NotFoundException('Repository not found in this project');

    const updatedSettings = settings.withRepositories(filtered);
    const updatedTeam = team.updateSettings(updatedSettings);
    await this.teamRepository.save(updatedTeam);
  }
}
```

- [ ] **Step 2: Register controller in teams module**

In `backend/src/teams/teams.module.ts`, add to imports and controllers array:

```typescript
import { TeamRepositoriesController } from './presentation/controllers/team-repositories.controller';

// Add to controllers array:
controllers: [...existingControllers, TeamRepositoriesController],
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/teams/presentation/controllers/team-repositories.controller.ts backend/src/teams/teams.module.ts
git commit -m "feat(teams): add repository CRUD endpoints"
```

---

### Task 5: Frontend Team Service + Store

**Files:**
- Modify: `client/src/teams/services/team.service.ts`
- Modify: `client/src/teams/stores/team.store.ts`

- [ ] **Step 1: Add repo API methods to TeamService**

Add these methods to the `TeamService` class:

```typescript
async getTeamRepositories(teamId: string): Promise<TeamRepositoryResponse[]> {
  const response = await this.fetchWithRetry(`${this.baseUrl}/${teamId}/repositories`);
  if (!response.ok) throw new Error('Failed to load repositories');
  const data = await response.json();
  return data.repositories;
}

async addTeamRepository(teamId: string, request: { repositoryFullName: string; role: string; defaultBranch?: string }): Promise<TeamRepositoryResponse> {
  const response = await this.fetchWithRetry(`${this.baseUrl}/${teamId}/repositories`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to add repository');
  }
  const data = await response.json();
  return data.repository;
}

async updateTeamRepository(teamId: string, repoFullName: string, request: { role?: string; defaultBranch?: string }): Promise<TeamRepositoryResponse> {
  const encoded = repoFullName.replace('/', '--');
  const response = await this.fetchWithRetry(`${this.baseUrl}/${teamId}/repositories/${encoded}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to update repository');
  const data = await response.json();
  return data.repository;
}

async removeTeamRepository(teamId: string, repoFullName: string): Promise<void> {
  const encoded = repoFullName.replace('/', '--');
  const response = await this.fetchWithRetry(`${this.baseUrl}/${teamId}/repositories/${encoded}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to remove repository');
}
```

Add the response type near other types:

```typescript
export interface TeamRepositoryResponse {
  repositoryFullName: string;
  role: 'backend' | 'frontend' | 'shared';
  defaultBranch: string;
  profileId: string | null;
  addedBy: string;
  addedAt: string;
}
```

- [ ] **Step 2: Add repo state and actions to team store**

Add to the store state interface:

```typescript
teamRepositories: TeamRepositoryResponse[];
isLoadingRepos: boolean;

loadTeamRepositories: (teamId: string) => Promise<void>;
addTeamRepository: (teamId: string, repo: { repositoryFullName: string; role: string; defaultBranch?: string }) => Promise<TeamRepositoryResponse | null>;
updateTeamRepository: (teamId: string, repoFullName: string, update: { role?: string; defaultBranch?: string }) => Promise<boolean>;
removeTeamRepository: (teamId: string, repoFullName: string) => Promise<boolean>;
```

Add initial state:

```typescript
teamRepositories: [],
isLoadingRepos: false,
```

Add actions (following existing patterns — lazy service access, try/catch, set state):

```typescript
loadTeamRepositories: async (teamId: string) => {
  set({ isLoadingRepos: true });
  try {
    const { teamService } = useServices();
    const repos = await teamService.getTeamRepositories(teamId);
    set({ teamRepositories: repos, isLoadingRepos: false });
  } catch {
    set({ isLoadingRepos: false });
  }
},

addTeamRepository: async (teamId, repo) => {
  try {
    const { teamService } = useServices();
    const added = await teamService.addTeamRepository(teamId, repo);
    set((s) => ({ teamRepositories: [...s.teamRepositories, added] }));
    return added;
  } catch (e: any) {
    throw e;
  }
},

updateTeamRepository: async (teamId, repoFullName, update) => {
  try {
    const { teamService } = useServices();
    const updated = await teamService.updateTeamRepository(teamId, repoFullName, update);
    set((s) => ({
      teamRepositories: s.teamRepositories.map(r =>
        r.repositoryFullName === repoFullName ? updated : r
      ),
    }));
    return true;
  } catch {
    return false;
  }
},

removeTeamRepository: async (teamId, repoFullName) => {
  try {
    const { teamService } = useServices();
    await teamService.removeTeamRepository(teamId, repoFullName);
    set((s) => ({
      teamRepositories: s.teamRepositories.filter(r => r.repositoryFullName !== repoFullName),
    }));
    return true;
  } catch {
    return false;
  }
},
```

- [ ] **Step 3: Commit**

```bash
git add client/src/teams/services/team.service.ts client/src/teams/stores/team.store.ts
git commit -m "feat(teams): add team repo service methods and store actions"
```

---

### Task 6: Repositories Tab Component

**Files:**
- Create: `client/src/teams/components/RepositoriesTab.tsx`
- Modify: `client/app/(main)/teams/[teamId]/page.tsx`

- [ ] **Step 1: Create RepositoriesTab component**

Create `client/src/teams/components/RepositoriesTab.tsx` — a Linear-style clean list with:
- Header: "Repositories" title + description + "+ Add repository" button (owner only)
- List of repos: each row has GitHub icon, full name, tech stack, role badge (purple=backend, blue=frontend, teal=shared), profile status dot, actions menu (owner only: change role, change branch, remove)
- Empty state when no repos configured
- Uses `useTeamStore` for data, loads on mount

Component should follow the same patterns as `MembersTab.tsx` and `OverviewTab.tsx` — design tokens, `text-[var(--text-secondary)]`, `border-[var(--border-subtle)]`, etc.

- [ ] **Step 2: Add Repositories tab to team detail page**

In `client/app/(main)/teams/[teamId]/page.tsx`, add the tab between Members and Settings:

```typescript
import { RepositoriesTab } from '@/teams/components/RepositoriesTab';

// In TabsList:
<TabsTrigger value="repositories">Repositories</TabsTrigger>

// In TabsContent:
<TabsContent value="repositories">
  <RepositoriesTab teamId={teamId} isOwner={fullTeam?.isOwner ?? false} />
</TabsContent>
```

- [ ] **Step 3: Commit**

```bash
git add client/src/teams/components/RepositoriesTab.tsx client/app/(main)/teams/[teamId]/page.tsx
git commit -m "feat(teams): add Repositories tab to project settings"
```

---

### Task 7: Add Repository Dialog

**Files:**
- Create: `client/src/teams/components/AddRepositoryDialog.tsx`

- [ ] **Step 1: Create AddRepositoryDialog**

Dialog component with:
- Dropdown of repos from `useSettingsStore().selectedRepositories` (GitHub App repos)
- Filter out repos already in team
- Each option shows profile status dot (green=profiled from `useProjectProfileStore`)
- Role picker: 3 pill buttons (backend/frontend/shared)
- Branch field: auto-populated from GitHub default, editable input
- Cancel + Add buttons
- On add: calls `addTeamRepository()` from team store, triggers profile scan if not profiled

Uses existing `Dialog`/`DialogContent` components from `@/core/components/ui/dialog`.

- [ ] **Step 2: Wire dialog into RepositoriesTab**

Import and render `AddRepositoryDialog` in `RepositoriesTab`, triggered by the "+ Add repository" button.

- [ ] **Step 3: Commit**

```bash
git add client/src/teams/components/AddRepositoryDialog.tsx client/src/teams/components/RepositoriesTab.tsx
git commit -m "feat(teams): add repository dialog with role and branch selection"
```

---

### Task 8: Wizard Auto-Population from Team Repos

**Files:**
- Modify: `client/src/tickets/components/wizard/CodebaseStep.tsx`

- [ ] **Step 1: Load team repos on mount and pre-fill**

At the top of `CodebaseStep`, add:

```typescript
const { currentTeam, teamRepositories, loadTeamRepositories } = useTeamStore();

useEffect(() => {
  if (currentTeam?.id && teamRepositories.length === 0) {
    loadTeamRepositories(currentTeam.id);
  }
}, [currentTeam?.id]);
```

When team repos are available and wizard repos are empty, auto-populate:

```typescript
useEffect(() => {
  if (teamRepositories.length > 0 && !input.repoOwner) {
    const primary = teamRepositories.find(r => r.role === 'backend') || teamRepositories[0];
    if (primary) {
      const [owner, name] = primary.repositoryFullName.split('/');
      setRepository(owner, name);
      // Also set in tickets store for branch loading
      ticketsStore.setRepository(primary.repositoryFullName);
    }

    const secondary = teamRepositories.find(r => r.repositoryFullName !== primary?.repositoryFullName);
    if (secondary) {
      const [sOwner, sName] = secondary.repositoryFullName.split('/');
      setSecondaryRepository(sOwner, sName);
      setSecondaryRole(secondary.role);
    }

    if (primary) setPrimaryRole(primary.role);
  }
}, [teamRepositories]);
```

- [ ] **Step 2: Filter repo dropdowns to team repos**

When team repos are configured, replace the dropdown source:

```typescript
const availableRepos = teamRepositories.length > 0
  ? teamRepositories.map(r => ({ id: r.repositoryFullName, fullName: r.repositoryFullName }))
  : selectedRepositories; // fallback to user's personal repos
```

- [ ] **Step 3: Commit**

```bash
git add client/src/tickets/components/wizard/CodebaseStep.tsx
git commit -m "feat(wizard): auto-populate repos from team configuration"
```

---

### Task 9: Preview Uses Frontend-Role Repo

**Files:**
- Modify: `client/app/(main)/tickets/[id]/page.tsx`
- Modify: `client/app/(main)/tickets/page.tsx`

- [ ] **Step 1: Update ticket detail preview to prefer frontend repo**

In the ticket detail page, when opening preview, check team repos for frontend role:

```typescript
const { teamRepositories } = useTeamStore();
const frontendRepo = teamRepositories.find(r => r.role === 'frontend');

// When setting preview:
const previewRepo = frontendRepo
  ? { fullName: frontendRepo.repositoryFullName, branch: frontendRepo.defaultBranch }
  : currentTicket.repositoryContext
    ? { fullName: currentTicket.repositoryContext.repositoryFullName, branch: currentTicket.repositoryContext.branchName }
    : null;
```

- [ ] **Step 2: Same for ticket list preview**

Apply same logic in the tickets list page `onPreview` callback.

- [ ] **Step 3: Commit**

```bash
git add client/app/(main)/tickets/[id]/page.tsx client/app/(main)/tickets/page.tsx
git commit -m "feat(preview): prefer frontend-role repo from team config"
```

---

### Task 10: Verify and Push

- [ ] **Step 1: TypeScript check (both sides)**

```bash
cd backend && npx tsc --noEmit
cd ../client && npx tsc --noEmit
```

- [ ] **Step 2: ESLint check**

```bash
cd backend && npx eslint "{src,apps,libs,test}/**/*.ts"
cd ../client && npx next lint
```

- [ ] **Step 3: Run existing tests**

```bash
cd backend && npx jest --testPathPattern="(Team|AEC)" --no-coverage
```

- [ ] **Step 4: Push branch**

```bash
git push -u origin feat/project-repos
```
