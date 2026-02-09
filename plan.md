# Implementation Plan: Fix Hardcoded Production Issues

## Problem Statement
The codebase contains hardcoded URLs (e.g., `http://localhost:3000`) and potential secret exposures that will break the application in production environments (Vercel/Render). These need to be replaced with environment-aware configurations.

## Analysis Findings
1. **Client Services:** `TicketService`, `AuthService`, `QuestionRoundService`, `GitHubService` all default to `http://localhost:3000/api` if `NEXT_PUBLIC_API_URL` is missing. This is generally safe for local dev but relies on correct env vars in prod.
2. **Backend CORS:** `backend/src/main.ts` explicitly lists `http://localhost:3000` and `http://localhost:3001` but also correctly uses `process.env.FRONTEND_URL`.
3. **cURL Generators:** Both client and backend `curl-generator.ts` files have been fixed to use env vars.
4. **Documentation:** `SETUP.md` and `EPIC-DEPLOYMENT.md` contain instructions with localhost URLs (expected for docs).
5. **Testing:** `test-scenarios.sh` and other shell scripts use localhost (expected for local testing).

## Workplan

### 1. Client-Side Fixes
- [ ] **Review `client/src/services/*.ts`**: Verify all services (`TicketService`, `AuthService`, `GitHubService`, `QuestionRoundService`) use `NEXT_PUBLIC_API_URL`.
- [ ] **Fix `AuthService.initializeWorkspace`**: It currently has a fallback `|| 'http://localhost:3000/api'`. Ensure this doesn't mask missing env var issues in prod.

### 2. Backend Fixes
- [ ] **Review `backend/src/main.ts`**: Ensure CORS origin handling is robust.
- [ ] **Add Runtime Validation**: In `backend/src/main.ts`, throw a hard error on startup if `NODE_ENV === 'production'` and critical env vars (`FRONTEND_URL`, `API_URL`, `SESSION_SECRET`) are missing. This prevents "silent failures".

### 3. Cleanup
- [ ] **Remove `console.log`**: Remove verbose logging in `TicketService` (e.g., `console.log('🎫 [TicketService] API URL:', ...)`).

## Notes
- `curl-generator` fixes are already applied.
- Shell scripts for local testing (`test-scenarios.sh`) should remain pointing to localhost.
