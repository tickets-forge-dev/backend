---
title: "Ticket Lifecycle"
excerpt: "How tickets move through Forge — from draft idea to verified execution contract."
category: "Platform"
---


Every ticket in Forge follows a defined lifecycle. Each status represents a stage where a specific role takes action, and transitions are enforced by the domain model.

## Status Flow

```
                    ┌──────────────────────────┐
                    │                          │
                    ▼                          │
  DRAFT ──► DEV-REFINING ──► REVIEW ──► FORGED ──► EXECUTING ──► COMPLETE
    │                           │                       │
    │                           │                       │
    └───────────────────────────┴── (send back) ◄───────┘
```

**Forward flow:** Draft → Dev-Refining → Review → Forged → Executing → Complete

**Backward flow:** Any later status can be sent back to an earlier one by the PM.

**Drift:** Forged and Executing tickets can detect drift — when the codebase changes and the spec may be stale. Drift is tracked as a property, not a separate status.

## Status Reference

| Status | Value | Who Acts | What Happens |
|--------|-------|----------|--------------|
| **Draft** | `draft` | PM (web) | Ticket is created. AI generates clarification questions. PM answers them. Tech spec is generated. |
| **Dev-Refining** | `dev-refining` | Developer (CLI) | Developer reviews the spec, adds code context, and submits a Q&A review session. |
| **Review** | `review` | PM (web) | PM reads the developer's Q&A, optionally re-bakes the spec with new context, then approves. |
| **Forged** | `forged` | — | AEC is locked and verified. Readiness score is 75+. Ready for execution. |
| **Executing** | `executing` | Developer (CLI) | Developer (or AI agent) implements the ticket following the AEC. |
| **Complete** | `complete` | — | Implementation is done. Ticket can be reverted to Draft if needed. |

## Transition Rules

### Forward Transitions

| From | To | Trigger | Requirements |
|------|----|---------|-------------|
| Draft | Dev-Refining | `startDevRefine()` | Validation results must be provided |
| Dev-Refining | Forged | `forge()` | Readiness score must be 75+ |
| Any | Review | `submitReviewSession()` | Developer submits Q&A pairs |
| Review | Forged | `approve()` | PM approves the spec |
| Forged | Executing | `export()` | External issue link provided |
| Forged | Executing | `startImplementation()` | Branch name provided |
| Draft, Executing | Complete | `markComplete()` | — |

### Backward Transitions

| From | To | Trigger | What Gets Cleared |
|------|----|---------|-------------------|
| Any later status | Draft | `sendBack()` | Validation results, readiness score, snapshots |
| Any later status | Dev-Refining | `sendBack()` | Code and API snapshots |
| Forged, Executing | Review | `sendBack()` | — |
| Complete | Draft | `revertToDraft()` | Tech spec is cleared |

> :blue_book: The `sendBack()` method only allows moving backward in the lifecycle. You cannot send a Draft ticket to Review.

## CLI Commands by Status

Which CLI commands work at each status:

| Command | Draft | Dev-Refining | Review | Forged | Executing | Complete |
|---------|-------|-------------|--------|--------|-----------|---------|
| `forge show <id>` | Yes | Yes | Yes | Yes | Yes | Yes |
| `forge review <id>` | — | Yes | — | — | — | — |
| `forge develop <id>` | — | — | — | Yes | — | — |
| `forge execute <id>` | — | — | — | Yes | Yes | — |

## Drift Detection

When a ticket is in **Forged** or **Executing** status, Forge monitors for drift — changes in the codebase that may make the spec stale.

Drift is tracked as properties on the AEC, not as a separate status:

| Property | Description |
|----------|-------------|
| `driftDetectedAt` | Timestamp when drift was detected |
| `driftReason` | Human-readable explanation of what changed |

When drift is detected, the PM can choose to:
1. **Ignore it** — The change doesn't affect the spec
2. **Send back** — Return the ticket to Dev-Refining for re-review
3. **Re-bake** — Regenerate the spec with updated context

## Lifecycle Diagram (Detailed)

```
PM creates ticket
       │
       ▼
    ┌──────┐    AI asks questions     ┌──────────────┐
    │ DRAFT│───────────────────────►  │ PM answers   │
    └──┬───┘                          │ questions    │
       │                              └──────┬───────┘
       │    Tech spec generated              │
       │◄────────────────────────────────────┘
       │
       │    PM assigns to developer
       ▼
┌──────────────┐    Developer reviews    ┌────────────┐
│ DEV-REFINING │◄───────────────────────►│ CLI review │
└──────┬───────┘    with code context    │ session    │
       │                                 └──────┬─────┘
       │    Q&A submitted                       │
       │◄───────────────────────────────────────┘
       ▼
    ┌────────┐    PM reviews Q&A    ┌──────────┐
    │ REVIEW │◄────────────────────►│ Re-bake  │
    └───┬────┘                      │ (optional)│
        │                           └──────────┘
        │    PM approves
        ▼
    ┌────────┐
    │ FORGED │    AEC is locked
    └───┬────┘    Score ≥ 75
        │
        │    Developer runs forge develop
        ▼
  ┌──────────────┐    Forgy asks questions    ┌────────────┐
  │  Dev Prep    │◄──────────────────────────►│ Q&A session│
  └──────┬───────┘                            └──────┬─────┘
         │    Branch created automatically           │
         │◄──────────────────────────────────────────┘
         ▼
  ┌───────────┐
  │ EXECUTING │    Developer implements
  └─────┬─────┘
        │
        │    Work complete
        ▼
   ┌──────────┐
   │ COMPLETE │
   └──────────┘
```

## Assignment

Tickets can be assigned to a developer at any status except **Complete**:

- PM assigns via the web app
- CLI commands like `forge execute` can auto-assign the current user
- A completed ticket must be reverted to Draft before reassignment
