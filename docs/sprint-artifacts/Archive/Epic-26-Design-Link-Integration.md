# Epic 26: Design Link Integration with LLM Leverage

**Status:** 📝 PLANNED
**Priority:** 🟡 HIGH
**Effort:** 30-35 hours
**Phase:** 3 (Planned Q2 2026)

## Quick Links
- **Full Plan:** [/docs/Epic-26-Design-Link-Integration.md](/docs/Epic-26-Design-Link-Integration.md)
- **Stories:** See Phase-based breakdown below
- **Related Epics:** Epic 25 (PRD Breakdown), Epic 24 (Jira/Linear Integration)

## Overview

Enables PMs to add structured design links (Figma, Loom, etc.) to tickets during creation. LLM uses design context to generate pixel-perfect specifications with design tokens, reducing back-and-forth between design and engineering.

**Why This Matters:**
- Engineers get pixel-perfect acceptance criteria (no guessing layout/colors)
- PMs get specs that automatically match Figma designs
- QA has testable criteria with exact values
- 10-15% higher spec quality, faster implementation

## Phases

### Phase 1: Store & Display (10-12 hours)
**Status:** 📋 TODO

Core functionality: Users add design links (0-5 per ticket), platform auto-detection, display in Implementation tab.

**Stories:**
- 26-01: Backend - DesignReference Value Object & Domain Model
- 26-02: Backend - Add/Remove Design Reference Use Cases
- 26-03: Backend - API Endpoints & DTOs
- 26-04: Backend - AECMapper Persistence Layer
- 26-05: Frontend - DesignLinkInput Component for Wizard
- 26-06: Frontend - Wizard Store & Service Integration
- 26-07: Frontend - DesignReferencesSection Display Component
- 26-08: Frontend - Ticket Detail Design Tab (NEW TAB between Spec & Implementation)

**Acceptance Criteria:**
- ✅ Add 0-5 design links during ticket creation (Figma/Loom URLs)
- ✅ Platform auto-detection works (icon changes based on URL)
- ✅ Links display in Implementation tab with external link icon
- ✅ Links open in new tab, can be removed post-creation
- ✅ TypeScript errors = 0, build passes

### Phase 2: Metadata Enrichment (10-12 hours)
**Status:** 📋 TODO (Blocked by: Phase 1)

OAuth integrations for Figma & Loom. Fetch metadata (thumbnails, titles, last modified). Rich preview cards.

**Stories:**
- 26-09: Backend - Figma OAuth Integration
- 26-10: Backend - Figma API Service & Metadata Fetcher
- 26-11: Backend - Loom OAuth Integration
- 26-12: Backend - Loom API Service & Metadata Fetcher
- 26-13: Frontend - Rich Preview Cards (Figma/Loom)
- 26-14: Frontend - Settings Page Integrations

**Acceptance Criteria:**
- ✅ OAuth flows work for Figma and Loom
- ✅ Figma previews show thumbnail, file name, last modified
- ✅ Loom previews show video thumbnail, title, duration
- ✅ Metadata fetches in background (non-blocking)
- ✅ Graceful fallback if platform not connected

**Setup Required:**
- Figma OAuth app registration
- Loom OAuth app registration

### Phase 3: LLM Integration (10-12 hours)
**Status:** 📋 TODO (Blocked by: Phase 1 + 2)

Pass design context to LLM during spec generation. Generate pixel-perfect acceptance criteria with design tokens.

**Stories:**
- 26-15: Backend - Design Context Prompt Builder
- 26-16: Backend - Deep Analysis Design Phase
- 26-17: Backend - TechSpec Generator Design Injection
- 26-18: Backend - Figma Design Tokens Extraction (Optional)
- 26-19: Frontend - Design-Aware Spec Display

**Acceptance Criteria:**
- ✅ Tech specs reference Figma designs in problem statement
- ✅ Visual expectations link to Figma screens
- ✅ Acceptance criteria include pixel-perfect design checks
- ✅ Loom transcripts enhance user story context
- ✅ Design-driven tickets score 10-15% higher quality

## Key Architecture Decisions

1. **Separate DesignReference Value Object** (not extending Attachment)
   - Attachments = uploaded files in Firebase Storage
   - DesignReferences = external URLs with platform metadata
   - Cleaner domain model, enables platform APIs

2. **24-Hour Metadata Caching**
   - Prevents API rate limits (200 req/min Figma, 100 req/min Loom)
   - Cache stored in Firestore subcollection
   - Graceful fallback to simple links if API fails

3. **Phase-Based Implementation**
   - Phase 1 is independent (no OAuth needed)
   - Phase 2 & 3 depend on Phase 1
   - Can release Phase 1 immediately for user feedback

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Figma/Loom API rate limits | 24-hour caching + graceful fallbacks |
| OAuth token expiry | Implement refresh flow + "Reconnect" message |
| LLM context too long | Truncate Loom transcripts to 1000 words |
| Cache storage growth | TTL cleanup (delete metadata >30 days old) |

## Future Enhancements (Out of Scope)

- Visual regression testing (Figma vs implementation screenshot comparison)
- Extract design tokens from Figma styles API
- Additional platforms: Sketch, InVision, Zeplin, Framer
- Generate React/Vue code snippets from Figma components
- Two-way sync: Push screenshots back to Figma comments

---

**Next Step:** After Phase 1 planning approval, begin backend domain model implementation.
