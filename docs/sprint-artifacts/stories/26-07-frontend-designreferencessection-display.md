# Story 26-07: Frontend - DesignReferencesSection Display Component

**Epic:** Epic 26 - Design Link Integration with LLM Leverage
**Status:** TODO
**Priority:** HIGH
**Effort:** 2 hours
**Assignee:** TBD

---

## Objective

Create the `DesignReferencesSection` component to display design links in the ticket detail view:
1. Collapsible section showing all design references for a ticket
2. Display count badge (e.g., "Design References (2)")
3. Individual reference cards with platform icons
4. "Add Design Link" button to open modal (Story 26-08)
5. Delete button for each reference (non-blocking removal)

---

## Acceptance Criteria

- ✅ DesignReferencesSection component created with proper TypeScript types
- ✅ Collapsible section with header and count badge
- ✅ List of DesignReferenceCard components
- ✅ Platform icons for Figma, Loom, Miro, etc.
- ✅ External link button opens URL in new tab
- ✅ Delete button removes reference (with optimistic UI)
- ✅ "Add Design Link" button opens modal dialog
- ✅ Empty state shows "No design links added"
- ✅ Loading state during removal
- ✅ Error handling with user-friendly messages
- ✅ Uses shadcn/ui components (Button, Icons)
- ✅ Responsive design works on mobile
- ✅ No console warnings or TypeScript errors

---

## Files Created

```
client/src/tickets/components/detail/
  ├── DesignReferencesSection.tsx        (NEW - 180 lines, container)
  ├── DesignReferenceCard.tsx            (NEW - 120 lines, individual reference)
  └── AddDesignLinkDialog.tsx            (NEW - 140 lines, modal for adding link)
```

---

## Files Modified

```
client/src/tickets/components/detail/TicketDetailLayout.tsx
  - Import DesignReferencesSection component
  - Add to Implementation tab above "API Changes" section
  - Pass currentTicket and handlers to component

client/src/tickets/components/CollapsibleSection.tsx (if needed)
  - Already created in earlier session, reuse as wrapper
```

---

## Implementation Notes

### DesignReferencesSection.tsx

```typescript
interface DesignReferencesSectionProps {
  references: DesignReference[];
  onAddClick: () => void;
  onRemove: (referenceId: string) => void;
  isLoading?: boolean;
  error?: string | null;
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

export function DesignReferencesSection({
  references,
  onAddClick,
  onRemove,
  isLoading = false,
  error = null
}: DesignReferencesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!references || references.length === 0) {
    return null; // Don't show section if no references
  }

  return (
    <CollapsibleSection
      title="Design References"
      isExpanded={isExpanded}
      onToggle={setIsExpanded}
      badge={`${references.length}`}
      className="mt-8"
    >
      <div className="space-y-3">
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {/* References List */}
        {references.map((reference) => (
          <DesignReferenceCard
            key={reference.id}
            reference={reference}
            onRemove={onRemove}
            isLoading={isLoading}
          />
        ))}

        {/* Add Link Button */}
        <Button
          onClick={onAddClick}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="w-full gap-2 mt-4"
        >
          <Plus className="h-4 w-4" />
          Add Design Link
        </Button>
      </div>
    </CollapsibleSection>
  );
}
```

### DesignReferenceCard.tsx

```typescript
interface DesignReferenceCardProps {
  reference: DesignReference;
  onRemove: (referenceId: string) => void;
  isLoading?: boolean;
}

export function DesignReferenceCard({
  reference,
  onRemove,
  isLoading = false
}: DesignReferenceCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const hostName = new URL(reference.url).hostname;
  const domain = hostName.replace('www.', '');

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      onRemove(reference.id);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 p-3 border border-border rounded-md bg-muted/20 hover:bg-muted/40 transition-colors">
      {/* Left: Icon + Title + Metadata */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Platform Icon */}
        <div className="text-lg mt-1 flex-shrink-0">
          {getPlatformIcon(reference.platform)}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Title */}
          <div className="text-sm font-medium truncate">
            {reference.title || 'Design Reference'}
          </div>

          {/* URL & Metadata */}
          <div className="text-xs text-muted-foreground space-y-1 mt-1">
            <div className="truncate">{domain}</div>
            <div className="text-xs">
              Added {formatRelativeTime(reference.addedAt)} by {reference.addedBy}
            </div>
          </div>
        </div>
      </div>

      {/* Right: External Link + Delete */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* External Link Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(reference.url, '_blank')}
          disabled={isLoading || isRemoving}
          className="h-8 w-8 p-0"
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={isLoading || isRemoving}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          title="Remove this design link"
        >
          {isRemoving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
```

