---
name: security-audit
description: Check for OWASP vulnerabilities, secrets exposure, and auth issues as you code
---

# Security Audit

Scan for security vulnerabilities during implementation. Every code change is checked against OWASP Top 10.

## Before Writing Code

Scan for existing secrets and vulnerabilities:
```bash
bash scripts/scan-secrets.sh
```

Review `reference/owasp-checklist.md` for the full checklist.

## Rules

1. **No hardcoded secrets** — API keys, passwords, tokens must come from environment variables
2. **Validate all input** — user input, query params, request bodies, headers
3. **Parameterize queries** — never concatenate user input into SQL/NoSQL queries
4. **Escape output** — prevent XSS in any rendered HTML
5. **Auth on every endpoint** — no unprotected routes unless explicitly public
6. **Least privilege** — request minimum permissions, scope tokens narrowly
7. **No sensitive data in logs** — mask tokens, passwords, PII before logging
8. **HTTPS only** — no HTTP URLs for API calls or redirects

## During Implementation

For every new endpoint or data handler, ask:
- Can an attacker inject malicious input here?
- Is authentication verified?
- Is authorization checked (right user, right role)?
- Are errors leaking internal details?

## After Implementation

Run the secrets scan again:
```bash
bash scripts/scan-secrets.sh
```
