---
name: architecture-quick-check
description: Fast architecture validation for Clean Architecture and DDD patterns
version: 1.0.0
tags: [architecture, validation, quick-check, clean-architecture, ddd]
performance: fast-only
---

# Architecture Quick Check

**CRITICAL: This is a FAST validator for pattern verification, not deep architectural analysis.**

**Performance Constraints:**
- Maximum 3 commands per validation
- Each command must complete in 1-3 seconds
- Pattern matching only - no deep exploration
- Skip if ticket doesn't mention architecture patterns

**When to activate:**
- Ticket mentions: "layer", "module", "clean architecture", "DDD", "boundary", "domain", "infrastructure"
- AC specifies: architectural patterns, layer structure, module organization
- Ticket type: Feature requiring new architectural components

**Quick checks to run:**

1. **Verify layer structure** (if AC mentions layered architecture):
   ```bash
   find src -type d -name "domain"
   find src -type d -name "application"
   find src -type d -name "infrastructure"
   ```
   ✅ Domain layer exists → skip, no finding
   ❌ Missing layer → create finding
   
   Example finding:
   ```
   category: architectural-mismatch
   severity: medium
   description: "AC requires domain layer but src/domain/ directory not found"
   suggestion: "Create domain layer: mkdir -p src/tickets/domain"
   evidence: "$ find src -type d -name 'domain'\n(no matches)"
   ```

2. **Check boundary violations** (if AC mentions Clean Architecture):
   ```bash
   grep -r "import.*infrastructure" src/domain/ --include="*.ts"
   ```
   ✅ No imports found → skip, no finding
   ❌ Infrastructure imports in domain → create finding
   
   Example finding:
   ```
   category: architectural-mismatch
   severity: high
   description: "Domain layer imports infrastructure in src/domain/User.ts:5"
   suggestion: "Remove infrastructure import - domain must not depend on infrastructure. Use dependency inversion."
   evidence: "import { FirestoreRepository } from '../infrastructure/FirestoreRepository'"
   codeLocation: "src/domain/User.ts:5"
   ```

3. **Verify module structure** (if AC mentions NestJS/module organization):
   ```bash
   find . -name "*.module.ts" -path "*/src/*"
   ```
   ✅ Module files found → skip, no finding
   ❌ No modules found → create finding
   
   Example finding:
   ```
   category: gap
   severity: medium
   description: "AC requires NestJS module structure but no *.module.ts files found"
   suggestion: "Create module file: src/tickets/tickets.module.ts"
   evidence: "$ find . -name '*.module.ts'\n(no matches)"
   ```

**Alternative check for module patterns:**
```bash
grep -r "@Module" src/ --include="*.ts" | head -5
```

**STOP after 3 checks or first blocker found.**

**Output Format:**

Return array of findings (empty if all checks pass):
```typescript
[
  {
    category: 'architectural-mismatch' | 'gap',
    severity: 'critical' | 'high' | 'medium',
    description: string,
    codeLocation?: string,
    suggestion: string,
    confidence: 0.85,
    evidence?: string
  }
]
```

**References:**
- Clean Architecture: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- DDD Patterns: https://martinfowler.com/bliki/DomainDrivenDesign.html
- NestJS Architecture: https://docs.nestjs.com/fundamentals/custom-providers
