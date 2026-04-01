# Skills Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users choose up to 3 development skills from a curated catalog before starting a Cloud Develop session, with AI-powered auto-recommendation.

**Architecture:** Firestore catalog for UI, skill plugin directories baked into Docker image, `--plugin-dir` flags injected at Claude CLI launch. Context7 MCP always on. Thin Haiku call for auto-recommendation.

**Tech Stack:** NestJS (backend), Next.js/React (frontend), Firestore (catalog), Anthropic Haiku (recommendation), E2B (sandbox), Claude Code CLI (agent)

---

## File Structure

### Backend — New files
- `backend/src/skills/skills.module.ts` — NestJS module
- `backend/src/skills/presentation/controllers/skills.controller.ts` — GET /catalog, POST /recommend
- `backend/src/skills/application/use-cases/GetSkillCatalogUseCase.ts` — reads Firestore
- `backend/src/skills/application/use-cases/RecommendSkillsUseCase.ts` — thin Haiku call
- `backend/src/skills/application/ports/SkillRepository.port.ts` — port interface
- `backend/src/skills/infrastructure/persistence/FirestoreSkillRepository.ts` — Firestore adapter
- `backend/src/skills/domain/Skill.ts` — domain entity
- `backend/src/skills/infrastructure/seed/skill-seed.ts` — seed data for initial catalog

### Backend — Modified files
- `backend/src/sessions/infrastructure/sandbox/E2BSandboxAdapter.ts` — add `--plugin-dir` flags + Context7 MCP
- `backend/src/sessions/infrastructure/container/forge-sandbox.Dockerfile` — COPY skills/
- `backend/src/sessions/application/services/SystemPromptBuilder.ts` — harden ticket reading + Context7 instruction
- `backend/src/sessions/presentation/controllers/sessions.controller.ts` — parse `skills` query param
- `backend/src/sessions/application/use-cases/StartSessionUseCase.ts` — pass skillIds through
- `backend/src/app.module.ts` — import SkillsModule

### Frontend — New files
- `client/src/sessions/stores/skills.store.ts` — Zustand store for catalog + recommendations
- `client/src/sessions/components/molecules/SkillPicker.tsx` — collapsible skill picker UI

### Frontend — Modified files
- `client/src/sessions/components/organisms/DevelopButton.tsx` — render SkillPicker, pass skillIds
- `client/src/sessions/stores/session.store.ts` — accept skillIds, append to URL

### Docker / Config
- `backend/skills/` — skill plugin directories (created by user, COPY'd into image)

---

## Task 1: Skill Domain Entity + Firestore Repository

**Files:**
- Create: `backend/src/skills/domain/Skill.ts`
- Create: `backend/src/skills/application/ports/SkillRepository.port.ts`
- Create: `backend/src/skills/infrastructure/persistence/FirestoreSkillRepository.ts`

- [ ] **Step 1: Create domain entity**

```typescript
// backend/src/skills/domain/Skill.ts
export interface Skill {
  id: string;
  name: string;
  description: string;
  expandedDescription: string;
  icon: string;
  category: 'architecture' | 'testing' | 'security' | 'quality' | 'tooling';
  version: string;
  pluginDirName: string;
  enabled: boolean;
  order: number;
}
```

- [ ] **Step 2: Create repository port**

```typescript
// backend/src/skills/application/ports/SkillRepository.port.ts
import { Skill } from '../../domain/Skill';

export const SKILL_REPOSITORY = Symbol('SkillRepository');

export interface SkillRepository {
  findAllEnabled(): Promise<Skill[]>;
  findByIds(ids: string[]): Promise<Skill[]>;
}
```

- [ ] **Step 3: Create Firestore adapter**

```typescript
// backend/src/skills/infrastructure/persistence/FirestoreSkillRepository.ts
import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';
import { SkillRepository } from '../../application/ports/SkillRepository.port';
import { Skill } from '../../domain/Skill';

@Injectable()
export class FirestoreSkillRepository implements SkillRepository {
  constructor(private readonly firebaseService: FirebaseService) {}

  async findAllEnabled(): Promise<Skill[]> {
    const firestore = this.firebaseService.getFirestore();
    const snapshot = await firestore
      .collection('skills')
      .where('enabled', '==', true)
      .orderBy('order')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill));
  }

  async findByIds(ids: string[]): Promise<Skill[]> {
    if (ids.length === 0) return [];
    const firestore = this.firebaseService.getFirestore();
    const docs = await Promise.all(
      ids.map(id => firestore.collection('skills').doc(id).get())
    );
    return docs
      .filter(doc => doc.exists)
      .map(doc => ({ id: doc.id, ...doc.data() } as Skill));
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/skills/
git commit -m "feat(skills): domain entity and Firestore repository"
```

---

## Task 2: Skill Catalog Use Case + Controller

**Files:**
- Create: `backend/src/skills/application/use-cases/GetSkillCatalogUseCase.ts`
- Create: `backend/src/skills/presentation/controllers/skills.controller.ts`
- Create: `backend/src/skills/skills.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Create GetSkillCatalogUseCase**

```typescript
// backend/src/skills/application/use-cases/GetSkillCatalogUseCase.ts
import { Injectable, Inject } from '@nestjs/common';
import { SKILL_REPOSITORY, SkillRepository } from '../ports/SkillRepository.port';

export interface SkillCatalogItem {
  id: string;
  name: string;
  description: string;
  expandedDescription: string;
  icon: string;
  category: string;
}

@Injectable()
export class GetSkillCatalogUseCase {
  constructor(
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
  ) {}

  async execute(): Promise<SkillCatalogItem[]> {
    const skills = await this.skillRepository.findAllEnabled();
    return skills.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      expandedDescription: s.expandedDescription,
      icon: s.icon,
      category: s.category,
    }));
  }
}
```

- [ ] **Step 2: Create controller**

```typescript
// backend/src/skills/presentation/controllers/skills.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { GetSkillCatalogUseCase } from '../../application/use-cases/GetSkillCatalogUseCase';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';

