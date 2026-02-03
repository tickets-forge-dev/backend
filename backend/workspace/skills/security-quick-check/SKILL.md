---
name: security-quick-check
description: Fast security validation for ticket assumptions (seconds, not minutes)
version: 1.0.0
tags: [security, validation, quick-check]
performance: fast-only
---

# Security Quick Check

**CRITICAL: This is a FAST validator, not a comprehensive security audit.**

**Performance Constraints:**
- Maximum 3 commands per validation
- Each command must complete in 1-3 seconds
- Only check assumptions mentioned in ticket AC
- Skip if ticket has no security-related AC

**When to activate:**
- Ticket mentions: "security", "auth", "helmet", "cors", "secrets"
- AC include: security headers, authentication, authorization
- Ticket type: Feature or Bug with security implications

**Quick checks to run:**

1. **Missing security packages** (if AC mentions them):
   ```bash
   npm list helmet cors express-rate-limit
   ```
   ✅ Package exists → skip, no finding
   ❌ Package missing → create finding with suggestion
   
   Example finding:
   ```
   category: missing-dependency
   severity: high
   description: "helmet package not installed but required by AC for security headers"
   suggestion: "Install helmet package: pnpm add helmet"
   evidence: "$ npm list helmet\n└── (empty)"
   ```

2. **Hardcoded secrets** (if AC mentions auth/credentials):
   ```bash
   grep -r "process.env" --include="*.ts" src/
   ```
   ✅ Uses env vars → skip, no finding
   ❌ Hardcoded found → create finding
   
   Alternative check for hardcoded values:
   ```bash
   grep -rn "password\|secret\|api.?key" --include="*.ts" src/
   ```
   
   Example finding:
   ```
   category: security
   severity: critical
   description: "Hardcoded API key found in src/config/auth.ts:12"
   suggestion: "Move to environment variable: API_KEY=xxx in .env file"
   evidence: "const API_KEY = 'sk_live_abc123'"
   codeLocation: "src/config/auth.ts:12"
   ```

3. **Auth patterns** (if AC mentions authentication):
   ```bash
   grep -r "passport\|jwt\|auth" src/main.ts src/app.module.ts
   ```
   ✅ Auth setup found → skip, no finding
   ❌ No auth found → create finding
   
   Example finding:
   ```
   category: gap
   severity: high
   description: "AC requires JWT authentication but no auth setup found in main.ts"
   suggestion: "Add JWT authentication middleware in src/main.ts"
   evidence: "$ grep 'jwt\|auth' src/main.ts\n(no matches)"
   ```

**STOP after 3 checks or first blocker found.**

**Output Format:**

Return array of findings (empty if all checks pass):
```typescript
[
  {
    category: 'missing-dependency' | 'security' | 'gap',
    severity: 'critical' | 'high' | 'medium',
    description: string,
    codeLocation?: string,
    suggestion: string,
    confidence: 0.9,
    evidence?: string
  }
]
```

**References:**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Security Headers: https://securityheaders.com/
- Node.js Security Best Practices: https://nodejs.org/en/docs/guides/security/
