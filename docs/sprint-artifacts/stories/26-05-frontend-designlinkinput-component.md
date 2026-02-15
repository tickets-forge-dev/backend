# Story 26-05: Frontend - DesignLinkInput Component for Wizard

**Epic:** Epic 26 - Design Link Integration with LLM Leverage
**Status:** TODO
**Priority:** HIGH
**Effort:** 2.5 hours
**Assignee:** TBD

---

## Objective

Create the `DesignLinkInput` component for the Stage 1 wizard "Reference Materials" tab:
1. Input field for design URLs (Figma, Loom, Miro, etc.)
2. Platform auto-detection with visual icons
3. Add/remove design links dynamically
4. Max 5 links enforcement
5. Display list of added links with delete buttons

---

## Acceptance Criteria

- ✅ DesignLinkInput component created with proper TypeScript types
- ✅ URL input field with placeholder text
- ✅ Platform auto-detection on input change
- ✅ Visual platform icon displayed (Figma, Loom, Miro, etc.)
- ✅ "Add Link" button validates URL before adding
- ✅ Display list of added links with title and delete button
- ✅ Max 5 links enforced (disable add button at limit)
- ✅ Delete button removes link from list
- ✅ Empty list renders "No design links added yet"
- ✅ Responsive design works on mobile
- ✅ Uses shadcn/ui components (Button, Input, Icon)
- ✅ No console warnings or TypeScript errors
- ✅ Follows project coding standards (clean architecture, dependency injection where applicable)

---

## Files Created

```
client/src/tickets/components/wizard/
  ├── DesignLinkInput.tsx               (NEW - 280 lines, main component)
  └── DesignLinkCard.tsx                (NEW - 100 lines, individual link display)

client/src/tickets/utils/
  └── platformIcons.ts                  (NEW - 50 lines, icon mapping)
```

---

## Files Modified

```
client/src/tickets/components/wizard/Stage1Input.tsx
  - Import DesignLinkInput component
  - Add to "Reference Materials" tab above file upload section
  - Line ~282: Add header "Design Links (Optional)"
  - Pass pendingDesignLinks and callbacks to component

client/src/tickets/stores/generation-wizard.store.ts
  - Add to state (line ~157):
    - pendingDesignLinks: DesignLinkData[] = []
  - Add actions:
    - addPendingDesignLink(link: DesignLinkData)
    - removePendingDesignLink(index: number)
```

---

## Implementation Notes

### Component Structure: DesignLinkInput.tsx

