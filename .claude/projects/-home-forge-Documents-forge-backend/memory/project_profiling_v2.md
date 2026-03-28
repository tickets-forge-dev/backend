---
name: Profiling v2 asset upload UX rule
description: Technical asset uploads in questions should not block PMs/QA — flag as "needed from developer" in the AEC instead of mandatory
type: feedback
---

When the question generator detects that a feature needs a technical asset (JSON config, API spec, CSV sample, etc.), do NOT make it mandatory for the ticket creator. PMs and QA typically don't have these assets — the developer does.

**Why:** PMs create tickets, developers execute them. Blocking ticket creation on a technical artifact the PM doesn't have creates friction and defeats the purpose of the workflow.

**How to apply:** Questions about technical assets should offer "Upload now" OR "Mark as needed for developer". The AEC gets a `requiredAssets` section that the developer sees when they pick up the ticket. Non-technical assets (screenshots, design mockups) can still be requested normally since PMs/QA typically have those.
