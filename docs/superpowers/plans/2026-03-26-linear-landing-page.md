# Linear-Inspired Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Forge landing page with Linear-quality scroll animations, atmospheric glow backgrounds, Linear's Inter-only typography, and perspective-transformed product screenshots.

**Architecture:** Component-level Framer Motion animations with shared presets in `motion-variants.ts`. Each landing section is a self-contained component. A global `BackgroundMesh` provides atmospheric glow. CSS custom properties define landing-specific tokens separate from the app's compact tokens.

**Tech Stack:** Next.js 15, React 19, Framer Motion, Tailwind CSS, Inter font (via next/font)

**Spec:** `docs/superpowers/specs/2026-03-26-linear-landing-page-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `client/src/landing/lib/motion-variants.ts` | Shared Framer Motion animation presets and transitions |
| `client/src/landing/components/BackgroundMesh.tsx` | Fixed-position atmospheric glow gradients |
| `client/src/landing/components/ProductShowcaseWeb.tsx` | Web app showcase section (text + aec-screenshot) |
| `client/src/landing/components/ProductShowcaseCLI.tsx` | CLI showcase section (cli-screenshot + text) |

### Modified Files
| File | Change |
|------|--------|
| `client/app/globals.css` | Add landing typography, spacing, and atmosphere tokens |
| `client/app/layout.tsx` | Remove Space Grotesk font import |
| `client/app/page.tsx` | New section order, swap components |
| `client/src/landing/components/LandingHeader.tsx` | Scroll-aware border opacity |
| `client/src/landing/components/HeroSection.tsx` | Major rewrite — screenshot hero, animations |
| `client/src/landing/components/HowItWorks.tsx` | Major rewrite — vertical timeline |
| `client/src/landing/components/BeforeAfter.tsx` | Scroll animations + glow effects |
| `client/src/landing/components/CTASection.tsx` | Bigger type, glow background, animation |

### Deleted Files
| File | Reason |
|------|--------|
| `client/src/landing/components/EmberSprinkles.tsx` | Replaced by BackgroundMesh |
| `client/src/landing/components/WhyForge.tsx` | Content absorbed into showcase sections |
| `client/src/landing/components/AECShowcase.tsx` | Replaced by hero screenshot |

---

### Task 1: Install Framer Motion and Update Global Config

**Files:**
- Modify: `client/package.json`
- Modify: `client/app/layout.tsx`
- Modify: `client/app/globals.css`

- [ ] **Step 1: Install framer-motion**

Run from the `client/` directory:

```bash
cd /home/forge/Documents/forge/backend/client && npm install framer-motion
```

Expected: `framer-motion` added to `package.json` dependencies.

- [ ] **Step 2: Remove Space Grotesk from layout.tsx**

In `client/app/layout.tsx`, remove the Space Grotesk import and variable. Change this:

```tsx
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
```

To:

```tsx
import { Inter, JetBrains_Mono } from 'next/font/google';
```

Remove the entire `spaceGrotesk` const block:

```tsx
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700'],
});
```

Update the `<body>` className from:

```tsx
<body className={`preload ${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable}`}>
```

To:

```tsx
<body className={`preload ${inter.variable} ${jetbrainsMono.variable}`}>
```

- [ ] **Step 3: Add landing tokens to globals.css**

Add these new CSS custom properties inside the `:root` block in `client/app/globals.css`, after the existing spacing system (after line 94, after `--space-20: 80px;`):

```css
  /* Landing Page Typography */
  --landing-hero: clamp(40px, 6vw, 72px);
  --landing-heading: clamp(28px, 4vw, 44px);
  --landing-subtitle: 18px;
  --landing-body: 16px;

  /* Landing Page Spacing (Linear-matched) */
  --landing-section-gap: 96px;
  --landing-subsection-gap: 48px;
  --landing-optical-tighten: -4px;
```

Add atmosphere tokens inside the `[data-theme="dark"]` block (after `--shadow-sm` on line 195):

```css
  /* Atmosphere */
  --bg-gradient-start: #0a0a0a;
  --bg-gradient-end: #111113;
  --glow-primary: rgba(99, 102, 241, 0.15);
  --glow-accent: rgba(16, 185, 129, 0.10);
```

Also add the same atmosphere tokens inside the `@media (prefers-color-scheme: dark)` block (after `--shadow-sm` on line 160):

```css
  /* Atmosphere */
  --bg-gradient-start: #0a0a0a;
  --bg-gradient-end: #111113;
  --glow-primary: rgba(99, 102, 241, 0.15);
  --glow-accent: rgba(16, 185, 129, 0.10);
