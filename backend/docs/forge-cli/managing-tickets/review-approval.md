---
title: "Review & Approval"
excerpt: "How PMs and developers agree on what 'done' means before code is written."
category: "Managing Tickets"
---


The review and approval flow is where the spec becomes a contract. Both PM and developer agree on what "done" means — before any code is written.

## How It Works

1. **Developer reviews** the ticket using the Forge CLI
2. **PM reads** the developer's feedback and questions
3. **PM re-bakes** the spec to incorporate the developer's input (optional, repeatable)
4. **PM approves** — the ticket is forged and locked

## Developer Review

When a developer reviews a ticket (via `forge review` in the CLI), the ticket moves to **Review** status. Their Q&A appears in the ticket detail view — questions the AI asked, and the developer's answers with technical context.

This is where real-world expertise gets added: which patterns to follow, edge cases to handle, existing code to reuse.

## Re-baking the Spec

After reading the developer's input, click **Re-bake** to regenerate the spec. Forge updates the acceptance criteria, file changes, and API contracts based on what the developer shared.

You can re-bake as many times as needed until the spec feels right.

## Approving

When the spec is ready, click **Approve**. The ticket transitions to **Forged** — the AEC is locked and verified. The developer (or an AI agent) can now execute against a clear, agreed-upon contract.

## Assigning Tickets

Assign a developer from the ticket detail view using the assignee dropdown. They'll be able to access the ticket via the CLI. You can reassign or unassign at any time before the ticket is completed.
