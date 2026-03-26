# Linear-Inspired Landing Page Redesign

**Date:** 2026-03-26
**Branch:** feat/better-landing-page-ux
**Status:** Approved

## Summary

Redesign the Forge landing page to match Linear's landing page quality: scroll-triggered Framer Motion animations, dark atmospheric glow/mesh backgrounds, Linear's typography system (Inter-only, 500-600 weight headings, tight letter-spacing), perspective-transformed product screenshots, and a restructured section flow with more breathing room.

The goal: blow the user away in 5 seconds with polished motion, focused copy, and a large hero product screenshot.

## Dependencies

**New dependency:**
- `framer-motion` (~32KB gzipped) — scroll animations, parallax, staggered reveals

**Removed:**
- `Space Grotesk` font — drop from `layout.tsx`, use Inter for everything

## Global Design Token Changes

### Typography (globals.css)

**Landing-specific type scale** (added as CSS custom properties):

```
--landing-hero: clamp(40px, 6vw, 72px)    /* Hero headline */
--landing-heading: clamp(28px, 4vw, 44px)  /* Section headings */
--landing-subtitle: 18px                    /* Section subtitles */
--landing-body: 16px                        /* Landing body text */
```

**Font weight philosophy:** 400 (body/subtitles), 500 (headings, nav, labels). Never 600 or 700 on landing page. This is Linear's signature — medium weight feels refined, not heavy.

**Letter-spacing:**
- Hero headline: `-0.03em`
- Section headings: `-0.025em`
- Body: `0` (default)
- Mono micro labels: `0.05em` (widened for readability at small sizes)

**Monospace micro labels (Linear signature pattern):**
- Font: JetBrains Mono, `11px`, uppercase, `--text-tertiary`, letter-spacing `0.05em`
- Used for: section label badges ("WEB APP", "DEVELOPER TOOLS", "HOW IT WORKS"), metadata text
- Example: the pill badge in the hero and the label badges in showcase sections

**Font stack change:**
- Remove `Space Grotesk` from `layout.tsx` — Inter handles headings too
- `--font-sans` remains Inter-based (no change to the variable itself)

### New Atmosphere Tokens (dark mode)

```css
--bg-gradient-start: #0a0a0a;
--bg-gradient-end: #111113;
--glow-primary: rgba(99, 102, 241, 0.15);   /* Indigo */
--glow-accent: rgba(16, 185, 129, 0.10);    /* Emerald / Forge brand */
```

### Spacing Changes (landing only)

Exact spacing values matching Linear's system:
- `96px` between major sections (desktop), `48px` on mobile
- `48px` between sub-sections within a section
- `-4px` optical tightening margin after section headings (before subtitle/content)
- Max content width: `max-w-6xl` (up from `max-w-4xl` / `max-w-5xl`)
- Hero gets generous top padding for full-viewport feel

New CSS custom properties:
```css
--landing-section-gap: 96px;
--landing-subsection-gap: 48px;
--landing-optical-tighten: -4px;
```

### What Stays Unchanged

- All app-level tokens (13px body, compact spacing) — untouched
- `--border-subtle` values — already Linear-correct
- Dark mode text `#e8e8e8` — already correct
- Scrollbar styling — already correct
- Light mode tokens — untouched

## Animation System

### Approach: Component-Level (Approach A)

Each section component owns its own Framer Motion animations. Shared presets live in a utility file.

### New File: `client/src/landing/lib/motion-variants.ts`

Shared animation presets:

```typescript
// Entrance variants
fadeUp:        { hidden: { opacity: 0, y: 20 },  visible: { opacity: 1, y: 0 } }
fadeIn:        { hidden: { opacity: 0 },          visible: { opacity: 1 } }
slideFromLeft: { hidden: { opacity: 0, x: -40 },  visible: { opacity: 1, x: 0 } }
slideFromRight:{ hidden: { opacity: 0, x: 40 },   visible: { opacity: 1, x: 0 } }
scaleUp:       { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }

// Container variant for staggering children
staggerContainer: { visible: { transition: { staggerChildren: 0.15 } } }

// Default transition
defaultTransition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
```

