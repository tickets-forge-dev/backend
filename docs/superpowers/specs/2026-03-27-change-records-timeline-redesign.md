# Change Records Timeline Redesign

## Context

The Change Records page needs a redesign from a card-based review UI to a timeline-first historical view. Records are a thin layer on top of git — they document what happened during ticket implementation (intent, result, divergences, decisions). They are not a review gate.

## Design

### Page Layout

Main content area + compact right sidebar. Mobile: sidebar stacks below.

```
┌─────────────────────────────────────────┬────────┐
│ Header: title + date range + zoom toggle│        │
├─────────────────────────────────────────┤Overview│
│ Timeline axis (dots on purple line)     │ stats  │
├─────────────────────────────────────────┤        │
│ Selected record detail                  │Latest  │
│ (summary, divergences, events, files)   │ list   │
└─────────────────────────────────────────┴────────┘
```

### Components

**1. Header row**
- Title: "Change Records" + subtitle
- Date range picker: two date inputs (from/to) filtering which records appear on the timeline
- Zoom toggle: dot icon ↔ card icon, switches between dot view and card view
- Help button: small `?` icon in the top-right corner. Opens a tooltip/popover explaining what records are in plain, non-technical language:
  > "Change Records capture what was built for each ticket — the summary of work done, any differences from the original plan, key decisions made along the way, and which files were changed. Think of it as a project changelog you can browse over time."

**2. Timeline axis (the hero — gets personality)**
- Horizontal line with purple gradient glow (`#8b5cf6`)
- Dark purple-tinted background: `linear-gradient(180deg, #110d1c, #13101e, #18181b)`
- Subtle radial glow behind the line center
- Border: `1px solid #8b5cf620`
- Each record = a dot on the line, positioned by delivery date
- Dot size: 6px normal, 8px selected
- Selected dot: ring + box-shadow glow
- Labels: date above, ticket name below (truncated)
- Horizontally scrollable when records exceed viewport

**3. Zoom toggle animation (dots ↔ cards)**
- **Dot mode (default):** Minimal dots on the line
- **Card mode:** Dots morph into small cards alternating above/below the line, showing title + file stats + divergence badge
- **Transition:** 300ms ease-out, staggered 50ms per dot (wave effect). Dots expand outward into cards, cards shrink back into dots.
- Toggle control: small switch in the header

**4. Selected record detail panel**
- Opens below the timeline when a dot/card is clicked
- Standard app card styling: `bg-[var(--bg-subtle)]`, `border-[var(--border-subtle)]`
- Sections: header (title + link + delivery date), summary, divergences (intended vs actual), execution events (decisions/risks/scope), code changes (file list with +/- counts)
- No accept/reject buttons — purely informational

**5. Right sidebar (160px, compact)**
- **Overview stats:** Records count, files changed, lines added, lines removed, divergence count. Key-value rows with small text (10px labels, 11px values).
- **Latest list:** 4-5 most recent records as small clickable items (10px title, 8px date + file count). Clicking selects the record on the timeline.

### Color System

| Element | Color |
|---------|-------|
| Page background | `#111113` (--bg-gradient-end) |
| Card/panel backgrounds | `#18181b` (--bg-subtle) |
| Borders | `rgba(255,255,255,0.06)` (--border-subtle) |
| Primary text | `#e4e4e7` |
| Secondary text | `#a1a1aa` (--text-secondary) |
| Tertiary text | `#71717a` (--text-tertiary) |
| Muted text | `#52525b` |
| Timeline line | `#8b5cf6` gradient with `box-shadow: 0 0 6px #8b5cf622` |
| Timeline bg | `linear-gradient(180deg, #110d1c, #13101e, #18181b)` |
| Timeline border | `1px solid #8b5cf620` |
| Dots | `#8b5cf6` with `box-shadow: 0 0 4px #8b5cf633` |
| Selected dot | `#a78bfa` with ring + glow |
| Selected label | `#c4b5fd` |
| Lines added | `#4ade80` |
| Lines removed | `#f87171` |

### Data Flow

1. `ChangeRecordTimeline` calls `ticketService.list()` — automatically scoped to current project via `x-team-id` header
2. Filters to tickets with `changeRecord !== null`
3. Date range filter applied client-side (from/to)
4. Records sorted by `changeRecord.submittedAt`
5. Selected record ID in local state
6. Sidebar stats computed from filtered records

### Project Filtering

Already handled — the existing `TicketService` Axios interceptor adds `x-team-id` to every request. When users switch projects in the sidebar, the records page automatically shows that project's records.

### Mobile Behavior

- Header: title stacks above date range + zoom toggle
- Timeline: horizontally scrollable, same purple treatment
- Record detail: full width, same sections stacked
- Sidebar: stacks below as a compact horizontal stats row, latest list below that

### File Changes

| Action | File |
|--------|------|
| Rewrite | `client/src/tickets/components/records/ChangeRecordTimeline.tsx` |
| Rewrite | `client/src/tickets/components/records/RecordDetailPanel.tsx` |
| Rewrite | `client/src/tickets/components/records/TimelineStrip.tsx` → rename to `TimelineAxis.tsx` |
| Rewrite | `client/src/tickets/components/records/TimelineRecordCard.tsx` |
| Create | `client/src/tickets/components/records/RecordSidebar.tsx` |
| Create | `client/src/tickets/components/records/ZoomToggle.tsx` |
| Create | `client/src/tickets/components/records/DateRangeFilter.tsx` |
| Create | `client/src/tickets/components/records/RecordHelpButton.tsx` |

### Out of Scope

- Backend changes (the API already returns everything needed)
- Change record review/accept/reject (removed — records are purely historical)
- `ChangeRecordStatus` enum cleanup in backend (separate task)
