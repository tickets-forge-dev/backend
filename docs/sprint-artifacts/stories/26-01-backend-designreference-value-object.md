# Story 26-01: Backend - DesignReference Value Object & Domain Model

**Epic:** Epic 26 - Design Link Integration with LLM Leverage
**Status:** TODO
**Priority:** HIGH
**Effort:** 2 hours
**Assignee:** TBD

---

## Objective

Create the core `DesignReference` value object and update the AEC domain model to support design links:
1. Define DesignReference value object with platform detection
2. Define DesignPlatform enum and DesignMetadata interfaces
3. Update AEC domain model with designReferences array
4. Add domain methods: addDesignReference() and removeDesignReference()
5. Update AEC factories (createDraft, reconstitute) to handle design references

---

## Acceptance Criteria

- ✅ `DesignReference.ts` value object created with full interface
- ✅ `DesignPlatform` enum supports: figma, loom, miro, sketch, whimsical, other
- ✅ `DesignMetadata` interface defined for Figma and Loom metadata
- ✅ Platform auto-detection works (regex-based from URL)
- ✅ AEC domain model updated with `_designReferences: DesignReference[]`
- ✅ `AEC.addDesignReference()` method enforces max 5 limit
- ✅ `AEC.removeDesignReference()` method removes by ID
- ✅ `AEC.designReferences` getter returns array
- ✅ AEC factories (createDraft, reconstitute) accept designReferences parameter
- ✅ TypeScript strict mode passes (no `any` casts)
- ✅ Unit tests for platform detection and max limit enforcement
- ✅ No linting errors

---

## Files Created

```
backend/src/tickets/domain/value-objects/
  └── DesignReference.ts                (NEW - 150 lines, interfaces, platform detection)
```

---

## Files Modified

```
backend/src/tickets/domain/aec/AEC.ts
  - Line 48: Add _designReferences: DesignReference[] = []
  - Add designReferences getter
  - Add addDesignReference(reference: DesignReference) method
  - Add removeDesignReference(referenceId: string) method
  - Update createDraft() factory to accept designReferences?: DesignReference[]
  - Update reconstitute() factory to accept designReferences?: DesignReference[]
  - Update validate() method to include design reference checks
```

---

## Implementation Notes

### DesignReference.ts Structure

```typescript
export interface DesignReference {
  id: string;                    // UUID v4
  url: string;                   // Validated HTTPS URL, max 2048 chars
  platform: DesignPlatform;      // Auto-detected from URL
  title?: string;                // User-provided or fetched from API (Phase 2)
  metadata?: DesignMetadata;     // Platform-specific metadata (Phase 2)
  addedAt: Date;                 // Timestamp when added
  addedBy: string;               // User email
}

export type DesignPlatform = 'figma' | 'loom' | 'miro' | 'sketch' | 'whimsical' | 'other';

export interface DesignMetadata {
  figma?: {
    fileName: string;
    thumbnailUrl: string;
    lastModified: Date;
    fileKey: string;              // Extracted from URL
  };
  loom?: {
    videoTitle: string;
    duration: number;             // Seconds
    thumbnailUrl: string;
    transcript?: string;          // For LLM context
    sharedId: string;             // Extracted from URL
  };
}

export const MAX_DESIGN_LINKS = 5;

// Platform detection helper function
export function detectPlatform(url: string): DesignPlatform {
  if (/figma\.com\/(file|proto|design)/.test(url)) return 'figma';
  if (/loom\.com\/(share|embed)/.test(url)) return 'loom';
  if (/miro\.com\/(app|board)/.test(url)) return 'miro';
  if /(sketch\.com|sketchapp)/.test(url)) return 'sketch';
  if /(whimsical\.com|whimsical\.app)/.test(url)) return 'whimsical';
  return 'other';
}

// URL validation helper
export function isValidDesignUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && url.length <= 2048;
  } catch {
    return false;
  }
}
```

### AEC Domain Changes

**Add to AEC class constructor:**
```typescript
private _designReferences: DesignReference[] = [];
```

**Add getter:**
```typescript
get designReferences(): DesignReference[] {
  return [...this._designReferences];
}
```

**Add addDesignReference method:**
```typescript
addDesignReference(reference: DesignReference): void {
  if (this._designReferences.length >= MAX_DESIGN_LINKS) {
    throw new DomainException(
      `Maximum ${MAX_DESIGN_LINKS} design links allowed per ticket`
    );
  }

  if (!isValidDesignUrl(reference.url)) {
    throw new DomainException('Invalid design reference URL');
  }

  // Check for duplicates
  if (this._designReferences.some(r => r.url === reference.url)) {
    throw new DomainException('Design reference URL already added');
  }

  this._designReferences.push(reference);
}
```

