# Skills Marketplace — Design Spec

**Date:** 2026-03-31
**Status:** Draft
**Epic:** Cloud Develop (Epic 18)

---

## Overview

Pluggable skills for the Cloud Develop sandbox. Users browse a curated skill catalog in the Develop blade, toggle up to 3 skills, and launch development. Selected skills are loaded as Claude Code plugins via `--plugin-dir` flags. Context7 (library documentation MCP) is always active and not user-selectable.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Skill format | Full plugin directories (SKILL.md + scripts/ + reference/) | Scripts execute deterministically — no repeated LLM interpretation |
| Storage | Baked into Docker image from repo | Fast startup, no downloads, version controlled |
| Metadata catalog | Firestore `skills` collection | UI reads catalog, decoupled from filesystem |
| User selection | Collapsible section in Develop blade | Zero friction for quick flow, power for those who want it |
| Selection memory | localStorage | Remembers last picks, no backend persistence needed |
| Max skills | 3 per session | Prevents conflicting instructions and context bloat |
| Auto mode | Forge auto-selects recommended skills based on ticket | Zero-friction default, user can override |
| Context7 | Always-on MCP server, not user-selectable | Every session benefits from up-to-date library docs |
| Ticket reading | Hardened system prompt | Agent MUST read full ticket before any code |

## Data Model

### Firestore: `skills` collection

```typescript
interface SkillDocument {
  id: string;              // matches directory name: "clean-architecture"
  name: string;            // display: "Clean Architecture"
  description: string;     // one-liner for card UI
  icon: string;            // emoji: "🏗"
  category: 'architecture' | 'testing' | 'security' | 'quality' | 'tooling';
  version: string;         // "1.0.0"
  pluginDirName: string;   // directory in Docker image: "clean-architecture"
  enabled: boolean;        // admin toggle
  order: number;           // display order
}
```

### Filesystem Contract

**In the repo:**
```
backend/skills/
├── clean-architecture/
│   ├── SKILL.md
│   ├── scripts/
│   └── reference/
├── tdd/
│   ├── SKILL.md
│   └── scripts/
├── security-audit/
│   ├── SKILL.md
│   └── reference/
├── code-review-ready/
│   └── SKILL.md
└── performance/
    └── SKILL.md
```

**In the Docker image:**
```
/home/user/skills/<skill-id>/
```

Copied during Docker build via `COPY backend/skills/ /home/user/skills/`.

## Architecture

### Sandbox Injection

The Claude CLI launch command gains `--plugin-dir` flags:

```bash
claude -p "Implement the ticket..." \
  --append-system-prompt-file /home/user/system_prompt.txt \
  --mcp-config /home/user/.forge-mcp.json \
  --plugin-dir /home/user/skills/clean-architecture \
  --plugin-dir /home/user/skills/tdd \
  --output-format stream-json \
  --verbose \
  --model ${model} \
  --max-turns 30 \
  --dangerously-skip-permissions
```

`E2BSandboxAdapter.ts` builds the `--plugin-dir` flags from the `skillIds` array passed through the session start flow.

### Context7 Integration

**Always-on MCP server.** Not a user-selectable skill.

Context7 provides two tools to the agent:
- `resolve-library-id` — resolves a library name to a Context7 ID
- `query-docs` — retrieves up-to-date documentation for a library

**Installation mode: MCP** (not CLI + Skills). The MCP server is a remote URL, no npm install needed.

**Setup:** Add Context7 to the `.forge-mcp.json` config that's written to the sandbox:

```json
{
  "mcpServers": {
    "forge": {
      "command": "node",
      "args": ["/home/user/forge-mcp-server/dist/index.js"],
      "env": { ... }
    },
    "context7": {
      "type": "url",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
      }
    }
  }
}
```

**Environment:** `CONTEXT7_API_KEY` stored in backend `.env`, passed to sandbox config and injected into the MCP JSON. The key is: `ctx7sk-433ebf06-58f8-44e8-852b-2915776f2855`.

**System prompt addition:**
```
When implementing code that uses external libraries, frameworks, or APIs,
use the Context7 MCP tools (resolve-library-id → query-docs) to fetch
up-to-date documentation before writing code. Do not rely on training data
for library APIs.
```