@Controller('skills')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class SkillsController {
  constructor(private readonly getSkillCatalogUseCase: GetSkillCatalogUseCase) {}

  @Get('catalog')
  async getCatalog() {
    return this.getSkillCatalogUseCase.execute();
  }
}
```

- [ ] **Step 3: Create module and register in AppModule**

```typescript
// backend/src/skills/skills.module.ts
import { Module } from '@nestjs/common';
import { SkillsController } from './presentation/controllers/skills.controller';
import { GetSkillCatalogUseCase } from './application/use-cases/GetSkillCatalogUseCase';
import { SKILL_REPOSITORY } from './application/ports/SkillRepository.port';
import { FirestoreSkillRepository } from './infrastructure/persistence/FirestoreSkillRepository';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [SkillsController],
  providers: [
    GetSkillCatalogUseCase,
    { provide: SKILL_REPOSITORY, useClass: FirestoreSkillRepository },
  ],
  exports: [SKILL_REPOSITORY, GetSkillCatalogUseCase],
})
export class SkillsModule {}
```

Add `SkillsModule` to imports in `backend/src/app.module.ts`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/skills/ backend/src/app.module.ts
git commit -m "feat(skills): catalog endpoint GET /skills/catalog"
```

---

## Task 3: Skill Recommendation Use Case (Haiku)

**Files:**
- Create: `backend/src/skills/application/use-cases/RecommendSkillsUseCase.ts`
- Modify: `backend/src/skills/presentation/controllers/skills.controller.ts`
- Modify: `backend/src/skills/skills.module.ts`

- [ ] **Step 1: Create RecommendSkillsUseCase**

```typescript
// backend/src/skills/application/use-cases/RecommendSkillsUseCase.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { SKILL_REPOSITORY, SkillRepository } from '../ports/SkillRepository.port';
import { AECRepository, AEC_REPOSITORY } from '../../../tickets/application/ports/AECRepository';
import Anthropic from '@anthropic-ai/sdk';

interface SkillRecommendation {
  skillId: string;
  reason: string;
}

@Injectable()
export class RecommendSkillsUseCase {
  private readonly logger = new Logger(RecommendSkillsUseCase.name);
  private readonly anthropic = new Anthropic();

  constructor(
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
    @Inject(AEC_REPOSITORY) private readonly aecRepository: AECRepository,
  ) {}

  async execute(ticketId: string, teamId: string): Promise<{ recommended: SkillRecommendation[] }> {
    const [skills, aec] = await Promise.all([
      this.skillRepository.findAllEnabled(),
      this.aecRepository.findById(ticketId),
    ]);

    if (!aec || skills.length === 0) {
      return { recommended: [] };
    }

    const ticketSummary = [
      `Title: ${aec.title}`,
      aec.description ? `Description: ${aec.description}` : '',
      aec.techSpec?.acceptanceCriteria?.length
        ? `Acceptance Criteria: ${aec.techSpec.acceptanceCriteria.join('; ')}`
        : '',
      aec.techSpec?.fileChanges?.length
        ? `Files to change: ${aec.techSpec.fileChanges.map((f: any) => f.path).join(', ')}`
        : '',
      aec.techSpec?.apiChanges?.endpoints?.length
        ? `API endpoints: ${aec.techSpec.apiChanges.endpoints.length}`
        : '',
    ].filter(Boolean).join('\n');

    const skillMenu = skills.map(s =>
      `- ${s.id}: ${s.name} — ${s.description}`
    ).join('\n');

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `You are selecting development skills for an AI coding agent. Given this ticket and available skills, pick up to 3 that would be most helpful. Return ONLY valid JSON.

