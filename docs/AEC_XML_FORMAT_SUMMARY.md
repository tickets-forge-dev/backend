# AEC XML Format - Implementation Summary

**Date:** 2026-02-01
**Status:** ✅ Specification Complete - Ready for Future Implementation
**Story:** 2.5 - AEC XML Serialization Format (Epic 2)
**Priority:** P2 (Nice to have for v1, required for v2)

---

## What Was Done

### 1. Complete XML Specification Document
**File:** `docs/aec-xml-specification.md`

Comprehensive specification document covering:
- Executive summary and purpose
- Relationship to existing AEC TypeScript entity
- Complete XML schema overview with 8 sections:
  - `<metadata>` - Lifecycle and identity
  - `<intent>` - Product intent and user story
  - `<requirements>` - Acceptance criteria (BDD format) and assumptions
  - `<implementation>` - Tasks, interfaces, artifacts, repoPaths
  - `<validation>` - Results, constraints, questions
  - `<snapshots>` - Repository context, code/API snapshots
  - `<tracking>` - Generation state and estimates
  - `<export>` - External issue tracking and appendices
- Implementation plan (Story 2.5 details)
- Usage examples (export, version control, agent execution)
- Benefits summary for AI agents, teams, and system
- Migration path (v1 → v2 → v3)

**Key Design Decision:** TypeScript AEC domain entity remains source of truth. XML is a projection/export format, not a replacement.

---

### 2. XSD Schema File
**File:** `docs/schemas/aec-v1.xsd`

Complete XML Schema Definition (XSD) with:
- Root element `<aec>` with version="1.0" and namespace
- 30+ complex types defining structure
- 15+ simple types and enums for validation
- All required/optional fields specified
- Documentation annotations
- Validation rules:
  - Title: 3-500 characters
  - Readiness score: 0-100
  - Max 3 questions
  - Status enum: draft | validated | ready | created | drifted
  - Priority enum: critical | high | medium | low
  - And more...

**Schema Namespace:** `https://executable-tickets.com/schema/aec/v1`

The XSD enables:
- Machine validation of XML files
- IDE autocomplete for XML editing
- External system validation
- Contract enforcement

---

### 3. Story Added to Epic 2
**File:** `docs/epics.md` (Story 2.5)

Added comprehensive story with:
- User story: "As a developer or AI agent..."
- 7 detailed acceptance criteria
- Prerequisites: Story 2.3 (AEC Domain Model)
- Technical notes for implementation
- Out of scope for v1 (XML as primary storage, real-time updates)
- Priority: P2

**Acceptance Criteria Summary:**
1. XML schema (XSD) defined
2. `toXML()` method on AEC domain entity
3. `fromXML()` static method for deserialization
4. XML export integration (download button, attachments)
5. XML format includes all 8 sections
6. Documentation complete
7. Round-trip conversion tested

---

### 4. Architecture Documentation Updated
**File:** `docs/architecture.md`

Added new section "AEC XML Serialization Format" in Data Architecture:
- Purpose and design decision
- Schema location reference
- XML structure overview
- Integration points
- Implementation phases (v1, v2, v3)
- Reference to full specification

---

## How It Fits Into the Project

### Current State
- **AEC TypeScript entity** exists: `backend/src/tickets/domain/aec/AEC.ts`
- Stored as JSON in Firestore
- Used for internal operations (creation, validation, export)

### Future State (After Story 2.5 Implementation)
- AEC entity gains `toXML()` and `fromXML()` methods
- XML generated on-demand for exports
- XML attached to Jira/Linear issues for full context
- Download button in ticket detail UI
- Optional storage in Firebase Storage bucket

### Why This Matters
1. **External AI Agents:** Can parse and execute tickets autonomously
2. **Full Context Exports:** Jira/Linear get complete machine-readable contract
3. **Version Control:** Commit AEC.xml alongside code changes
4. **Schema Validation:** XSD ensures structural integrity
5. **Human Readable:** Better than JSON for reviews and audits

---

## Comparison: Context XML vs AEC XML

### Story Context XML (Already Implemented)
**File:** `docs/sprint-artifacts/4-1-github-app-integration-read-only-repo-access.context.xml`

**Purpose:** Bridge document for developers implementing a story
- Human-first design with embedded documentation
- Links to PRD/Architecture docs
- Code artifact references with reasons
- Interface signatures with locations
- Test ideas and standards

