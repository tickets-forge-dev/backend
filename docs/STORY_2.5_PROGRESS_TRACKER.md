# Story 2.5 Implementation Progress Tracker

**Story:** AEC XML Serialization Format  
**Started:** ___________  
**Target Completion:** ___________  
**Status:** 🟡 Not Started

---

## Quick Links

- [Implementation Steps](./STORY_2.5_IMPLEMENTATION_STEPS.md)
- [XML Specification](./aec-xml-specification.md)
- [XSD Schema](./schemas/aec-v1.xsd)
- [Quick Reference](./schemas/AEC_XML_QUICK_REFERENCE.md)

---

## Phase 1: Setup & Dependencies ⏱️ 1-2 hours

- [ ] 1.1: Install fast-xml-parser
  ```bash
  cd backend && npm install fast-xml-parser @types/fast-xml-parser
  ```
- [ ] 1.2: Create XmlService.ts
  - Location: `backend/src/shared/infrastructure/xml/XmlService.ts`
  - Has toXML() and fromXML() methods
- [ ] 1.3: Create AECXmlMapper stub
  - Location: `backend/src/tickets/infrastructure/xml/AECXmlMapper.ts`
  - Has toXmlObject() stub

**Phase 1 Complete:** [ ] Yes  
**Time Spent:** _____ hours

---

## Phase 2: XML Serialization (toXML) ⏱️ 6-8 hours

### Mapper Implementation
- [ ] 2.1: Implement buildMetadata()
- [ ] 2.2: Implement buildIntent()
- [ ] 2.3: Implement buildRequirements()
- [ ] 2.4: Implement buildImplementation()
- [ ] 2.5: Implement buildValidation()
- [ ] 2.6: Implement buildSnapshots()
- [ ] 2.7: Implement buildTracking()
- [ ] 2.8: Implement buildExport()

### Integration
- [ ] 2.9: Add toXML() method to AEC.ts
- [ ] 2.10: Test with simple AEC (draft status)
- [ ] 2.11: Test with full AEC (ready status)
- [ ] 2.12: Verify XML is well-formed

### Testing
- [ ] 2.13: Write unit test: generates valid XML
- [ ] 2.14: Write unit test: includes all sections
- [ ] 2.15: Write unit test: handles null values
- [ ] 2.16: Write unit test: includes namespace
- [ ] 2.17: Write unit test: escapes special chars

**Phase 2 Complete:** [ ] Yes  
**Time Spent:** _____ hours

---

## Phase 3: XML Deserialization (fromXML) ⏱️ 4-6 hours

### Parser Implementation
- [ ] 3.1: Implement fromXmlObject()
- [ ] 3.2: Implement parseAcceptanceCriteria()
- [ ] 3.3: Implement parseAssumptions()
- [ ] 3.4: Implement parseRepoPaths()
- [ ] 3.5: Implement parseGenerationState()
- [ ] 3.6: Implement parseCodeSnapshot()
- [ ] 3.7: Implement parseApiSnapshot()
- [ ] 3.8: Implement parseRepositoryContext()
- [ ] 3.9: Implement parseQuestions()
- [ ] 3.10: Implement parseEstimate()
- [ ] 3.11: Implement parseValidationResults()
- [ ] 3.12: Implement parseExternalIssue()

### Integration
- [ ] 3.13: Add fromXML() static method to AEC.ts
- [ ] 3.14: Test parsing simple XML
- [ ] 3.15: Test parsing full XML

### Testing
- [ ] 3.16: Write unit test: parses XML back to AEC
- [ ] 3.17: Write unit test: round-trip conversion
- [ ] 3.18: Write unit test: throws on invalid XML
- [ ] 3.19: Write unit test: throws on missing fields
- [ ] 3.20: Write unit test: handles optional fields

**Phase 3 Complete:** [ ] Yes  
**Time Spent:** _____ hours

---

## Phase 4: Backend API Endpoint ⏱️ 2-3 hours

### Use Case
- [ ] 4.1: Create GetAECXmlUseCase.ts
  - Location: `backend/src/tickets/application/use-cases/`
  - Implements execute(aecId, workspaceId)
  - Returns XML string

### Controller
- [ ] 4.2: Add GET /tickets/:id/xml endpoint
  - Location: `backend/src/tickets/presentation/controllers/tickets.controller.ts`
  - Uses FirebaseAuthGuard + WorkspaceGuard
  - Sets XML headers
  - Returns file download

### Module Registration
- [ ] 4.3: Register GetAECXmlUseCase in TicketsModule

### Testing
- [ ] 4.4: Test with Postman/curl
- [ ] 4.5: Write integration test: returns XML
- [ ] 4.6: Write integration test: correct headers
- [ ] 4.7: Write integration test: 404 for non-existent
- [ ] 4.8: Write integration test: 403 for wrong workspace

**Phase 4 Complete:** [ ] Yes  
**Time Spent:** _____ hours

---

## Phase 5: Export Integration ⏱️ 4-6 hours (OPTIONAL for v1)