TICKET:
${ticketSummary}

AVAILABLE SKILLS:
${skillMenu}

Return JSON: {"recommended": [{"skillId": "id", "reason": "one sentence why"}]}
Pick 1-3 skills. If none are clearly helpful, return an empty array.`,
        }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(text);
      return {
        recommended: (parsed.recommended || []).slice(0, 3),
      };
    } catch (error) {
      this.logger.warn(`Skill recommendation failed: ${error}`);
      return { recommended: [] };
    }
  }
}
```

- [ ] **Step 2: Add POST /skills/recommend endpoint**

Add to `skills.controller.ts`:

```typescript
import { Post, Body } from '@nestjs/common';
import { RecommendSkillsUseCase } from '../../application/use-cases/RecommendSkillsUseCase';
import { TeamId } from '../../../shared/presentation/decorators/TeamId.decorator';

// In the controller class:
constructor(
  private readonly getSkillCatalogUseCase: GetSkillCatalogUseCase,
  private readonly recommendSkillsUseCase: RecommendSkillsUseCase,
) {}

@Post('recommend')
async recommend(
  @TeamId() teamId: string,
  @Body() body: { ticketId: string },
) {
  return this.recommendSkillsUseCase.execute(body.ticketId, teamId);
}
```

- [ ] **Step 3: Register in module**

Add `RecommendSkillsUseCase` to `skills.module.ts` providers. Import `TicketsModule` (or add `AEC_REPOSITORY` provider).

- [ ] **Step 4: Commit**

```bash
git add backend/src/skills/
git commit -m "feat(skills): AI-powered skill recommendation via Haiku"
```

---

## Task 4: Seed Initial Skill Catalog into Firestore

**Files:**
- Create: `backend/src/skills/infrastructure/seed/skill-seed.ts`

- [ ] **Step 1: Create seed script**

```typescript
// backend/src/skills/infrastructure/seed/skill-seed.ts
import { Skill } from '../../domain/Skill';

export const SEED_SKILLS: Omit<Skill, 'id'>[] = [
  {
    name: 'Clean Architecture',
    description: 'Keeps code organized and easy to change',
    expandedDescription: 'Ensures the AI separates your code into clear layers — so business logic doesn\'t get tangled with databases, APIs, or UI. Makes the codebase easier to maintain and extend.',
    icon: '🏗',
    category: 'architecture',
    version: '1.0.0',
    pluginDirName: 'clean-architecture',
    enabled: true,
    order: 1,
  },
  {
    name: 'Test-Driven Development',
    description: 'Writes tests before code for fewer bugs',
    expandedDescription: 'The AI writes automated tests first, then implements the feature to pass them. Catches bugs early and ensures everything works as specified.',
    icon: '🧪',
    category: 'testing',
    version: '1.0.0',
    pluginDirName: 'tdd',
    enabled: true,
    order: 2,
  },
  {
    name: 'Security Audit',
    description: 'Checks for vulnerabilities as it codes',
    expandedDescription: 'Scans for common security issues like injection attacks, broken authentication, and data exposure. Follows industry-standard security checklists (OWASP).',
    icon: '🔒',
    category: 'security',
    version: '1.0.0',
    pluginDirName: 'security-audit',
    enabled: true,
    order: 3,
  },
  {
    name: 'Code Review Ready',
    description: 'Produces clean, well-documented code',
    expandedDescription: 'The AI writes clear commit messages, adds comments where needed, and structures code so your team can review it quickly and confidently.',
    icon: '📋',
    category: 'quality',
    version: '1.0.0',
    pluginDirName: 'code-review-ready',
    enabled: true,
    order: 4,
  },
  {
    name: 'Performance',
    description: 'Optimizes for speed and efficiency',
    expandedDescription: 'Focuses on fast load times, efficient database queries, and minimal resource usage. Avoids common performance pitfalls.',
    icon: '⚡',
    category: 'quality',
    version: '1.0.0',
    pluginDirName: 'performance',
    enabled: true,
    order: 5,
  },
];
```

