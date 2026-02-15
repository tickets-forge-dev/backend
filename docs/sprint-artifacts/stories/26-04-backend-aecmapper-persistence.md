# Story 26-04: Backend - AECMapper Persistence Layer

**Epic:** Epic 26 - Design Link Integration with LLM Leverage
**Status:** TODO
**Priority:** HIGH
**Effort:** 1.5 hours
**Assignee:** TBD

---

## Objective

Update the AECMapper to handle persistence of design references:
1. Add `designReferences` field to AECDocument interface (MongoDB schema)
2. Map designReferences from domain → persistence (toPersistence)
3. Map designReferences from persistence → domain (toDomain)
4. Ensure bidirectional sync between AEC domain and MongoDB
5. Handle null/undefined gracefully

---

## Acceptance Criteria

- ✅ AECDocument interface updated with `designReferences?: DesignReference[]`
- ✅ toPersistence() method maps designReferences array
- ✅ toDomain() method reconstructs designReferences from stored data
- ✅ Null/undefined designReferences handled gracefully (defaults to [])
- ✅ Timestamp fields (addedAt) properly serialized
- ✅ No data loss when round-tripping (domain → persistence → domain)
- ✅ Unit tests verify bidirectional mapping
- ✅ TypeScript strict mode passes (no `any` casts)
- ✅ No linting errors

---

## Files Created

None (all modifications to existing AECMapper.ts)

---

## Files Modified

```
backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts
  - Add designReferences?: DesignReference[] to AECDocument interface
  - Map designReferences in toPersistence() method
  - Map designReferences in toDomain() method
  - Update AECData interface if needed
```

---

## Implementation Notes

### AECDocument Interface Update

