# Forge — The Product Vision

## One Line

**Forge turns tickets into pull requests. From your browser.**

---

## What Forge Is

Forge is a development workflow platform where PMs write tickets and AI implements them — on your existing codebase, with production-quality code, creating real pull requests that developers review and merge.

It's not a code generator. It's not a prototyping tool. It's the missing layer between "we need this feature" and "here's the PR."

---

## The Problem We Solve

Every engineering team has the same bottleneck:

```
PM writes ticket → ticket sits in backlog → developer eventually picks it up
                         ↑
                    weeks or months
```

47 tickets in the backlog. Two developers. The PM knows exactly what needs to happen but can't make it happen without a developer's time. Small fixes, bug patches, straightforward features — they all wait in line behind the complex work.

**What if the PM could just click a button?**

---

## How It Works

### 1. Write

The PM describes what they need. Forge's AI generates a detailed technical specification with acceptance criteria, file changes, and test requirements. This isn't a vague user story — it's a developer-ready spec that Claude will follow to implement.

### 2. Develop

The PM clicks **"Develop."** Behind the scenes, Forge spins up a secure cloud sandbox, clones the team's codebase, and runs the real Claude Code CLI — the same tool developers use in their terminals. Claude reads the spec, reads the codebase, follows the team's coding patterns (CLAUDE.md rules), implements the changes, runs the tests, and pushes a branch.

**No API key needed. No terminal. No waiting for a developer.** The PM clicks a button and watches it happen.

### 3. Review

A pull request appears on GitHub. The developer reviews it — not writing code from scratch, but reviewing AI-generated code that already follows the team's patterns and passes the test suite. 15 minutes instead of 4 hours.

---

## What Makes Forge Different From Everything Else

### vs. Lovable / Bolt / v0

They build new apps from scratch. Forge ships features into your **existing** 500-file codebase. They can't clone your repo, follow your architecture rules, or run your test suite. Different market entirely.

- Lovable = zero to one (greenfield prototypes)
- **Forge = one to N (ongoing product development)**

### vs. Cursor / Copilot / Windsurf

They're developer tools that require a developer in a terminal. Forge is a **PM tool** that works from the browser. The developer's role shifts from writing code to reviewing pull requests.

### vs. Hiring

A developer costs $10,000-25,000/month. Forge costs $39-99/month and multiplies your existing team's output by 3-4x.

---

## The Change Record: Why This Isn't Just "Vibe Coding"

Here's what separates Forge from every "AI writes code" tool.

When Claude implements a ticket, it doesn't just produce code. It produces a **Change Record** — a structured audit trail of everything that happened:

```
Change Record for AEC-2437: Webhook Retry Logic
────────────────────────────────────────────────

Execution Summary:
  Added exponential retry logic to the webhook delivery
  system using a dedicated Bull queue processor.

Decisions Made:
  ✦ Used Bull queue pattern (not inline retry)
    → Matches existing BackgroundFinalizationService pattern

  ✦ Exponential backoff: 1s, 2s, 4s, 8s
    → Industry standard, matches RFC 7231 recommendations

  ✦ Max 5 retry attempts
    → Matches project's existing retry configurations

Risks Identified:
  ⚠ No dead-letter queue for permanently failed webhooks
    → Logged for future ticket

Files Changed:
  + src/webhooks/webhook-retry.processor.ts  (+89 lines)
  ~ src/webhooks/webhooks.module.ts          (+12 -2)
  ~ src/webhooks/webhook.service.ts          (+23 -4)
  + src/webhooks/__tests__/retry.spec.ts     (+124 lines)

Tests: 18 passed, 0 failed
PR: #42 on feat/aec-2437-webhook-retry
```

**Every decision documented. Every risk flagged. Every file tracked.**

The reviewing developer doesn't need to guess why the AI made certain choices. The PM has a clear record of what was built and whether it matches the spec. The CTO has an audit trail.

This isn't "throw code at the wall and hope." This is **structured, accountable, traceable AI development.**

---

## The Three-Tier Model

Forge adapts to the complexity of the work:

| | Small Changes | Medium Features | Complex Work |
|---|---|---|---|
| **How** | Quick Flow | Cloud Develop | Developer + CLI |
| **Who triggers** | PM | PM | Developer |
| **Where it runs** | Cloud (auto) | Cloud (auto) | Developer's machine |
| **Time** | 5 min | 10-20 min | Hours (human pace) |
| **Example** | "Fix the typo on the settings page" | "Add rate limiting to the API" | "Refactor the auth system to support SSO" |

Small and medium work → PM handles it from the browser. Never touches a developer.
Complex work → Developer handles it with full CLI power. PM wrote the spec, dev executes.

**Every tier produces the same outputs:** Pull request. Change Record. Execution events. The lifecycle is identical.

---

## The Market

**Forge's market is every team with an existing codebase and a backlog.**

- ~26 million professional developers worldwide
- ~5 million PMs/product owners
- Average backlog: 40-60 tickets
- Average ticket wait time: 2-4 weeks

We don't serve solo hackers building MVPs (that's Lovable). We serve **teams** — where PMs need features shipped, developers are stretched thin, and backlogs grow faster than they shrink.

---

## The Business Model

SaaS subscription. Forge provides the AI infrastructure — users never see an API key.

| Plan | Price | Cloud Developments |
|---|---|---|
| Free | $0 | 2/month |
| Pro | $39/mo | 20/month |
| Team | $99/mo | 50/month |

**Unit economics:**
- Average cost per development: ~$0.92 (blended across tiers)
- Average revenue per development: ~$1.98 (Pro plan)
- **Gross margin: ~78%**

The magic: complex work (which is expensive in AI tokens) is handled by the developer using their own tools. Forge pays for small/medium work — which is cheap. The expensive stuff costs us nothing.

---

## The Vision

```
Today:
  PM writes ticket in Jira → waits weeks → developer codes it

Tomorrow (Forge):
  PM writes ticket → clicks "Develop" → PR in 15 minutes → developer reviews

The future:
  PM describes what they need → Forge handles everything
  The backlog doesn't exist because features ship as fast as they're conceived
```

---

## Why Now

1. **Claude Code CLI exists** — production-quality AI coding, open source, structured output
2. **Cloud sandboxes are commodity** — E2B, Fly Machines, $0.10/hour for a full VM
3. **Every team has a backlog problem** — and it's getting worse as products grow
4. **The trust gap is closing** — developers are increasingly comfortable reviewing AI-generated PRs

The infrastructure for this product didn't exist 12 months ago. It does now. The window is open.

---

## What's Already Built

Forge isn't a pitch deck. It's a working product.

- ✅ AI-assisted ticket creation with spec generation
- ✅ Review Q&A system for spec refinement
- ✅ Approval workflow
- ✅ Project profiles (codebase context for AI)
- ✅ Change Record system (structured audit trail)
- ✅ GitHub integration (OAuth + App)
- ✅ MCP bridge for developer CLI
- ✅ Real-time job monitoring
- ✅ Email notifications
- ✅ Team/workspace management

**What's next:** The "Develop" button — Cloud Develop (Epic 18). This is the feature that closes the loop and makes everything above 10x more valuable.

---

*"Your PM writes the ticket. Claude writes the code. Your developer reviews the PR. Everyone does what they're best at."*
