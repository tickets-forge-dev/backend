# Story 5.1: CLI Project Setup

Status: review

## Story

As a developer joining the Forge platform,
I want a properly scaffolded `forge-cli` repository with TypeScript, Commander.js, and a working `forge` binary,
so that subsequent CLI stories have a consistent, buildable foundation to build on.

## Acceptance Criteria

1. `package.json` is configured with `name: "@forge/cli"`, `version: "0.1.0"`, `bin: { "forge": "./dist/index.js" }`, and correct `scripts` (build, dev, start, lint).
2. TypeScript is configured (`tsconfig.json`) targeting Node.js 20, strict mode enabled, outputs to `dist/`.
3. `tsup` builds the CLI to `dist/index.js` as a CommonJS bundle with source maps.
4. Running `forge --version` outputs `0.1.0`.
5. Running `forge --help` lists all planned commands (login, logout, list, show, review, execute) with descriptions.
6. `src/types/ticket.ts` defines `AECStatus` enum, `TicketType`, `TicketPriority`, `TicketListItem`, and `TicketDetail` interfaces.
7. Directory structure matches spec: `src/commands/`, `src/services/`, `src/ui/`, `src/types/`.
8. `FORGE_API_URL` and `FORGE_APP_URL` are read from environment variables with production defaults compiled in (`https://api.forge.app` and `https://forge.app`).
9. `dotenv` loads `.env.development` automatically in non-production environments.
10. `npm link` (or `pnpm link`) makes `forge` available globally for local development.
11. `tsc --noEmit` exits with zero errors.
12. `.env.development` is in `.gitignore`; `.env.example` is committed.

## Tasks / Subtasks

- [x] Task 1: Initialize package.json (AC: 1, 10)
  - [x] Set `name: "@forge/cli"`, `version: "0.1.0"`, `license: "MIT"`
  - [x] Set `bin: { "forge": "./dist/index.js" }`
  - [x] Set `engines: { "node": ">=20" }`
  - [x] Add scripts: `build: "tsup"`, `dev: "tsup --watch"`, `start: "node dist/index.js"`, `typecheck: "tsc --noEmit"`
  - [x] Set `main: "./dist/index.js"`, `types: "./dist/index.d.ts"`

- [x] Task 2: Configure TypeScript (AC: 2, 11)
  - [x] Create `tsconfig.json` with `target: "ES2022"`, `module: "CommonJS"`, `strict: true`, `outDir: "dist"`, `rootDir: "src"`
  - [x] Enable `esModuleInterop`, `resolveJsonModule`, `skipLibCheck`
  - [x] Exclude `node_modules`, `dist`

- [x] Task 3: Configure tsup build (AC: 3)
  - [x] Create `tsup.config.ts` with `entry: ["src/index.ts"]`, `format: ["cjs"]`, `sourcemap: true`, `clean: true`, `dts: true`
  - [x] Add shebang (`#!/usr/bin/env node`) to entry output via tsup `banner` option

- [x] Task 4: Install dependencies (AC: 1, 6, 8, 9)
  - [x] Runtime: `commander`, `chalk`, `dotenv`, `zod`, `ora`
  - [x] Dev: `typescript`, `tsup`, `@types/node`

- [x] Task 5: Create directory structure (AC: 7)
  - [x] `src/commands/` — one placeholder file per command: `login.ts`, `logout.ts`, `list.ts`, `show.ts`, `review.ts`, `execute.ts`
  - [x] `src/services/` — empty, ready for `api.service.ts`, `auth.service.ts`, `config.service.ts`
  - [x] `src/ui/` — empty, ready for `formatters.ts`, `pager.ts`
  - [x] `src/types/` — `ticket.ts` with full type definitions

- [x] Task 6: Create `src/types/ticket.ts` (AC: 6)
  - [x] `AECStatus` enum with all values from backend: `DRAFT`, `IN_QUESTION_ROUND_1`, `IN_QUESTION_ROUND_2`, `IN_QUESTION_ROUND_3`, `QUESTIONS_COMPLETE`, `VALIDATED`, `READY`, `CREATED`, `DRIFTED`, `COMPLETE`
  - [x] `TicketType` union type: `'feature' | 'bug' | 'task'`
  - [x] `TicketPriority` union type: `'low' | 'medium' | 'high' | 'urgent'`
  - [x] `TicketListItem` interface: `id`, `title`, `status: AECStatus`, `priority?: TicketPriority`, `assignee?: string`
  - [x] `TicketDetail` extends `TicketListItem` with: `description?`, `acceptanceCriteria: string[]`, `assignedTo?`, `createdAt`, `updatedAt`
  - [x] Add `// TODO: Replace with @forge/types when published (Epic 8)` comment at top

