# Database Query Patterns

## Firestore Composite Index

```typescript
// Query that needs a composite index:
firestore.collection('tickets')
  .where('teamId', '==', teamId)
  .where('status', '==', 'approved')
  .orderBy('createdAt', 'desc')
  .limit(20);

// Create index in firestore.indexes.json:
// { collectionGroup: "tickets", fields: [
//   { fieldPath: "teamId", order: "ASCENDING" },
//   { fieldPath: "status", order: "ASCENDING" },
//   { fieldPath: "createdAt", order: "DESCENDING" }
// ]}
```

## Batch Reads (Prevent N+1)

```typescript
// BAD
for (const id of userIds) {
  const user = await firestore.collection('users').doc(id).get();
}

// GOOD
const refs = userIds.map(id => firestore.collection('users').doc(id));
const snapshots = await firestore.getAll(...refs);
```

## Pagination

```typescript
// Cursor-based (Firestore)
const query = firestore.collection('items')
  .orderBy('createdAt', 'desc')
  .startAfter(lastDoc)
  .limit(20);
```

## Select Only Needed Fields

```typescript
// Firestore — use select() to limit fields
const snapshot = await firestore.collection('users')
  .select('name', 'email')
  .get();
```
