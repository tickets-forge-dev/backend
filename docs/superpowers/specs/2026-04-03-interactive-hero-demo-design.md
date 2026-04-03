# Interactive Hero Demo — Design Spec

**Date:** 2026-04-03
**Status:** Approved

## Overview

Replace the static hero screenshot on the landing page with a fully interactive, self-contained demo of the Forge app. Users can explore the product hands-on — browse tickets, drill into a full spec, trigger a simulated development session, view decision logs, and see a preview — all with mock data inside a browser chrome frame.

## Goals

- Let visitors **experience** the product rather than see a static image
- Showcase the full lifecycle: ticket list → ticket detail → develop → delivered → preview
- Look **1:1 like the real app** using the same design tokens and Tailwind classes
- Be **completely isolated** from the real app — no shared stores, services, or dependencies
- Illustrate complex parts (terminal, preview, prototype) where pixel-perfect isn't feasible

## Architecture

### Approach: Self-Contained Landing Component

All demo code lives under `client/src/landing/components/demo/`. No imports from the real app's stores or services. Uses the same design tokens (`--bg`, `--text-primary`, `--border-subtle`, etc.) and Tailwind classes to achieve visual parity.

### File Structure

```
client/src/landing/components/demo/
├── InteractiveDemo.tsx          # Root — browser chrome + state machine
├── DemoBrowserChrome.tsx        # Fake browser frame (URL bar, traffic light dots)
├── DemoTicketList.tsx           # Ticket list with folders, rows, tags, sidebar
├── DemoTicketDetail.tsx         # Full ticket detail with tabs
├── DemoDevelopSession.tsx       # Animated terminal replay blade
├── DemoDelivered.tsx            # Change record + preview button
├── DemoPreview.tsx              # Terminal showing deployed feature
├── DemoDecisionLogs.tsx         # Decision logs timeline view
├── DemoDecisionLogDetail.tsx    # Individual record detail
├── demo-data.ts                 # All mock data (tickets, folders, spec, events, records)
├── demo-state.ts                # State machine types and transitions

client/public/images/demo/
├── demo-prototype.png           # Mock design prototype screenshot (for Design tab)
└── demo-preview.png             # Mock preview screenshot (optional fallback)
```

### State Machine

```
ticket-list ──(click ticket)──→ ticket-detail ──(click Develop)──→ develop-session ──(auto)──→ delivered
     ↕ (sidebar)                      ↑ (back arrow)                                              │
decision-logs                         ←───────────────────────────────────────────(back arrow)─────┘
     │                                                                                             │
     └──(click record)──→ decision-log-detail                              (click View Preview)──→ preview
```

Screens: `ticket-list` | `ticket-detail` | `develop-session` | `delivered` | `preview` | `decision-logs` | `decision-log-detail`

Transitions use Framer Motion `AnimatePresence` with horizontal slide direction.

## Visual Frame

### Browser Chrome
- Three traffic light dots (red/yellow/green) top-left
- URL bar showing contextual path: `app.forge-ai.dev/tickets`, `/tickets/FOR-127`, `/records`
- URL updates on navigation
- Dark border, `rounded-xl`, dark theme background
- Constrained to `max-w-[1180px]` in the hero section

### Demo Sidebar (inside the frame)
- Collapsed icon-only sidebar (64px wide), matching real app
- Icons: Tickets (active state), Decision Logs — both clickable
- Settings, Search icons — visible but non-clickable (greyed)
- Tickets icon always returns to ticket list

### Guided Hints
- Subtle pulsing ring on the first ticket row on initial load
- Pulsing hint on "Develop" button when on ticket detail
- Hints disappear after first interaction

### Responsive Behavior
- On mobile, the entire demo scales down using CSS `transform: scale()` within the browser chrome
- Maintains aspect ratio rather than trying to be responsive inside the frame

## Screen Details

### 1. Ticket List (`DemoTicketList.tsx`)

Grid table layout matching the real app. Columns: Title (with type icon, tags), Status, Priority.

**Folders (expanded):**

| Folder | Ticket | Status | Priority | Tags |
|--------|--------|--------|----------|------|
| **API & Integrations** | Rate limit API responses to 100 req/min | Ready | Low | `sprint 1` |
| | Add webhook events for ticket status changes | Define | Low | `sprint 1` |
| | Fix session expiry not redirecting to login | Define | Low | |
| | Add SSO login with Google OAuth | Define | Low | |
| **Auth & Users** | Implement JWT refresh token rotation | Approved | High | `sprint 1`, `security` |
| | Add role-based access control to endpoints | Refined | Medium | `backend` |
| | Fix password reset email not sending | Executing | Urgent | `bug`, `sprint 1` |
| | Add user activity audit log | Draft | Low | `compliance` |

**Folders (collapsed, showing count only):**
- Before Recording (0)
- Dashboard (1)
- Onboarding (2)
- Profile (2)
- Tags (2)

