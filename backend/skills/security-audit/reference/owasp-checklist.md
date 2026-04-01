# OWASP Top 10 Checklist

## A01 — Broken Access Control
- [ ] Every endpoint has authentication
- [ ] Authorization checks role/ownership, not just auth
- [ ] No IDOR (Insecure Direct Object References) — users can't access others' data by changing IDs

## A02 — Cryptographic Failures
- [ ] Passwords hashed with bcrypt/argon2 (never MD5/SHA1)
- [ ] Sensitive data encrypted at rest
- [ ] TLS for all data in transit

## A03 — Injection
- [ ] SQL queries parameterized (never string concatenation)
- [ ] NoSQL queries use typed parameters
- [ ] OS commands never include user input
- [ ] HTML output escaped (XSS prevention)

## A04 — Insecure Design
- [ ] Rate limiting on auth endpoints
- [ ] Account lockout after failed attempts
- [ ] Input length limits enforced

## A05 — Security Misconfiguration
- [ ] No default credentials
- [ ] Error messages don't leak stack traces or internals
- [ ] CORS configured restrictively
- [ ] Security headers set (CSP, X-Frame-Options, etc.)

## A07 — Authentication Failures
- [ ] JWT tokens have expiration
- [ ] Refresh tokens rotated on use
- [ ] Session invalidated on logout

## A08 — Data Integrity Failures
- [ ] Dependencies from trusted sources
- [ ] No dynamic code execution with user input
- [ ] CI/CD pipeline integrity verified
