# Production Blockers - Comprehensive Audit

## CRITICAL (Security & Crashes)

### 1. ❌ Hardcoded Dev Secret in Session Configuration
**File:** `backend/src/main.ts:20`
**Severity:** CRITICAL
**Issue:** `process.env.SESSION_SECRET || 'dev-secret-change-in-production'`
- Sessions will use weak secret if env var missing
- **Fix:** Throw error on startup if SESSION_SECRET not set in production

### 2. ❌ Missing Firebase Config Validation
**File:** `client/src/lib/firebase.ts:6-13`
**Severity:** CRITICAL
**Issue:** No validation that Firebase config values exist before initialization
- Silent failure if any env var is missing
- App initialization fails without clear error
- **Fix:** Validate all 6 Firebase env vars before initializing Firebase

### 3. ❌ No Production Env Var Validation
**File:** `backend/src/main.ts` (startup)
**Severity:** HIGH
**Issue:** Missing validation for: `SESSION_SECRET`, `FRONTEND_URL`, `OLLAMA_BASE_URL`
- App starts even if critical vars missing
- **Fix:** Add startup validation throw on missing critical vars in production

### 4. ❌ Hardcoded Localhost Fallbacks (Client Services)
**Files:**
- `client/src/services/ticket.service.ts:65`
- `client/src/services/auth.service.ts:32`
- `client/src/services/github.service.ts:113`
- `client/src/services/jira.service.ts:27`
- `client/src/services/linear.service.ts:28`
- `client/src/services/question-round.service.ts:29`

**Severity:** HIGH
**Issue:** All default to `http://localhost:3000/api` if `NEXT_PUBLIC_API_URL` missing
- Will fail silently in production
- **Fix:** Add startup validation for `NEXT_PUBLIC_API_URL`

### 5. ❌ Hardcoded Localhost URLs in Console Output
**File:** `backend/src/main.ts:84-86`
**Severity:** MEDIUM
**Issue:** Shows `http://localhost:${port}` in logs even in production
- Misleading for debugging
- **Fix:** Use env vars to generate correct URLs

---

## HIGH (Development Code in Production)

### 6. ❌ Excessive Console.log Statements
**Files (47 total):**
- `backend/src/main.ts` - 3 console.log calls
- `client/src/lib/firebase.ts` - 4 console.log calls
- `client/src/services/auth.service.ts` - 2 console calls
- `client/src/services/ticket.service.ts` - 1 console.log
- **Many validators and use cases** - development-only logging
- **50+ additional console calls** across backend

**Severity:** HIGH
**Issue:** Logs clutter monitoring, expose internal details
- **Fix:** Remove all non-essential console logs (keep only errors)

### 7. ❌ Localhost Check in Client Code
**File:** `client/src/lib/firebase.ts:29`
**Severity:** MEDIUM
**Issue:** `if (typeof window !== 'undefined' && window.location.hostname === 'localhost')`
- Hardcoded environment check
- **Fix:** Remove—Firebase handles this automatically

---

## MEDIUM (Configuration & Error Handling)

### 8. ❌ Ollama Provider Hardcoded Localhost
**File:** `backend/src/shared/infrastructure/mastra/providers/ollama.provider.ts:37`
**Severity:** MEDIUM
**Issue:** `|| 'http://localhost:11434'` - Won't work in production
- Ollama only used in dev, but still a blocker
- **Fix:** No default, require explicit config in production

### 9. ❌ Unsafe Default LLM Config
**File:** `backend/src/shared/infrastructure/mastra/llm.config.ts`
**Severity:** HIGH
**Issue:** Need to check LLM provider configs for hardcoded values
- **Fix:** Validate all LLM env vars

### 10. ❌ Console Warns Bypassing Errors
**Files:**
- `backend/src/main.ts:52` - console.warn for CORS
- `client/src/lib/firebase.ts:48, 50` - console.warn for persistence
- `backend/src/shared/infrastructure/mastra/providers/ollama.provider.ts:22` - console.warn

**Severity:** MEDIUM
**Issue:** Using warn/log for recoverable errors instead of proper error handling
- **Fix:** Keep as debug-only logs if needed

---

## Implementation Plan (Ordered by Impact)

### Phase 1: CRITICAL (Do First)
1. ✅ Validate SESSION_SECRET on backend startup
2. ✅ Validate Firebase config on client startup
3. ✅ Validate NEXT_PUBLIC_API_URL on client startup
4. ✅ Validate FRONTEND_URL on backend startup

### Phase 2: HIGH (Remove Dev Code)
5. ✅ Remove console.log from main.ts
6. ✅ Remove console.log from firebase.ts
7. ✅ Remove console.log from auth.service.ts
8. ✅ Remove console.log from ticket.service.ts
9. ✅ Remove dev-specific console logs from backend services

### Phase 3: MEDIUM (Polish)
10. ✅ Fix console output messages in main.ts (use env vars)
11. ✅ Remove localhost check from firebase.ts
12. ✅ Remove default localhost from Ollama provider

---

## Testing in Production
- Set env vars before deploying
- Monitor logs for any remaining console output
- Test critical paths: auth, ticket creation, LLM calls
- Verify no localhost URLs appear in logs
