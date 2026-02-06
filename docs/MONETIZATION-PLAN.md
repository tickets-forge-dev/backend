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

## Bridging the Non-Technical PM Gap

### The Problem

Current flow requires GitHub OAuth to connect a repo. A PM without GitHub access drops off at step 2 — before ever seeing the product's value. If Forge targets non-technical product people, this kills the funnel.

### Solution 1: GitHub-Free Generation Mode (Ship First)

New onboarding path: *"Describe your project instead"*

- PM picks a tech stack from presets (React + Node, Django + Postgres, etc.) or writes a short product/feature description
- AI generates tickets based on product context alone — no code analysis needed
- Less precise than repo-connected generation, but still delivers ~80% of the value (ticket structure, acceptance criteria, edge cases)
- **Smallest change**: new "manual context" path in the wizard — skip repo selection, describe your stack. The generation pipeline already accepts user input; repo analysis becomes optional
- **Monetization tie-in**: Free tier users without repos. Upgrade to Pro unlocks repo-connected precision

### Solution 2: Team Workspace with Roles (Ship Second)

A developer connects GitHub once. The PM is invited to the workspace and generates tickets using the already-analyzed repo — no GitHub account needed.

- PM signs in with Google only, joins via invite link
- Sees repos the dev already connected, generates tickets against that context
- Dev controls repo access; PM controls product intent
- **Monetization tie-in**: This is the natural Free-to-Team upsell. One dev tries it solo, invites the PM, now you have 2+ seats at $49/mo
- **Requires**: invite system, workspace roles (admin/member), permission model

### Solution 3: Shareable Project Context Link (Future)

Developer runs repo analysis once, generates a read-only **project profile URL**. PM pastes it during onboarding — gets full repo context without touching GitHub.

- Works across organizations (consultant PM + client dev team)
- Zero friction for the PM
- Dev controls what's shared

### Impact on Pricing Tiers

| Tier | GitHub-Free Mode | Team Workspace | Shareable Context |
|------|-----------------|----------------|-------------------|
| **Free** | Yes (5 tickets/mo) | - | - |
| **Pro** | Yes + repo-connected | - | - |
| **Team** | Yes + repo-connected | Yes (invite PMs) | Yes |
| **Enterprise** | Yes + repo-connected | Yes + SSO | Yes + audit log |

### Priority

1. **GitHub-Free Mode** — unblocks the PM persona immediately, no auth/invite system needed
2. **Team Workspace + Roles** — drives seat expansion revenue, natural Team tier feature
3. **Shareable Context** — nice-to-have for cross-org collaboration

---

## Future Features

### Multi-Repo Cross-Reference

**Problem:** Real products aren't one repo. A feature touches the client, the backend, shared packages, infra — but today Forge only analyzes a single repo.

**Solution:** Allow selecting multiple repos (e.g. `client` + `backend` + `shared-types`) and merge their analysis into a unified project context.

- Ticket generation sees the full picture: API contracts, shared types, frontend consumption patterns
- Cross-repo dependency detection: "this endpoint is consumed by these 3 frontend components"
- Generated tickets include implementation steps across repos (e.g. "1. Add field to DTO in backend, 2. Update API call in client, 3. Add type to shared-types")
- **Why it matters**: Without this, generated tickets only cover half the story. A PM asks for "add user avatar to profile page" and gets a frontend-only ticket — missing the backend endpoint, storage, and migration

**Monetization tie-in:** Free = 1 repo, Pro = 10 repos (single-select), Team = unlimited repos with multi-select cross-reference. Cross-reference is the Team tier killer feature.

### Codebase Explorer for PMs (RAG-Powered Q&A)

**Problem:** PMs constantly interrupt developers with questions: "Where does the payment flow live?", "Do we support SSO?", "What happens when a user deletes their account?" These answers exist in the code, docs, or Confluence — but PMs can't access or read them.

**Solution:** A conversational interface where PMs ask plain-English questions and get non-technical answers grounded in the actual codebase and documentation.

