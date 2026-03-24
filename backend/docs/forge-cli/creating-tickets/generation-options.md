---
title: "Generation Options"
excerpt: "AI-generated wireframes and API specs — choose what Forge produces for each ticket."
category: "Creating Tickets"
---


During ticket creation, you can choose to have Forge generate additional outputs alongside the spec.

## What You Can Generate

| Option | What you get |
|--------|-------------|
| **Wireframes** | An interactive HTML wireframe previewing the proposed UI |
| **API Spec** | Endpoint definitions with request and response formats |

## Defaults by Ticket Type

| Ticket Type | Wireframes | API Spec |
|-------------|------------|----------|
| **Feature** | On | On |
| **Bug** | Off | Off |
| **Task** | Off | Off |

You can toggle these freely for any ticket.

## HTML Wireframes

When enabled, Forge generates a full interactive wireframe showing what the UI could look like — based on your ticket description and the connected codebase.

### Example

Here's a real wireframe Forge generated from a ticket for "Add tag filtering to the ticket grid":

![Hi-res Wireframe Example](/assets/2026-03-23-ticket-tags-wireframes.html)

### Key Details

- When a repository is connected, the wireframe uses your project's actual colors and fonts
- Click the wireframe to open it in a large preview for detailed inspection
- Not quite right? Click **Regenerate** and add instructions to guide the next version

The wireframe appears in the **Design** tab of your ticket, alongside any Figma or Loom links you've attached.

## API Specification

When enabled, Forge generates endpoint definitions including methods, paths, request/response formats, and error codes. These appear in the **Technical** tab of your ticket.
