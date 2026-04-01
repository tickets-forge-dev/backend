---
name: database-optimization
description: Efficient queries, proper indexing, N+1 prevention, connection management
---

# Database Optimization

Every database interaction must be efficient. Slow queries are bugs.

## Before Writing Code

Scan for query patterns:
```bash
bash scripts/explain-queries.sh --scan
```

Review `reference/query-patterns.md` for optimization techniques.

## Rules

1. **Index every filter/sort field** — if you query by it, index it
2. **No N+1 queries** — batch or join, never loop
3. **Select only needed fields** — no `SELECT *` or fetching full documents when you need one field
4. **Paginate all list queries** — never return unbounded results
5. **Use transactions for multi-write operations** — consistency matters
6. **Connection pooling** — reuse connections, don't open per-request
7. **Avoid full collection scans** — compound indexes for multi-field filters
8. **Write efficient Firestore queries** — use composite indexes, limit subcollection depth

## During Implementation

For every new query:
- Does it hit an index?
- Is it inside a loop? (N+1 risk)
- What happens with 10,000 records? 100,000?

## After Implementation

```bash
bash scripts/explain-queries.sh
```
