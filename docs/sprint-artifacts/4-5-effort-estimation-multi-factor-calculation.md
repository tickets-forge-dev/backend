# Story 4.5: Effort Estimation - Multi-Factor Calculation

**Epic:** Epic 4 - Code Intelligence & Estimation  
**Story ID:** 4.5  
**Created:** 2026-02-02  
**Status:** Done  
**Priority:** P2  
**Effort Estimate:** 3 hours

---

## User Story

As a Product Manager,  
I want accurate effort estimates based on code complexity and similar tickets,  
So that I can plan sprints realistically.

---

## Acceptance Criteria

**Given** an AEC has been validated and code/API snapshots resolved  
**When** the estimation step runs (step 8 of generation)  
**Then** the system calculates effort based on:
- **Modules touched:** Count of files/modules affected
- **API changes:** New endpoints, modified schemas, breaking changes
- **DB changes:** Migrations detected (schema changes in code)
- **Auth impact:** Changes to permissions, roles, or auth flows
- **Similar tickets:** Historical data from past tickets with similar scope

**And** estimation output includes:
- **Range:** Min-max hours (e.g., "4-8 hours")
- **Confidence:** Low/Medium/High based on data availability
- **Drivers:** Top 3 factors influencing estimate (e.g., "3 modules touched", "New API endpoint", "Auth logic change")

**And** estimation stored in AEC:
- `estimate: { min: number, max: number, confidence: string, drivers: string[] }`

**And** estimation logic:
- Base effort: 2 hours (minimum ticket size)
- +1-2 hours per module touched
- +2-4 hours for API changes
- +3-6 hours for DB migrations
- +2-3 hours for auth changes
- Adjusted by confidence (reduce range if high confidence)

**And** when insufficient data available:
- Confidence = "Low"
- Range = "4-12 hours" (wide)
- Drivers include "Limited historical data"

**And** UI displays estimate in ticket detail:
- "Estimate: 4-8 hours (Medium confidence)" badge
- Expandable section showing drivers

---

## Prerequisites

- Story 4.2 (Code Indexing - Build Repo Index for Query) - COMPLETED ✅
- Story 4.3 (OpenAPI Spec Sync - API Contract Awareness) - COMPLETED ✅
- Story 3.1 (Validation Engine - Multi-Criteria Scoring) - COMPLETED ✅

---

## Technical Notes

### Architecture Layer: Application + Domain

**Estimation Engine:**
- File: `backend/src/tickets/application/services/estimation-engine.service.ts`
- Responsibilities: Calculate effort based on multiple factors

**Use Case:**
- File: `backend/src/tickets/application/use-cases/estimate-effort.use-case.ts`
- Called at generation step 8

**Similar Tickets Query:**
- Firestore query for AECs with similar `repoPaths` or `type`
- Use for historical context

**Initial MVP:**
- Rule-based estimation (no ML)
- Deterministic calculations

**Post-MVP:**
- Train model on historical ticket data
- Machine learning for improved accuracy

**Frontend Component:**
- `client/src/features/tickets/components/EstimateBadge.tsx`

---

## Technical Implementation

### Domain Layer

**File:** `backend/src/tickets/domain/value-objects/Estimate.ts`

```typescript
export interface Estimate {
  min: number;
  max: number;
  confidence: 'Low' | 'Medium' | 'High';
  drivers: string[];
}
```

### Application Layer

**File:** `backend/src/tickets/application/services/estimation-engine.interface.ts`

```typescript
export interface IEstimationEngine {
  estimateEffort(params: EstimationParams): Promise<Estimate>;
}

export interface EstimationParams {
  workspaceId: string;
  repositoryName: string;
  ticketType: TicketType;
  repoPaths: string[];
  hasApiChanges: boolean;
  hasDatabaseChanges: boolean;
  hasAuthChanges: boolean;
}
```

**File:** `backend/src/tickets/application/use-cases/estimate-effort.use-case.ts`

```typescript
export class EstimateEffortUseCase {
  async execute(aecId: string): Promise<Estimate>;
}
```

### Infrastructure Layer

