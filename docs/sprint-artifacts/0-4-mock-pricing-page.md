# Story 0.4: Mock Pricing Page

Status: drafted

## Story

As a prospective user evaluating Forge,
I want to see pricing tiers and subscription plans with clear tier names, features, and pricing,
so that I understand the cost structure and can decide to sign up.

## Acceptance Criteria

1. **Pricing page route created**: `/pricing` route accessible from main app
2. **Three tier cards displayed**: Free ($0), Pro ($29/mo), Team ($99/mo) with visual hierarchy
3. **Free tier details**: 3 tickets/month, basic features, upgrade CTA button
4. **Pro tier details**: 30 tickets/month, export integrations, priority support, subscribe button
5. **Team tier details**: Unlimited tickets, team workspace, role-based access, subscribe button
6. **Features list per tier**: Clear comparison table or list showing what's included in each tier
7. **Subscribe buttons styled**: Clickable "Subscribe" buttons (no Stripe integration yet - UI only)
8. **Responsive design**: Pricing page works on desktop, tablet, and mobile
9. **Navigation link**: Link to pricing from main sidebar or header
10. **Design consistency**: Matches Forge minimalist design system (Linear-inspired aesthetic)

## Tasks / Subtasks

- [ ] Task 1: Create pricing page route and layout (AC: 1, 10)
  - [ ] Add `/pricing` route in app routing
  - [ ] Create PricingPage component
  - [ ] Apply layout container and styling from design system

- [ ] Task 2: Build tier card component system (AC: 2, 3, 4, 5, 6)
  - [ ] Create TierCard atom component with pricing, title, features list
  - [ ] Build features list component (checkmarks, descriptions)
  - [ ] Style three tiers: Free, Pro (highlighted as recommended), Team
  - [ ] Add tier icons or visual distinction (color, badge, shadow)

- [ ] Task 3: Implement comparison table (AC: 6)
  - [ ] Create feature comparison structure (feature → tier availability)
  - [ ] Display as table or expandable lists per tier
  - [ ] Include: tickets/month, exports, workspaces, user limits, support

- [ ] Task 4: Add Subscribe buttons and CTAs (AC: 7)
  - [ ] Add "Subscribe" button to Pro and Team tiers (no action yet, UI-only)
  - [ ] Add "Get Started" or "Upgrade" button on Free tier
  - [ ] Style buttons using design system button variants
  - [ ] Buttons are interactive (click-ready for future Stripe integration)

- [ ] Task 5: Responsive design and mobile optimization (AC: 8)
  - [ ] Test layout on desktop (1440px, 1920px)
  - [ ] Test layout on tablet (768px)
  - [ ] Test layout on mobile (375px, 414px)
  - [ ] Adjust card grid and features display for small screens

- [ ] Task 6: Add navigation link to pricing (AC: 9)
  - [ ] Add "Pricing" link in sidebar or header navigation
  - [ ] Link to `/pricing` route
  - [ ] Highlight active state if currently viewing pricing page

- [ ] Task 7: Design system compliance (AC: 10)
  - [ ] Use design system colors (--primary, --bg-subtle, --text-secondary, etc.)
  - [ ] Use design system typography (font sizes, weights)
  - [ ] Use design system spacing (--space-* variables)
  - [ ] Match Linear-inspired minimalist aesthetic

## Dev Notes

### Architecture & Design Constraints

- **Design System**: Leverage `client/app/globals.css` design tokens (colors, spacing, typography)
- **Component Location**: Create pricing components in `client/src/core/components/pricing/` (atoms/molecules)
- **Page Location**: Create page at `client/app/(main)/pricing/page.tsx`
- **Styling**: Use Tailwind CSS with design system CSS variables (e.g., `bg-[var(--bg-subtle)]`)
- **No Backend Integration**: This is UI-only; no API calls or database changes
- **Linear Design Inspiration**: Keep design minimal, calm, flat; avoid excessive borders or shadows

### Project Structure Notes

- **Client-side only**: No backend changes required
- **Next.js App Router**: Use `app/(main)/pricing/page.tsx` route structure
- **Component Pattern**: Atomic design (atoms → molecules → organisms)
- **Reusable Components**: TierCard and features components should be reusable for future tier customization
- **Design Tokens**: All colors/spacing from `globals.css` — do not hardcode colors

### Previous Story Context

Previous story `0-3-free-tier-ticket-limit` (DONE) established:
- Backend quota enforcement (3 free tickets)
- Frontend sidebar quota banner showing usage
- UI state tracking in Zustand stores

This story complements the quota feature by showing users pricing options when they hit limits.

### References

- Design System: `client/app/globals.css` (design tokens, colors, typography)
- Button Components: `client/src/core/components/ui/button.tsx`
- Layout Patterns: Existing pages in `client/app/(main)/` (e.g., `tickets/page.tsx`)
- Pricing Strategy: `sprint-status.yaml` Phase 0 notes (Free: 3 tickets, Pro: 30, Team: unlimited)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