- [ ] **Step 2: Add seed method to repository**

Add to `FirestoreSkillRepository`:

```typescript
async seedIfEmpty(): Promise<void> {
  const existing = await this.findAllEnabled();
  if (existing.length > 0) return;

  const firestore = this.firebaseService.getFirestore();
  const batch = firestore.batch();

  for (const skill of SEED_SKILLS) {
    const ref = firestore.collection('skills').doc(skill.pluginDirName);
    batch.set(ref, skill);
  }

  await batch.commit();
}
```

- [ ] **Step 3: Call seed on module init**

In `skills.module.ts`, add `OnModuleInit`:

```typescript
@Module({ ... })
export class SkillsModule implements OnModuleInit {
  constructor(@Inject(SKILL_REPOSITORY) private readonly repo: FirestoreSkillRepository) {}
  async onModuleInit() {
    await this.repo.seedIfEmpty();
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/skills/
git commit -m "feat(skills): seed initial skill catalog into Firestore"
```

---

## Task 5: Pass Skill IDs Through Session Start Flow

**Files:**
- Modify: `backend/src/sessions/presentation/controllers/sessions.controller.ts`
- Modify: `backend/src/sessions/application/use-cases/StartSessionUseCase.ts`

- [ ] **Step 1: Parse skills query param in controller**

In `sessions.controller.ts`, add `@Query` to `startSession`:

```typescript
import { Query } from '@nestjs/common';

@Post(':ticketId/start')
async startSession(
  @Param('ticketId') ticketId: string,
  @Query('skills') skillsParam: string | undefined,
  @TeamId() teamId: string,
  @WorkspaceId() workspaceId: string,
  @UserId() userId: string,
  @Res() res: Response,
): Promise<void> {
  const skillIds = skillsParam ? skillsParam.split(',').filter(Boolean) : [];

  const { sessionId, repoOwner, repoName, branch, model, maxDurationMs, fileChanges } =
    await this.startSessionUseCase.execute({ ticketId, userId, teamId });
```

Pass `skillIds` into the sandbox config:

```typescript
const sandboxConfig = {
  // ...existing fields...
  skillIds,
};
```

- [ ] **Step 2: Add skillIds to SandboxConfig interface**

In `E2BSandboxAdapter.ts`, extend the config interface to include `skillIds: string[]`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/sessions/
git commit -m "feat(sessions): pass skillIds through session start flow"
```

---

## Task 6: Inject Skills + Context7 into Sandbox

**Files:**
- Modify: `backend/src/sessions/infrastructure/sandbox/E2BSandboxAdapter.ts`
- Modify: `backend/src/sessions/infrastructure/container/forge-sandbox.Dockerfile`
- Modify: `backend/src/sessions/application/services/SystemPromptBuilder.ts`

- [ ] **Step 1: Add COPY skills to Dockerfile**

Add after the MCP server COPY:

```dockerfile
# Skill plugin directories (for --plugin-dir injection)
COPY ../../skills/ /home/user/skills/
RUN chown -R user:user /home/user/skills
```

Note: The exact COPY path depends on the Docker build context. If the Dockerfile is at `backend/src/sessions/infrastructure/container/`, the skills at `backend/skills/` need the correct relative path or the build context adjusted.

- [ ] **Step 2: Add Context7 to MCP config in E2BSandboxAdapter**

In `E2BSandboxAdapter.ts`, where MCP config is written (line ~110-123), add context7:

```typescript
const mcpConfig = {
  mcpServers: {
    forge: {
      command: 'node',
      args: ['/home/user/forge-mcp-server/dist/index.js'],
      env: {
        FORGE_API_URL: config.forgeApiUrl,
        FORGE_SESSION_JWT: config.forgeSessionJwt,
        TICKET_ID: config.ticketId,
      },
    },
    context7: {
      type: 'url',
      url: 'https://mcp.context7.com/mcp',
      headers: {
        CONTEXT7_API_KEY: process.env.CONTEXT7_API_KEY || '',
      },
    },
  },
};
```

- [ ] **Step 3: Build --plugin-dir flags from skillIds**

In `E2BSandboxAdapter.ts`, where the Claude CLI command is built (line ~140):

```typescript
const pluginFlags = (config.skillIds || [])
  .map(id => ` --plugin-dir /home/user/skills/${id}`)
  .join('');