**File:** `backend/src/tickets/infrastructure/services/estimation-engine.service.ts`

Implementation responsibilities:
1. Count modules touched from repoPaths
2. Detect API changes from code index
3. Detect DB migrations (look for migration files)
4. Detect auth changes (auth-related files)
5. Query historical tickets with similar scope
6. Calculate min-max range
7. Determine confidence level
8. Identify top 3 drivers

**Estimation Formula:**

```typescript
// Base effort
let minHours = 2;
let maxHours = 2;

// Modules touched
const moduleCount = repoPaths.length;
minHours += moduleCount * 1;
maxHours += moduleCount * 2;

// API changes
if (hasApiChanges) {
  minHours += 2;
  maxHours += 4;
}

// Database migrations
if (hasDatabaseChanges) {
  minHours += 3;
  maxHours += 6;
}

// Auth changes
if (hasAuthChanges) {
  minHours += 2;
  maxHours += 3;
}

// Confidence adjustment
const historicalTickets = await this.findSimilarTickets(...);
let confidence: string;

if (historicalTickets.length >= 5) {
  confidence = 'High';
  // Narrow range for high confidence
  const avg = (minHours + maxHours) / 2;
  minHours = Math.round(avg * 0.8);
  maxHours = Math.round(avg * 1.2);
} else if (historicalTickets.length >= 2) {
  confidence = 'Medium';
} else {
  confidence = 'Low';
  // Widen range for low confidence
  minHours = Math.max(4, Math.round(minHours * 0.7));
  maxHours = Math.min(12, Math.round(maxHours * 1.3));
}
```

---

## Testing Requirements

### Unit Tests

1. **EstimationEngine.spec.ts**
   - Calculates base effort (2 hours)
   - Adds hours per module touched
   - Adds hours for API changes
   - Adds hours for DB migrations
   - Adds hours for auth changes
   - Adjusts confidence based on historical data
   - Narrows range for high confidence
   - Widens range for low confidence
   - Identifies top 3 drivers

2. **EstimateEffortUseCase.spec.ts**
   - Loads AEC by ID
   - Calls estimation engine with correct params
   - Saves estimate to AEC
   - Returns estimate

### Integration Tests

1. **Effort Estimation E2E**
   - Create AEC with snapshots
   - Run estimation
   - Verify estimate stored in Firestore
   - Verify estimate has min, max, confidence, drivers
   - Verify UI displays estimate badge

---

## Functional Requirements Coverage

- **FR6:** System provides effort estimates based on code complexity ✅

---

## Definition of Done

- [ ] Estimate value object created
- [ ] IEstimationEngine interface defined
- [ ] EstimationEngineService implemented
- [ ] EstimateEffortUseCase created
- [ ] Module counting logic working
- [ ] API change detection functional
- [ ] DB migration detection functional
- [ ] Auth change detection functional
- [ ] Similar tickets query implemented
- [ ] Confidence calculation working
- [ ] Driver identification functional
- [ ] Estimate stored in AEC
- [ ] EstimateBadge component created (frontend)
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Code review completed
- [ ] Documentation updated

---

## Dev Agent Record

**Status:** Done  
**Assigned To:** Amelia (Dev Agent)  
**Completed:** 2026-02-02  
**Context Reference:** 
- docs/sprint-artifacts/4-5-effort-estimation-multi-factor-calculation.context.xml

**Implementation Summary:**
- Estimate value object already existed (reused)
- Created IEstimationEngine interface
- Implemented EstimationEngineService with rule-based calculation
- Created EstimateEffortUseCase
- Implemented module counting, API/DB/auth change detection
- Historical ticket query for confidence calculation
- Top 3 drivers identification
- Integrated with TicketsModule
- Unit tests created covering all calculation branches

---

## Notes

- This is the FINAL story in Epic 4!
- Initial implementation is rule-based (deterministic)
- No machine learning required for MVP
- Post-MVP: Train on historical data for better accuracy
- Estimation runs as part of generation step 8
- Frontend badge displays estimate prominently
- Expandable section shows breakdown of drivers
