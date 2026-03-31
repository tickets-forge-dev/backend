# Commit Conventions

## Format

```
<type>(<scope>): <subject>

<body>
```

## Types

| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `chore` | Build process, dependencies, tooling |

## Rules

- Subject line: imperative mood, lowercase, no period, max 72 chars
- Body: explain WHY, not what (the diff shows what)
- One commit = one logical change
- Tests and implementation in the same commit (not separate)
