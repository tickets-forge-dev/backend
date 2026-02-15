# Story 26-06: Frontend - Wizard Store & Service Integration

**Epic:** Epic 26 - Design Link Integration with LLM Leverage
**Status:** TODO
**Priority:** HIGH
**Effort:** 2 hours
**Assignee:** TBD

---

## Objective

Integrate design links into the wizard flow and ticket service:
1. Add pendingDesignLinks to generation-wizard.store
2. Upload design links to backend after ticket creation
3. Add service methods to ticket.service for design reference operations
4. Handle errors gracefully (non-blocking)

---

## Acceptance Criteria

- ✅ Store state includes `pendingDesignLinks: DesignLinkData[]`
- ✅ Store actions: addPendingDesignLink(), removePendingDesignLink()
- ✅ Design links uploaded in parallel with file attachments after draft creation
- ✅ ticket.service.ts has addDesignReference() method
- ✅ ticket.service.ts has removeDesignReference() method
- ✅ Upload errors logged but don't block wizard progression
- ✅ Design links synced back to store after upload
- ✅ TypeScript strict mode passes (no `any` casts)
- ✅ No linting errors

---

## Files Created

None (all modifications to existing files)

---

## Files Modified

```
client/src/tickets/stores/generation-wizard.store.ts
  - Add pendingDesignLinks: DesignLinkData[] to state
  - Add addPendingDesignLink() action
  - Add removePendingDesignLink() action
  - Modify finalizeDraft() to upload design links after draft creation

client/src/services/ticket.service.ts
  - Add addDesignReference(ticketId: string, url: string, title?: string) method
  - Add removeDesignReference(ticketId: string, referenceId: string) method
  - Both methods call backend API from Story 26-03
```

---

## Implementation Notes

### Store State Update: generation-wizard.store.ts

```typescript
interface GenerationWizardState {
  // ... existing fields ...

  // Design Links (NEW)
  pendingDesignLinks: DesignLinkData[];
}

interface DesignLinkData {
  url: string;
  title?: string;
  platform: string;
}
```

### Store Actions Update

```typescript
const generateStore = create<GenerationWizardState & GenerationWizardActions>(
  (set, get) => ({
    // ... existing state ...

    // Design Links Actions (NEW)
    addPendingDesignLink: (link: DesignLinkData) => {
      set((state) => ({
        pendingDesignLinks: [...state.pendingDesignLinks, link]
      }));
    },

    removePendingDesignLink: (index: number) => {
      set((state) => ({
        pendingDesignLinks: state.pendingDesignLinks.filter((_, i) => i !== index)
      }));
    },

    // Update finalizeDraft to upload design links
    finalizeDraft: async () => {
      const state = get();

      try {
        // 1. Upload design links in parallel with existing tasks
        const designLinkPromises = state.pendingDesignLinks.map(link =>
          ticketService.addDesignReference(state.currentTicketId!, {
            url: link.url,
            title: link.title
          }).catch(err => {
            // Log error but don't throw (non-blocking)
            console.warn(`Failed to upload design link ${link.url}:`, err);
            return null;
          })
        );

        // 2. Wait for all uploads
        const uploadResults = await Promise.all(designLinkPromises);

        // 3. Update store with uploaded references
        const uploadedReferences = uploadResults.filter(Boolean);
        if (uploadedReferences.length > 0) {
          set((state) => ({
            designReferences: uploadedReferences as DesignReference[]
          }));
        }

        // 4. Clear pending links
        set((state) => ({
          pendingDesignLinks: []
        }));

      } catch (error) {
        console.error('Error uploading design links:', error);
        // Don't throw - design links are optional
      }
    },

    // Clear pending links when starting new ticket
    moveToInput: () => {
      set({
        pendingDesignLinks: [],
        // ... existing resets ...
      });
    },

    // Resume draft: load existing design references if ticket has them
    resumeDraft: async (ticketId: string) => {
      try {
        const ticket = await ticketService.getById(ticketId);
        set({
          designReferences: ticket.designReferences ?? []
        });
      } catch (error) {
        console.warn('Failed to load design references:', error);
      }
    }
  })
);
```

### Ticket Service Updates: ticket.service.ts

