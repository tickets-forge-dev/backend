# Story 1-3b-01: Backend - API Detection Service

**Epic:** EPIC 1 - Interactive API Editor with Smart Detection
**Status:** IN PROGRESS
**Priority:** CRITICAL
**Effort:** 2 days
**Assignee:** Claude

---

## Objective

Create the core `ApiDetectionService` that:
1. Scans the codebase to find existing API endpoints (from NestJS controllers)
2. Accepts LLM-detected APIs from deep analysis
3. Merges both sources and identifies conflicts
4. Generates cURL commands for testing

---

## Acceptance Criteria

- ✅ `ApiDetectionService` created with full implementation
- ✅ Can scan controller files for @Get/@Post/@Put/@Patch/@Delete decorators
- ✅ Can parse LLM response with new/modified/deleted APIs
- ✅ Merges codebase + spec APIs correctly
- ✅ Detects conflicts (spec says "new" but exists in codebase)
- ✅ Generates valid cURL commands
- ✅ All methods have unit tests
- ✅ TypeScript strict mode passes
- ✅ No linting errors

---

## Files Created

```
backend/src/tickets/application/services/
  └── ApiDetectionService.ts          (NEW - 250 lines)

backend/src/tickets/utils/
  └── curl-generator.ts               (NEW - 120 lines, reusable)
```

---

## Implementation Notes

### ApiDetectionService Methods

**Public:**
- `detectApisFromCodebase(owner, repo, branch)` → Scans controllers
- `detectApisFromSpec(spec, aec, llmResponse)` → Parses LLM output
- `mergeApiLists(coedbaseApis, specApis)` → Deduplicates and finds conflicts

**Private:**
- `findControllerFiles()` → GitHub API to find .controller.ts files
- `parseControllerFile()` → Regex to extract routes from code
- `jsonToSchema()` → Convert JSON example to schema string
- `generateCurlCommand()` → Build cURL for testing

### Data Types

```typescript
DetectedApi {
  id: string;                    // Unique ID
  status: 'existing' | 'new' | 'modified' | 'delete';
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;                  // e.g., "/api/tickets"
  request: { shape, example };   // Request payload spec
  response: { shape, example };  // Response spec
  description: string;           // What it does
  sourceFile?: string;           // Where it was found (codebase)
  curlCommand: string;           // Ready to copy-paste
  confidence: 'high' | 'medium' | 'low';
  createdAt: Date;
  confirmedAt?: Date;
}

ApiDetectionResult {
  apis: DetectedApi[];           // Merged list
  fromCodebase: DetectedApi[];   // Existing APIs only
  fromSpec: DetectedApi[];       // Spec APIs only
  conflicts: DetectedApi[];      // Conflicts found
}
```

---

## Testing Strategy

### Unit Tests Required

1. **Parsing Controller Files**
   - ✅ Extract @Get('path') correctly
   - ✅ Extract @Post('path') correctly
   - ✅ Handle controller base paths
   - ✅ Ignore non-controller files

2. **LLM Response Parsing**
   - ✅ Parse new API correctly
   - ✅ Parse modified API correctly
   - ✅ Parse deleted API correctly
   - ✅ Handle missing fields gracefully
   - ✅ Validate confidence levels

3. **Merging Logic**
   - ✅ Merge codebase + spec without duplicates
   - ✅ Detect conflict: spec="new" but exists
   - ✅ Detect conflict: spec="modify" but doesn't exist
   - ✅ Mark existing APIs for deletion correctly

4. **cURL Generation**
   - ✅ Generate valid GET cURL
   - ✅ Generate valid POST cURL with body
   - ✅ Generate valid PUT cURL with body
   - ✅ Quote special characters correctly
   - ✅ Include headers correctly
   - ✅ Handle query parameters

---

## Integration Points

**Upstream (Feeds Into):**
- `DeepAnalysisServiceImpl` calls this service with LLM response
- `tickets.controller.ts` has endpoint: `GET /tickets/:id/detect-apis`

**Downstream (Consumed By):**
- Story 1-3b-04: Frontend ApiReviewSection component
- Story 1-3b-07: Integration tests

---

## Dependencies

- `GitHubApiClient` (existing service) - to fetch controller files
- NestJS `@Injectable()` decorator
- Standard TypeScript utilities

**NPM Packages:**
- None new (uses existing dependencies)

---

## Rollout Plan

1. **Day 1:** Implement all methods + unit tests
2. **Day 2:** Integration test with real controller files
3. **Commit:** After Day 2 when all tests pass

---

## Known Risks

1. **Controller Parsing:** Regex might miss edge cases (decorators with newlines, etc.)
   - *Mitigation:* Start simple, enhance in future if needed

2. **GitHub API Rate Limiting:** Fetching many files might hit limits
   - *Mitigation:* Cache results, implement exponential backoff

3. **LLM Response Format:** Format might vary if LLM prompt changes
   - *Mitigation:* Validate and log any parse errors

---

## Success Metrics

- ✅ Can detect 100% of NestJS controller routes
- ✅ Can parse any LLM-generated API list
- ✅ Zero false positives in merging
- ✅ cURL commands are copy-paste ready
- ✅ All tests pass (>80% coverage)
- ✅ Build passes, 0 TS errors

---

## Follow-Up Stories

- **1-3b-02:** ControllerScanner (dedicated scanner service - optional if this becomes too large)
- **1-3b-03:** DeepAnalysisService Enhancement (integrate detection into analysis pipeline)
- **1-3b-04:** Frontend - API Review Section (UI to review detected APIs)

---

**Created:** 2026-02-07
**Last Updated:** 2026-02-07
**Status:** Implementation in progress
