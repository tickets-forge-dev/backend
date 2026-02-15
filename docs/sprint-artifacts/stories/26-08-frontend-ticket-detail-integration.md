# Story 26-08: Frontend - Ticket Detail Integration

**Epic:** Epic 26 - Design Link Integration with LLM Leverage
**Status:** TODO
**Priority:** HIGH
**Effort:** 1.5 hours
**Assignee:** TBD

---

## Objective

Complete frontend integration by adding design references to the ticket detail page:
1. Add DesignReferencesSection to TicketDetailLayout
2. Position in Implementation tab above "API Changes"
3. Wire up add/remove handlers
4. Show/hide based on design reference availability
5. Handle loading and error states

---

## Acceptance Criteria

- ✅ DesignReferencesSection imported and integrated
- ✅ Positioned in Implementation tab above API Changes section
- ✅ Show section only if references exist
- ✅ Add Design Link button available when viewing ticket
- ✅ Remove button works for each reference
- ✅ Loading state shown during add/remove
- ✅ Error messages displayed on failure
- ✅ Ticket detail loads with designReferences data
- ✅ No TypeScript errors
- ✅ No console warnings
- ✅ Build passes

---

## Files Created

None (all modifications to existing file)

---

## Files Modified

```
client/src/tickets/components/detail/TicketDetailLayout.tsx
  - Import DesignReferencesSection component
  - Import AddDesignLinkDialog component
  - Add state for dialog visibility
  - Add handlers: handleAddDesignLink, handleRemoveDesignReference
  - Add DesignReferencesSection to Implementation tab (before API Changes)
  - Add AddDesignLinkDialog below tabs

client/app/(main)/tickets/[id]/page.tsx (if needed)
  - Verify designReferences loaded in ticket query
  - Pass to TicketDetailLayout
```

---

## Implementation Notes

### Integration in TicketDetailLayout.tsx

```typescript
import { DesignReferencesSection } from './DesignReferencesSection';
import { AddDesignLinkDialog } from './AddDesignLinkDialog';

interface TicketDetailLayoutProps {
  currentTicket: Ticket;
  onUpdate?: (ticket: Ticket) => void;
  // ... other props ...
}

export function TicketDetailLayout({
  currentTicket,
  onUpdate,
  // ... other props ...
}: TicketDetailLayoutProps) {
  // State for design link dialog and operations
  const [showAddDesignLink, setShowAddDesignLink] = useState(false);
  const [isAddingDesignLink, setIsAddingDesignLink] = useState(false);
  const [isRemovingDesignRef, setIsRemovingDesignRef] = useState(false);
  const [designRefError, setDesignRefError] = useState<string | null>(null);

  // Handle adding design link
  const handleAddDesignLink = async (link: { url: string; title?: string }) => {
    setIsAddingDesignLink(true);
    setDesignRefError(null);

    try {
      // Add design reference via service
      const result = await ticketService.addDesignReference(currentTicket.id, link);

      // Update current ticket with new reference
      const updatedTicket: Ticket = {
        ...currentTicket,
        designReferences: [
          ...(currentTicket.designReferences ?? []),
          result
        ]
      };

      // Update parent component and close dialog
      onUpdate?.(updatedTicket);
      setShowAddDesignLink(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add design link';
      setDesignRefError(message);
      throw error; // Re-throw so dialog can handle it
    } finally {
      setIsAddingDesignLink(false);
    }
  };

  // Handle removing design reference
  const handleRemoveDesignReference = async (referenceId: string) => {
    setIsRemovingDesignRef(true);
    setDesignRefError(null);

    try {
      // Remove design reference via service
      await ticketService.removeDesignReference(currentTicket.id, referenceId);

      // Update current ticket (filter out removed reference)
      const updatedTicket: Ticket = {
        ...currentTicket,
        designReferences: (currentTicket.designReferences ?? []).filter(
          ref => ref.id !== referenceId
        )
      };

      // Update parent component
      onUpdate?.(updatedTicket);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove design link';
      setDesignRefError(message);
    } finally {
      setIsRemovingDesignRef(false);
    }
  };

  return (
    <>
      {/* Overview Card with metrics and notes */}
      <OverviewCard ticket={currentTicket} />

      {/* Tabs: Specification | Implementation */}
      <Tabs defaultValue="specification" className="mt-6">
        <TabsList>
          <TabsTrigger value="specification">Specification</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
        </TabsList>

        {/* Specification Tab */}
        <TabsContent value="specification" className="space-y-6 mt-4">
          {/* Problem Statement */}
          <CollapsibleSection title="Problem Statement" defaultOpen={true}>
            {/* ... */}
          </CollapsibleSection>

          {/* Solution */}
          <CollapsibleSection title="Solution" defaultOpen={true}>
            {/* ... */}
          </CollapsibleSection>

          {/* Acceptance Criteria */}
          <CollapsibleSection title="Acceptance Criteria" defaultOpen={true}>
            {/* ... */}
          </CollapsibleSection>

          {/* Visual Expectations */}
          <CollapsibleSection title="Visual Expectations">
            {/* ... */}
          </CollapsibleSection>

          {/* Scope */}
          <CollapsibleSection title="Scope">
            {/* ... */}
          </CollapsibleSection>

          {/* Assumptions */}
          <CollapsibleSection title="Assumptions">
            {/* ... */}
          </CollapsibleSection>
        </TabsContent>

        {/* Implementation Tab */}
        <TabsContent value="implementation" className="space-y-6 mt-4">
          {/* Design References Section (NEW - Position 1) */}
          {currentTicket.designReferences && currentTicket.designReferences.length > 0 ? (
            <DesignReferencesSection
              references={currentTicket.designReferences}
              onAddClick={() => setShowAddDesignLink(true)}
              onRemove={handleRemoveDesignReference}
              isLoading={isRemovingDesignRef}
              error={designRefError}
            />
          ) : (
            <div className="p-4 border border-dashed border-border rounded-lg text-center space-y-3">
              <p className="text-sm text-muted-foreground">No design links added yet</p>
              <Button
                onClick={() => setShowAddDesignLink(true)}
                variant="outline"
                size="sm"
                className="gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Add Design Link
              </Button>
            </div>
          )}

          {/* API Changes Section */}
          <ApiEndpointsList
            endpoints={currentTicket.techSpec?.apiChanges ?? []}
            onEdit={handleEditApiEndpoint}
            onDelete={handleDeleteApiEndpoint}
            onAdd={handleAddApiEndpoint}
          />

          {/* File Changes Section */}
          <BackendClientChanges
            fileChanges={currentTicket.techSpec?.layeredFileChanges ?? []}
            onEdit={handleEditFileChange}
            onDelete={handleDeleteFileChange}
          />

          {/* Test Plan Section */}
          <TestPlanSection
            testPlan={currentTicket.techSpec?.testPlan ?? []}
            onEdit={handleEditTestCase}
            onDelete={handleDeleteTestCase}
            onAdd={handleAddTestCase}
          />

          {/* Assets / Export Section */}
          <CollapsibleSection title="Assets & Export">
            {/* ... export buttons, etc. ... */}
          </CollapsibleSection>
        </TabsContent>
      </Tabs>

      {/* Add Design Link Dialog (NEW - Outside tabs) */}
      <AddDesignLinkDialog
        open={showAddDesignLink}
        onOpenChange={setShowAddDesignLink}
        onAdd={handleAddDesignLink}
        isLoading={isAddingDesignLink}
      />
    </>
  );
}
```