```typescript
export class TicketService {
  constructor(private readonly api = useApi()) {}

  // ... existing methods ...

  /**
   * Add a design reference (Figma, Loom, etc.) to a ticket
   */
  async addDesignReference(
    ticketId: string,
    data: { url: string; title?: string }
  ): Promise<DesignReference> {
    try {
      const response = await this.api.post<{ designReference: DesignReference }>(
        `/tickets/${ticketId}/design-references`,
        data
      );

      if (!response.designReference) {
        throw new Error('No design reference in response');
      }

      return response.designReference;
    } catch (error) {
      console.error(`Error adding design reference to ticket ${ticketId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a design reference from a ticket
   */
  async removeDesignReference(
    ticketId: string,
    referenceId: string
  ): Promise<void> {
    try {
      await this.api.delete(
        `/tickets/${ticketId}/design-references/${referenceId}`
      );
    } catch (error) {
      console.error(
        `Error removing design reference ${referenceId} from ticket ${ticketId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get ticket with design references
   */
  async getById(ticketId: string): Promise<Ticket> {
    // Existing method - verify it includes designReferences field
    const response = await this.api.get<Ticket>(`/tickets/${ticketId}`);
    return response;
  }
}
```

### Store Types Update

```typescript
interface GenerationWizardState {
  // ... existing fields ...

  // Design References (stored after upload)
  designReferences: DesignReference[];
  pendingDesignLinks: DesignLinkData[];
}

interface DesignReference {
  id: string;
  url: string;
  platform: string;
  title?: string;
  metadata?: any;
  addedAt: Date;
  addedBy: string;
}

interface DesignLinkData {
  url: string;
  title?: string;
  platform: string;
}
```

### Upload Flow in finalizeDraft

```
User clicks "Continue" in Stage 1
  ↓
Draft ticket created on backend
  ↓
[PARALLEL UPLOADS]
  - File attachments (existing)
  - Design links (NEW) - via addDesignReference() API
  ↓
Store updated with designReferences
  ↓
Pending links cleared
  ↓
Move to Stage 2 (questions)
```

### Error Handling Strategy

```typescript
// Design link uploads are non-blocking
// If upload fails:
// 1. Error logged to console
// 2. User not blocked from continuing
// 3. User can manually add link from ticket detail (Story 26-08)

// If all uploads fail:
// 1. Warning logged
// 2. Store cleared anyway
// 3. User can retry from ticket detail

// Success case:
// 1. References stored in store.designReferences
// 2. Displayed in ticket detail (Story 26-07)
// 3. Used by LLM in Phase 3
```

---

## Data Flow

### Adding Design Link During Wizard

```
User enters URL in Stage 1 DesignLinkInput
  ↓
onAdd callback fires
  ↓
store.addPendingDesignLink(link)
  ↓
Link added to store.pendingDesignLinks
  ↓
Component re-renders with updated list
```

### Uploading After Draft Creation

```
User clicks "Continue" from Stage 1
  ↓
finalizeDraft() called
  ↓
Draft ticket created
  ↓
For each link in pendingDesignLinks:
  - Call ticketService.addDesignReference(ticketId, link)
  - API POST /tickets/:id/design-references
  - Backend creates DesignReference in AEC
  - Returns updated reference with ID
  ↓
Update store.designReferences with results
  ↓
Clear store.pendingDesignLinks
  ↓
Continue to Stage 2
```

### Loading Existing References

```
User resumes draft or views ticket detail
  ↓
resumeDraft(ticketId) called
  ↓
Fetch ticket from backend (GET /tickets/:id)
  ↓
Response includes designReferences array
  ↓
Update store.designReferences
  ↓
DesignReferencesSection component displays them
```

---

## Testing Strategy

### Unit Tests for Store

1. **State Management**
   - ✅ Add design link to empty array
   - ✅ Add multiple design links
   - ✅ Remove link by index
   - ✅ Remove non-existent index (no-op)

2. **finalizeDraft Integration**
   - ✅ Upload design links after draft creation
   - ✅ Clear pending links after successful upload
   - ✅ Log warning on upload error (don't throw)
   - ✅ Handle all uploads failing gracefully

3. **Draft Resume**
   - ✅ Load existing design references from ticket
   - ✅ Update store.designReferences correctly
   - ✅ Handle missing designReferences field (default to [])

### Unit Tests for Service

1. **addDesignReference()**
   - ✅ POST to correct endpoint
   - ✅ Include url and title in request body
   - ✅ Return DesignReference object
   - ✅ Throw error on API failure
   - ✅ Log error on failure

2. **removeDesignReference()**
   - ✅ DELETE to correct endpoint
   - ✅ Include ticketId and referenceId in URL
   - ✅ Return void on success
   - ✅ Throw error on API failure
   - ✅ Log error on failure

### Integration Tests

1. **Full Wizard Flow**
   - ✅ Add design link in Stage 1
   - ✅ Upload link after draft creation
   - ✅ Link appears in store.designReferences
   - ✅ Can proceed to Stage 2

2. **Error Handling**
   - ✅ Upload error doesn't block wizard
   - ✅ Error logged to console
   - ✅ User can still proceed
   - ✅ User can add link from detail page later

---

## Integration Points

**Upstream (Depends On):**
- Story 26-05: DesignLinkInput component (provides links)
- Story 26-03: Backend API endpoints
- ticket.service.ts existing methods

**Downstream (Feeds Into):**
- Story 26-07: DesignReferencesSection (displays stored links)
- Story 26-08: Ticket detail (can remove links post-creation)

---

## Dependencies

- Zustand store (already in project)
- HTTP client API (useApi)
- TypeScript
- React hooks

**NPM Packages:**
- None new (uses existing dependencies)

---

## Rollout Plan

1. **45 minutes:** Add store state, getters, and basic actions
2. **45 minutes:** Create service methods (add/remove)
3. **30 minutes:** Integrate upload into finalizeDraft()
4. **Commit:** After tests pass

---

## Known Risks

1. **Concurrent Uploads:** Multiple design links uploading in parallel might hit rate limits
   - *Mitigation:* Add configurable delay between uploads if needed

2. **Service Availability:** Backend might be down during upload
   - *Mitigation:* Non-blocking error handling already in place

3. **State Sync:** Store might be out of sync with backend if upload partially fails
   - *Mitigation:* Can reload ticket details to resync

---

## Success Metrics

- ✅ Design links stored in Zustand with add/remove actions
- ✅ Links uploaded to backend after draft creation
- ✅ Upload errors logged but don't block wizard
- ✅ Service methods callable from components
- ✅ All tests pass (>80% coverage)
- ✅ Build passes, 0 TypeScript errors
- ✅ No linting errors

---

## Follow-Up Stories

- **26-07:** Frontend - DesignReferencesSection Display Component
- **26-08:** Frontend - Ticket Detail Integration

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Status:** TODO