**Add removeDesignReference method:**
```typescript
removeDesignReference(referenceId: string): void {
  const index = this._designReferences.findIndex(r => r.id === referenceId);
  if (index === -1) {
    throw new DomainException(`Design reference with ID ${referenceId} not found`);
  }
  this._designReferences.splice(index, 1);
}
```

**Update createDraft factory:**
```typescript
static createDraft(
  ticketId: string,
  workspaceId: string,
  userId: string,
  title: string,
  description: string,
  ticketType: TicketType,
  designReferences?: DesignReference[]
): AEC {
  const aec = new AEC(ticketId, workspaceId, userId, title, description, ticketType);

  if (designReferences && designReferences.length > 0) {
    for (const ref of designReferences) {
      aec.addDesignReference(ref);
    }
  }

  return aec;
}
```

**Update reconstitute factory:**
```typescript
static reconstitute(data: AECData): AEC {
  const aec = new AEC(
    data.id,
    data.workspaceId,
    data.userId,
    data.title,
    data.description,
    data.ticketType,
    // ... other properties
  );

  if (data.designReferences && data.designReferences.length > 0) {
    for (const ref of data.designReferences) {
      aec._designReferences.push(ref);
    }
  }

  return aec;
}
```

---

## Data Types

### DesignReference Value Object

```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  url: "https://figma.com/file/abc123/Dashboard-Redesign",
  platform: "figma",
  title: "Dashboard Mockups v2",
  metadata: null,  // Filled in Phase 2
  addedAt: 2026-02-14T10:30:00Z,
  addedBy: "alice@company.com"
}
```

### AECData Interface Update

```typescript
interface AECData {
  // ... existing properties
  designReferences?: DesignReference[];
}
```

---

## Testing Strategy

### Unit Tests Required

1. **Platform Detection**
   - ✅ Detect Figma URLs correctly
   - ✅ Detect Loom URLs correctly
   - ✅ Detect Miro URLs correctly
   - ✅ Detect 'other' for unknown platforms
   - ✅ Handle URL with path parameters correctly

2. **URL Validation**
   - ✅ Accept valid HTTPS URLs
   - ✅ Reject HTTP URLs (non-HTTPS)
   - ✅ Reject URLs > 2048 characters
   - ✅ Reject malformed URLs

3. **Domain Business Rules**
   - ✅ Add design reference successfully
   - ✅ Throw error when adding 6th reference (max 5)
   - ✅ Throw error on duplicate URL
   - ✅ Remove reference by ID
   - ✅ Throw error when removing non-existent reference
   - ✅ designReferences getter returns copy (not reference)

4. **Factory Methods**
   - ✅ createDraft with no design references
   - ✅ createDraft with multiple design references
   - ✅ reconstitute preserves design references
   - ✅ reconstitute with empty array

---

## Integration Points

**Upstream (Feeds Into):**
- Story 26-02: AddDesignReferenceUseCase (uses DesignReference)
- Story 26-02: RemoveDesignReferenceUseCase (uses DesignReference)

**Downstream (Consumed By):**
- Story 26-04: AECMapper persistence layer
- Story 26-03: API endpoints and DTOs

---

## Dependencies

- NestJS (domain layer doesn't depend on framework)
- Standard TypeScript utilities
- UUID for ID generation

**NPM Packages:**
- uuid (already in project)

---

## Rollout Plan

1. **Day 1 Morning:** Create DesignReference.ts with interfaces and helpers
2. **Day 1 Afternoon:** Update AEC domain model with methods
3. **Day 1 Late:** Write and run unit tests
4. **Commit:** After all tests pass

---

## Known Risks

1. **Platform Regex Edge Cases:** Complex URLs with fragments/query params might not parse correctly
   - *Mitigation:* Extract domain first using URL() constructor, then regex on domain

2. **URL Length Validation:** Max 2048 might be exceeded by Figma URLs with long filenames
   - *Mitigation:* Increase to 4096 if needed during Phase 2 testing

3. **Duplicate Detection:** URL comparison is case-sensitive
   - *Mitigation:* Normalize URLs before comparison (lowercase, remove trailing slash)

---

## Success Metrics

- ✅ Platform detection works for all 6 types (figma, loom, miro, sketch, whimsical, other)
- ✅ URL validation rejects invalid URLs (non-HTTPS, too long)
- ✅ Max 5 links limit enforced (6th reference throws error)
- ✅ Duplicate URLs rejected
- ✅ All unit tests pass (>90% coverage)
- ✅ Build passes, 0 TypeScript errors
- ✅ No linting errors

---

## Follow-Up Stories

- **26-02:** Backend - Add/Remove Design Reference Use Cases
- **26-04:** Backend - AECMapper Persistence Layer

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Status:** TODO
