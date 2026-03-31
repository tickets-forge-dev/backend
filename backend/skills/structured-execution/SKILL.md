---
name: structured-execution
description: Follow the ticket specification step by step. Read the full spec, execute methodically, verify each step.
---

# Structured Execution

Load the ticket spec, review it critically, execute all tasks methodically.

## The Process

### Step 1: Load and Review

1. Read the full ticket specification (call get_ticket_context)
2. Read the repository context (call get_repository_context)
3. Read CLAUDE.md if it exists in the repo root
4. Review critically — identify any ambiguities or concerns
5. If concerns: log them via record_execution_event before proceeding

### Step 2: Plan Before Coding

Before writing any code:
1. List the files you'll create or modify
2. Identify the order of operations
3. Note any dependencies between changes
4. Plan your test strategy

### Step 3: Execute Tasks

For each change:
1. Write the test first (if applicable)
2. Run it to verify it fails
3. Implement the minimal code to pass
4. Run tests to verify they pass
5. Commit with a clear message

### Step 4: Verify Completion

After all changes:
1. Run the full test suite
2. Check that all acceptance criteria are met
3. Review your own diff — is everything intentional?
4. Log any decisions or deviations via record_execution_event
5. Submit settlement via submit_settlement

## When to Stop and Log

**Log decisions immediately when:**
- You chose approach A over approach B
- You deviated from the spec (and why)
- You discovered a risk or concern
- You made an assumption

**Stop and re-read the spec when:**
- You're unsure what a requirement means
- You've been coding for a while without checking
- Your implementation feels larger than expected

## Rules

- Follow the spec exactly — don't add features that weren't asked for
- Don't skip verifications
- Log every significant decision
- Stop when blocked — don't guess
- Small, focused commits — one logical change per commit
