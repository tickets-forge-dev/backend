---
title: "Security Model"
excerpt: "How Forge protects your data and defends against prompt injection."
---

## How Forge handles AI securely

Forge processes user-provided text through AI models to generate structured execution contracts (AECs). The AI model has **no execution capabilities** — it cannot run code, access files, or make network requests. It receives text and returns validated JSON.

---

## Threat model

The primary attack surface is **prompt injection** — a user embedding malicious instructions inside ticket content that the AI model might interpret as commands rather than data.

### What an attacker CAN try

- Embed instructions in ticket fields (e.g., "ignore previous instructions and...")
- Attempt to corrupt the generated AEC content
- Try to extract system prompt details through crafted inputs

### What an attacker CANNOT do

- **Execute code.** The AI model has no shell access, no filesystem access, and no tools. It receives text and returns text.
- **Access other users' data.** All requests are scoped to authenticated workspaces with Firebase token verification.
- **Bypass output validation.** Every AI-generated response passes through schema validation and a multi-validator scoring pipeline before storage.

---

## Defense layers

### 1. No execution surface

This is the most important security property. The AI model operates in **text-in, JSON-out** mode:

- No function calling or tool use during AEC generation
- No access to databases, filesystems, or external services
- No ability to make network requests

Even if prompt injection influences the model's output, the blast radius is limited to the content of a single ticket. No system-level actions can be triggered.

### 2. Input boundary isolation

User-provided content is wrapped in explicit delimiters before being included in any AI prompt. The system prompt instructs the model to treat everything inside these boundaries as **untrusted data — never as instructions**.

### 3. Input validation

All API inputs pass through strict validation:

- **Whitelist mode** — unknown properties are stripped automatically
- **Reject unexpected fields** — requests with extra fields are blocked
- **Type enforcement** — string lengths, regex patterns, and enum values are enforced at the HTTP boundary

### 4. Output schema enforcement

AI responses must conform to a strict JSON schema. Responses that deviate from the expected structure are rejected entirely. This prevents free-form text responses, schema pollution, and malformed outputs.

### 5. 7-validator output pipeline

Every generated AEC is scored by 7 independent validators before being stored:

| Validator | What it checks |
|-----------|---------------|
| **Clarity** | Language is unambiguous, no vague terms |
| **Completeness** | All required sections are present and filled |
| **Consistency** | No internal contradictions |
| **Context Alignment** | Content aligns with provided codebase context |
| **Feasibility** | Technical approach is realistic |
| **Scope** | Work is reasonably scoped |
| **Testability** | Acceptance criteria are verifiable |

AECs with critical failures are not stored. This catches corrupted or nonsensical output regardless of the cause.

### 6. Authentication and authorization

- **Firebase Auth** — all API requests require a valid Firebase ID token
- **Workspace scoping** — every data operation is isolated to the user's team
- **Secure sessions** — httpOnly, secure, sameSite cookies

### 7. Rate limiting

AI generation endpoints are rate-limited per IP address to prevent abuse.

### 8. Infrastructure

- **Strict CORS** — origin whitelist, no wildcards
- **HTTPS enforced** in production
- **Log redaction** — passwords, tokens, and API keys are automatically stripped from logs
- **File upload restrictions** — MIME type whitelist, 5MB size limit, sanitized filenames

---

## Summary

Forge's security is built on one core principle: **the AI has no execution capabilities**. It receives text, returns structured JSON, and that output is validated by 7 independent checks before it reaches the database. User input is boundary-isolated so the model distinguishes instructions from data. In a worst-case prompt injection scenario, the impact is limited to a single ticket's content — and that content still has to pass every validator before being accepted.
