# REST API Patterns

## URL Structure

```
GET    /users              → list users
POST   /users              → create user
GET    /users/:id          → get user
PATCH  /users/:id          → update user
DELETE /users/:id          → delete user
GET    /users/:id/posts    → list user's posts
```

## Status Codes

| Code | When |
|------|------|
| 200 | Success (GET, PATCH) |
| 201 | Created (POST) |
| 204 | No content (DELETE) |
| 400 | Bad request (validation failed) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (authenticated but not allowed) |
| 404 | Not found |
| 409 | Conflict (duplicate, state violation) |
| 422 | Unprocessable entity (semantic validation) |
| 500 | Server error (never intentional) |

## Response Shape

```json
// Success
{ "data": { ... }, "meta": { "page": 1, "total": 42 } }

// Error
{ "statusCode": 400, "message": "Email is required", "error": "Bad Request" }
```

## Pagination

```
GET /users?page=1&limit=20
GET /users?cursor=abc123&limit=20
```