const commandHandle = await sandbox.commands.run(
  `claude -p "Implement the ticket according to the system prompt instructions." --append-system-prompt-file /home/user/system_prompt.txt --output-format stream-json --verbose --model ${toClaudeCodeModel(config.model)} --max-turns 30 --dangerously-skip-permissions${mcpFlag}${pluginFlags}`,
  { ... }
);
```

- [ ] **Step 4: Harden system prompt**

In `SystemPromptBuilder.ts`, add at the top of the prompt:

```typescript
let prompt = `You are implementing a ticket on an existing codebase.

CRITICAL: Before writing ANY code, you MUST:
1. Call get_ticket_context to read the FULL ticket specification
2. Call get_repository_context to understand the codebase architecture
3. Read CLAUDE.md if it exists in the repo root
Only AFTER understanding the full context should you begin implementation.

When implementing code that uses external libraries, frameworks, or APIs,
use the Context7 MCP tools (resolve-library-id then query-docs) to fetch
up-to-date documentation. Do not rely on training data for library APIs.

RULES:
...`;
```

- [ ] **Step 5: Add CONTEXT7_API_KEY to .env.example**

```
CONTEXT7_API_KEY=your-context7-api-key
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/sessions/ backend/skills/ .env.example
git commit -m "feat(sessions): inject skills via --plugin-dir + Context7 MCP"
```

---

## Task 7: Frontend Skills Store

**Files:**
- Create: `client/src/sessions/stores/skills.store.ts`

- [ ] **Step 1: Create Zustand store**

```typescript
// client/src/sessions/stores/skills.store.ts
import { create } from 'zustand';
import { auth } from '@/lib/firebase';
import { useTeamStore } from '@/teams/stores/team.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface SkillCatalogItem {
  id: string;
  name: string;
  description: string;
  expandedDescription: string;
  icon: string;
  category: string;
}

interface SkillRecommendation {
  skillId: string;
  reason: string;
}

interface SkillsState {
  catalog: SkillCatalogItem[];
  recommended: SkillRecommendation[];
  selectedIds: string[];
  mode: 'auto' | 'manual';
  isLoadingCatalog: boolean;
  isLoadingRecommendations: boolean;

  fetchCatalog: () => Promise<void>;
  fetchRecommendations: (ticketId: string) => Promise<void>;
  toggleSkill: (skillId: string) => void;
  setMode: (mode: 'auto' | 'manual') => void;
  getEffectiveSkillIds: () => string[];
}

async function authFetch(path: string): Promise<Response> {
  const user = auth.currentUser;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (user) headers['Authorization'] = `Bearer ${await user.getIdToken()}`;
  const teamId = useTeamStore.getState().currentTeam?.id;
  if (teamId) headers['x-team-id'] = teamId;
  return fetch(`${API_URL}${path}`, { headers });
}

const MAX_SKILLS = 3;

