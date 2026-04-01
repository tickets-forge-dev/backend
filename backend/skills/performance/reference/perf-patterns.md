# Performance Patterns

## N+1 Query Prevention

```typescript
// BAD — N+1
const users = await repo.findAll();
for (const user of users) {
  user.posts = await postRepo.findByUserId(user.id); // N queries
}

// GOOD — batch
const users = await repo.findAllWithPosts(); // 1 query with JOIN
```

## Pagination

```typescript
// BAD — unbounded
return repo.findAll();

// GOOD — paginated
return repo.findAll({ skip: offset, take: limit });
```

## React Re-render Prevention

```typescript
// BAD — new object every render
<Child style={{ color: 'red' }} />

// GOOD — stable reference
const style = useMemo(() => ({ color: 'red' }), []);
<Child style={style} />
```

## Debounce

```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => search(query), 300),
  [search]
);
```