All ticket rows are clickable and open the same ticket detail.

### 2. Ticket Detail (`DemoTicketDetail.tsx`)

Full 1:1 replica of the real ticket detail page.

**Header:** Title "Rate limit API responses to 100 req/min", Status badge (Approved), lifecycle bar

**Tabs:** Overview | Specification | Technical | Design

**Overview tab (default):**
- Status: Approved, Priority: Low, Type: Feature
- Readiness score: 87
- Assignee: Mock avatar + name
- Tags: `sprint 1`, `backend`
- Description: 2-3 sentences about rate limiting needs
- Acceptance criteria: 3-4 items

**Specification tab:**
- Problem statement with narrative, why it matters, assumptions
- Acceptance criteria in BDD format (Given/When/Then)
- Solution steps: 4-5 numbered steps with file paths
- Scope: affected areas

**Technical tab:**
- API endpoint: `GET /api/v1/*` with rate limit headers
- Dependencies: `express-rate-limit` package
- Test plan

**Design tab:**
- Mock prototype image (static asset from `public/images/demo/`)

**"Develop" button** in header — pulsing hint guides user to click it.

### 3. Develop Session (`DemoDevelopSession.tsx`)

Blade slides in from right (520px wide). Animated terminal replay ~10 seconds.

**Scripted sequence:**

| Phase | Duration | Visual |
|-------|----------|--------|
| Provisioning | 1.5s | "Setting up environment..." spinner |
| Analyzing | 2s | Tool card: `Reading ticket spec...`, file tree starts populating |
| Writing code | 3s | `bash: mkdir -p src/middleware` → `file_create: src/middleware/rate-limiter.ts` (green diff lines) → `file_edit: src/routes/api.ts` (small diff) |
| Testing | 2s | `bash: npm test` → "✓ 4 passed" in green |
| Creating PR | 1.5s | `bash: gh pr create` → PR #142 link |
| Complete | — | Summary card |

Each phase shows tool-use cards styled like the real session monitor: dark terminal background, monospace font, colored icons per tool type. File tree on the left grows as files are touched.

**Completion summary card:**
- 3 files changed, +87 -4 lines
- Branch: `feat/rate-limit`
- PR: #142 (mock link)
- Duration: 45s
- "View Change Record" button → transitions to delivered state
- "View Preview" button → transitions to preview state

### 4. Delivered (`DemoDelivered.tsx`)

Ticket detail page now shows the "Delivered" tab with a Change Record:

- **Execution summary:** "Implemented sliding window rate limiter at 100 req/min using express-rate-limit. Added X-RateLimit headers to all API responses. Configured per-IP tracking with Redis store."
- **Decisions:** 2 items (e.g., "Chose sliding window over fixed window", "Used Redis for distributed rate limit state")
- **File changes:** 3 files with +/- counts
- **Status:** Awaiting Review
- **"View Preview" button** prominently displayed

### 5. Preview (`DemoPreview.tsx`)

Terminal-style panel (illustrated) showing:

```
$ curl -i https://api.example.com/v1/users

HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 98
X-RateLimit-Reset: 1712150400

{"users": [...]}

$ curl -i https://api.example.com/v1/users  # 101st request

HTTP/1.1 429 Too Many Requests
Retry-After: 60
{"error": "Rate limit exceeded. Try again in 60 seconds."}
```

Dark terminal background, monospace, syntax-colored output. Illustrated, not a real terminal.

### 6. Decision Logs (`DemoDecisionLogs.tsx`)

Accessed via sidebar "Decision Logs" icon.

**Header:** "Decision Logs" title

**Records list:**

| Ticket | Developer | Submitted | Files | Status |
|--------|-----------|-----------|-------|--------|
| Add pagination to user list API | Sarah Chen | 2 days ago | 5 files, +142 -38 | Accepted |
| Fix CORS headers on staging | Alex Kim | 5 days ago | 2 files, +24 -8 | Accepted |
| Migrate auth tokens to Redis | Sarah Chen | 1 week ago | 8 files, +310 -156 | Changes Requested |

### 7. Decision Log Detail (`DemoDecisionLogDetail.tsx`)

Clicking a record shows:
- Execution summary (2-3 sentences)
- Decisions list (2 items)
- File changes table (path, +additions, -deletions)
- Divergence section (for "Changes Requested" record): area, intended vs actual, justification

## Integration with Landing Page

The `InteractiveDemo` component replaces the current `<Image>` screenshot in `HeroSection.tsx`. The hero text (headline, subtitle, CTA) remains above. The browser chrome frame sits where the screenshot currently is.

## Non-Goals

- No real API calls or authentication
- No drag-and-drop in the demo
- No ticket creation wizard
- No search/filter functionality in demo
- No mobile-responsive layouts inside the demo frame (uses CSS scale instead)