```

- [ ] **Step 4: Verify the app still builds**

```bash
cd /home/forge/Documents/forge/backend/client && npm run type-check
```

Expected: No type errors. The Space Grotesk `--font-display` variable is no longer set, but it's not referenced anywhere in the codebase (only in the body className).

- [ ] **Step 5: Commit**

```bash
cd /home/forge/Documents/forge/backend && git add client/package.json client/package-lock.json client/app/layout.tsx client/app/globals.css && git commit -m "feat(landing): install framer-motion, remove Space Grotesk, add landing tokens"
```

---

### Task 2: Create Motion Variants Library

**Files:**
- Create: `client/src/landing/lib/motion-variants.ts`

- [ ] **Step 1: Create the lib directory and motion-variants file**

Create `client/src/landing/lib/motion-variants.ts`:

```typescript
import type { Variants, Transition } from 'framer-motion';

// Default easing curve — cubic bezier matching Linear's smooth feel
export const defaultTransition: Transition = {
  duration: 0.6,
  ease: [0.25, 0.1, 0.25, 1],
};

// Slow transition for hero elements
export const heroTransition: Transition = {
  duration: 0.8,
  ease: [0.25, 0.1, 0.25, 1],
};

// --- Entrance Variants ---

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: defaultTransition },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: defaultTransition },
};

export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: defaultTransition },
};

export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: defaultTransition },
};

export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: heroTransition },
};