```typescript
interface DesignLinkInputProps {
  links: DesignLinkData[];
  onAdd: (link: DesignLinkData) => void;
  onRemove: (index: number) => void;
  maxLinks?: number; // Default 5
  disabled?: boolean;
}

interface DesignLinkData {
  url: string;
  title?: string;
  platform: DesignPlatform;
}

export function DesignLinkInput({
  links,
  onAdd,
  onRemove,
  maxLinks = 5,
  disabled = false
}: DesignLinkInputProps) {
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<DesignPlatform>('other');
  const [error, setError] = useState<string | null>(null);

  // 1. Detect platform on URL change
  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    setError(null);
    if (url.length > 0) {
      setDetectedPlatform(detectPlatform(url));
    }
  };

  // 2. Validate and add link
  const handleAddLink = () => {
    if (!urlInput.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidDesignUrl(urlInput)) {
      setError('Invalid URL. Must be HTTPS and under 2048 characters');
      return;
    }

    // Check for duplicates
    if (links.some(link => link.url === urlInput)) {
      setError('This URL is already added');
      return;
    }

    // Add link via callback
    onAdd({
      url: urlInput,
      title: titleInput || generateDefaultTitle(urlInput),
      platform: detectedPlatform
    });

    // Clear inputs
    setUrlInput('');
    setTitleInput('');
    setDetectedPlatform('other');
    setError(null);
  };

  // 3. Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddLink();
    }
  };

  const isFull = links.length >= maxLinks;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-medium">Design Links (Optional)</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Paste Figma, Loom, Miro, or other design tool links to provide visual context
        </p>
      </div>

      {/* Input Section */}
      <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/30">
        {/* URL Input */}
        <div>
          <label className="text-xs font-medium mb-1 block">URL</label>
          <Input
            placeholder="https://figma.com/file/... or https://loom.com/share/..."
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled || isFull}
            className="text-sm"
          />
        </div>

        {/* Platform Indicator */}
        {urlInput && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{getPlatformIcon(detectedPlatform)}</span>
            <span>{detectedPlatform === 'other' ? 'Unknown platform' : `${detectedPlatform} detected`}</span>
          </div>
        )}

        {/* Title Input (Optional) */}
        <div>
          <label className="text-xs font-medium mb-1 block">Title (Optional)</label>
          <Input
            placeholder="e.g., Dashboard Mockups v2"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            disabled={disabled || isFull || !urlInput}
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
          <p className="text-xs text-destructive">{error}</p>
        )}

        {/* Add Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleAddLink}
            disabled={disabled || !urlInput || isFull}
            size="sm"
            variant="outline"
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Link
          </Button>
          {isFull && (
            <span className="text-xs text-muted-foreground self-center">
              Max {maxLinks} links reached
            </span>
          )}
        </div>
      </div>

      {/* Links List */}
      <div>
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No design links added yet
          </p>
        ) : (
          <div className="space-y-2">
            {links.map((link, index) => (
              <DesignLinkCard
                key={`${link.url}-${index}`}
                link={link}
                index={index}
                onRemove={onRemove}
                disabled={disabled}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Component: DesignLinkCard.tsx

```typescript
interface DesignLinkCardProps {
  link: DesignLinkData;
  index: number;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export function DesignLinkCard({
  link,
  index,
  onRemove,
  disabled = false
}: DesignLinkCardProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 border border-border rounded-md bg-background hover:bg-muted/30 transition-colors">
      {/* Left side: Icon + Title + URL */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Platform Icon */}
        <div className="text-lg mt-1 flex-shrink-0">
          {getPlatformIcon(link.platform)}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{link.title || 'Design Link'}</div>
          <div className="text-xs text-muted-foreground truncate">{new URL(link.url).hostname}</div>
        </div>
      </div>

      {/* Right side: External link + Delete */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* External Link Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(link.url, '_blank')}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="Open link in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
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

### Helper: platformIcons.ts

```typescript
import {
  FileText,
  Video,
  Grid3X3,
  Pencil,
  Zap,
  Link as LinkIcon
} from 'lucide-react';

export type DesignPlatform = 'figma' | 'loom' | 'miro' | 'sketch' | 'whimsical' | 'other';

export function getPlatformIcon(platform: DesignPlatform): React.ReactNode {
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

export function detectPlatform(url: string): DesignPlatform {
  if (/figma\.com\/(file|proto|design)/.test(url)) return 'figma';
  if (/loom\.com\/(share|embed)/.test(url)) return 'loom';
  if (/miro\.com\/(app|board)/.test(url)) return 'miro';
  if (/(sketch\.com|sketchapp)/.test(url)) return 'sketch';
  if (/(whimsical\.com|whimsical\.app)/.test(url)) return 'whimsical';
  return 'other';
}

export function isValidDesignUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && url.length <= 2048;
  } catch {
    return false;
  }
}

export function generateDefaultTitle(url: string): string {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/').filter(p => p.length > 0);

    if (urlObj.hostname.includes('figma')) {
      const fileName = parts[parts.length - 1];
      return decodeURIComponent(fileName).replace(/-/g, ' ');
    }

    if (urlObj.hostname.includes('loom')) {
      return `Loom Video - ${new Date().toLocaleDateString()}`;
    }

    const platform = detectPlatform(url);
    return platform !== 'other'
      ? `${platform.charAt(0).toUpperCase() + platform.slice(1)} Design`
      : 'Design Reference';
  } catch {
    return 'Design Reference';
  }
}
```

### Integration: Stage1Input.tsx

```typescript
// In Stage1Input component, around line 282 in Reference Materials tab:

<div className="space-y-6">
  {/* Design Links Section */}
  <DesignLinkInput
    links={state.pendingDesignLinks}
    onAdd={(link) => store.addPendingDesignLink(link)}
    onRemove={(index) => store.removePendingDesignLink(index)}
    maxLinks={5}
    disabled={isLoading}
  />

  {/* File Upload Section */}
  <div>
    <h3 className="text-sm font-medium mb-2">Attachments (Optional)</h3>
    {/* ... existing file upload component ... */}
  </div>
</div>
```

### Store Integration: generation-wizard.store.ts

```typescript
interface GenerationWizardState {
  // ... existing fields ...

  // NEW: Design Links
  pendingDesignLinks: DesignLinkData[];
}

// In the store actions:
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
```

---

## Data Types

### DesignLinkData

```typescript
interface DesignLinkData {
  url: string;                    // HTTPS URL
  title?: string;                 // User-provided or auto-generated
  platform: DesignPlatform;       // Auto-detected from URL
}
```

---

## Testing Strategy

### Unit Tests

1. **Component Rendering**
   - ✅ Render with empty links array
   - ✅ Render with pre-populated links
   - ✅ Render platform icons correctly

2. **URL Input & Detection**
   - ✅ Detect Figma URLs and show icon
   - ✅ Detect Loom URLs and show icon
   - ✅ Detect Miro URLs and show icon
   - ✅ Show 'unknown' for unrecognized platforms

3. **Adding Links**
   - ✅ Add valid HTTPS URL
   - ✅ Reject empty URL with error message
   - ✅ Reject invalid URL with error message
   - ✅ Reject non-HTTPS URL with error message
   - ✅ Reject duplicate URL with error message
   - ✅ Clear inputs after successful add

4. **Link List Display**
   - ✅ Display links with title, URL, platform icon
   - ✅ Show "No links added" message when empty
   - ✅ Open link in new tab on external link click
   - ✅ Remove link from list on delete click

5. **Max Links Enforcement**
   - ✅ Disable add button when 5 links present
   - ✅ Show "Max links reached" message
   - ✅ Re-enable add button after removing one link

6. **Keyboard Navigation**
   - ✅ Add link on Enter key in URL input
   - ✅ Handle focus states properly

---

## Integration Points

**Upstream (Depends On):**
- generation-wizard.store (state management)
- platformIcons.ts helper functions
- shadcn/ui components (Button, Input)

**Downstream (Feeds Into):**
- Story 26-06: Service integration (upload links to backend)
- Story 26-07: Display component (shows stored links)

---

## Dependencies

- React hooks (useState)
- lucide-react icons
- shadcn/ui Button, Input components
- TypeScript

**NPM Packages:**
- lucide-react (already in project)
- shadcn/ui components (already in project)

---

## Rollout Plan

1. **1 hour:** Create platformIcons.ts helper functions and test
2. **45 minutes:** Create DesignLinkCard.tsx component
3. **1 hour:** Create DesignLinkInput.tsx component
4. **15 minutes:** Integrate into Stage1Input and store
5. **Commit:** After component testing passes

---

## Known Risks

1. **URL Parsing:** Complex URLs with fragments might fail
   - *Mitigation:* Use URL() constructor with try-catch

2. **Platform Detection:** Regex patterns might miss edge cases
   - *Mitigation:* Test with real Figma/Loom URLs during implementation

3. **Icon Display:** Emoji rendering might vary by OS/browser
   - *Mitigation:* Use lucide-react icons as fallback

4. **Responsive Design:** Mobile layout might need adjustment
   - *Mitigation:* Test on mobile during development

---

## Success Metrics

- ✅ Component renders without console errors
- ✅ Can add/remove design links with no TypeScript errors
- ✅ Platform detection works for all major platforms
- ✅ Max 5 links enforced (add button disabled at limit)
- ✅ URLs validated (HTTPS required, max length)
- ✅ Responsive on mobile
- ✅ All unit tests pass (>80% coverage)
- ✅ No linting errors

---

## Follow-Up Stories

- **26-06:** Frontend - Wizard Store & Service Integration (upload to backend)
- **26-07:** Frontend - DesignReferencesSection Display Component (show in detail view)

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Status:** TODO
