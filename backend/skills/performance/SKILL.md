---
name: performance
description: Optimize for speed — efficient queries, lazy loading, minimal bundle size
---

# Performance

Write code that's fast by default. Avoid common performance pitfalls.

## Before Writing Code

If this is a frontend project, check the bundle:
```bash
bash scripts/analyze-bundle.sh
```

Review `reference/perf-patterns.md` for optimization patterns.

## Rules

1. **No N+1 queries** — batch database calls, use joins or includes
2. **Paginate large datasets** — never return unbounded arrays
3. **Index database queries** — every WHERE/filter clause needs an index
4. **Lazy load heavy modules** — dynamic imports for large dependencies
5. **Debounce user input** — search, autocomplete, resize handlers
6. **Cache repeated computations** — useMemo, memoize, Redis where appropriate
7. **Minimize re-renders** — React.memo for pure components, stable references
8. **No synchronous blocking** — use async/await, never block the event loop

## During Implementation

Ask for each function:
- What's the time complexity? Can it be O(n) instead of O(n^2)?
- Does this trigger a database query in a loop?
- Will this re-render unnecessary components?
