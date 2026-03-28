# Change Record Timeline — Design Spec

## Goal

A project-level page where PMs and managers see all Change Records across tickets on a horizontal timeline, review deliveries, and navigate to tickets — without opening them one by one.

## Layout: Timeline Strip + Detail Panel (Option A)

The page has two zones:

### Zone 1 — Timeline Strip (top)

A horizontally scrollable timeline with date markers on the X-axis.

- **Date columns** spaced evenly, labeled with short dates (Mar 21, Mar 25, Today)
- **Record cards** (last ~3): expanded with title, status dot, divergence badge, file count, time ago
- **Record dots** (older): small colored circles, hover to see title tooltip, click to select
- **Multiple records per day** stack vertically in the same date column
- **Scroll arrows** (◀ ▶) on the edges for navigation, plus trackpad/mouse-wheel horizontal scroll
- **Color coding**: amber dot = awaiting review, green dot = accepted, red dot = changes requested

### Zone 2 — Detail Panel (bottom)

Expands when a record is selected on the timeline. Split layout:

- **Left (main)**: ticket title as clickable link (→ ticket page), execution summary, divergence cards (intended vs actual with justification), file changes list with +/- counts
- **Right (sidebar)**: execution events grouped by type (decisions 💡, risks ⚠️, scope changes 📐)
- **Header**: status banner with Accept / Request Changes buttons (when awaiting_review)
- **Link to ticket** is always prominent — "Add rate limiting ↗" navigates to full ticket detail

### Filters

Filter pills at the top: All | Awaiting Review (count) | Accepted (count) | Changes Requested (count)

Active filter narrows which records appear on the timeline.

## Data Source

The backend already returns `changeRecord` and `executionEvents` on each ticket via the existing `GET /tickets` (list) and `GET /tickets/:id` (detail) endpoints. The timeline page fetches all team tickets and filters to those with `changeRecord !== null`.

No new backend endpoints needed — the data is already available. The `reviewDelivery` API function (already in `ticket.service.ts`) handles accept/reject actions.

## Components

| Component | Type | Responsibility |
|-----------|------|---------------|
| `ChangeRecordTimelinePage` | Page | Route shell, fetches tickets, manages selected record state |
| `TimelineStrip` | Organism | Horizontal scrollable timeline with date columns, cards, dots |
| `TimelineRecordCard` | Molecule | Expanded card on the timeline (title, status, badges) |
| `TimelineRecordDot` | Atom | Colored dot for older records (with hover tooltip) |
| `RecordDetailPanel` | Organism | Bottom panel showing full Change Record content |
| `TimelineFilters` | Molecule | Filter pills with counts |

Reuses existing components:
- `DivergenceCard` (already built)
- `ChangeRecordTab` content patterns (execution summary, events, file changes)

## Navigation

Add "Records" entry to the sidebar navigation (`SidebarNav.tsx`), between existing items. Route: `/records`.

## Interactions

1. Page loads → fetches team tickets → filters to those with changeRecord → renders timeline
2. Most recent record is auto-selected, detail panel open
3. Click a card or dot → update selected record, detail panel refreshes
4. Click ticket title in detail panel → navigate to `/tickets/:id`
5. Accept / Request Changes → call `reviewDelivery` API → refresh ticket data → update timeline
6. Filter pills → narrow visible records on timeline

## Design Rules

Follow CLAUDE.md section 4a strictly:
- All borders: `border border-[var(--border-subtle)]`
- Text: `--text-primary`, `--text-secondary`, `--text-tertiary`
- Status badges: translucent (`bg-amber-500/10 text-amber-500`)
- Font sizes: 13px body, 12px meta, 11px badges
- Hover states on all interactive elements
- No hardcoded colors

## Wireframe Reference

HTML wireframe at: `.superpowers/brainstorm/change-record-timeline/timeline-wireframe.html`
Visual companion mockup at: `.superpowers/brainstorm/2816590-1774588776/content/timeline-layout.html`
