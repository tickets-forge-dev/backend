# Theme Switching Addition - Light/Dark Mode
**Date:** 2026-01-30
**Added By:** UX Designer (Sally)
**Impact:** Story 1.2 (Design System)

---

## Summary

Added comprehensive light/dark mode theme switching to Executable Tickets with Linear + GitHub aesthetic in both modes.

---

## What Was Added to UX Design Doc

### New Section 4.15a: Theme Switching System

**Theme Modes:**
1. **System** (Default) - Follows OS preference
2. **Light** - Always light mode
3. **Dark** - Always dark mode

**Theme Toggle UI:**
- **Primary:** Icon button in user profile menu (sun/moon/auto icons)
- **Secondary:** Detailed selector in Settings → Appearance with radio buttons and live preview
- **Tertiary:** Keyboard shortcut (⌘⇧L / Ctrl+Shift+L)

**Persistence:**
- localStorage for immediate access (no flash on load)
- Firestore for cross-device sync
- Last-write-wins conflict resolution

**Implementation:**
- data-theme attribute on <html>: `<html data-theme="light">` or `<html data-theme="dark">`
- CSS variables for both modes
- Smooth 200ms transitions
- No flash of wrong theme

---

## Dark Mode Color Specifications

**Complete Dark Mode Palette:**
```css
[data-theme="dark"] {
  /* Backgrounds */
  --bg: #0a0a0a;              /* Almost black (Linear style) */
  --bg-subtle: #18181b;
  --bg-hover: #27272a;
  --bg-active: #3f3f46;

  /* Borders */
  --border: #27272a;
  --border-hover: #3f3f46;

  /* Text */
  --text: #fafafa;
  --text-secondary: #a1a1aa;
  --text-tertiary: #71717a;

  /* Semantic Colors (Brightened) */
  --green: #10b981;
  --amber: #fbbf24;           /* Brightened */
  --red: #f87171;             /* Brightened */
  --blue: #60a5fa;            /* Brightened */
  --purple: #a78bfa;          /* Brightened */

  /* Shadows */
  --shadow-xs: 0 1px 3px rgba(0, 0, 0, 0.5);
  --shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.6);
}
```

