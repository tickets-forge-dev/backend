# Forge — Monetization & Go-to-Market Plan

## Pricing Model: Freemium + Tiered Subscriptions

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | 5 tickets/month, 1 repo, community support |
| **Pro** | $19/mo per seat | Unlimited tickets, 10 repos, priority generation |
| **Team** | $49/mo per seat | Unlimited repos, team workspace, SSO, custom LLM config |
| **Enterprise** | Custom | Self-hosted option, SLA, dedicated support |

**Rationale:**
- Free tier drives word-of-mouth and adoption
- Per-seat pricing scales with team growth (1 person tries it, team follows)
- $19/mo is impulse-buy range — no procurement approval needed
- Team tier triggers when a manager says "let's all use this"

---

## Cost Structure & Margins

**Primary variable cost: LLM API calls**

| Operation | Input Tokens | Output Tokens | Est. Cost |
|-----------|-------------|---------------|-----------|
| Repo analysis (tree + files + LLM) | 10-30K | 2-4K | ~$0.02-0.10 |
| Ticket generation | 5-15K | 2-5K | ~$0.01-0.05 |
| **Total per ticket** | | | **~$0.03-0.15** |

At $19/mo with ~30 tickets/month: excellent margin.
Even heavy users (100+ tickets) cost ~$15/mo max.

---

## Payment: Stripe

- **Stripe Checkout** — hosted payment page for signup (minimal code)
- **Stripe Billing** — subscription management (upgrades, downgrades, cancellations)
- **Stripe Customer Portal** — self-serve billing management (zero support burden)
- **Usage-based metering** (future) — charge per-ticket overages on Free tier

**Implementation:** Add `subscription` field to workspace/user model in Firestore, verify via NestJS guard before ticket generation.

---

## Go-to-Market Strategy

### Phase 1: Validation (Weeks 1-4)
- Launch on **Product Hunt** (dev tools do well there)
- **Show HN** post on Hacker News (target audience lives here)
- Reddit: r/programming, r/devops, r/SaaS — write about the problem, not the product
- Twitter/X dev community — short demo videos showing before/after
- **Goal:** 100 free signups, 10 paying users, validate conversion

### Phase 2: Content (Weeks 4-12)
- Blog: "How we use AI to write better engineering tickets" (SEO play)
- Comparison content: "Forge vs writing tickets manually" (with time savings data)
- Case study from earliest paying users
- YouTube demo — 2-minute walkthrough showing the magic moment

### Phase 3: Growth (Months 3-6)
- **GitHub Marketplace listing** — massive distribution, right where users are
- **Integrations:** Jira export, Linear export, GitHub Issues export (drives team adoption)
- **Referral program:** "Give a friend 1 month free, get 1 month free"

---

## Release Checklist (Before Charging Money)

- [ ] Landing page with value prop + demo video + pricing
- [ ] Stripe integration with subscription tiers
- [ ] Usage limits enforced in backend (free tier gates)
- [ ] Terms of Service + Privacy Policy
- [ ] Transactional emails (welcome, receipt, approaching limit)
- [ ] Error monitoring (Sentry)
- [ ] Basic analytics (PostHog or Mixpanel free tier)

---

## Priority Order

1. **Stripe + subscription tiers** in codebase (the revenue unlock)
2. **Landing page** (can be a Next.js page on the same app)
3. **Usage metering** (count tickets per workspace per month)
4. **Product Hunt launch** (forcing function for a deadline)

---

## Key Insight

The biggest risk is **distribution**, not pricing or payment. The product works. Focus energy on channels where engineering leads feel the pain of poorly-written tickets: HN, Twitter/X dev community, GitHub.