// --- Container Variants (for staggering children) ---

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// --- Shared viewport config ---
// Trigger once when 20% of element is visible
export const viewportConfig = { once: true, amount: 0.2 } as const;
```

- [ ] **Step 2: Verify types**

```bash
cd /home/forge/Documents/forge/backend/client && npx tsc --noEmit --strict client/src/landing/lib/motion-variants.ts 2>&1 | head -5
```

Expected: No errors (or only unrelated errors from other files).

- [ ] **Step 3: Commit**

```bash
cd /home/forge/Documents/forge/backend && git add client/src/landing/lib/motion-variants.ts && git commit -m "feat(landing): add shared Framer Motion animation presets"
```

---

### Task 3: Create BackgroundMesh Component

**Files:**
- Create: `client/src/landing/components/BackgroundMesh.tsx`

- [ ] **Step 1: Create BackgroundMesh.tsx**

Create `client/src/landing/components/BackgroundMesh.tsx`:

```tsx
export function BackgroundMesh() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    >
      {/* Top — indigo glow (hero area) */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px]"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Middle — emerald glow (showcase area) */}
      <div
        className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px]"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Bottom — mixed glow (CTA area) */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px]"
        style={{
          background:
            'radial-gradient(ellipse at 40% 100%, rgba(99,102,241,0.06) 0%, transparent 60%), radial-gradient(ellipse at 60% 100%, rgba(16,185,129,0.05) 0%, transparent 60%)',
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/forge/Documents/forge/backend && git add client/src/landing/components/BackgroundMesh.tsx && git commit -m "feat(landing): add BackgroundMesh atmospheric glow component"
```

---

### Task 4: Rewrite LandingHeader with Scroll-Aware Border

**Files:**
- Modify: `client/src/landing/components/LandingHeader.tsx`

- [ ] **Step 1: Rewrite LandingHeader.tsx**

Replace the entire contents of `client/src/landing/components/LandingHeader.tsx`:

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';

export function LandingHeader() {
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 1]);

  return (
    <header className="w-full sticky top-0 bg-[var(--bg)]/80 backdrop-blur-md z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
        <div className="flex items-center gap-3">
          <Image
            src="/forge-icon.png"
            alt="Forge Logo"
            width={32}
            height={32}
            className="drop-shadow-sm"
          />
          <span className="font-medium text-xl tracking-tight text-red-500">
            forge
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/docs"
            className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            Docs
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/tickets"
            className="hidden sm:inline-flex h-9 items-center justify-center rounded-md bg-[var(--text)] px-4 text-sm font-medium text-[var(--bg)] transition-colors hover:opacity-90"
          >
            Go to App
          </Link>
        </div>
      </div>
      {/* Scroll-aware bottom border — fades in as user scrolls past hero */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-[var(--border-subtle)]"
        style={{ opacity: borderOpacity }}
      />
    </header>
  );
}
```

- [ ] **Step 2: Verify it renders**

```bash
cd /home/forge/Documents/forge/backend/client && npm run type-check
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
cd /home/forge/Documents/forge/backend && git add client/src/landing/components/LandingHeader.tsx && git commit -m "feat(landing): add scroll-aware header border opacity"
```

---

### Task 5: Rewrite HeroSection

**Files:**
- Modify: `client/src/landing/components/HeroSection.tsx`

- [ ] **Step 1: Rewrite HeroSection.tsx**

Replace the entire contents of `client/src/landing/components/HeroSection.tsx`:

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import {
  fadeUp,
  fadeIn,
  scaleUp,
  defaultTransition,
  heroTransition,
} from '@/landing/lib/motion-variants';

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Parallax: screenshot tilt flattens as user scrolls
  const rotateX = useTransform(scrollYProgress, [0, 1], [5, 0]);
  const screenshotY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col items-center justify-center text-center px-4 overflow-hidden"
      style={{
        paddingTop: 'var(--landing-section-gap)',
        paddingBottom: 'var(--landing-section-gap)',
      }}
    >
      {/* Background glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px]"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[600px] h-[400px]"
          style={{
            background:
              'radial-gradient(ellipse at 80% 100%, rgba(16,185,129,0.06) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Badge */}
      <motion.div
        className="relative mb-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--border-subtle)] text-[var(--text-tertiary)] bg-[var(--bg-subtle)] font-mono text-[11px] uppercase tracking-[0.05em]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          AI-powered ticket specs
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        className="relative text-[var(--text)] font-medium tracking-[-0.03em] mb-2 max-w-3xl"
        style={{ fontSize: 'var(--landing-hero)', lineHeight: 1.1 }}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ ...defaultTransition, delay: 0.1 }}
      >
        Dev-ready tickets.
        <br />
        Every single time.
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="relative text-[var(--text-secondary)] mb-8 max-w-lg leading-relaxed mx-auto"
        style={{
          fontSize: 'var(--landing-subtitle)',
          marginTop: 'var(--landing-optical-tighten)',
        }}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ ...defaultTransition, delay: 0.2 }}
      >
        PMs miss technical context. Forge doesn&apos;t. Dev-ready tickets from
        rough ideas, in minutes.
      </motion.p>

      {/* CTAs */}
      <motion.div
        className="relative flex items-center gap-4"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ ...defaultTransition, delay: 0.3 }}
      >
        <Link
          href="/tickets"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-7 text-sm font-medium text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)] active:scale-[0.97]"
        >
          Get Started
        </Link>
        <a
          href="#how-it-works"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--border-subtle)] px-7 text-sm font-medium text-[var(--text-secondary)] transition-all hover:text-[var(--text)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-subtle)]"
          onClick={(e) => {
            e.preventDefault();
            document
              .getElementById('how-it-works')
              ?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          See how it works
        </a>
      </motion.div>

      {/* Hero Screenshot */}
      <motion.div
        className="relative w-full max-w-5xl mt-16"
        variants={scaleUp}
        initial="hidden"
        animate="visible"
        transition={{ ...heroTransition, delay: 0.5 }}
        style={{ y: screenshotY }}
      >
        {/* Ambient glow behind screenshot */}
        <div
          className="absolute -inset-20 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse at 50% 60%, rgba(16,185,129,0.12) 0%, rgba(99,102,241,0.06) 40%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <motion.div
          className="relative rounded-2xl border border-[var(--border-subtle)] overflow-hidden"
          style={{
            perspective: '2000px',
            rotateX,
            boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
          }}
        >
          <Image
            src="/images/ticket-screenshot.png"
            alt="Forge ticket management interface showing AI-enriched tickets with quality scores"
            width={1920}
            height={1080}
            priority
            className="w-full h-auto"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Verify types**

```bash
cd /home/forge/Documents/forge/backend/client && npm run type-check
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
cd /home/forge/Documents/forge/backend && git add client/src/landing/components/HeroSection.tsx && git commit -m "feat(landing): rewrite hero with perspective screenshot and scroll parallax"
```

---

### Task 6: Rewrite HowItWorks as Vertical Timeline

**Files:**
- Modify: `client/src/landing/components/HowItWorks.tsx`

- [ ] **Step 1: Rewrite HowItWorks.tsx**

Replace the entire contents of `client/src/landing/components/HowItWorks.tsx`:

```tsx
'use client';

import { motion } from 'framer-motion';
import {
  fadeUp,
  slideFromLeft,
  staggerContainer,
  viewportConfig,
} from '@/landing/lib/motion-variants';

const STEPS = [
  {
    number: '1',
    title: 'Describe',
    subtitle: 'What you want built — rough idea, Slack message, anything.',
    dotColor: 'bg-purple-400',
    borderColor: 'border-purple-400/30',
  },
  {
    number: '2',
    title: 'AI Refines',
    subtitle:
      'Forge asks smart questions, fills in technical gaps, and structures the spec.',
    dotColor: 'bg-violet-400',
    borderColor: 'border-violet-400/30',
  },
  {
    number: '3',
    title: 'Approve',
    subtitle:
      'Review the complete spec. Assigns developer automatically. Tracks SLA.',
    dotColor: 'bg-amber-400',
    borderColor: 'border-amber-400/30',
  },
  {
    number: '4',
    title: 'Develop',
    subtitle:
      'Developer picks up a fully-scoped ticket with file paths, acceptance criteria, and implementation plan.',
    dotColor: 'bg-emerald-400',
    borderColor: 'border-emerald-400/30',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        paddingTop: 'var(--landing-section-gap)',
        paddingBottom: 'var(--landing-section-gap)',
      }}
    >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section heading */}
        <motion.div
          className="text-center mb-16"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-4">
            HOW IT WORKS
          </p>
          <h2
            className="font-medium tracking-[-0.025em] text-[var(--text)]"
            style={{
              fontSize: 'var(--landing-heading)',
              marginBottom: 'var(--landing-optical-tighten)',
            }}
          >
            From idea to dev-ready spec in minutes
          </h2>
          <p
            className="text-[var(--text-secondary)] max-w-lg mx-auto"
            style={{ fontSize: 'var(--landing-subtitle)' }}
          >
            Not days. Not hours. Minutes.
          </p>
        </motion.div>

        {/* Vertical timeline */}
        <motion.div
          className="relative max-w-xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {/* Timeline line */}
          <div
            className="absolute left-[15px] top-2 bottom-2 w-px bg-[var(--border-subtle)]"
            aria-hidden="true"
          />

          <div className="flex flex-col gap-10">
            {STEPS.map((step) => (
              <motion.div
                key={step.number}
                className="relative flex items-start gap-6 pl-1"
                variants={slideFromLeft}
              >
                {/* Dot on timeline */}
                <div className="relative z-10 flex items-center justify-center w-[30px] h-[30px] shrink-0">
                  <div
                    className={`w-3 h-3 rounded-full ${step.dotColor}`}
                  />
                </div>

                {/* Content */}
                <div className={`pb-0 border-l-2 ${step.borderColor} pl-5`}>
                  <h3 className="font-medium text-[var(--text)] text-lg mb-1">
                    {step.title}
                  </h3>
                  <p
                    className="text-[var(--text-secondary)] leading-relaxed"
                    style={{ fontSize: 'var(--landing-body)' }}
                  >
                    {step.subtitle}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/forge/Documents/forge/backend && git add client/src/landing/components/HowItWorks.tsx && git commit -m "feat(landing): rewrite HowItWorks as vertical timeline with stagger animation"
```

---

### Task 7: Create ProductShowcaseWeb Section

**Files:**
- Create: `client/src/landing/components/ProductShowcaseWeb.tsx`

- [ ] **Step 1: Create ProductShowcaseWeb.tsx**

Create `client/src/landing/components/ProductShowcaseWeb.tsx`:

```tsx
'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  slideFromLeft,
  slideFromRight,
  scaleUp,
  viewportConfig,
} from '@/landing/lib/motion-variants';

export function ProductShowcaseWeb() {
  return (
    <section
      style={{
        paddingTop: 'var(--landing-section-gap)',
        paddingBottom: 'var(--landing-section-gap)',
        backgroundColor: 'var(--bg-gradient-end)',
      }}
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          {/* Text — left 40% */}
          <motion.div
            className="md:col-span-5"
            variants={slideFromLeft}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-4">
              WEB APP
            </p>
            <h2
              className="font-medium tracking-[-0.025em] text-[var(--text)] mb-6"
              style={{ fontSize: 'var(--landing-heading)' }}
            >
              Create, review, and approve — all from the browser
            </h2>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-3 text-[var(--text-secondary)]" style={{ fontSize: 'var(--landing-body)' }}>
                <span className="text-emerald-400 mt-0.5 shrink-0">&#10003;</span>
                AI-enriched specs with quality scores and acceptance criteria
              </li>
              <li className="flex items-start gap-3 text-[var(--text-secondary)]" style={{ fontSize: 'var(--landing-body)' }}>
                <span className="text-emerald-400 mt-0.5 shrink-0">&#10003;</span>
                Drag-and-drop ticket management with status tracking
              </li>
              <li className="flex items-start gap-3 text-[var(--text-secondary)]" style={{ fontSize: 'var(--landing-body)' }}>
                <span className="text-emerald-400 mt-0.5 shrink-0">&#10003;</span>
                Developer review and PM approval workflow built in
              </li>
            </ul>
          </motion.div>

          {/* Screenshot — right 60% */}
          <motion.div
            className="md:col-span-7 relative"
            variants={slideFromRight}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            {/* Emerald glow behind */}
            <div
              className="absolute -inset-16 pointer-events-none"
              aria-hidden="true"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 50%, var(--glow-accent) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
            <motion.div
              className="relative rounded-2xl border border-[var(--border-subtle)] overflow-hidden"
              style={{
                boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                transform: 'perspective(2000px) rotateY(-3deg) rotateX(2deg)',
              }}
            >
              <Image
                src="/images/aec-screenshot.png"
                alt="Forge web app showing an AI-enriched ticket spec with problem statement, acceptance criteria, and quality score"
                width={1920}
                height={1080}
                className="w-full h-auto"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/forge/Documents/forge/backend && git add client/src/landing/components/ProductShowcaseWeb.tsx && git commit -m "feat(landing): add web app showcase section with perspective screenshot"
```

---

### Task 8: Create ProductShowcaseCLI Section

**Files:**
- Create: `client/src/landing/components/ProductShowcaseCLI.tsx`

- [ ] **Step 1: Create ProductShowcaseCLI.tsx**

Create `client/src/landing/components/ProductShowcaseCLI.tsx`:

```tsx
'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { CopyCommand } from '@/core/components/CopyCommand';
import {
  slideFromLeft,
  slideFromRight,
  viewportConfig,
} from '@/landing/lib/motion-variants';

export function ProductShowcaseCLI() {
  return (
    <section
      style={{
        paddingTop: 'var(--landing-section-gap)',
        paddingBottom: 'var(--landing-section-gap)',
      }}
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          {/* Screenshot — left 60% */}
          <motion.div
            className="md:col-span-7 relative order-2 md:order-1"
            variants={slideFromLeft}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            {/* Indigo glow behind */}
            <div
              className="absolute -inset-16 pointer-events-none"
              aria-hidden="true"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 50%, var(--glow-primary) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
            <motion.div
              className="relative rounded-2xl border border-[var(--border-subtle)] overflow-hidden"
              style={{
                boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                transform: 'perspective(2000px) rotateY(3deg) rotateX(2deg)',
              }}
            >
              <Image
                src="/images/cli-screenshot.png"
                alt="Forge CLI integration with Claude Code showing ticket list and review commands"
                width={1920}
                height={1080}
                className="w-full h-auto"
              />
            </motion.div>
          </motion.div>

          {/* Text — right 40% */}
          <motion.div
            className="md:col-span-5 order-1 md:order-2"
            variants={slideFromRight}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-4">
              DEVELOPER TOOLS
            </p>
            <h2
              className="font-medium tracking-[-0.025em] text-[var(--text)] mb-6"
              style={{ fontSize: 'var(--landing-heading)' }}
            >
              Pick up tickets without leaving your IDE
            </h2>
            <ul className="flex flex-col gap-3 mb-6">
              <li className="flex items-start gap-3 text-[var(--text-secondary)]" style={{ fontSize: 'var(--landing-body)' }}>
                <span className="text-indigo-400 mt-0.5 shrink-0">&#10003;</span>
                Browse and claim tickets from Claude Code or your terminal
              </li>
              <li className="flex items-start gap-3 text-[var(--text-secondary)]" style={{ fontSize: 'var(--landing-body)' }}>
                <span className="text-indigo-400 mt-0.5 shrink-0">&#10003;</span>
                Full codebase context included — file paths, APIs, patterns
              </li>
              <li className="flex items-start gap-3 text-[var(--text-secondary)]" style={{ fontSize: 'var(--landing-body)' }}>
                <span className="text-indigo-400 mt-0.5 shrink-0">&#10003;</span>
                MCP bridge for two-way sync between IDE and Forge
              </li>
            </ul>
            <CopyCommand command="npm i forge-aec" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/forge/Documents/forge/backend && git add client/src/landing/components/ProductShowcaseCLI.tsx && git commit -m "feat(landing): add CLI showcase section with mirrored perspective"
```

---

### Task 9: Update BeforeAfter with Scroll Animations and Glows

**Files:**
- Modify: `client/src/landing/components/BeforeAfter.tsx`

- [ ] **Step 1: Rewrite BeforeAfter.tsx**

Replace the entire contents of `client/src/landing/components/BeforeAfter.tsx`:

```tsx
'use client';

import { motion } from 'framer-motion';
import {
  fadeUp,
  slideFromLeft,
  slideFromRight,
  viewportConfig,
} from '@/landing/lib/motion-variants';

const slackMessages = [
  { name: 'Alex', initials: 'AP', color: '#e87461', text: 'hey can you pick up the login ticket?', time: '10:23 AM' },
  { name: 'Jordan', initials: 'JR', color: '#4a9eff', text: 'which login ticket?', time: '10:24 AM' },
  { name: 'Alex', initials: 'AP', color: '#e87461', text: 'the one for adding social login', time: '10:25 AM' },
  { name: 'Jordan', initials: 'JR', color: '#4a9eff', text: 'google only or also github?', time: '10:31 AM' },
  { name: 'Alex', initials: 'AP', color: '#e87461', text: 'both I think? check with design', time: '10:34 AM' },
  { name: 'Jordan', initials: 'JR', color: '#4a9eff', text: "where's the design?", time: '10:35 AM' },
  { name: 'Alex', initials: 'AP', color: '#e87461', text: 'not sure, ask Sarah', time: '10:41 AM' },
  { name: 'Jordan', initials: 'JR', color: '#4a9eff', text: 'also — existing auth table or new one?', time: '10:52 AM' },
  { name: 'Alex', initials: 'AP', color: '#e87461', text: 'whatever makes sense', time: '11:06 AM' },
  { name: 'Jordan', initials: 'JR', color: '#4a9eff', text: '...', time: '1:14 PM', subtle: true },
  { name: 'Jordan', initials: 'JR', color: '#4a9eff', text: 'built it with Google only, separate table', time: '1:15 PM' },
  { name: 'Alex', initials: 'AP', color: '#e87461', text: 'wait we needed GitHub too, and auth table already has a provider column', time: '1:16 PM' },
  { name: 'Jordan', initials: 'JR', color: '#4a9eff', text: '\u{1F643}', time: '1:16 PM' },
] as const;

const specSections = {
  title: 'Add Social Login (Google + GitHub)',
  criteria: [
    'Users can sign in with Google or GitHub OAuth',
    'New provider entries use existing auth_providers table',
    'Graceful fallback if OAuth provider is unavailable',
  ],
  files: ['src/auth/providers/', 'src/auth/models/User.ts', 'src/auth/auth.module.ts'],
  steps: [
    'Add Google & GitHub strategy to OAuthProviderFactory',
    'Extend auth_providers table with provider-specific metadata',
    'Add OAuth callback routes and token exchange flow',
  ],
};

export function BeforeAfter() {
  return (
    <section
      style={{
        paddingTop: 'var(--landing-section-gap)',
        paddingBottom: 'var(--landing-section-gap)',
        backgroundColor: 'var(--bg-gradient-end)',
      }}
    >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section heading */}
        <motion.div
          className="text-center mb-16"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-4">
            BEFORE &amp; AFTER
          </p>
          <h2
            className="font-medium tracking-[-0.025em] text-[var(--text)]"
            style={{
              fontSize: 'var(--landing-heading)',
              marginBottom: 'var(--landing-optical-tighten)',
            }}
          >
            Sound familiar?
          </h2>
          <p
            className="text-[var(--text-secondary)] max-w-xl mx-auto"
            style={{ fontSize: 'var(--landing-subtitle)' }}
          >
            Forge replaces hours of back-and-forth with a single, dev-ready spec.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left — Before: Slack Thread */}
          <motion.div
            className="flex flex-col gap-3"
            variants={slideFromLeft}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            {/* Subtle red glow */}
            <div className="relative">
              <div
                className="absolute -inset-10 pointer-events-none"
                aria-hidden="true"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.06) 0%, transparent 70%)',
                  filter: 'blur(30px)',
                }}
              />
              <div className="relative rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                {/* Slack header */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)]">
                  <span className="text-sm font-medium text-[var(--text)]"># dev-backend</span>
                  <span className="ml-auto flex h-2 w-2 rounded-full bg-red-400/80" />
                </div>

                {/* Messages */}
                <div className="px-4 py-3 flex flex-col gap-2.5 max-h-[420px] overflow-y-auto">
                  {slackMessages.map((msg, i) => {
                    const prevMsg = i > 0 ? slackMessages[i - 1] : null;
                    const isTimeSeparator =
                      msg.time === '1:14 PM' && prevMsg?.time === '11:06 AM';
                    return (
                      <div key={i}>
                        {isTimeSeparator && (
                          <div className="flex items-center gap-3 my-2">
                            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                            <span className="text-[10px] text-[var(--text-tertiary)] font-medium px-2">
                              2 hours later
                            </span>
                            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                          </div>
                        )}
                        <div className="flex items-start gap-2.5">
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-medium text-white shrink-0 mt-0.5"
                            style={{ backgroundColor: msg.color }}
                          >
                            {msg.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-medium text-[var(--text)]">
                                {msg.name}
                              </span>
                              <span className="text-[10px] text-[var(--text-tertiary)]">
                                {msg.time}
                              </span>
                            </div>
                            <p
                              className={`text-sm leading-relaxed ${
                                msg.subtle
                                  ? 'text-[var(--text-tertiary)]'
                                  : 'text-[var(--text-secondary)]'
                              }`}
                            >
                              {msg.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Before label */}
            <div className="flex items-center gap-2 px-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-red-500/20 text-red-400 bg-red-500/5">
                Before
              </span>
              <span className="text-sm text-[var(--text-tertiary)]">
                3 hours wasted. Wrong implementation.
              </span>
            </div>
          </motion.div>

          {/* Right — After: Forge Spec */}
          <motion.div
            className="flex flex-col gap-3"
            variants={slideFromRight}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            {/* Subtle emerald glow */}
            <div className="relative">
              <div
                className="absolute -inset-10 pointer-events-none"
                aria-hidden="true"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.06) 0%, transparent 70%)',
                  filter: 'blur(30px)',
                }}
              />
              <div className="relative rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                {/* Spec header */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)]">
                  <span className="text-sm font-medium text-[var(--text)]">
                    Forge Spec
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    95 / 100
                  </span>
                </div>

                {/* Spec content */}
                <div className="px-4 py-4 flex flex-col gap-4">
                  <div>
                    <h4 className="text-base font-medium text-[var(--text)] mb-1">
                      {specSections.title}
                    </h4>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
                        feature
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
                        auth
                      </span>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-mono text-[10px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-2">
                      Acceptance Criteria
                    </h5>
                    <ul className="flex flex-col gap-1.5">
                      {specSections.criteria.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <span className="text-emerald-400 mt-0.5 shrink-0">
                            &#10003;
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-mono text-[10px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-2">
                      Relevant Files
                    </h5>
                    <div className="flex flex-col gap-1">
                      {specSections.files.map((file, i) => (
                        <code
                          key={i}
                          className="text-xs text-[var(--text-secondary)] bg-[var(--bg-subtle)] px-2 py-1 rounded border border-[var(--border-subtle)] font-mono w-fit"
                        >
                          {file}
                        </code>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-mono text-[10px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-2">
                      Implementation Plan
                    </h5>
                    <ol className="flex flex-col gap-1.5">
                      {specSections.steps.map((step, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <span className="text-[var(--text-tertiary)] font-mono text-xs mt-0.5 shrink-0">
                            {i + 1}.
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            {/* After label */}
            <div className="flex items-center gap-2 px-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                After
              </span>
              <span className="text-sm text-[var(--text-tertiary)]">
                15 minutes. Aligned before coding starts.
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/forge/Documents/forge/backend && git add client/src/landing/components/BeforeAfter.tsx && git commit -m "feat(landing): add scroll animations and colored glows to BeforeAfter"
```

---

### Task 10: Update CTASection with Glow and Animation

**Files:**
- Modify: `client/src/landing/components/CTASection.tsx`

- [ ] **Step 1: Rewrite CTASection.tsx**

Replace the entire contents of `client/src/landing/components/CTASection.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { fadeUp, viewportConfig } from '@/landing/lib/motion-variants';

export function CTASection() {
  return (
    <section
      className="relative"
      style={{
        paddingTop: 'var(--landing-section-gap)',
        paddingBottom: 'var(--landing-section-gap)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px]"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.10) 0%, rgba(99,102,241,0.06) 40%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <motion.div
        className="relative container mx-auto px-4 max-w-3xl text-center"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        <h2
          className="font-medium tracking-[-0.025em] text-[var(--text)] mb-4"
          style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}
        >
          Stop wasting time on bad tickets
        </h2>
        <p
          className="text-[var(--text-secondary)] mb-8"
          style={{ fontSize: 'var(--landing-subtitle)' }}
        >
          Forge your first ticket in minutes. Free forever for individuals.
        </p>
        <Link
          href="/tickets"
          className="inline-flex h-12 items-center justify-center rounded-lg bg-emerald-600 px-8 text-base font-medium text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] active:scale-[0.97]"
        >
          Try Forge Free
        </Link>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/forge/Documents/forge/backend && git add client/src/landing/components/CTASection.tsx && git commit -m "feat(landing): add glow background and scroll animation to CTA section"
```

---

### Task 11: Wire Everything Together in page.tsx

**Files:**
- Modify: `client/app/page.tsx`

- [ ] **Step 1: Update page.tsx**

Replace the entire contents of `client/app/page.tsx`:

```tsx
import { LandingHeader } from '@/landing/components/LandingHeader';
import { HeroSection } from '@/landing/components/HeroSection';
import { HowItWorks } from '@/landing/components/HowItWorks';
import { ProductShowcaseWeb } from '@/landing/components/ProductShowcaseWeb';
import { ProductShowcaseCLI } from '@/landing/components/ProductShowcaseCLI';
import { BeforeAfter } from '@/landing/components/BeforeAfter';
import { CTASection } from '@/landing/components/CTASection';
import { BackgroundMesh } from '@/landing/components/BackgroundMesh';
import { LandingFooter } from '@/landing/components/LandingFooter';

export default function LandingPage() {
  return (
    <div
      data-theme="dark"
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans selection:bg-[var(--primary)] selection:text-[var(--primary-bg)]"
    >
      <BackgroundMesh />
      <LandingHeader />
      <main className="relative z-10 flex-1">
        <HeroSection />
        <HowItWorks />
        <ProductShowcaseWeb />
        <ProductShowcaseCLI />
        <BeforeAfter />
        <CTASection />
      </main>
      <footer className="relative z-10">
        <LandingFooter />
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd /home/forge/Documents/forge/backend/client && npm run type-check
```

Expected: No type errors. Unused imports from old components are removed.

- [ ] **Step 3: Commit**

```bash
cd /home/forge/Documents/forge/backend && git add client/app/page.tsx && git commit -m "feat(landing): wire new section structure with BackgroundMesh"
```

---

### Task 12: Delete Removed Components

**Files:**
- Delete: `client/src/landing/components/EmberSprinkles.tsx`
- Delete: `client/src/landing/components/WhyForge.tsx`
- Delete: `client/src/landing/components/AECShowcase.tsx`

- [ ] **Step 1: Remove the three files**

```bash
cd /home/forge/Documents/forge/backend && rm client/src/landing/components/EmberSprinkles.tsx client/src/landing/components/WhyForge.tsx client/src/landing/components/AECShowcase.tsx
```

- [ ] **Step 2: Verify no remaining imports**

```bash
cd /home/forge/Documents/forge/backend && grep -r "EmberSprinkles\|WhyForge\|AECShowcase" client/src/ client/app/ --include="*.tsx" --include="*.ts"
```

Expected: No results (page.tsx no longer imports them).

- [ ] **Step 3: Verify build still works**

```bash
cd /home/forge/Documents/forge/backend/client && npm run type-check
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
cd /home/forge/Documents/forge/backend && git add -u client/src/landing/components/EmberSprinkles.tsx client/src/landing/components/WhyForge.tsx client/src/landing/components/AECShowcase.tsx && git commit -m "chore(landing): remove EmberSprinkles, WhyForge, and AECShowcase components"
```

---

### Task 13: Remove Ember CSS Animations from globals.css

**Files:**
- Modify: `client/app/globals.css`

- [ ] **Step 1: Remove ember animation keyframes and classes**

In `client/app/globals.css`, remove the entire ember animation block (lines 534-580 approximately):

Remove `@keyframes ember-rise`, `@keyframes ember-rise-slow`, `.ember-particle`, and `.ember-particle-slow` blocks.

These CSS rules:

```css
/* forge ember particles — pixelated fire sprinkles */
@keyframes ember-rise {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 0.7;
  }
  60% {
    opacity: 0.4;
  }
  100% {
    transform: translateY(-200px) translateX(var(--ember-drift));
    opacity: 0;
  }
}

@keyframes ember-rise-slow {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  15% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    transform: translateY(-160px) translateX(var(--ember-drift));
    opacity: 0;
  }
}

.ember-particle {
  position: absolute;
  bottom: 0;
  image-rendering: pixelated;
  animation: ember-rise var(--ember-duration) var(--ember-delay) infinite;
}

.ember-particle-slow {
  position: absolute;
  bottom: 0;
  image-rendering: pixelated;
  animation: ember-rise-slow var(--ember-duration) var(--ember-delay) infinite;
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/forge/Documents/forge/backend && git add client/app/globals.css && git commit -m "chore(landing): remove unused ember animation CSS"
```

---

### Task 14: Visual QA and Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Start the dev server**

```bash
cd /home/forge/Documents/forge/backend/client && npm run dev
```

- [ ] **Step 2: Open the landing page in a browser**

Navigate to `http://localhost:3001` and verify:

1. **Header:** Border is invisible at top, fades in on scroll
2. **Hero:** Badge, headline (Inter 500, large), subtitle, two CTAs, screenshot with perspective tilt that flattens on scroll, ambient glow behind screenshot
3. **How It Works:** Vertical timeline, steps stagger in from left as you scroll
4. **Web App Showcase:** Text left, aec-screenshot right with perspective tilt and emerald glow
5. **CLI Showcase:** cli-screenshot left with indigo glow, text right with copy command
6. **Before/After:** Slack thread slides from left, Forge spec slides from right, red/emerald glows
7. **CTA:** Large heading, emerald button with hover glow, ambient background glow
8. **Background Mesh:** Subtle atmospheric glows visible behind all sections
9. **Mono micro labels:** Section labels ("HOW IT WORKS", "WEB APP", etc.) are JetBrains Mono, 11px, uppercase
10. **No ember particles** visible
11. **Reduced motion:** Enable `prefers-reduced-motion: reduce` in browser devtools and verify animations are minimal/disabled

- [ ] **Step 3: Final type check**

```bash
cd /home/forge/Documents/forge/backend/client && npm run type-check && npm run build
```

Expected: Clean build with no errors.

- [ ] **Step 4: Commit any fixes**

If any visual QA issues are found, fix them and commit:

```bash
cd /home/forge/Documents/forge/backend && git add -A && git commit -m "fix(landing): visual QA adjustments"
```