### Ticket Data Type

Ensure Ticket interface includes designReferences:

```typescript
interface Ticket {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  ticketType: TicketType;
  status: TicketStatus;
  techSpec?: TechSpec;

  // Design References (NEW)
  designReferences?: DesignReference[];

  // ... other fields ...
}

interface DesignReference {
  id: string;
  url: string;
  platform: DesignPlatform;
  title?: string;
  metadata?: DesignMetadata;
  addedAt: Date;
  addedBy: string;
}

type DesignPlatform = 'figma' | 'loom' | 'miro' | 'sketch' | 'whimsical' | 'other';
```

### API Response Verification

Ensure backend returns designReferences in ticket response (Story 26-03):

```typescript
// GET /tickets/:id should include:
{
  ticket: {
    id: "...",
    title: "...",
    designReferences: [
      {
        id: "...",
        url: "https://figma.com/...",
        platform: "figma",
        title: "Dashboard Mockups",
        metadata: null,
        addedAt: "2026-02-14T10:30:00Z",
        addedBy: "alice@company.com"
      }
    ]
    // ... other fields ...
  }
}
```

---

## Tab Structure

**Specification Tab (Left):**
- Problem Statement (not collapsible)
- Solution (not collapsible)
- Acceptance Criteria (not collapsible)
- Visual Expectations (collapsible)
- Scope (collapsible)
- Assumptions (collapsible)

**Implementation Tab (Right):**
- **Design References (NEW)** ← Position 1
- API Changes (collapsible)
- File Changes (collapsible)
- Test Plan (collapsible)
- Assets & Export (collapsible)

---

## State Management

### Local Component State

```typescript
// Design Link Dialog
const [showAddDesignLink, setShowAddDesignLink] = useState(false);

// Loading States
const [isAddingDesignLink, setIsAddingDesignLink] = useState(false);
const [isRemovingDesignRef, setIsRemovingDesignRef] = useState(false);

// Error State
const [designRefError, setDesignRefError] = useState<string | null>(null);
```

### Parent Update Flow

```
Component State ← Design Link Operation
         ↓
  onUpdate() called with updated ticket
         ↓
Parent Component State Updated
         ↓
Re-render with new designReferences
```

---

## Error Handling

```typescript
// Add Error
catch (error) {
  const message = error instanceof Error ? error.message : 'Failed to add design link';
  setDesignRefError(message);  // Display to user
  throw error;                 // Dialog handles error state
}

// Remove Error
catch (error) {
  const message = error instanceof Error ? error.message : 'Failed to remove design link';
  setDesignRefError(message);  // Display to user
  // No throw - keep UI responsive
}

// Error clears on next add/remove attempt
setDesignRefError(null);  // Reset before operation
```

