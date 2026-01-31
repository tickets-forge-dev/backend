
# Executable Tickets – Minimalistic UI/UX Style Guide (Linear-Inspired)
Version 1.0

This document complements the **UX Design Specification** and defines
the **visual + interaction philosophy** inspired by Linear:
quiet, fast, low-friction, confidence-inducing.

This is not about copying Linear visually — it is about copying its *discipline*.

---

## 1. Core Aesthetic Principles

### 1.1 Visual Quietness
- Default UI should feel almost empty
- No borders unless necessary
- No visual noise
- No icons unless they add meaning

> Rule: If removing an element does not reduce understanding, remove it.

---

### 1.2 Typography First
- Text hierarchy over containers
- Size + weight > boxes + colors
- One primary font family

**Recommended scale**
- Page title: 20–22px / semibold
- Section title: 14–16px / medium
- Body: 13–14px / regular
- Metadata: 12px / regular / muted

---

### 1.3 Color Discipline
- Mostly grayscale
- Color used only for *state*

**Allowed colors**
- Neutral (default)
- Green → Ready
- Amber → Needs input
- Red → Blocked / Failed

No decorative colors.

---

## 2. Layout Rules

### 2.1 Spacing Over Lines
- Use whitespace to separate sections
- Avoid dividers
- Prefer padding and margin

---

### 2.2 Flat Surfaces
- No cards inside cards
- No nested containers
- Flat scrolling page

---

### 2.3 Alignment
- Single main column
- Max width ~720–840px
- Left-aligned text always

---

## 3. Interaction Philosophy

### 3.1 Speed Over Ceremony
- No confirmations unless destructive
- No modals unless blocking
- No loaders longer than 300ms without explanation

---

### 3.2 Inline Editing Everywhere
- Click-to-edit
- Save on blur
- Undo available

---

### 3.3 Keyboard-First
- `/` opens command menu
- `Enter` confirms
- `Esc` cancels
- Arrow keys navigate lists

---

## 4. Chips & Clarification UX

### 4.1 Chips (Critical Component)
- Rounded
- Neutral background
- Darken on hover
- No icons

**Selection**
- Selected chip = subtle background change
- No checkmarks

---

### 4.2 “Type your own” Pattern
- Always last chip
- Becomes inline text input
- Does not open modal

---

## 5. Generation Progress (Linear-Style)

### Visual Rules
- No spinners
- No percentage bars
- No animations beyond subtle transitions

### Representation
- Vertical text list
- Active step highlighted
- Completed steps muted

---

## 6. Ticket List (Linear-Inspired)

### Behavior
- Instant navigation
- No pagination
- Keyboard navigable

### Visuals
- No row borders
- Hover highlights row background slightly
- Badges are text, not pills

---

## 7. Dev & QA Appendix (Minimal)

### Default State
Collapsed, one-line label:
“Technical details”

### Expanded State
- Monospace
- No borders
- Copy-first UX

---

## 8. Empty States

### Rules
- Calm tone
- No illustrations
- One sentence explanation
- One clear action

Example:
“No executable tickets yet. Create one to get started.”

---

## 9. Animations & Motion

- Subtle fade / slide only
- 150–200ms max
- Motion must convey state change, not delight

---

## 10. Anti-Patterns (Do Not Ship)

- Wizard flows
- Tooltips everywhere
- Highlighting everything
- Decorative icons
- Multi-color badges
- Overexplaining in UI

---

## 11. Final Design Rule

If the UI feels slightly *boring*,
you are doing it right.

If it feels impressive,
you are doing it wrong.