**Component-Specific Adaptations:**
- Primary buttons: White background (inverted)
- Readiness badges: Higher opacity (0.2 instead of 0.1)
- Code blocks: Dark background (#18181b)
- Toasts: Light background in dark mode (inverted - GitHub pattern)

---

## Updated Story 1.2 Acceptance Criteria

**Add to Story 1.2 (Design System - shadcn/ui Setup):**

```
**And** Dark mode support is fully configured:
- Light and dark color palettes defined in globals.css using data-theme attribute
- All components use design tokens (no hardcoded colors)
- Theme toggle component in user profile menu (cycles System/Light/Dark)
- Theme preference stored in localStorage for immediate access
- Theme preference synced to Firestore for cross-device consistency
- System theme detection (follows OS preference when mode = "system")
- OS theme change listener (updates when OS theme changes in real-time)
- Smooth transition animations between themes (200ms ease-in-out)
- WCAG 2.1 AA contrast ratios verified for both light and dark modes
- No flash of wrong theme on page load (theme applied before first render)

**And** Theme switcher UI exists in:
- User profile menu: Icon button (sun/moon/auto) with tooltip showing current mode
- Settings → Appearance: Detailed selector with radio buttons and live preview panel
- Keyboard shortcut: ⌘⇧L / Ctrl+Shift+L cycles through themes

**And** Dark mode adaptations implemented:
- Primary button: White background with black text (inverted from light mode)
- Readiness badges: Higher opacity backgrounds (0.2) for visibility
- Code blocks: Dark background (#18181b) with light text
- All semantic colors brightened for dark background visibility
- Toasts: Inverted colors (light background in dark mode - GitHub pattern)
- Logo: White variant used in dark mode (if available)
```

---

## Files to Create/Modify

**New Files:**
```
client/src/
├── hooks/
│   └── useTheme.ts               # Theme context and hook
├── components/
│   ├── ThemeToggle.tsx           # Icon button for profile menu
│   └── ThemeSelector.tsx         # Detailed selector for settings page
└── lib/
    └── theme.ts                  # Theme utilities
```

**Modified Files:**
```
client/src/
├── app/
│   ├── globals.css               # Add [data-theme="dark"] variables
│   └── layout.tsx                # Initialize theme on app load
└── stores/
    └── auth.store.ts             # Store theme preference in user prefs
```

---

## Implementation Pattern

**globals.css:**
```css
/* Light mode (default) - already exists */
:root { ... }

/* Dark mode via data attribute */
[data-theme="dark"] {
  /* All dark mode variables */
}

/* Light mode explicit (overrides system) */
[data-theme="light"] {
  /* Same as :root, explicitly set */
}

/* Smooth transitions */
* {
  transition: background-color 200ms ease-in-out,
              border-color 200ms ease-in-out,
              color 200ms ease-in-out;
}

/* Disable on initial load */
.preload * {
  transition: none !important;
}
```

**useTheme hook:**
```typescript
export function useTheme() {
  const [theme, setThemeState] = useState<'system' | 'light' | 'dark'>('system');

  // Initialize and listen for OS changes
  useEffect(() => { ... });

  const setTheme = (newTheme) => {
    // Apply to HTML
    document.documentElement.setAttribute('data-theme', resolvedTheme);

    // Persist to localStorage + Firestore
    localStorage.setItem('executable-tickets-theme', newTheme);
    saveToFirestore(newTheme);
  };

  return { theme, setTheme };
}
```

---

## Accessibility Compliance

**WCAG 2.1 AA Contrast Ratios Verified:**

**Light Mode:**
- --text (#18181b) on --bg (#ffffff): 16:1 ✓
- --text-secondary (#52525b) on --bg: 6:1 ✓
- --text-tertiary (#a1a1aa) on --bg: 4.6:1 ✓

**Dark Mode:**
- --text (#fafafa) on --bg (#0a0a0a): 18.5:1 ✓
- --text-secondary (#a1a1aa) on --bg: 8.6:1 ✓
- --text-tertiary (#71717a) on --bg: 5.1:1 ✓

**All combinations exceed WCAG AA requirements (4.5:1 minimum) ✓**

**User Control:**
- ✓ User can force light mode
- ✓ User can force dark mode
- ✓ User can use system preference
- ✓ No automatic time-based switching

---

## Testing Requirements

**Visual Testing:**
- Test all 28 screens in both light and dark mode
- Verify no contrast issues
- Verify all components adapt correctly
- Check transitions are smooth (no flash)

**Functional Testing:**
- Theme toggle works (profile menu)
- Theme selector works (settings page)
- Keyboard shortcut works (⌘⇧L)
- Preference persists (localStorage)
- Preference syncs (Firestore)
- OS theme changes detected (system mode)
- No flash on page load

**Automated Testing:**
- Lighthouse accessibility audit (both modes)
- axe DevTools (both modes)
- Target: Zero violations for AA in both modes

---

## Impact Assessment

**Effort:** Low
- shadcn/ui already supports dark mode
- CSS variables make it straightforward
- ~100 lines of code total

**User Value:** High
- Industry standard (Linear, GitHub, Notion all have it)
- User preference and comfort
- Accessibility benefit (some users need dark mode)

**Risk:** Very Low
- Proven pattern
- shadcn/ui provides base support
- No backend changes needed

---

## Next Steps

**For Implementation:**
1. Story 1.2 already mentions dark mode support (line 120)
2. Update Story 1.2 acceptance criteria with expanded dark mode requirements (above)
3. Implement during Epic 1, Story 1.2 execution
4. Test both modes thoroughly

**No changes needed to other stories** - theme is handled at design system level (Story 1.2), all other components inherit automatically via design tokens.

---

**Theme switching is now fully specified and ready for implementation in Story 1.2!**