- [x] Task 7: Create `src/config.ts` — env/config constants (AC: 8, 9)
  - [x] Load `dotenv` for `.env.development` in non-production
  - [x] Export `API_URL = process.env.FORGE_API_URL ?? 'https://api.forge.app'`
  - [x] Export `APP_URL = process.env.FORGE_APP_URL ?? 'https://forge.app'`

- [x] Task 8: Create `src/index.ts` — CLI entry point (AC: 4, 5)
  - [x] Import `Command` from `commander`
  - [x] Create root `program` with name `forge`, version `0.1.0`, description `"CLI for Forge — authenticate, browse tickets, and execute AI-assisted implementations via MCP"`
  - [x] Register all 6 command stubs: `login`, `logout`, `list`, `show <ticketId>`, `review <ticketId>`, `execute <ticketId>` — each prints `"Not yet implemented"` and exits
  - [x] Call `program.parse(process.argv)`

- [x] Task 9: Verify build and binary (AC: 3, 4, 5, 10, 11)
  - [x] Run `npm run build` — `dist/index.js` created with shebang ✓
  - [x] Run `npm link` — `forge` available globally ✓
  - [x] Run `forge --version` → `0.1.0` ✓
  - [x] Run `forge --help` → lists all 6 commands ✓
  - [x] Run `npm run typecheck` → zero errors ✓

## Dev Notes

### Repo Context
- **Repo:** `forge-cli` — standalone public repo, NOT inside the private `forge` monorepo
- **Local path:** `/Users/.../forge/forge-cli/` (cloned inside forge/ dir, but separate git repo)
- **forge/.gitignore** already excludes `forge-cli/` — no cross-contamination risk
- This is a greenfield project — no existing code to worry about

### Architecture Constraints
- **Node.js ≥ 20** required (uses native `fetch` in later stories, `fs/promises`)
- **CommonJS output** (not ESM) — Commander.js and many CLI deps work best with CJS for now
- **Standalone binary** — must have shebang and be executable after `npm link`
- **Environment pattern:** Never hardcode API URLs; always read from `FORGE_API_URL` / `FORGE_APP_URL` with production defaults
- **No business logic in index.ts** — entry point registers commands only; logic goes in command files

### Shared Types Note
`src/types/ticket.ts` is a manual copy of the relevant backend domain types. The `AECStatus` enum values must exactly match the backend (`AECStatus.ts`). Mark with TODO for Epic 8 when `@forge/types` is published.
[Source: docs/sprint-artifacts/tech-spec-epic-5-cli-foundation.md — Shared types decision]

### Package Structure
```
forge-cli/
├── src/
│   ├── index.ts           # Entry point, Commander program
│   ├── config.ts          # Env vars + production defaults
│   ├── commands/
│   │   ├── login.ts       # stub
│   │   ├── logout.ts      # stub
│   │   ├── list.ts        # stub
│   │   ├── show.ts        # stub
│   │   ├── review.ts      # stub
│   │   └── execute.ts     # stub
│   ├── services/          # empty (populated in 5-2 through 5-7)
│   ├── ui/                # empty (populated in 5-4, 5-5)
│   └── types/
│       └── ticket.ts      # AECStatus, TicketListItem, TicketDetail
├── dist/                  # built output (gitignored)
├── .env.example
├── .env.development       # gitignored
├── .gitignore
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
└── LICENSE
```

### References
- [Source: docs/sprint-artifacts/tech-spec-epic-5-cli-foundation.md — Architecture Alignment, Dependencies]
- [Source: docs/CLI/FORGE-TEAMS-CLI-ARCHITECTURE.md — Section 4.1 Package Structure]
- [Source: docs/CLI/IMPLEMENTATION-PLAN.md — Epic 5, Story 5.1]
- AECStatus values: [Source: backend/src/tickets/domain/value-objects/AECStatus.ts]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fixed double-shebang: `src/index.ts` must NOT contain `#!/usr/bin/env node` when tsup `banner` option adds it — having both causes a Node.js SyntaxError.

### Completion Notes List

- All 12 ACs verified manually
- `forge --version` → `0.1.0` ✓
- `forge --help` → all 6 commands listed ✓
- `npm run typecheck` → 0 errors ✓
- `npm link` → `forge` available globally ✓
- Shebang added via tsup `banner` option only (not duplicated in `src/index.ts`)

### File List

- `forge-cli/package.json`
- `forge-cli/tsconfig.json`
- `forge-cli/tsup.config.ts`
- `forge-cli/src/index.ts`
- `forge-cli/src/config.ts`
- `forge-cli/src/types/ticket.ts`
- `forge-cli/src/commands/login.ts`
- `forge-cli/src/commands/logout.ts`
- `forge-cli/src/commands/list.ts`
- `forge-cli/src/commands/show.ts`
- `forge-cli/src/commands/review.ts`
- `forge-cli/src/commands/execute.ts`
