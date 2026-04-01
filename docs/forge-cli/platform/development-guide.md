# Development Guide

## Two Ways to Work

Forge supports two development workflows. Choose the one that fits your task.

### Quick Flow

Best for bug fixes, small features, and when you know exactly what you want.

```
Develop → Review → Done
```

1. Open the ticket
2. Click **Develop** in the top bar
3. Optionally configure skills
4. Click **Start Development**
5. The AI agent implements, tests, and opens a pull request
6. Review the PR and merge

**When to use:** You have a clear idea of what needs to be built. The ticket has enough context for the agent to work autonomously. No team alignment needed before coding starts.

### Full Flow

Best for complex features where your team needs to align before code is written.

```
Review Spec → Assign Reviewer → Refine → Approve → Develop → Done
```

1. Create the ticket — Forge generates a technical specification
2. Assign a reviewer to refine the spec with code context
3. The reviewer submits changes, PM reviews and approves
4. Click **Develop** to start AI implementation
5. The agent follows the refined spec to build, test, and open a PR
6. Review the PR and merge

**When to use:** The feature is large, cross-functional, or the team needs to agree on the approach before any code is written.

### Switching Between Flows

You can switch from full flow to quick flow at any time. If you've started the spec review but decide to just develop, click **Develop** — the agent will use whatever spec enrichment already exists. No work is lost.

## The Ticket Lifecycle

Every ticket has a lifecycle bar at the top showing where it is:

```
Define · Dev Review · PM Review · Ready · Executing · Done
```

| Stage | What Happens |
|-------|-------------|
| **Define** | Ticket is created. Forge generates the technical specification, acceptance criteria, and file changes. |
| **Dev Review** | A reviewer (developer, tech lead, QA) refines the spec using code context. Optional — skip if not needed. |
| **PM Review** | PM reviews the reviewer's changes before approving. Only appears when a reviewer submits changes. |
| **Ready** | The spec is approved and ready for development. |
| **Executing** | The AI agent is implementing the ticket in a cloud sandbox. |
| **Done** | Implementation complete. A pull request has been created. |

In quick flow, you skip straight from Define to Executing.

## Starting Development

Click the **Develop** button in the top-right corner of any ticket. This opens the development panel.

### Skills

Skills are specialized instructions that guide the AI agent during development. They're optional — the agent works without them — but they improve output quality for specific concerns.

**Auto mode (default):** Forge analyzes your ticket and automatically recommends up to 3 skills. Recommended skills are highlighted with a "REC" badge and a brief explanation of why they were chosen. Non-recommended skills are dimmed.

**Manual mode:** Switch to manual if you want to pick skills yourself. Toggle up to 3 skills on or off. The rest are disabled when the limit is reached.

Available skills:

| Skill | What it does |
|-------|-------------|
| **Clean Architecture** | Keeps code organized into clear layers — business logic stays separated from databases and APIs |
| **Test-Driven Development** | Writes automated tests first, then implements the feature to pass them |
| **Security Audit** | Checks for common vulnerabilities like injection attacks, broken auth, and data exposure |
| **Code Review Ready** | Produces clean commits and readable code that reviewers can approve quickly |
| **Performance** | Focuses on fast queries, efficient loading, and minimal resource usage |
| **Accessibility** | Ensures the interface works for everyone — keyboard navigation, screen readers, contrast |
| **API Design** | Follows RESTful conventions with proper status codes and input validation |
| **Error Handling** | Implements typed errors, graceful failures, and retry patterns |
| **Documentation** | Adds JSDoc comments, updates READMEs, and documents decisions |
| **Database Optimization** | Prevents slow queries, N+1 problems, and missing indexes |

Skills are loaded as plugins into the AI agent's environment. Each skill includes executable scripts (not just instructions) so the agent can run boundary checks, linting, test detection, and other verifications automatically.

### Starting the Session

Click **Start Development**. The agent:

1. Creates a cloud sandbox with your repository
2. Reads the full ticket specification
3. Loads the selected skills
4. Implements the changes, writes tests, and runs them
5. Commits, pushes, and creates a pull request
6. Reports a summary with the PR link

You can watch the agent work in real time — the development panel streams every action, file change, and decision.

## After Development

### Reviewing the Output

When the session completes, you'll see:
- A summary of what was built
- A link to the branch and pull request
- The number of files changed and session duration

### Requesting Changes

After development completes, an input field appears below the summary. Type a follow-up request to iterate:

> "Add retry logic to the webhook sender"

This starts a new session on the same branch. The agent sees all the code from the previous session and applies your change on top. You can keep iterating — each follow-up builds on the last.

### Change Records

Every completed development session creates a change record documenting:
- What was implemented
- Architectural decisions made during development
- Any deviations from the original specification
- Files changed with line counts

Change records are visible in the **Record** tab of the ticket.

## Connected Services

### Repository

Connect a GitHub repository in the ticket header. The AI agent clones this repository into the sandbox and creates a feature branch for its changes.

### Library Documentation

Every development session has access to up-to-date library documentation via Context7. When the agent uses external libraries or frameworks, it automatically fetches current API docs rather than relying on training data. This is always active — no configuration needed.
