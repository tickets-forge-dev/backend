# Story 26-13: Frontend - Rich Preview Cards (Figma/Loom)

**Epic:** Epic 26 - Design Link Integration with LLM Leverage
**Status:** TODO (Blocked by: Phase 1 + 26-10 + 26-12)
**Priority:** HIGH
**Effort:** 2.5 hours
**Assignee:** TBD

---

## Objective

Enhance DesignReferenceCard component to display rich preview metadata for Figma and Loom design references:
1. Figma: Show thumbnail image, file name, last modified date, file key
2. Loom: Show video thumbnail, title, duration, play icon indicator
3. Graceful fallback: If metadata not available, show basic link card
4. Handle loading states and errors gracefully
5. Keep styling minimal and calm (Linear-inspired design)

---

## Acceptance Criteria

- ✅ DesignReferenceCard component created with rich preview logic
- ✅ Figma card displays: thumbnail image, file name, "Last modified: X hours ago", file key
- ✅ Loom card displays: video thumbnail, title, "Duration: 3:45", play icon overlay
- ✅ Fallback card (no metadata): Platform icon, URL hostname, link button
- ✅ Thumbnail images load with proper error handling
- ✅ Responsive design: Works on mobile (single column stacked)
- ✅ Image lazy loading: Use native `loading="lazy"` attribute
- ✅ Metadata loading state: Show skeleton or placeholder while fetching
- ✅ Open link in new tab via external link button
- ✅ Delete button removes card from list
- ✅ Uses shadcn/ui components (Button, Image)
- ✅ No console warnings or TypeScript errors
- ✅ Follows project coding standards

---

## Files Created

```
client/src/tickets/components/detail/
  ├── DesignReferenceCard.tsx                 (NEW - Enhanced with rich preview)
  ├── FigmaPreviewCard.tsx                    (NEW - Figma-specific card)
  └── LoomPreviewCard.tsx                     (NEW - Loom-specific card)

client/src/tickets/utils/
  └── formatDesignReference.ts                (NEW - Formatting helpers)
```

---

## Files Modified

```
client/src/tickets/components/detail/DesignReferencesSection.tsx
  - Replace DesignReferenceCard with enhanced version
  - Pass metadata from server to card component
  - No breaking changes to props

client/src/tickets/components/detail/TicketDetailLayout.tsx
  - No changes needed (already using DesignReferencesSection)
```

---

## Implementation Notes

### 1. DesignReferenceCard (Main Router Component)

```typescript
// client/src/tickets/components/detail/DesignReferenceCard.tsx
interface DesignReferenceCardProps {
  reference: DesignReference;
  onRemove: (referenceId: string) => void;
  disabled?: boolean;
}

interface DesignReference {
  id: string;
  url: string;
  platform: 'figma' | 'loom' | 'miro' | 'sketch' | 'whimsical' | 'other';
  title?: string;
  metadata?: {
    figma?: {
      fileName: string;
      thumbnailUrl: string;
      lastModified: Date;
      fileKey: string;
    };
    loom?: {
      videoTitle: string;
      duration: number; // Seconds
      thumbnailUrl: string;
      transcript?: string;
      sharedId: string;
    };
  };
  addedAt: Date;
  addedBy: string;
}

export function DesignReferenceCard({
  reference,
  onRemove,
  disabled = false,
}: DesignReferenceCardProps) {
  // Route to platform-specific preview card
  if (reference.platform === 'figma' && reference.metadata?.figma) {
    return (
      <FigmaPreviewCard
        reference={reference}
        onRemove={onRemove}
        disabled={disabled}
      />
    );
  }

  if (reference.platform === 'loom' && reference.metadata?.loom) {
    return (
      <LoomPreviewCard
        reference={reference}
        onRemove={onRemove}
        disabled={disabled}
      />
    );
  }

  // Fallback: Simple link card (no metadata)
  return <SimpleDesignReferenceCard reference={reference} onRemove={onRemove} disabled={disabled} />;
}
```

### 2. FigmaPreviewCard Component

