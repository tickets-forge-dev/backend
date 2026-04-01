# Stream Enrichment — Design Spec

**Date:** 2026-03-31
**Status:** Draft

## Overview

Passively detect when the agent's messages reference ticket content (ACs, files, screens, APIs) and render compact inline cards in the stream. Zero agent changes — all frontend parsing.

## Approach

Parse each `event.message` content against the ticket's data. When a match is found, append a subtle card below the message.

## Enrichment Types

### Acceptance Criteria
**Trigger:** Agent mentions text that fuzzy-matches an AC item
**Card:** One-line pill showing `AC #3 · User can configure webhook endpoints` with a subtle checkmark if the agent later says "done" or "implemented"
**Not:** Full AC text. Just the short reference.

### File Progress
**Trigger:** Agent mentions a file path that's in the ticket's expected file changes
**Card:** `3 of 10 files · src/webhooks/service.ts` — tiny progress indicator
**Not:** Full file list. Just the current file in context.

### Screen/Wireframe
**Trigger:** Agent mentions a screen name matching a visual expectation
**Card:** Collapsed thumbnail of the ASCII wireframe, expandable. Or just `Screen: Configuration Page · default state`
**Not:** Full wireframe inline. Too noisy.

### API Endpoint
**Trigger:** Agent mentions a route like `POST /webhooks`
**Card:** `POST /webhooks · Create webhook endpoint` — method + path + description from spec
**Not:** Full request/response schema.

## Matching Strategy

- Fuzzy string matching against AC text (cosine similarity or keyword overlap)
- Exact path matching for file changes
- Keyword matching for screen names
- Regex matching for API routes (`GET|POST|PUT|PATCH|DELETE /path`)

All matching runs client-side using ticket data already loaded in the store.

## Design Rules

- Maximum one enrichment card per message
- Cards are one line — never multi-line
- Muted styling: `text-[10px]`, tertiary color, subtle left border
- No walls of text. Ever.
- Enrichments are passive decorations — they don't affect the stream flow
- If no match found, show nothing (most messages won't match)

## Implementation

- New component: `StreamEnrichment` — receives message content + ticket data, returns optional card
- Rendered below each `SessionMessage` in the stream
- Matching logic in a pure function — no API calls, no side effects
- Ticket data available from `useTicketsStore` (already loaded on the page)