Every section uses `whileInView` with `viewport: { once: true, amount: 0.2 }` — animations trigger once when 20% of the element enters viewport.

## Section Structure (Top to Bottom)

### 1. Header — `LandingHeader.tsx` (modify)

- Keep: sticky, backdrop blur, logo, nav links
- Change: bottom border starts `transparent`, fades to `var(--border-subtle)` on scroll (using Framer Motion `useScroll` + `useTransform` on opacity)
- This makes the hero feel more immersive on initial load

### 2. Hero — `HeroSection.tsx` (major rewrite)

**Content (top to bottom):**
1. Pill badge — "AI-powered ticket specs", animated `fadeIn` + `scale(0.95 → 1)`, 400ms
2. Headline — "Dev-ready tickets. Every single time." in white (no gradient text), Inter 500 (medium, not semibold), `--landing-hero` size, `-0.03em` letter-spacing. Animation: `fadeUp`, 600ms, 100ms delay
3. Subtitle — single line, 18px, `--text-secondary`. Animation: `fadeUp`, 600ms, 200ms delay
4. Two CTAs — "Get Started" (solid emerald, links to `/tickets`) + "See how it works" (ghost outline, smooth-scrolls to `#how-it-works`). Animation: `fadeUp`, 600ms, 300ms delay
5. Product screenshot — `ticket-screenshot.png` in `/images/`. Animation: `fadeUp` + `scaleUp`, 800ms, 500ms delay

**Screenshot treatment:**
- `perspective(2000px) rotateX(5deg)` initial tilt
- On scroll: tilt flattens to `rotateX(0deg)` via `useScroll` + `useTransform`
- Border: `rounded-2xl border border-[var(--border-subtle)]`
- Shadow: `0 40px 80px rgba(0,0,0,0.5)`
- Ambient glow behind: large blurred `div` with radial gradient (emerald center + indigo edges)

**Background:**
- Two overlapping radial gradients:
  - Top center: `radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08), transparent 70%)`
  - Bottom right: `radial-gradient(ellipse at 80% 100%, rgba(16,185,129,0.06), transparent 60%)`

**Removed:** video element, orange/amber gradient text on headline

### 3. How It Works — `HowItWorks.tsx` (major rewrite)

**Layout:** Vertical timeline replacing horizontal card row

- Thin vertical line (`1px`, `--border-subtle`) on the left
- 4 steps vertically stacked, each with:
  - Colored dot on the timeline (purple → violet → amber → emerald)
  - Title (Inter 500, `--text`) + subtitle (`--text-secondary`)
  - Subtle left border accent in step color (no filled background cards)
- Section heading centered above

**Animation:**
- Section heading: `fadeUp`
- Each step: `slideFromLeft` with `staggerChildren: 0.15`, triggered `whileInView`

**Removed:** horizontal arrows, colored card backgrounds (`bg-purple-500/5` etc.)

### 4. Product Showcase: Web App — `ProductShowcaseWeb.tsx` (new file)

**Layout:** Split — text left (40%), screenshot right (60%)

- Left: mono micro label "WEB APP" (JetBrains Mono, 11px, uppercase, `--text-tertiary`), heading "Create, review, and approve — all from the browser" (Inter 500), 2-3 bullet points
- Right: `aec-screenshot.png` with perspective tilt (`rotateY(-3deg) rotateX(2deg)`), soft shadow, emerald glow behind

**Animation:**
- Text: `slideFromLeft`, 600ms
- Screenshot: `slideFromRight` + `scaleUp`, 800ms, 200ms delay

**Background:** subtle shift to `--bg-gradient-end` (`#111113`)

### 5. Product Showcase: CLI — `ProductShowcaseCLI.tsx` (new file)

**Layout:** Flipped — screenshot left (60%), text right (40%)

- Left: `cli-screenshot.png` with mirrored tilt (`rotateY(3deg) rotateX(2deg)`), indigo glow behind
- Right: mono micro label "DEVELOPER TOOLS" (JetBrains Mono, 11px, uppercase, `--text-tertiary`), heading "Pick up tickets without leaving your IDE" (Inter 500), bullet points, `npm i forge-aec` copy command

