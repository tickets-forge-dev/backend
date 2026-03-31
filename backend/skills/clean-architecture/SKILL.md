---
name: clean-architecture
description: Enforce clean architecture — domain isolation, layer boundaries, ports & adapters
---

# Clean Architecture

Enforce strict layer boundaries during implementation. Business logic must never depend on frameworks, databases, or external APIs directly.

## Rules

1. **Domain layer** is pure — no imports from infrastructure, presentation, or frameworks
2. **Use cases** are the only entry points for business operations
3. **Ports** (interfaces) defined in domain/application, **adapters** in infrastructure
4. **No cross-layer shortcuts** — controllers never call repositories directly
5. **Mappers** at every boundary — DTO to Domain, Domain to Persistence

## Before Writing Code

Run the boundary check script to understand the current architecture:
```bash
bash scripts/check-boundaries.sh
```

Review `reference/patterns.md` for port & adapter examples in this codebase's language.

## During Implementation

- Create interfaces (ports) before implementations (adapters)
- Domain entities must not import from NestJS, Express, Firebase, or any framework
- Each new file must belong to exactly one layer: `domain/`, `application/`, `infrastructure/`, or `presentation/`
- If you need something from another layer, define a port

## After Implementation

Run the boundary check again to verify no violations were introduced.