**No npm install, no `npx ctx7 setup`, no CLI tools needed.** The MCP server is remote — just a URL + API key in the config.

### System Prompt Changes

`SystemPromptBuilder.ts` updated with a hard rule:

```
CRITICAL: Before writing ANY code, you MUST:
1. Call get_ticket_context to read the FULL ticket specification
2. Call get_repository_context to understand the codebase architecture
3. Read CLAUDE.md if it exists in the repo root
Only AFTER understanding the full context should you begin implementation.
```

## API

### New Endpoint: `GET /skills/catalog`

Returns the skill list for the UI.

```typescript
// Controller
@Get('catalog')
async getCatalog(@TeamId() teamId: string): Promise<SkillCatalogItem[]> {
  return this.getSkillCatalogUseCase.execute();
}

// Response
interface SkillCatalogItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}
```

Reads from Firestore `skills` collection, filters `enabled: true`, orders by `order`.

### Modified Endpoint: `POST /sessions/:ticketId/start`

Accepts optional `skillIds` in the request body (sent as query params or parsed from the SSE request).

Since the current start endpoint uses SSE (not JSON body), the skill IDs are passed as a query parameter:

```
POST /sessions/:ticketId/start?skills=clean-architecture,tdd
```

`StartSessionUseCase` validates skill IDs against the Firestore catalog, passes them to the sandbox adapter.

## Frontend

### New Components

**`SkillPicker`** — Collapsible section in `DevelopButton` organism.

```
┌─────────────────────────────┐
│ ⚙ Skills          0 of 3 ▾ │  ← collapsed (default)
└─────────────────────────────┘

┌─────────────────────────────┐
│ ⚙ Skills          2 of 3 ▴ │  ← expanded
├─────────────────────────────┤
│ 🏗 Clean Architecture    [✓]│
│    Ports & adapters          │
│ 🧪 TDD                  [✓]│
│    Write tests first         │
│ 🔒 Security Audit       [ ]│
│    OWASP checks              │
│ ⚡ Performance        [dim] │
│    Max 3 skills per session  │
└─────────────────────────────┘
```

**`useSkillsStore`** — Zustand store.
- `skills: SkillCatalogItem[]` — fetched from `GET /skills/catalog`
- `selectedIds: string[]` — toggled by user, max 3
- `fetchCatalog()` — called on Develop blade mount
- Selection persisted to `localStorage('forge:selected-skills')`

### Modified Components

**`DevelopButton`** — Renders `SkillPicker` between header and start button. Passes `selectedIds` to `startSession`.

**`useSessionStore.startSession`** — Accepts optional `skillIds`, appends as query param to the SSE request URL.

## Initial Skill Catalog (Seed Data)

| ID | Name | Icon | Category | Card Description | Expanded Description |
|----|------|------|----------|-----------------|---------------------|
| `clean-architecture` | Clean Architecture | 🏗 | architecture | Keeps code organized and easy to change | Ensures the AI separates your code into clear layers — so business logic doesn't get tangled with databases, APIs, or UI. Makes the codebase easier to maintain and extend. |
| `tdd` | Test-Driven Development | 🧪 | testing | Writes tests before code for fewer bugs | The AI writes automated tests first, then implements the feature to pass them. Catches bugs early and ensures everything works as specified. |
| `security-audit` | Security Audit | 🔒 | security | Checks for vulnerabilities as it codes | Scans for common security issues like injection attacks, broken authentication, and data exposure. Follows industry-standard security checklists (OWASP). |
| `code-review-ready` | Code Review Ready | 📋 | quality | Produces clean, well-documented code | The AI writes clear commit messages, adds comments where needed, and structures code so your team can review it quickly and confidently. |
| `performance` | Performance | ⚡ | quality | Optimizes for speed and efficiency | Focuses on fast load times, efficient database queries, and minimal resource usage. Avoids common performance pitfalls. |

## Auto Mode

The skills section has a toggle at the top: **Auto** (default) / **Manual**.