```typescript
interface AECDocument {
  _id: ObjectId;
  ticketId: string;
  workspaceId: string;
  userId: string;
  title: string;
  description: string;
  ticketType: TicketType;
  status: AECStatus;
  // ... existing fields ...

  // NEW: Design References
  designReferences?: DesignReference[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### toPersistence() Method Update

```typescript
static toPersistence(aec: AEC): AECDocument {
  return {
    // ... existing mappings ...

    // Design References (NEW)
    designReferences: aec.designReferences.map(ref => ({
      id: ref.id,
      url: ref.url,
      platform: ref.platform,
      title: ref.title,
      metadata: ref.metadata,
      addedAt: ref.addedAt, // Serialize as ISO string or Date
      addedBy: ref.addedBy
    })),

    // Timestamps
    createdAt: aec.createdAt,
    updatedAt: new Date()
  };
}
```

### toDomain() Method Update

```typescript
static toDomain(document: AECDocument): AEC {
  // Load base properties
  const aec = new AEC(
    document.ticketId,
    document.workspaceId,
    document.userId,
    document.title,
    document.description,
    document.ticketType,
    // ... other properties ...
  );

  // Restore design references (NEW)
  const designReferences = document.designReferences ?? [];
  for (const ref of designReferences) {
    // Direct assignment to bypass validation
    // (since we're loading from persistence, not adding new)
    aec['_designReferences'].push({
      id: ref.id,
      url: ref.url,
      platform: ref.platform,
      title: ref.title,
      metadata: ref.metadata,
      addedAt: new Date(ref.addedAt), // Ensure Date object
      addedBy: ref.addedBy
    });
  }

  return aec;
}
```

### Alternative: Using Reconstitute Factory

If using the reconstitute() factory method:

```typescript
static toDomain(document: AECDocument): AEC {
  return AEC.reconstitute({
    // ... existing properties ...
    designReferences: (document.designReferences ?? []).map(ref => ({
      id: ref.id,
      url: ref.url,
      platform: ref.platform,
      title: ref.title,
      metadata: ref.metadata,
      addedAt: new Date(ref.addedAt),
      addedBy: ref.addedBy
    }))
  });
}
```

---

## Data Types

### MongoDB Document Schema

```typescript
// Stored in MongoDB
{
  "_id": ObjectId("..."),
  "ticketId": "550e8400-e29b-41d4-a716-446655440000",
  "workspaceId": "60d5ec49c1234567890abcd0",
  "userId": "alice@company.com",
  "title": "Implement user dashboard",
  "description": "...",
  "ticketType": "feature",
  "status": "draft",

  // Design references stored as array
  "designReferences": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "url": "https://figma.com/file/abc123/Dashboard-Redesign",
      "platform": "figma",
      "title": "Dashboard Mockups v2",
      "metadata": null,
      "addedAt": ISODate("2026-02-14T10:30:00Z"),
      "addedBy": "alice@company.com"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "url": "https://loom.com/share/xyz789",
      "platform": "loom",
      "title": "User Flow Demo",
      "metadata": null,
      "addedAt": ISODate("2026-02-14T10:35:00Z"),
      "addedBy": "bob@company.com"
    }
  ],

  "createdAt": ISODate("2026-02-14T09:00:00Z"),
  "updatedAt": ISODate("2026-02-14T10:35:00Z")
}
```

### Domain Object (AEC)

```typescript
// In memory (after toDomain)
aec.designReferences === [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    url: "https://figma.com/file/abc123/Dashboard-Redesign",
    platform: "figma",
    title: "Dashboard Mockups v2",
    metadata: undefined,
    addedAt: Date object,
    addedBy: "alice@company.com"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    url: "https://loom.com/share/xyz789",
    platform: "loom",
    title: "User Flow Demo",
    metadata: undefined,
    addedAt: Date object,
    addedBy: "bob@company.com"
  }
]
```

---

## Testing Strategy

### Unit Tests for Mapping

1. **toPersistence() - Domain to Persistence**
   - ✅ Map empty designReferences array correctly
   - ✅ Map single design reference correctly
   - ✅ Map multiple design references correctly
   - ✅ Preserve all fields (id, url, platform, title, addedAt, addedBy)
   - ✅ Serialize timestamps as Date/ISODate
   - ✅ Handle null metadata gracefully

2. **toDomain() - Persistence to Domain**
   - ✅ Reconstruct AEC with designReferences
   - ✅ Handle missing/undefined designReferences (default to [])
   - ✅ Deserialize timestamps back to Date objects
   - ✅ All fields accessible via aec.designReferences getter
   - ✅ designReferences array is copy (mutations don't affect domain)

3. **Round-Trip Testing**
   - ✅ domain → persistence → domain preserves all data
   - ✅ Empty array round-trips correctly
   - ✅ Multiple references round-trip correctly
   - ✅ No data loss

4. **Edge Cases**
   - ✅ Handle null metadata object
   - ✅ Handle undefined metadata
   - ✅ Handle missing optional fields (title)
   - ✅ Handle future metadata fields without breaking

---

## Integration Points

**Upstream (Depends On):**
- Story 26-01: DesignReference value object
- Story 26-02: AddDesignReferenceUseCase (calls repository.save)
- Story 26-02: RemoveDesignReferenceUseCase (calls repository.save)

**Downstream (Feeds Into):**
- Story 26-06: Frontend gets design references in ticket response
- Story 26-08: Ticket detail displays design references

---

## Dependencies

- MongoDB driver/Mongoose (existing)
- DesignReference interface from Story 26-01
- AEC domain model (Story 26-01)
- TypeScript

**NPM Packages:**
- None new (uses existing persistence setup)

---

## Rollout Plan

1. **30 minutes:** Update AECDocument interface and add designReferences field
2. **30 minutes:** Implement toPersistence() mapping
3. **30 minutes:** Implement toDomain() mapping and unit tests
4. **Commit:** After all tests pass

---

## Known Risks

1. **Timestamp Serialization:** MongoDB stores dates as ISODate, JavaScript as Date
   - *Mitigation:* Always convert with `new Date()` in toDomain()

2. **Null/Undefined Consistency:** designReferences might be null in old documents
   - *Mitigation:* Use nullish coalescing `?? []` to default to empty array

3. **Metadata Versioning:** DesignMetadata might grow in Phase 2
   - *Mitigation:* Use optional chaining and defensive coding now

4. **Migration:** Existing tickets won't have designReferences field
   - *Mitigation:* Add data migration script or handle gracefully at runtime

---

## Success Metrics

- ✅ AECDocument includes designReferences field
- ✅ Both toPersistence() and toDomain() updated and tested
- ✅ Round-trip testing passes (no data loss)
- ✅ Handles null/undefined gracefully
- ✅ All tests pass (>90% coverage)
- ✅ Build passes, 0 TypeScript errors
- ✅ No linting errors

---

## Follow-Up Stories

- **26-09 (Phase 2):** Update AECMapper to handle metadata field enrichment

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Status:** TODO
