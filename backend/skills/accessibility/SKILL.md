---
name: accessibility
description: Ensure WCAG compliance — screen readers, keyboard navigation, semantic HTML
---

# Accessibility (a11y)

Every UI component must be usable by everyone — keyboard users, screen reader users, low-vision users.

## Rules

1. **Semantic HTML** — use `<button>` not `<div onClick>`, `<nav>` not `<div class="nav">`
2. **All images have alt text** — decorative images use `alt=""`
3. **Keyboard navigable** — every interactive element reachable via Tab, activatable via Enter/Space
4. **Focus visible** — never `outline: none` without a replacement focus indicator
5. **ARIA labels** — icon-only buttons need `aria-label`, custom widgets need appropriate roles
6. **Color contrast** — minimum 4.5:1 for normal text, 3:1 for large text
7. **No color-only indicators** — don't rely solely on color to convey meaning (add icons, text)
8. **Form labels** — every input has a visible `<label>` or `aria-label`
9. **Error messages** — linked to inputs via `aria-describedby`
10. **Skip links** — long pages need a "Skip to main content" link

## During Implementation

For every new UI element, ask:
- Can I reach this with Tab?
- Can I activate it with Enter/Space?
- Does a screen reader announce what this is?
- Is the contrast sufficient?

Review `reference/wcag-checklist.md` for the full checklist.
