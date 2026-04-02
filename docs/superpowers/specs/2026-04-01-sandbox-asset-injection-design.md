# Sandbox Asset Injection — Design Ticket

**Date:** 2026-04-01
**Status:** Backlog
**Priority:** Medium
**Type:** Feature

## Problem

When a ticket has uploaded assets (SVG icons, images, design files), the AI sandbox can't use them during development. Claude references files that don't exist in the sandbox workspace, resulting in broken imports (e.g., `import logo from "./assets/logo.svg"` → file not found).

## Solution

When the user clicks Develop, check if the ticket has attachments. If yes, show a selection step where the user picks which assets to include. Selected assets are downloaded and placed in the sandbox workspace before Claude starts.

### Flow

1. User clicks **Develop** on a ticket with attachments
2. DevelopButton shows an **asset selection step**: checkboxes for each attachment with preview thumbnails
3. User selects which assets to include (or "Select All" / "Skip")
4. Selected assets are sent to the backend alongside the session start request
5. Backend downloads assets from storage → writes to sandbox filesystem at a configurable path (default: `public/assets/` for web projects, `assets/` otherwise)
6. Claude sees the files on disk and can import/reference them

### Asset Path Detection

- If `public/` directory exists → place in `public/assets/`
- If `src/assets/` exists → place in `src/assets/`
- Otherwise → place in `assets/`
- The path is included in the system prompt so Claude knows where to find them

### What This Enables

- SVG icons uploaded by designers → used directly in implementation
- Screenshots of desired UI → Claude references them for layout
- Design tokens/config files → imported into the codebase
- Any binary asset needed for the feature

## Implementation

### Backend
- `StartSessionUseCase` — accept `assetIds: string[]` parameter
- `SessionOrchestrator` — download assets from Firebase Storage, write to sandbox before starting Claude
- System prompt update — tell Claude where assets are: "Design assets are available at /workspace/{path}"

### Frontend
- `DevelopButton` — add asset selection step when ticket has attachments
- `DevelopSessionBlade` — pass selected asset IDs to `startSession()`
- Session store — include `assetIds` in the start request

## Acceptance Criteria

- [ ] User can select which ticket attachments to include in the sandbox
- [ ] Selected assets are available on the sandbox filesystem before Claude starts
- [ ] Claude's system prompt tells it where assets are located
- [ ] Asset paths match the project's convention (public/, src/assets/, etc.)
- [ ] Non-selected assets are not downloaded (saves time/bandwidth)
- [ ] Works with images (PNG, SVG, JPG), documents (PDF), and config files (JSON, YAML)