**Animation:**
- Screenshot: `slideFromLeft`, 800ms
- Text: `slideFromRight`, 600ms, 200ms delay

**Background:** back to `#0a0a0a` (alternating with section 4)

### 6. Before/After — `BeforeAfter.tsx` (modify)

- Keep: Slack vs Forge spec side-by-side concept, all content
- Remove: per-message staggered fade-in animations
- Add: scroll-triggered entrance — left panel `slideFromLeft`, right panel `slideFromRight`, 200ms stagger
- Add: subtle red glow behind Slack panel, emerald glow behind Forge panel
- Background: subtle gradient shift

### 7. Final CTA — `CTASection.tsx` (modify)

- Heading bumped to `clamp(32px, 4vw, 48px)`, Inter 500
- Button: emerald with hover glow `box-shadow: 0 0 40px rgba(16,185,129,0.3)`
- Background: large centered radial gradient (emerald + indigo, ~15% opacity)
- Animation: `fadeUp` on scroll enter

### 8. Footer — `LandingFooter.tsx` (no changes)

Keep as-is.

### 9. Background Mesh — `BackgroundMesh.tsx` (new file)

Global atmospheric layer replacing EmberSprinkles:

- `position: fixed`, `inset: 0`, `pointer-events-none`, `z-index: 0`
- 3-4 large radial gradients at 5-10% opacity:
  - Top area: indigo glow
  - Middle area: emerald glow
  - Bottom area: mixed emerald + indigo
- All content sections have `position: relative; z-index: 1` to sit above

## Files Changed

### Modified:
- `client/app/globals.css` — add landing type scale, atmosphere tokens
- `client/app/layout.tsx` — remove Space Grotesk font import
- `client/app/page.tsx` — update section order, swap components
- `client/src/landing/components/HeroSection.tsx` — major rewrite
- `client/src/landing/components/HowItWorks.tsx` — major rewrite (vertical timeline)
- `client/src/landing/components/BeforeAfter.tsx` — add scroll animations + glows
- `client/src/landing/components/CTASection.tsx` — bigger type, glow background
- `client/src/landing/components/LandingHeader.tsx` — scroll-aware border opacity

### New:
- `client/src/landing/lib/motion-variants.ts` — shared Framer Motion presets
- `client/src/landing/components/ProductShowcaseWeb.tsx` — web app showcase
- `client/src/landing/components/ProductShowcaseCLI.tsx` — CLI showcase
- `client/src/landing/components/BackgroundMesh.tsx` — atmospheric glow layer

### Deleted:
- `client/src/landing/components/EmberSprinkles.tsx` — replaced by BackgroundMesh
- `client/src/landing/components/WhyForge.tsx` — content absorbed into showcases
- `client/src/landing/components/AECShowcase.tsx` — replaced by hero screenshot

### Untouched:
- `client/src/landing/components/TerminalAnimation.tsx` — kept but no longer used on landing (available for future use)
- `client/src/landing/components/TicketListAnimation.tsx` — kept but no longer used on landing
- All app-level components, stores, and pages — no changes

## Accessibility

- All animations respect `prefers-reduced-motion: reduce` — Framer Motion's `useReducedMotion()` hook disables transforms/opacity transitions
- Focus indicators unchanged
- Semantic heading hierarchy maintained (h1 → h2 → h3)
- All images have descriptive alt text
- Skip-to-content link preserved
- Color contrast ratios maintained (WCAG AA)

## Performance

- Framer Motion tree-shakes well — only import `motion`, `useScroll`, `useTransform`, `useInView`
- `whileInView` with `once: true` means animations run once, not on every scroll
- Background mesh uses CSS gradients (GPU-composited), no JS
- Product screenshots are static images (already optimized via Next.js `<Image>`)
- No layout shift — screenshots have explicit dimensions

## Out of Scope

- Social proof / logos bar (no logos available yet)
- Mobile-specific animation tuning (will use responsive Tailwind + simpler transforms)
- New product screenshots (using existing 3)
- App-level design changes (only landing page + global tokens)
- Dark/light theme toggle on landing (stays dark-only)