- **Ingest sources**: GitHub repos (code + README), Confluence/Atlassian, Notion, Google Docs, internal wikis
- **RAG pipeline**: Chunk + embed documents, retrieve relevant context, LLM generates PM-friendly answers
- **Example queries**:
  - "How does our checkout flow work?" → step-by-step explanation with feature boundaries
  - "What third-party services do we depend on?" → list extracted from package.json, imports, config
  - "Can our system handle multi-currency?" → answer based on actual code, not assumptions
  - "What would it take to add dark mode?" → scope estimate based on current component architecture
- **Key differentiator**: Answers cite sources ("Based on `PaymentService.ts` line 42 and the Stripe integration doc in Confluence") so PMs can share them with engineers for verification
- **Trust layer**: Every answer shows what it's based on — PMs get confidence, devs get traceability

**Monetization tie-in:** This is a standalone value prop that could justify its own pricing. Embed it in Team/Enterprise tiers as "Codebase Intelligence" — it's the feature that makes PMs self-sufficient and saves engineers hours of context-switching per week.

### Team Workspace with Role-Based Access

**Problem:** Today every user is the same. But real teams have distinct roles — a PM who writes product intent, a tech lead who connects repos and reviews specs, a developer who consumes tickets. Without role separation, either everyone needs GitHub access (blocks PMs) or everyone has admin control (risky).

**Solution:** Users select their role at sign-up. The workspace adapts its UI, permissions, and capabilities to each role.

**Roles:**

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| **Admin** (Tech Lead) | Connect GitHub, manage repos, invite members, configure LLM, billing | - |
| **PM / Product** | Create tickets, use Codebase Explorer, export to Jira/Linear, view repo context | Connect/disconnect GitHub, manage billing |
| **Developer** | View tickets, comment, mark complete, view code context | Create tickets, manage repos, billing |
| **Viewer** | Read-only access to tickets and exports | Everything else |

**How it works:**

- **Onboarding**: User picks role → "I'm a PM", "I'm a Tech Lead", "I'm a Developer"
- **Invite flow**: Admin sends invite link with pre-assigned role → PM clicks, signs in with Google (no GitHub needed), lands in workspace with repos already connected
- **Adaptive UI**: PMs see the ticket creation wizard front and center. Developers see the ticket backlog. Admins see settings + integrations
- **Permission enforcement**: Backend guards check role before every action (NestJS guard pattern, consistent with existing `WorkspaceGuard`)

**Implementation scope:**
- `WorkspaceRole` enum: `admin`, `pm`, `developer`, `viewer`
- `WorkspaceMember` entity: `{ userId, workspaceId, role, invitedAt, joinedAt }`
- `RoleGuard` NestJS guard (checks role against required permission per endpoint)
- Invite system: generate token → email/link → accept → join workspace with role
- Frontend: role-aware sidebar navigation + conditional UI rendering

**Monetization tie-in:** This is the Team tier's core feature and the primary seat expansion driver. One dev signs up on Free, connects GitHub, invites the PM — now you have 2 seats at $49/mo. The PM invites 2 more devs to consume tickets — 4 seats. Role-based access is what makes Forge a team tool, not a single-player utility.

| Feature | Free | Pro | Team | Enterprise |
|---------|------|-----|------|------------|
| Multi-repo select | - | Single repo | Cross-reference | Cross-reference + org-wide |
| Codebase Explorer | - | - | Repos + docs | Repos + docs + Confluence/Jira/Notion |
| Team roles | - | - | 4 roles + invite | 4 roles + SSO + SCIM provisioning |

---

## Key Insight

The biggest risk is **distribution**, not pricing or payment. The product works. Focus energy on channels where engineering leads feel the pain of poorly-written tickets: HN, Twitter/X dev community, GitHub.

The second biggest risk is **audience mismatch** — if PMs are the primary buyer but the product requires dev-level GitHub access, conversion dies at onboarding. GitHub-Free Mode fixes this at minimal engineering cost.