```typescript
// client/src/tickets/components/detail/FigmaPreviewCard.tsx
export function FigmaPreviewCard({
  reference,
  onRemove,
  disabled = false,
}: DesignReferenceCardProps) {
  const figmaData = reference.metadata?.figma;
  if (!figmaData) return null;

  const lastModifiedText = formatLastModified(new Date(figmaData.lastModified));
  const isImageError = false; // Track with state if needed
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex gap-4 p-4 border border-border rounded-lg bg-background hover:bg-muted/30 transition-colors">
      {/* Thumbnail */}
      <div className="flex-shrink-0">
        {figmaData.thumbnailUrl && !imageError ? (
          <img
            src={figmaData.thumbnailUrl}
            alt={figmaData.fileName}
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-24 w-24 rounded-md object-cover bg-muted"
          />
        ) : (
          <div className="h-24 w-24 rounded-md bg-muted flex items-center justify-center">
            <span className="text-2xl">🎨</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium truncate">{figmaData.fileName}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              figma.com/file/{figmaData.fileKey}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Last modified: {lastModifiedText}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Added by {reference.addedBy}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(reference.url, '_blank')}
              disabled={disabled}
              className="h-8 w-8 p-0"
              title="Open Figma file in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(reference.id)}
              disabled={disabled}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Remove this design link"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 3. LoomPreviewCard Component

```typescript
// client/src/tickets/components/detail/LoomPreviewCard.tsx
export function LoomPreviewCard({
  reference,
  onRemove,
  disabled = false,
}: DesignReferenceCardProps) {
  const loomData = reference.metadata?.loom;
  if (!loomData) return null;

  const [imageError, setImageError] = useState(false);
  const durationText = formatDuration(loomData.duration);

  return (
    <div className="flex gap-4 p-4 border border-border rounded-lg bg-background hover:bg-muted/30 transition-colors">
      {/* Video Thumbnail */}
      <div className="flex-shrink-0 relative group">
        {loomData.thumbnailUrl && !imageError ? (
          <img
            src={loomData.thumbnailUrl}
            alt={loomData.videoTitle}
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-24 w-24 rounded-md object-cover bg-muted"
          />
        ) : (
          <div className="h-24 w-24 rounded-md bg-muted flex items-center justify-center">
            <span className="text-2xl">📹</span>
          </div>
        )}

        {/* Play Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="h-6 w-6 text-white fill-white" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium truncate">{loomData.videoTitle}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              loom.com/share/{loomData.sharedId}
            </p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs text-muted-foreground">
                Duration: {durationText}
              </span>
              {loomData.transcript && (
                <span className="text-xs text-muted-foreground">
                  • Transcript ✓
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Added by {reference.addedBy}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(reference.url, '_blank')}
              disabled={disabled}
              className="h-8 w-8 p-0"
              title="Open Loom video in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(reference.id)}
              disabled={disabled}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Remove this design link"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4. SimpleDesignReferenceCard (Fallback)

```typescript
// client/src/tickets/components/detail/DesignReferenceCard.tsx (continued)
function SimpleDesignReferenceCard({
  reference,
  onRemove,
  disabled = false,
}: DesignReferenceCardProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 border border-border rounded-md bg-background hover:bg-muted/30 transition-colors">
      {/* Left side: Icon + Title + URL */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Platform Icon */}
        <div className="text-lg mt-1 flex-shrink-0">
          {getPlatformIcon(reference.platform)}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">
            {reference.title || 'Design Link'}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {new URL(reference.url).hostname}
          </div>
        </div>
      </div>

      {/* Right side: External link + Delete */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(reference.url, '_blank')}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="Open link in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(reference.id)}
          disabled={disabled}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          title="Remove this design link"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

### 5. Formatting Helpers

```typescript
// client/src/tickets/utils/formatDesignReference.ts
export function formatLastModified(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? 's' : ''} ago`;

  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export function getPlatformIcon(platform: string): React.ReactNode {
  switch (platform) {
    case 'figma':
      return <span className="text-[#A259FF]">🎨</span>;
    case 'loom':
      return <span className="text-[#00A1F7]">📹</span>;
    case 'miro':
      return <span className="text-[#FFB81C]">🎯</span>;
    case 'sketch':
      return <span className="text-[#F7B500]">✏️</span>;
    case 'whimsical':
      return <span className="text-[#7B2CBF]">⚡</span>;
    default:
      return <LinkIcon className="h-4 w-4 text-muted-foreground" />;
  }
}
```

---

## Data Types

### DesignReference (Updated from Phase 1)

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

interface DesignMetadata {
  figma?: {
    fileName: string;
    thumbnailUrl: string;
    lastModified: Date;
    fileKey: string;
  };
  loom?: {
    videoTitle: string;
    duration: number;
    thumbnailUrl: string;
    transcript?: string;
    sharedId: string;
  };
}
```

---

## Responsive Design

**Desktop (>768px):**
- Thumbnail: 96px × 96px (h-24 w-24)
- Layout: Side-by-side (flex gap-4)
- Text truncated with ellipsis
- Hover states active

**Tablet (640-768px):**
- Thumbnail: 80px × 80px
- Same layout

**Mobile (<640px):**
- Thumbnail: 64px × 64px (h-16 w-16)
- Card stacks vertically if needed
- Text fully visible (no truncation on titles)

---

## Loading States

**While Metadata Fetching:**
- ❌ No loading skeleton (metadata fetched non-blocking in background)
- Card renders with basic link first
- Metadata added once available (invisible update)
- OR: Show loading state if fetching takes >2s (optional enhancement)

**Image Load Errors:**
- Show emoji fallback (🎨 for Figma, 📹 for Loom)
- Continue rendering card normally

---

## Testing Strategy

### Unit Tests

1. **DesignReferenceCard Routing**
   - ✅ Route to FigmaPreviewCard when figma metadata present
   - ✅ Route to LoomPreviewCard when loom metadata present
   - ✅ Route to SimpleDesignReferenceCard when no metadata
   - ✅ Pass props correctly to each card

2. **FigmaPreviewCard**
   - ✅ Display thumbnail image
   - ✅ Display file name and file key
   - ✅ Display "Last modified X hours ago"
   - ✅ Display added by user email
   - ✅ Handle image load error (show emoji)
   - ✅ Open link in new tab on external link click
   - ✅ Remove card on delete click

3. **LoomPreviewCard**
   - ✅ Display video thumbnail
   - ✅ Display video title
   - ✅ Display duration (HH:MM:SS format)
   - ✅ Show transcript indicator if available
   - ✅ Show play icon on hover
   - ✅ Handle image load error (show emoji)
   - ✅ Open link in new tab on external link click
   - ✅ Remove card on delete click

4. **SimpleDesignReferenceCard**
   - ✅ Display platform icon
   - ✅ Display title or "Design Link"
   - ✅ Display URL hostname
   - ✅ Open link and remove work correctly

5. **Formatting Helpers**
   - ✅ formatLastModified: "Just now", "2 hours ago", "3 days ago", etc.
   - ✅ formatDuration: "3:45" for 225 seconds, "1:23:45" for long videos
   - ✅ getPlatformIcon: Return correct emoji for each platform

---

## Integration Points

**Upstream (Depends On):**
- Story 26-10: Figma metadata (fetched and passed to component)
- Story 26-12: Loom metadata (fetched and passed to component)
- DesignReferencesSection component (Phase 1)

**Downstream (Feeds Into):**
- Ticket detail page display
- Design-driven badge (Phase 3)

---

## Dependencies

**React:**
- hooks (useState)

**UI Components:**
- lucide-react: ExternalLink, X, Play, LinkIcon
- shadcn/ui: Button

**Utilities:**
- formatDesignReference helpers

---

## Rollout Plan

1. **30 minutes:** Create formatDesignReference.ts helpers
2. **45 minutes:** Create FigmaPreviewCard component
3. **45 minutes:** Create LoomPreviewCard component
4. **30 minutes:** Update DesignReferenceCard with routing logic
5. **30 minutes:** Update DesignReferencesSection to use enhanced card
6. **Commit:** After component tests pass

---

## Known Risks

1. **Image Load Failures:** CDN outages or slow networks
   - *Mitigation:* Emoji fallback, no breaking errors

2. **Responsive Layout:** Mobile might be cramped with long titles
   - *Mitigation:* Test on real devices, truncate if needed

3. **Metadata Updates:** Figma/Loom file changes not reflected immediately (24h cache)
   - *Mitigation:* Document cache TTL, provide refresh button (future)

4. **Slow Image Loading:** Large thumbnails might slow page load
   - *Mitigation:* Use native `loading="lazy"` attribute

---

## Success Metrics

- ✅ Figma cards display thumbnail + file name + last modified
- ✅ Loom cards display video thumbnail + title + duration
- ✅ Fallback cards show for missing metadata
- ✅ Image errors handled gracefully (emoji shown)
- ✅ Responsive on mobile
- ✅ No console errors
- ✅ All unit tests pass (>80% coverage)
- ✅ 0 TypeScript errors

---

## Follow-Up Stories

- **26-19:** Frontend - Design-Aware Spec Display (show design-driven badge)

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Status:** TODO (Blocked by: Phase 1 + 26-10 + 26-12)