**Note:** Only do this if Epic 5 (Export) is already implemented

### Jira Integration
- [ ] 5.1: Update ExportToJiraUseCase
- [ ] 5.2: Attach XML to Jira issue
- [ ] 5.3: Test Jira export with attachment

### Linear Integration
- [ ] 5.4: Update ExportToLinearUseCase
- [ ] 5.5: Attach XML to Linear issue
- [ ] 5.6: Test Linear export with attachment

**Phase 5 Complete:** [ ] Yes (or N/A if deferred)  
**Time Spent:** _____ hours

---

## Phase 6: Frontend Download Button ⏱️ 2-3 hours

### Service Layer
- [ ] 6.1: Add downloadAECXml() to ticket.service.ts
  - Fetches from /api/tickets/:id/xml
  - Triggers browser download
  - Handles errors

### UI Component
- [ ] 6.2: Add Download XML button to TicketDetail.tsx
  - Position near Export button
  - Uses Download icon from lucide-react
  - Calls ticketService.downloadAECXml()

### Testing
- [ ] 6.3: Test download in browser (Chrome)
- [ ] 6.4: Test download in browser (Firefox/Safari)
- [ ] 6.5: Verify filename format: AEC-{id}.xml
- [ ] 6.6: Test error handling (404, 403)

**Phase 6 Complete:** [ ] Yes  
**Time Spent:** _____ hours

---

## Phase 7: Testing ⏱️ 6-8 hours

### Unit Tests
- [ ] 7.1: All toXML() tests pass
- [ ] 7.2: All fromXML() tests pass
- [ ] 7.3: Code coverage > 90%

### Integration Tests
- [ ] 7.4: API endpoint tests pass
- [ ] 7.5: Export integration tests pass (if applicable)

### Manual Testing
- [ ] 7.6: Create draft AEC → download XML → verify
- [ ] 7.7: Create full AEC → download XML → verify
- [ ] 7.8: Parse downloaded XML → verify round-trip
- [ ] 7.9: Test with different browsers
- [ ] 7.10: Test with special characters in data

### Edge Cases
- [ ] 7.11: Test with empty acceptance criteria
- [ ] 7.12: Test with null description
- [ ] 7.13: Test with no estimate
- [ ] 7.14: Test with no external issue
- [ ] 7.15: Test with drifted AEC

**Phase 7 Complete:** [ ] Yes  
**Time Spent:** _____ hours

---

## Phase 8: Documentation ⏱️ 1-2 hours

- [ ] 8.1: Update API docs (Swagger/OpenAPI)
- [ ] 8.2: Add usage examples to README
- [ ] 8.3: Update CHANGELOG
- [ ] 8.4: Create PR with detailed description
- [ ] 8.5: Code review addressed
- [ ] 8.6: All CI checks pass
- [ ] 8.7: Merge to main

**Phase 8 Complete:** [ ] Yes  
**Time Spent:** _____ hours

---

## Final Checklist - Story Complete ✅

### Acceptance Criteria (from Story 2.5)
- [ ] ✅ XSD schema defined (already done)
- [ ] `aec.toXML()` generates valid XML
- [ ] `AEC.fromXML(xml)` reconstructs AEC
- [ ] Round-trip conversion works
- [ ] XML contains all 8 sections
- [ ] GET /api/tickets/:id/xml works
- [ ] Download button in UI
- [ ] Browser download works
- [ ] All unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] Jira/Linear exports include XML (optional for v1)

### Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Code follows project standards (CLAUDE.md)
- [ ] Clean Architecture maintained (domain independent)
- [ ] Error handling implemented
- [ ] Logging added for debugging

### Documentation
- [ ] API endpoint documented
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] PR description complete

### Deployment
- [ ] Feature branch created
- [ ] All commits follow convention
- [ ] PR created and reviewed
- [ ] CI/CD pipeline passes
- [ ] Merged to main
- [ ] Deployed to staging
- [ ] Smoke tested in staging
- [ ] Ready for production

---

## Time Tracking Summary

| Phase | Estimated | Actual | Notes |
|-------|-----------|--------|-------|
| Phase 1: Setup | 1-2h | ___h | |
| Phase 2: toXML | 6-8h | ___h | |
| Phase 3: fromXML | 4-6h | ___h | |
| Phase 4: API | 2-3h | ___h | |
| Phase 5: Export | 4-6h | ___h | Optional |
| Phase 6: UI | 2-3h | ___h | |
| Phase 7: Testing | 6-8h | ___h | |
| Phase 8: Docs | 1-2h | ___h | |
| **TOTAL** | **22-32h** | **___h** | |

---

## Blockers & Issues

| Date | Issue | Resolution | Status |
|------|-------|------------|--------|
| | | | |

---

## Notes & Learnings

### What Went Well


### What Could Be Improved


### Unexpected Challenges


---

**Story Status:** 🟡 Not Started → 🟠 In Progress → 🟢 Complete

**Completed:** ___________  
**Total Time:** _____ hours  
**Merged PR:** #_____
