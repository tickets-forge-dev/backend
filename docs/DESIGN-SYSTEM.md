# Design System - Linear-Inspired Aesthetic

This document protects the design system from regressions. The app uses a **minimalist, comfortable design** inspired by Linear.

## 🎨 Core Philosophy

- **Minimal visual noise**: Subtle borders, calm colors
- **Easy on eyes**: Soft whites in dark mode, comfortable contrast
- **Structural clarity**: Clear hierarchy without decorative elements
- **Consistent interactions**: Predictable, responsive hover states

---

## 📐 Design Tokens (globals.css)

### Color Palette

**Light Mode:**
- Text: `#18181b` (dark gray)
- Text Secondary: `#52525b` (medium gray)
- Text Tertiary: `#a1a1aa` (light gray)
- Background: `#ffffff` (white)
- Border: `#e4e4e7` (very subtle)
- Accent (Purple): `#7c3aed` (comfortable purple)

**Dark Mode (CRITICAL - Soft Not Harsh):**
- Text: `#e8e8e8` **← SOFT WHITE (NOT #fafafa which is harsh)**
- Text Secondary: `#a1a1aa`
- Text Tertiary: `#71717a`
- Background: `#0a0a0a` (very dark)
- Border: `#27272a` (subtle dark)
- Accent (Purple): `#8b5cf6` (softer purple)

### Scrollbars (Modern, Thin, Rounded)

```css
/* Firefox */
scrollbar-width: thin;
scrollbar-color: var(--gray-300) transparent;

/* Webkit - 8px thin rounded */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
```

**Why this matters:** Default browser scrollbars are ugly and harsh. Modern thin scrollbars keep the interface calm and professional.

### Typography

- **Base**: 13px (Linear standard - compact but readable)
- **Body**: 13px normal weight
- **Headings**: Minimal weight (500 medium, 600 semibold rare)
- **Font**: System fonts (-apple-system, Segoe UI, etc.)

---

## 🧩 Sidebar Navigation (Structural)

**Files Protected:**
- `client/src/core/components/sidebar/Sidebar.tsx`
- `client/src/core/components/sidebar/SidebarHeader.tsx`
- `client/src/core/components/sidebar/SidebarNav.tsx`
- `client/src/core/components/sidebar/SidebarFooter.tsx`
- `client/src/stores/ui.store.ts`

**Key Features:**
1. **Collapsible** - Expands to `240px` (--nav-width), collapses to `64px` icon-only
2. **Persistent** - State saved in localStorage via Zustand (`forge-ui-preferences`)
3. **Mobile** - Slides in from left on mobile with backdrop overlay
4. **Header** - User profile, avatar, email, settings/logout dropdown
5. **Nav** - Tickets and Settings links with active state highlighting
6. **Footer** - Theme toggle (Light/Dark/System) + collapse button

**DO NOT:**
- Remove sidebar and replace with header-only layout
- Remove persistent state management
- Lose the mobile slide-out behavior
- Change the width constants (240px, 64px are intentional)

---

## 🚨 Red Flags (Signs of Regression)

### 1. Visible Card Borders
```tsx
// ❌ BAD - Ugly visible borders on every card
<div className="border border-[var(--border)]/30 hover:border-[var(--border)]">

// ✅ GOOD - Clean subtle styling with hover background
<Card className="p-4 hover:border-[var(--border-hover)] transition-colors">
```

### 2. Harsh Text Colors
```css
/* ❌ BAD - Harsh white in dark mode */
--text: #fafafa;

/* ✅ GOOD - Soft comfortable white */
--text: #e8e8e8;
```

### 3. Missing Sidebar
```tsx
// ❌ BAD - Just a minimal header
<header>
  <div className="flex items-center justify-between">
    <h1>Forge</h1>
    <DropdownMenu>...</DropdownMenu>
  </div>
</header>

// ✅ GOOD - Sidebar + main content
<Sidebar />
<main className="md:ml-[var(--nav-width)]">
  {children}
</main>
```

### 4. Default Browser Scrollbars
If scrollbars look chunky and platform-native, the custom CSS was removed. Restore from globals.css.

---

## ✅ Design System Compliance Checklist

- [ ] Dark mode text is `#e8e8e8` (soft), not `#fafafa` (harsh)
- [ ] Scrollbars are thin (8px) rounded, not browser default
- [ ] Sidebar exists with collapsible state (240px expanded / 64px icon-only)
- [ ] User preferences persist in localStorage
- [ ] Cards have subtle styling, not obvious borders
- [ ] Accent color (purple) is consistent across buttons and highlights
- [ ] Spacing follows 8px grid system
- [ ] Shadows are barely visible (no heavy shadows)
- [ ] Borders are subtle (#e4e4e7 light, #27272a dark)

---

## 📝 Commit Checklist

Before committing UI changes:

```
- [ ] Did I remove or change any design tokens in globals.css?
  → If yes, explain WHY in the PR description with design justification
- [ ] Did I modify sidebar components?
  → If yes, ensure state management (ui.store.ts) is updated
- [ ] Did I change text colors?
  → If yes, verify they're still comfortable (soft in dark mode)
- [ ] Did I add new borders/cards?
  → If yes, use existing card styling, not custom borders
- [ ] Did I remove any CSS like scrollbars or transitions?
  → If yes, this is probably a regression - restore it
```

---

## 🔗 Reference Commit

**Feb 3, 2026 (3ce28b6):** Complete UI modernization with Linear-inspired design system
- Introduced sidebar navigation with persistent state
- Modern scrollbars (8px thin rounded)
- Soft text colors for dark mode eye comfort
- Clean card styling with subtle borders

This is the source of truth for the design system. If something is missing, check this commit.

---

## Questions?

If uncertain whether a UI change is compliant:
1. Check this file for red flags
2. Compare against Feb 3 modernization commit (3ce28b6)
3. Ask: "Does this make the UI simpler, calmer, and easier on the eyes?"
   - If yes, probably good
   - If no, probably a regression
