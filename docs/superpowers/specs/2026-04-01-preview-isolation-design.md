# Preview Isolation — Design Ticket

**Date:** 2026-04-01
**Status:** Backlog
**Priority:** Medium
**Type:** Task

## Problem

WebContainers require `Cross-Origin-Embedder-Policy: credentialless` and `Cross-Origin-Opener-Policy: same-origin` HTTP headers to enable `SharedArrayBuffer`. Without them, `npm install` fails with "Network Error" inside the WebContainer.

Setting these headers globally breaks cross-origin API calls (SSE streams, REST calls from `localhost:3001` to `localhost:3000`).

## Solution Options

### Option A: Dedicated `/preview` route (Recommended)
- Create `app/preview/page.tsx` as an isolated page
- Use Next.js `headers()` scoped to `/preview` only
- Open the preview in a new window/tab or iframe pointing to `/preview?repo=owner/name&branch=main`
- This page has COEP/COOP headers; the rest of the app doesn't

### Option B: Subdomain iframe
- Serve preview from `preview.localhost:3001` or `preview.forge.dev`
- Configure COEP/COOP on the subdomain only
- Embed via iframe in the slide-over panel

### Option C: StackBlitz embed API
- Use StackBlitz's hosted WebContainer embed (`sdk.stackblitz.com`)
- No self-hosted headers needed — StackBlitz handles isolation
- Trade-off: dependency on external service, less control

## Acceptance Criteria

- [ ] Preview can run `npm install` and `npm run dev` without Network Error
- [ ] Cross-origin API calls (SSE, REST) continue working
- [ ] Develop flow (Cloud Develop) is not affected
- [ ] Preview panel or window shows the running app
