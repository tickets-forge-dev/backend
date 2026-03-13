# Forge Security Model

Forge processes user-provided text through AI models to generate structured execution contracts (AECs). This document describes the security boundaries, threat model, and protections in place.

---

## Threat Model

The primary attack surface is **prompt injection** — a user embedding malicious instructions inside ticket content (title, description, answers) that the AI model interprets as commands rather than data.

### What an attacker CAN try

- Embed instructions in ticket fields (e.g., "ignore previous instructions and...")
- Attempt to corrupt the generated AEC content with misleading information
- Try to extract system prompt details through crafted inputs

### What an attacker CANNOT do

- **Execute code.** The AI model has no shell access, no filesystem access, and no tools. It receives text and returns text.
- **Access other users' data.** All requests are scoped to authenticated workspaces. Firebase token verification and workspace-level authorization enforce isolation.
- **Bypass output validation.** Every AI-generated response passes through schema validation and a multi-validator scoring pipeline before storage.

---

## Defense Layers

### 1. Input Boundary Isolation

User-provided content is wrapped in explicit delimiters before being included in any AI prompt:

```
<user-input>
{user's ticket description here}
</user-input>
```

The system prompt instructs the model to treat everything inside `<user-input>` as untrusted data — never as instructions. This is the primary defense against prompt injection.

### 2. Input Validation

All API inputs pass through NestJS `ValidationPipe` with strict settings:

- **Whitelist mode** — unknown properties are stripped automatically
- **forbidNonWhitelisted** — requests with unexpected fields are rejected
- **Type enforcement** — DTOs enforce string lengths, regex patterns, and enum values at the HTTP boundary

### 3. No Execution Surface

The AI model operates in a **read-only, text-in/text-out** mode:

- No function calling or tool use during AEC generation
- No access to databases, filesystems, or external services
- No ability to make network requests
- The model can only return structured JSON matching a predefined schema

This is the most important security property. Even if prompt injection succeeds in influencing the model's output, the blast radius is limited to the content of a single ticket. No system-level actions can be triggered.

### 4. Output Schema Enforcement

AI responses must conform to a strict JSON schema. Responses that deviate from the expected structure are rejected. This prevents:

- Free-form text responses that might contain injected instructions
- Schema pollution (extra fields, unexpected types)
- Partial or malformed outputs

### 5. Output Validation Pipeline

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

Validators produce a weighted score (0–100%). AECs with blockers (critical failures) are not stored. This catches corrupted or nonsensical output regardless of the cause.

### 6. Authentication & Authorization

- **Firebase Auth** — all API requests require a valid Firebase ID token
- **Workspace scoping** — every data operation is scoped to the user's team/workspace
- **Role-based access** — workspace guards prevent cross-team data access
- **Secure sessions** — httpOnly, secure, sameSite cookies with 15-minute expiry

### 7. Rate Limiting

API endpoints are rate-limited to 5 requests per 60 seconds per IP address. This prevents abuse of AI generation endpoints and brute-force attacks.

### 8. Infrastructure Security

- **CORS** — strict origin whitelist (only forge-ai.dev and localhost in dev)
- **HTTPS** — enforced in production
- **Sensitive data redaction** — passwords, tokens, and API keys are automatically redacted from logs
- **File upload restrictions** — MIME type whitelist (images + PDF only), 5MB limit, sanitized filenames
- **Environment validation** — OAuth redirect URIs must use HTTPS in production

---

## Summary

Forge's security model is built on one core principle: **the AI model has no execution capabilities**. It receives text, returns structured JSON, and that output is validated before it touches the database. User input is boundary-isolated so the model can distinguish instructions from data. Even in a worst-case prompt injection scenario, the impact is limited to a single ticket's content — and that content still has to pass 7 validators before being accepted.