### AddDesignLinkDialog.tsx

```typescript
interface AddDesignLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (link: { url: string; title?: string }) => Promise<void>;
  isLoading?: boolean;
}

export function AddDesignLinkDialog({
  open,
  onOpenChange,
  onAdd,
  isLoading = false
}: AddDesignLinkDialogProps) {
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<DesignPlatform>('other');
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    setError(null);
    if (url.length > 0) {
      setDetectedPlatform(detectPlatform(url));
    }
  };

  const handleAddLink = async () => {
    if (!urlInput.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidDesignUrl(urlInput)) {
      setError('Invalid URL. Must be HTTPS and under 2048 characters');
      return;
    }

    setIsAdding(true);
    try {
      await onAdd({
        url: urlInput,
        title: titleInput || generateDefaultTitle(urlInput)
      });

      // Close dialog on success
      onOpenChange(false);

      // Clear inputs
      setUrlInput('');
      setTitleInput('');
      setDetectedPlatform('other');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add design link');
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAdding) {
      handleAddLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Design Link</DialogTitle>
          <DialogDescription>
            Paste a link to Figma, Loom, Miro, or other design tool
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">URL *</label>
            <Input
              placeholder="https://figma.com/file/... or https://loom.com/share/..."
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isAdding || isLoading}
              className="text-sm"
            />
          </div>

          {/* Platform Indicator */}
          {urlInput && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{getPlatformIcon(detectedPlatform)}</span>
              <span>
                {detectedPlatform === 'other' ? 'Unknown platform' : `${detectedPlatform} detected`}
              </span>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">Title (Optional)</label>
            <Input
              placeholder="e.g., Dashboard Mockups v2"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              disabled={isAdding || isLoading || !urlInput}
              className="text-sm"
            />
            {!titleInput && urlInput && (
              <p className="text-xs text-muted-foreground mt-1">
                Auto-generated: {generateDefaultTitle(urlInput)}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAdding || isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddLink}
            disabled={isAdding || isLoading || !urlInput}
            className="gap-2"
          >
            {isAdding && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Integration in TicketDetailLayout.tsx

```typescript
export function TicketDetailLayout() {
  const [showAddDesignLink, setShowAddDesignLink] = useState(false);
  const [designRefError, setDesignRefError] = useState<string | null>(null);
  const [isRemovingRef, setIsRemovingRef] = useState(false);

  const handleAddDesignLink = async (link: { url: string; title?: string }) => {
    try {
      setDesignRefError(null);
      await ticketService.addDesignReference(currentTicket.id, link);
      // Reload ticket to get updated references
      await loadTicket(currentTicket.id);
    } catch (error) {
      setDesignRefError(
        error instanceof Error ? error.message : 'Failed to add design link'
      );
      throw error;
    }
  };

  const handleRemoveDesignReference = async (referenceId: string) => {
    try {
      setIsRemovingRef(true);
      setDesignRefError(null);
      await ticketService.removeDesignReference(currentTicket.id, referenceId);
      // Reload ticket to get updated references
      await loadTicket(currentTicket.id);
    } catch (error) {
      setDesignRefError(
        error instanceof Error ? error.message : 'Failed to remove design link'
      );
    } finally {
      setIsRemovingRef(false);
    }
  };

  return (
    <>
      {/* Tabs */}
      <Tabs defaultValue="specification">
        <TabsList>
          <TabsTrigger value="specification">Specification</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
        </TabsList>

        <TabsContent value="implementation" className="space-y-6">
          {/* Design References Section (NEW) */}
          {currentTicket.designReferences && currentTicket.designReferences.length > 0 && (
            <DesignReferencesSection
              references={currentTicket.designReferences}
              onAddClick={() => setShowAddDesignLink(true)}
              onRemove={handleRemoveDesignReference}
              isLoading={isRemovingRef}
              error={designRefError}
            />
          )}

          {/* Alternative: Show add button even when no references */}
          {(!currentTicket.designReferences || currentTicket.designReferences.length === 0) && (
            <div className="p-4 border border-dashed border-border rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">No design links added</p>
              <Button
                onClick={() => setShowAddDesignLink(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Design Link
              </Button>
            </div>
          )}

          {/* API Changes */}
          <ApiEndpointsList ... />

          {/* File Changes */}
          <BackendClientChanges ... />
        </TabsContent>
      </Tabs>

      {/* Add Design Link Dialog */}
      <AddDesignLinkDialog
        open={showAddDesignLink}
        onOpenChange={setShowAddDesignLink}
        onAdd={handleAddDesignLink}
        isLoading={isRemovingRef}
      />
    </>
  );
}
```

---

## Helper Functions

### formatRelativeTime.ts

```typescript
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  // Format as date if older than a week
  return new Date(date).toLocaleDateString();
}
```

---

## Data Types

### DesignReference

```typescript
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

---

## Testing Strategy

### Unit Tests

1. **DesignReferencesSection**
   - ✅ Don't render if no references (null)
   - ✅ Render section if references exist
   - ✅ Show count badge with correct number
   - ✅ Render DesignReferenceCard for each reference
   - ✅ Handle "Add Design Link" click

2. **DesignReferenceCard**
   - ✅ Display title, URL, platform icon
   - ✅ Show "Added X ago by user" metadata
   - ✅ Open URL in new tab on external link click
   - ✅ Call onRemove callback on delete click
   - ✅ Show loading spinner during removal

3. **AddDesignLinkDialog**
   - ✅ Open/close dialog correctly
   - ✅ Validate URL before adding
   - ✅ Show platform detection
   - ✅ Show error message on invalid input
   - ✅ Call onAdd callback with link data
   - ✅ Clear inputs after successful add
   - ✅ Add on Enter key press

### Integration Tests

1. **Full Flow**
   - ✅ Display design references in ticket detail
   - ✅ Add new reference via dialog
   - ✅ Remove reference from list
   - ✅ Reload ticket after changes

2. **Error Handling**
   - ✅ Show error message on add failure
   - ✅ Show error message on remove failure
   - ✅ Error clears on next attempt

---

## Integration Points

**Upstream (Depends On):**
- Story 26-06: ticket.service methods (add/remove)
- platformIcons.ts helper functions
- CollapsibleSection component (existing)
- shadcn/ui Dialog, Button, Input components

**Downstream (Feeds Into):**
- Story 26-08: Full ticket detail integration
- Phase 2: Rich preview enhancement

---

## Dependencies

- React hooks (useState)
- shadcn/ui components (Dialog, Button, Input)
- lucide-react icons
- ticket.service (Story 26-06)
- Helper functions (platformIcons, formatRelativeTime)

**NPM Packages:**
- lucide-react (already in project)
- shadcn/ui components (already in project)

---

## Rollout Plan

1. **45 minutes:** Create DesignReferencesSection.tsx
2. **30 minutes:** Create DesignReferenceCard.tsx
3. **45 minutes:** Create AddDesignLinkDialog.tsx
4. **30 minutes:** Integrate into TicketDetailLayout.tsx
5. **Commit:** After component testing passes

---

## Known Risks

1. **Refresh on Add/Remove:** UI might be briefly stale during API call
   - *Mitigation:* Optimistic updates with rollback on error

2. **Mobile Layout:** Dialog might be too wide on small screens
   - *Mitigation:* Use shadcn Dialog's responsive defaults

3. **Performance:** Many references might slow down rendering
   - *Mitigation:* Add virtualization if >20 references

---

## Success Metrics

- ✅ Design references display in ticket detail
- ✅ Can add/remove links with working buttons
- ✅ Platform icons display correctly
- ✅ Dialog opens/closes properly
- ✅ Errors handled gracefully
- ✅ All unit tests pass (>80% coverage)
- ✅ Build passes, 0 TypeScript errors
- ✅ No linting errors

---

## Follow-Up Stories

- **26-08:** Frontend - Ticket Detail Integration
- **26-09 (Phase 2):** Rich preview enhancement with metadata

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Status:** TODO