**In Auto mode:**
- Forge calls a lightweight AI endpoint to recommend skills for this ticket
- The endpoint receives: ticket title, description, acceptance criteria, file change list, and the full skill catalog (names + descriptions)
- A fast model (Haiku) returns up to 3 recommended skill IDs with one-line reasoning
- User sees which skills were auto-picked (highlighted with "Recommended" badge)
- User can override: toggle any skill on/off, still capped at 3
- Switching to **Manual** clears auto-picks, user starts from scratch

**Backend endpoint:** `POST /skills/recommend`
```typescript
// Request
{ ticketId: string }

// Response
{
  recommended: [
    { skillId: "tdd", reason: "Ticket has 6 acceptance criteria — TDD ensures each is verified" },
    { skillId: "security-audit", reason: "Ticket involves webhook endpoints with authentication" }
  ]
}
```

The LLM prompt is thin — just the ticket summary + skill catalog as a menu. Haiku responds in <1s. Cached per ticket (no re-call if user re-opens the blade).

**In Manual mode:**
- No auto-selection, user picks from scratch
- Mode preference saved to localStorage

**UI in the collapsed state:**
```
⚙ Skills     Auto · 2 recommended ▾
```
vs manual:
```
⚙ Skills     Manual · 1 of 3 ▾
```

**Card description** = one-liner shown on the toggle card in the Develop blade.
**Expanded description** = shown on hover or tap for users who want more context.

**You create the skill directories** at `backend/skills/<id>/` with SKILL.md + optional scripts.
**I wire** the Firestore seeding, UI, sandbox injection, and Dockerfile changes.

## Sequence Diagram

```
User                    Client                   Backend                  E2B Sandbox
 │                        │                        │                        │
 │ Click Develop          │                        │                        │
 │───────────────────────→│                        │                        │
 │                        │ GET /skills/catalog    │                        │
 │                        │───────────────────────→│                        │
 │                        │←───────────────────────│                        │
 │                        │ Show blade + picker    │                        │
 │←───────────────────────│                        │                        │
 │                        │                        │                        │
 │ Toggle skills, Start   │                        │                        │
 │───────────────────────→│                        │                        │
 │                        │ POST /sessions/start   │                        │
 │                        │  ?skills=tdd,security  │                        │
 │                        │───────────────────────→│                        │
 │                        │                        │ Validate skillIds      │
 │                        │                        │ Build sandbox config   │
 │                        │                        │───────────────────────→│
 │                        │                        │ bootstrap.sh:          │
 │                        │                        │  - clone repo          │
 │                        │                        │  - ctx7 setup          │
 │                        │                        │ claude --plugin-dir x  │
 │                        │                        │        --plugin-dir y  │
 │                        │←─── SSE stream ────────│←─── events ───────────│
```

## Files Changed

### Backend
- `backend/src/sessions/infrastructure/sandbox/E2BSandboxAdapter.ts` — add `--plugin-dir` flags
- `backend/src/sessions/infrastructure/container/bootstrap.sh` — add Context7 setup
- `backend/src/sessions/infrastructure/container/forge-sandbox.Dockerfile` — COPY skills/
- `backend/src/sessions/application/services/SystemPromptBuilder.ts` — harden ticket reading
- `backend/src/sessions/presentation/controllers/sessions.controller.ts` — parse `skills` query param
- `backend/src/sessions/application/use-cases/StartSessionUseCase.ts` — pass skillIds through
- New: `backend/src/skills/` — controller, use case, Firestore repository for catalog
- New: `backend/skills/` — skill plugin directories (created by user)

### Frontend
- New: `client/src/sessions/components/molecules/SkillPicker.tsx`
- New: `client/src/sessions/stores/skills.store.ts`
- `client/src/sessions/components/organisms/DevelopButton.tsx` — render SkillPicker
- `client/src/sessions/stores/session.store.ts` — pass skillIds to start URL

### Config
- `.env` — add `CONTEXT7_API_KEY`

## Out of Scope (Future)

- Firebase Storage for downloadable skill packages
- User-created custom skills
- Per-team default skills (settings)
- Skill analytics (which skills are most used)
- Skill versioning/updates without image rebuild
- Skill dependencies (skill A requires skill B)