---

## Testing Strategy

### Unit Tests

1. **Component Integration**
   - ✅ Import DesignReferencesSection
   - ✅ Import AddDesignLinkDialog
   - ✅ Render without errors

2. **Add Design Link Flow**
   - ✅ Dialog opens on button click
   - ✅ Call handleAddDesignLink on submit
   - ✅ Update currentTicket with new reference
   - ✅ Call onUpdate() with updated ticket
   - ✅ Close dialog on success
   - ✅ Show error message on failure

3. **Remove Design Reference Flow**
   - ✅ Call handleRemoveDesignReference on delete
   - ✅ Remove reference from currentTicket
   - ✅ Call onUpdate() with updated ticket
   - ✅ Show error message on failure

4. **Conditional Rendering**
   - ✅ Show DesignReferencesSection if references exist
   - ✅ Show empty state if no references
   - ✅ Hide add button during loading
   - ✅ Show error message when present

5. **State Management**
   - ✅ isAddingDesignLink toggles correctly
   - ✅ isRemovingDesignRef toggles correctly
   - ✅ designRefError state clears on new operation

### Integration Tests

1. **Tab Navigation**
   - ✅ Can switch between Specification and Implementation tabs
   - ✅ Design References visible in Implementation tab

2. **Full User Flow**
   - ✅ Open ticket detail → see Design References section
   - ✅ Click "Add Design Link" → dialog opens
   - ✅ Enter URL and submit → reference added to ticket
   - ✅ Click delete icon → reference removed from ticket
   - ✅ Refresh ticket → changes persisted

3. **Error Scenarios**
   - ✅ Add with invalid URL → show error
   - ✅ Add fails on backend → show error message
   - ✅ Remove fails on backend → show error message

---

## Integration Points

**Upstream (Depends On):**
- Story 26-07: DesignReferencesSection component
- Story 26-06: ticket.service methods (add/remove)
- Story 26-05: DesignLinkInput component (modal variant)

**Downstream (Feeds Into):**
- Phase 2: Metadata enrichment (rich previews)
- Phase 3: LLM integration (design context in specs)

---

## Dependencies

- React hooks (useState)
- DesignReferencesSection component (Story 26-07)
- AddDesignLinkDialog component (Story 26-07)
- ticket.service methods (Story 26-06)
- TypeScript

**NPM Packages:**
- None new (uses existing dependencies)

---

## Rollout Plan

1. **30 minutes:** Add imports and component setup
2. **30 minutes:** Implement add/remove handlers
3. **30 minutes:** Integrate into Implementation tab
4. **Commit:** After integration testing passes

---

## Known Risks

1. **Missing designReferences Field:** Backend might not include field if not updated
   - *Mitigation:* Verify Story 26-03 completes first

2. **Type Mismatch:** DesignReference types might differ between backend and frontend
   - *Mitigation:* Coordinate with Story 26-01 for consistent types

3. **Optimistic Updates:** UI might briefly show stale state on error
   - *Mitigation:* Reload ticket on significant errors

---

## Success Metrics

- ✅ DesignReferencesSection displayed in Implementation tab
- ✅ Add Design Link button works
- ✅ Remove buttons work for each reference
- ✅ Loading states show during operations
- ✅ Error messages display on failure
- ✅ All unit tests pass (>80% coverage)
- ✅ Build passes, 0 TypeScript errors
- ✅ No console warnings

---

## Completion Criteria for Phase 1

✅ All 8 stories completed:
- 26-01: Backend - DesignReference Value Object
- 26-02: Backend - Add/Remove Use Cases
- 26-03: Backend - API Endpoints & DTOs
- 26-04: Backend - AECMapper Persistence
- 26-05: Frontend - DesignLinkInput Component
- 26-06: Frontend - Wizard Store & Service Integration
- 26-07: Frontend - DesignReferencesSection Display
- 26-08: Frontend - Ticket Detail Integration (THIS STORY)

✅ Phase 1 Features Ready:
- Users can add 0-5 design links (Figma, Loom, Miro, etc.)
- Links display with platform icons in ticket detail
- Links can be removed post-creation
- Links stored in MongoDB and synced to frontend
- Ready for Phase 2 metadata enrichment

✅ Build Status:
- 0 TypeScript errors (backend + frontend)
- All tests passing
- No console warnings

---

## Follow-Up Stories

- **26-09 (Phase 2):** Backend - Figma OAuth Integration
- **26-10 (Phase 2):** Backend - Figma API Service & Metadata Fetcher
- **26-11 (Phase 2):** Backend - Loom OAuth Integration
- **26-12 (Phase 2):** Backend - Loom API Service & Metadata Fetcher
- **26-13 (Phase 2):** Frontend - Rich Preview Cards
- **26-14 (Phase 2):** Frontend - Settings Page Integrations
- **26-15 (Phase 3):** Backend - Design Context Prompt Builder
- **26-16 (Phase 3):** Backend - Deep Analysis Design Phase
- **26-17 (Phase 3):** Backend - TechSpec Generator Design Injection

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Status:** TODO
