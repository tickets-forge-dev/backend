# Story 4.3: OpenAPI Spec Sync - API Contract Awareness

**Epic:** Epic 4 - Code Intelligence & Estimation  
**Story ID:** 4.3  
**Created:** 2026-02-02  
**Status:** Done  
**Priority:** P2  
**Effort Estimate:** 3 hours

---

## User Story

As a backend system,  
I want to pull and validate OpenAPI specs from repositories,  
So that tickets reference actual API contracts and detect drift.

---

## Acceptance Criteria

**Given** a repository contains an OpenAPI spec file (e.g., `openapi.yaml`)  
**When** the indexing job runs  
**Then** the system:
- Detects OpenAPI spec file(s) in repo
- Parses and validates spec (OpenAPI 3.0/3.1)
- Extracts endpoints, methods, request/response schemas
- Computes spec hash (SHA-256 of spec content)
- Stores spec metadata in Firestore

**And** spec stored in Firestore:
- Collection: `/workspaces/{workspaceId}/apiSpecs/{specId}`
- Fields: `repoName`, `specUrl`, `hash`, `endpoints[]`, `version`, `commitSha`, `createdAt`

**And** when ticket generation references an API:
- Ticket includes `apiSnapshot: { specUrl, hash }`
- Snapshot locks ticket to specific API version

**And** spec validation enforced:
- Invalid OpenAPI files logged but don't block indexing
- UI shows warning if spec validation fails

**And** graceful degradation when no spec found:
- If no OpenAPI spec files detected, log and continue
- Store metadata with hasSpec: false, endpoints: []
- Ticket generation proceeds without API snapshot
- No blocking errors for repos without specs

**And** query interface exists:
- `findEndpointsByIntent(intent: string, specId: string): Promise<Endpoint[]>`
- Returns relevant API endpoints for ticket type

---

## Prerequisites

- Story 4.2 (Code Indexing - Build Repo Index for Query) - COMPLETED ✅

---

## Technical Notes

### Architecture Layer: Infrastructure + Application

**OpenAPI Parser:**
- Use `@apidevtools/swagger-parser` or `openapi-typescript`
- Supports OpenAPI 3.0 and 3.1

**Spec Detection:**
- Search for `openapi.yaml`, `openapi.json`, `swagger.yaml` in repo root or `/docs`
- Scan common locations: `/api-docs`, `/specifications`

**Storage Strategy:**
- Store full spec in Firestore if < 1MB
- Use Cloud Storage for larger specs
- Always store metadata in Firestore

**Hash Computation:**
- Use Node.js `crypto` module
- Algorithm: SHA-256 of normalized spec content

**Error Handling:**
- Validation errors logged to Firestore `/logs` for debugging
- Continue indexing even if spec is invalid
- Store validation status with spec metadata
- If no spec found: log info (not error), store hasSpec: false, continue gracefully

---

## Technical Implementation

### Domain Layer

**File:** `backend/src/domain/entities/ApiSpec.ts`

```typescript
export interface ApiEndpoint {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  requestSchema?: object;
  responseSchema?: object;
}

export interface ApiSpec {
  id: string;
  workspaceId: string;
  repoName: string;
  specUrl: string;
  hash: string;
  endpoints: ApiEndpoint[];
  version: string;
  commitSha: string;
  hasSpec: boolean;              // NEW: false if no spec found
  isValid: boolean;
  validationErrors?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Application Layer

**File:** `backend/src/application/services/ApiSpecIndexer.ts`

```typescript
export interface IApiSpecIndexer {
  indexApiSpecs(workspaceId: string, repoName: string, commitSha: string): Promise<void>;
  findEndpointsByIntent(intent: string, specId: string): Promise<ApiEndpoint[]>;
  getSpecByRepo(workspaceId: string, repoName: string): Promise<ApiSpec | null>;
}
```

### Infrastructure Layer

**File:** `backend/src/infrastructure/services/ApiSpecIndexerImpl.ts`

Implementation responsibilities:
1. Detect OpenAPI spec files in repository
2. Parse and validate spec using swagger-parser
3. Extract endpoints with schemas
4. Compute SHA-256 hash
5. Store in Firestore
6. Handle validation errors gracefully

**File:** `backend/src/infrastructure/repositories/ApiSpecRepository.ts`

Firestore operations:
- `save(apiSpec: ApiSpec): Promise<void>`
- `findByRepo(workspaceId: string, repoName: string): Promise<ApiSpec | null>`
- `findById(specId: string): Promise<ApiSpec | null>`
- `update(specId: string, updates: Partial<ApiSpec>): Promise<void>`

---

## Dependencies

```json
{
  "@apidevtools/swagger-parser": "^10.1.0"
}
```

---

## Testing Requirements

### Unit Tests

1. **ApiSpecIndexer.spec.ts**
   - Detects OpenAPI files in repository
   - Parses valid OpenAPI 3.0 spec
   - Parses valid OpenAPI 3.1 spec
   - Handles invalid spec gracefully
   - Extracts endpoints correctly
   - Computes hash consistently
   - Stores metadata in Firestore

2. **ApiSpecRepository.spec.ts**
   - Saves spec to Firestore
   - Retrieves spec by repo
   - Retrieves spec by ID
   - Updates spec metadata

### Integration Tests

1. **OpenAPI Indexing E2E**
   - Index repository with valid OpenAPI spec
   - Verify spec stored in Firestore
   - Verify endpoints extracted
   - Query endpoints by intent

---

## Functional Requirements Coverage

- **FR10:** System pulls and validates OpenAPI specs for API-aware tickets ✅

---

## Definition of Done

- [x] Domain entity `ApiSpec` created
- [x] Application service `IApiSpecIndexer` interface defined
- [x] Infrastructure implementation `ApiSpecIndexerImpl` complete
- [x] Firestore repository `ApiSpecRepository` implemented
- [x] OpenAPI spec detection logic working
- [x] Spec parsing and validation functional
- [x] Hash computation implemented
- [x] Endpoints extraction working
- [x] Query interface `findEndpointsByIntent` implemented
- [x] Unit tests passing (100% coverage for new code)
- [x] Integration tests passing
- [x] Error handling and logging in place
- [x] Code review completed
- [x] Documentation updated

---

## Dev Agent Record

**Status:** Done  
**Assigned To:** Amelia (Dev Agent)  
**Completed:** 2026-02-02  
**Context Reference:** 
- docs/sprint-artifacts/4-3-openapi-spec-sync-api-contract-awareness.context.xml

**Implementation Summary:**
- Created domain entities: ApiSpec, ApiEndpoint
- Implemented application interface: IApiSpecIndexer
- Built infrastructure service: ApiSpecIndexerImpl with graceful degradation
- Implemented Firestore repository: FirestoreApiSpecRepository
- Integrated with existing RepoIndexerService
- Added unit tests covering graceful degradation and endpoint querying
- Wired up dependency injection in IndexingModule

---

## Notes

- This story builds on the code indexing infrastructure from Story 4.2
- OpenAPI spec awareness enables the system to reference actual API contracts in tickets
- Hash-based snapshot system will enable drift detection in Story 4.4
- MVP focuses on detection and storage; advanced querying can be enhanced post-MVP
