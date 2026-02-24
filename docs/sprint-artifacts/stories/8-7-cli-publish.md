# Story 8.7: CLI Publish — Prep & Publish to npm

Status: drafted

## Story

As a developer who wants to use Forge,
I want to install the CLI with `npm install -g @forge/cli`,
so that I can authenticate, browse tickets, and run AI-assisted implementations without manual setup.

## Acceptance Criteria

1. `forge-cli/package.json` has `"publishConfig": { "access": "public" }` so `@forge/cli` publishes as a public scoped npm package.
2. `forge-cli/src/config.ts` has the production backend URL as the default for `API_URL` (not `localhost`). Devs can override via `FORGE_API_URL` env var.
3. `npm run build` succeeds with no errors — `dist/` is clean.
4. `npm publish` succeeds — package is live on npm registry as `@forge/cli`.
5. `npm install -g @forge/cli && forge --version` works on a clean machine.

## Tasks / Subtasks

- [ ] Task 1: Add `publishConfig` to `forge-cli/package.json` (AC: 1)
- [ ] Task 2: Update production `API_URL` default in `forge-cli/src/config.ts` (AC: 2)
  - **Requires**: Confirm production backend URL (e.g. `https://forge-api.onrender.com/api`)
  - Update `APP_URL` default too if different from `https://forge.app`
- [ ] Task 3: Build and smoke-test the dist (AC: 3)
  - `npm run build` in `forge-cli/`
  - `node dist/index.js --version` locally
- [ ] Task 4: Bump version if needed (currently `0.1.0`)
  - For initial publish `0.1.0` is fine; bump to `0.2.0` if changes were made post-Epic 5
- [ ] Task 5: `npm login` + `npm publish --access public` (AC: 4)
- [ ] Task 6: Verify install from registry (AC: 5)
  - On a clean terminal (or temp dir): `npm install -g @forge/cli && forge --version`

## Dev Notes

**Production URL:** The Render service is named `forge-api`. Confirm the deployed URL before Task 2.
Likely: `https://forge-api.onrender.com/api` — but verify in Render dashboard.

**Scoped package on npm:** `@forge/cli` requires either:
- `publishConfig.access = "public"` → free, visible to everyone
- A paid npm org plan → private, team-only install

For MVP, public is recommended.

**What NOT to include in the publish:**
- `src/` — tsup builds to `dist/`, only `dist/` is shipped
- Test files (`**/__tests__/**`)
- `.env.development`

Add/verify `.npmignore` or `"files"` field in `package.json` if needed.

**Auth for publish:** Must be logged in as the npm user/org that owns `@forge` scope.
Run `npm whoami` to verify before publishing.

## Dev Agent Record

### Debug Log

### Completion Notes

## File List

- `forge-cli/package.json` (modified — publishConfig)
- `forge-cli/src/config.ts` (modified — production API_URL default)

## Change Log

| Date | Change |
|------|--------|
| 2026-02-22 | Story created — pre-publish prep identified during manual testing planning |