export const useSkillsStore = create<SkillsState>((set, get) => ({
  catalog: [],
  recommended: [],
  selectedIds: [],
  mode: 'auto',
  isLoadingCatalog: false,
  isLoadingRecommendations: false,

  fetchCatalog: async () => {
    if (get().catalog.length > 0) return;
    set({ isLoadingCatalog: true });
    try {
      const res = await authFetch('/skills/catalog');
      if (res.ok) {
        const data = await res.json();
        set({ catalog: data, isLoadingCatalog: false });
      }
    } catch {
      set({ isLoadingCatalog: false });
    }
  },

  fetchRecommendations: async (ticketId: string) => {
    const cacheKey = `forge:skill-recs:${ticketId}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        set({
          recommended: parsed,
          selectedIds: parsed.map((r: SkillRecommendation) => r.skillId),
        });
        return;
      } catch {}
    }

    set({ isLoadingRecommendations: true });
    try {
      const res = await fetch(`${API_URL}/skills/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
          'x-team-id': useTeamStore.getState().currentTeam?.id || '',
        },
        body: JSON.stringify({ ticketId }),
      });
      if (res.ok) {
        const data = await res.json();
        const recs = data.recommended || [];
        sessionStorage.setItem(cacheKey, JSON.stringify(recs));
        set({
          recommended: recs,
          selectedIds: recs.map((r: SkillRecommendation) => r.skillId),
          isLoadingRecommendations: false,
        });
      }
    } catch {
      set({ isLoadingRecommendations: false });
    }
  },

  toggleSkill: (skillId: string) => {
    const { selectedIds } = get();
    if (selectedIds.includes(skillId)) {
      set({ selectedIds: selectedIds.filter(id => id !== skillId) });
    } else if (selectedIds.length < MAX_SKILLS) {
      set({ selectedIds: [...selectedIds, skillId] });
    }
  },

  setMode: (mode) => {
    set({ mode });
    if (mode === 'manual') {
      set({ selectedIds: [] });
    }
  },

  getEffectiveSkillIds: () => {
    const { mode, selectedIds, recommended } = get();
    if (mode === 'auto') {
      return recommended.map(r => r.skillId);
    }
    return selectedIds;
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add client/src/sessions/stores/skills.store.ts
git commit -m "feat(skills): frontend Zustand store with catalog, recommendations, and selection"
```

---

## Task 8: Skill Picker UI Component

**Files:**
- Create: `client/src/sessions/components/molecules/SkillPicker.tsx`

- [ ] **Step 1: Create SkillPicker component**

```typescript
// client/src/sessions/components/molecules/SkillPicker.tsx
'use client';

import { useState, useEffect } from 'react';
import { Settings, Loader2, Sparkles } from 'lucide-react';
import { useSkillsStore } from '../../stores/skills.store';

interface SkillPickerProps {
  ticketId: string;
}

export function SkillPicker({ ticketId }: SkillPickerProps) {
  const {
    catalog, recommended, selectedIds, mode,
    isLoadingCatalog, isLoadingRecommendations,
    fetchCatalog, fetchRecommendations, toggleSkill, setMode,
  } = useSkillsStore();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchCatalog();
    fetchRecommendations(ticketId);
  }, [ticketId, fetchCatalog, fetchRecommendations]);

  const effectiveIds = mode === 'auto'
    ? recommended.map(r => r.skillId)
    : selectedIds;
  const count = effectiveIds.length;
  const isLoading = isLoadingCatalog || isLoadingRecommendations;

  return (
    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[var(--bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          <span className="text-[12px] font-medium text-[var(--text-secondary)]">Skills</span>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="w-3 h-3 text-[var(--text-tertiary)] animate-spin" />
          ) : (
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {mode === 'auto' ? `Auto · ${count} recommended` : `Manual · ${count} of 3`}
            </span>
          )}
          <span className="text-[10px] text-[var(--text-tertiary)]">{expanded ? '▴' : '▾'}</span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[var(--border-subtle)]">
          {/* Mode toggle */}
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[var(--border-subtle)]">
            <div className="inline-flex rounded-md bg-[var(--bg-hover)] p-0.5">
              {(['auto', 'manual'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    mode === m
                      ? 'bg-[var(--bg)] text-[var(--text)] shadow-sm'
                      : 'text-[var(--text-tertiary)]'
                  }`}
                >
                  {m === 'auto' ? 'Auto' : 'Manual'}
                </button>
              ))}
            </div>
            {mode === 'auto' && (
              <span className="text-[9px] text-[var(--text-tertiary)] flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> AI recommended
              </span>
            )}
          </div>

          {/* Skill cards */}
          <div className="divide-y divide-[var(--border-subtle)]">
            {catalog.map(skill => {
              const isSelected = effectiveIds.includes(skill.id);
              const isDisabled = !isSelected && effectiveIds.length >= 3 && mode === 'manual';
              const rec = recommended.find(r => r.skillId === skill.id);

              return (
                <div
                  key={skill.id}
                  className={`flex items-center gap-3 px-3.5 py-2.5 ${isDisabled ? 'opacity-30' : ''}`}
                >
                  <span className="text-[16px] shrink-0">{skill.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-medium text-[var(--text)]">{skill.name}</span>
                      {mode === 'auto' && rec && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">REC</span>
                      )}
                    </div>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 line-clamp-1">{skill.description}</p>
                    {mode === 'auto' && rec && (
                      <p className="text-[9px] text-[var(--text-tertiary)]/60 mt-0.5 italic">{rec.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => mode === 'manual' && !isDisabled && toggleSkill(skill.id)}
                    disabled={mode === 'auto' || isDisabled}
                    className="shrink-0"
                  >
                    <div className={`w-8 h-[18px] rounded-full transition-colors relative ${
                      isSelected ? 'bg-emerald-500' : 'bg-[var(--bg-hover)]'
                    } ${mode === 'auto' ? 'opacity-60' : ''}`}>
                      <div className={`w-[14px] h-[14px] rounded-full bg-white absolute top-[2px] transition-all ${
                        isSelected ? 'right-[2px]' : 'left-[2px]'
                      }`} />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Max hint */}
          {mode === 'manual' && effectiveIds.length >= 3 && (
            <div className="px-3.5 py-2 text-center text-[9px] text-[var(--text-tertiary)] bg-[var(--bg-hover)]/50">
              Max 3 skills per session
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/sessions/components/molecules/SkillPicker.tsx
git commit -m "feat(skills): SkillPicker UI component with auto/manual modes"
```

---

## Task 9: Wire SkillPicker into DevelopButton + Session Store

**Files:**
- Modify: `client/src/sessions/components/organisms/DevelopButton.tsx`
- Modify: `client/src/sessions/stores/session.store.ts`

- [ ] **Step 1: Add SkillPicker to DevelopButton**

In `DevelopButton.tsx`, import and render `SkillPicker` between the header and the start button:

```typescript
import { SkillPicker } from '../molecules/SkillPicker';
import { useSkillsStore } from '../../stores/skills.store';

// Inside the component, before the start button:
<SkillPicker ticketId={ticketId} />
```

Update the `onStart` handler to pass skill IDs:

```typescript
const { getEffectiveSkillIds } = useSkillsStore();

<button
  onClick={() => onStart(getEffectiveSkillIds())}
  ...
>
```

Update `DevelopButtonProps` and `SessionMonitorView` to pass `skillIds` through to `startSession`.

- [ ] **Step 2: Update session store to accept skillIds**

In `session.store.ts`, change `startSession` signature:

```typescript
startSession: async (ticketId: string, skillIds?: string[]) => {
  // ...existing code...

  const skillsParam = skillIds?.length ? `?skills=${skillIds.join(',')}` : '';
  const response = await authFetch(`/sessions/${ticketId}/start${skillsParam}`, {
    method: 'POST',
    signal: abortController.signal,
  });
```

- [ ] **Step 3: Commit**

```bash
git add client/src/sessions/
git commit -m "feat(skills): wire SkillPicker into DevelopButton and session start flow"
```

---

## Task 10: End-to-End Testing + Cleanup

**Files:**
- Verify all connections work

- [ ] **Step 1: Verify catalog endpoint**

```bash
curl -H "Authorization: Bearer $TOKEN" -H "x-team-id: $TEAM_ID" \
  http://localhost:3000/api/skills/catalog
```

Expected: JSON array of 5 skill items.

- [ ] **Step 2: Verify recommendation endpoint**

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" -H "x-team-id: $TEAM_ID" \
  -H "Content-Type: application/json" \
  -d '{"ticketId": "your-ticket-id"}' \
  http://localhost:3000/api/skills/recommend
```

Expected: JSON with `recommended` array, 1-3 items.

- [ ] **Step 3: Verify UI flow**

1. Open a ticket → click Develop
2. Blade opens → skill picker shows collapsed with "Auto · X recommended"
3. Expand → see skill cards with recommendations
4. Switch to Manual → toggles become interactive
5. Select 3 → 4th is disabled
6. Click Start Development → check server logs for `--plugin-dir` flags

- [ ] **Step 4: Verify Context7 in MCP config**

Check sandbox logs for the MCP config containing `context7` server entry.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(skills): complete skills marketplace — catalog, recommendations, injection"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Domain + Repository | 3 new backend files |
| 2 | Catalog endpoint | 3 new + 1 modified backend |
| 3 | Recommendation (Haiku) | 1 new + 2 modified backend |
| 4 | Seed data | 1 new + 1 modified backend |
| 5 | Session flow passthrough | 2 modified backend |
| 6 | Sandbox injection + Context7 | 3 modified backend + Dockerfile |
| 7 | Frontend store | 1 new client |
| 8 | SkillPicker component | 1 new client |
| 9 | Wire into DevelopButton | 2 modified client |
| 10 | E2E verification | 0 new files |