**Target Audience:** Human developers

---

### AEC XML (Specification Complete, Implementation Pending)
**File:** `docs/aec-xml-specification.md` (spec), `docs/schemas/aec-v1.xsd` (schema)

**Purpose:** Machine-executable contract for AI agents and external systems
- Machine-first design with schema validation
- Complete ticket data (metadata, intent, requirements, validation, snapshots)
- Structured for parsing and automation
- Self-contained (no external references needed)

**Target Audience:** AI agents, automation tools, external systems

---

## Next Steps (When Implementing Story 2.5)

1. **Backend Implementation:**
   - Add `toXML()` method to `AEC.ts` using `fast-xml-parser`
   - Add `fromXML()` static method
   - Unit tests for serialization/deserialization
   - Validate against XSD schema

2. **Export Integration:**
   - Update `ExportToJiraUseCase` to attach AEC.xml
   - Update `ExportToLinearUseCase` to attach AEC.xml
   - Add Firebase Storage integration for downloads

3. **Frontend:**
   - Add "Download AEC.xml" button in `TicketDetail.tsx`
   - Call new endpoint: `GET /api/aecs/{id}/xml`
   - Trigger browser download

4. **Testing:**
   - Unit tests for `toXML()` and `fromXML()`
   - Integration tests for export attachments
   - Validate generated XML against XSD
   - Round-trip conversion tests (AEC → XML → AEC)

5. **Documentation:**
   - Update API docs with new endpoint
   - Add usage guide for external agents
   - Document XML schema in developer docs

---

## Files Created/Modified

### Created:
- ✅ `docs/aec-xml-specification.md` - Complete specification (686 lines)
- ✅ `docs/schemas/aec-v1.xsd` - XML Schema Definition (650+ lines)
- ✅ `docs/AEC_XML_FORMAT_SUMMARY.md` - This summary

### Modified:
- ✅ `docs/epics.md` - Added Story 2.5 with full acceptance criteria
- ✅ `docs/architecture.md` - Added AEC XML section to Data Architecture

---

## Dependencies

**Required for Implementation:**
- `fast-xml-parser` or `xml2js` (npm package for XML generation/parsing)
- XSD validator library (e.g., `libxmljs2`)

**No External Services Required:**
- XML generation is deterministic
- No LLM calls needed
- No third-party APIs

---

## Estimated Implementation Effort

**Story 2.5 Implementation:**
- Backend (toXML/fromXML): 8-12 hours
- Export integration: 4-6 hours
- Frontend download button: 2-3 hours
- Testing: 6-8 hours
- Documentation: 2-3 hours

**Total:** 22-32 hours (medium confidence)

---

## Success Criteria

Story 2.5 is complete when:
- ✅ XSD schema validates sample AEC XML files
- ✅ `aec.toXML()` generates valid XML conforming to schema
- ✅ `AEC.fromXML(xml)` reconstructs AEC entity correctly
- ✅ Round-trip conversion works (AEC → XML → AEC)
- ✅ Jira/Linear exports include AEC.xml attachment
- ✅ Download button works in ticket detail UI
- ✅ All unit and integration tests pass
- ✅ Documentation updated

---

## References

- **Full Specification:** `docs/aec-xml-specification.md`
- **XSD Schema:** `docs/schemas/aec-v1.xsd`
- **Story Details:** `docs/epics.md` (Story 2.5)
- **Architecture:** `docs/architecture.md` (Data Architecture → AEC XML Serialization)
- **Context XML Example:** `docs/sprint-artifacts/4-1-github-app-integration-read-only-repo-access.context.xml`
- **AEC Domain Entity:** `backend/src/tickets/domain/aec/AEC.ts`

---

## Questions for Future Implementation

1. Should XML be stored in Firestore alongside JSON, or generated on-demand? (Current plan: on-demand for v1)
2. Should we support bidirectional sync (external edits to XML reflected in AEC)? (Current plan: no for v1)
3. Should CLI tools be included in v1? (Current plan: optional)
4. Should we version the XML format (v1.0, v1.1, v2.0)? (Current plan: yes, v1.0 is fixed)

---

**Status:** ✅ All specification work complete. Ready for implementation when Story 2.5 is prioritized.
