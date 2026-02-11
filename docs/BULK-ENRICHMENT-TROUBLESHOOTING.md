# Bulk Enrichment - Troubleshooting Guide

## Connection Error: "Connection error. Check your internet connection."

This error occurs when the SSE stream connection fails. Here are common causes and solutions:

### 1. **Authentication Not Provided**
**Problem:** The `WorkspaceGuard` requires Firebase authentication but no auth token is sent.

**Solution:**
- Ensure you're logged in to the application
- Check that the `Authorization: Bearer <token>` header is being sent
- The `BulkEnrichmentService` should automatically use the current Firebase user

**Code Check:**
```typescript
// In bulk-enrichment.service.ts
const token = await auth.currentUser?.getIdToken();
// Make sure this is sending the token in fetch headers
```

### 2. **Invalid Ticket IDs**
**Problem:** The ticket IDs being enriched don't exist in the database.

**Solution:**
- Verify ticket IDs are real and belong to your workspace
- Check the `tickets` collection in Firestore
- Ensure tickets are in "draft" status (not "complete")

**How to Check:**
```bash
# Query Firestore for your workspace
firebase firestore:query workspaces/{workspaceId}/tickets --limit=10
```

### 3. **Workspace Verification Failed**
**Problem:** The tickets belong to a different workspace than the one you're authenticated to.

**Solution:**
- Verify all tickets belong to the same workspace as your current workspace
- Check `ticket.workspaceId` matches your `workspace.id`

### 4. **Validation Error in Request**
**Problem:** The `BulkEnrichDto` validation is failing (e.g., too many tickets, invalid branch name).

**Solution:**
- Verify ticketIds array has 1-100 items (not 0, not 101+)
- Verify branch name only contains: alphanumeric, /, -, _, .
- Verify repositoryOwner and repositoryName are non-empty

**Valid Example:**
```json
{
  "ticketIds": ["ticket-1", "ticket-2"],
  "repositoryOwner": "myorg",
  "repositoryName": "my-repo",
  "branch": "main"
}
```

**Invalid Examples:**
```json
// Too many tickets (max 100)
{ "ticketIds": Array(101).fill("ticket-1") }

// Invalid branch name (contains @ character)
{ "branch": "feature@auth" }

// Empty array
{ "ticketIds": [] }
```

### 5. **Backend Not Running**
**Problem:** The Node.js backend process is not running or crashed.

**Solution:**
```bash
# Check if backend is running
ps aux | grep "nest"

# Restart backend if needed
cd backend
npm run start:dev

# Check console for errors
```

### 6. **Frontend Not Sending Headers**
**Problem:** The fetch request is missing required headers.

**Solution:**
Verify `bulk-enrichment.service.ts` includes these headers:
```typescript
{
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`, // CRITICAL
  },
  body: JSON.stringify({ answers }),
}
```

---

## Debugging Steps

### Step 1: Check Backend Console
Look for these error patterns:
```
❌ Workspace verification failed
❌ Ticket not found
❌ Validation error
❌ Authentication failed
```

### Step 2: Verify Frontend Configuration
```typescript
// client/src/services/bulk-enrichment.service.ts
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
console.log('API URL:', apiUrl); // Should be http://localhost:3000

// Make sure auth token is included
const token = await auth.currentUser?.getIdToken();
console.log('Token available:', !!token);
```

### Step 3: Test Endpoint with curl
```bash
# Get your Firebase token first
FIREBASE_TOKEN=$(firebase auth:export tokens.json | grep "custom token" | awk '{print $NF}')

# Test the endpoint
curl -X POST http://localhost:3000/api/tickets/bulk/enrich \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${FIREBASE_TOKEN}" \
  -d '{
    "ticketIds": ["real-ticket-id"],
    "repositoryOwner": "owner",
    "repositoryName": "repo",
    "branch": "main"
  }'
```

### Step 4: Check Firestore Data
```bash
# Verify tickets exist and are in draft status
firebase firestore:query "workspaces/{workspaceId}/tickets" \
  --where="status==draft" \
  --limit=5
```

---

## Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot enrich more than 100 tickets` | Too many tickets in request | Reduce ticketIds array to ≤100 items |
| `Ticket "..." does not belong to your workspace` | Workspace mismatch | Verify ticket.workspaceId matches current workspace |
| `Ticket "..." not found` | Invalid ticket ID | Check ticket exists in Firestore |
| `Ticket "..." is not in draft state` | Wrong ticket status | Only draft tickets can be enriched |
| `branch must contain only alphanumeric...` | Invalid branch name | Use only: a-z, 0-9, /, -, _, . |
| `At least one ticket ID is required` | Empty array | Provide at least 1 ticketId |
| `Connection error` | SSE stream failed | Check backend logs for root cause |

---

## Quick Checklist

- [ ] Backend is running (`npm run start:dev`)
- [ ] Frontend has `NEXT_PUBLIC_API_URL` set correctly
- [ ] You are logged in (Firebase auth token available)
- [ ] Tickets exist in Firestore and are in "draft" status
- [ ] Tickets belong to your current workspace
- [ ] TicketIds array has 1-100 items
- [ ] Repository owner/name are valid
- [ ] Branch name contains only valid characters

---

## Still Having Issues?

1. **Check backend logs** - Look for specific error messages
2. **Verify Firestore data** - Make sure tickets exist
3. **Test authentication** - Verify you're properly logged in
4. **Test with curl** - Use curl with auth headers to isolate frontend issues
5. **Check network tab** - Look at the actual HTTP response in DevTools

