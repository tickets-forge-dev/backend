# SOC 2 Compliance Implementation Roadmap

**Created:** 2026-02-13
**Status:** Planning
**Timeline:** 8-10 weeks implementation
**Priority:** P0 (Required for enterprise customers)

---

## Executive Summary

Forge currently lacks critical security controls required for SOC 2 Type 2 certification. This roadmap addresses Trust Services Criteria CC6 (Logical Access), CC7 (Monitoring), and A1 (Availability) through a phased implementation over 8-10 weeks.

**Critical Gaps Identified:**
- ❌ No multi-factor authentication (MFA) enforcement
- ❌ No role-based access control (RBAC)
- ❌ No persistent session store (sessions lost on restart)
- ❌ No comprehensive audit logging (console logs only)
- ❌ Public file access without authentication
- ❌ Insecure encryption key fallback
- ❌ No rate limiting or security headers

**Audit Risk:** SOC 2 Type 2 audit would fail without addressing these gaps.

---

## Current State Assessment

### ✅ What Exists Today

**Authentication:**
- Firebase OAuth (Google, GitHub)
- Firebase Admin SDK token verification
- Workspace-based multi-tenancy
- OAuth token encryption (AES-256-CBC)

**Authorization:**
- Workspace isolation (Firestore security rules)
- Binary access model (workspace owner = full access)
- Use case-level workspace validation

**Logging:**
- HTTP request/response interceptor (stdout only)
- PostHog product analytics
- Sensitive data redaction

**Encryption:**
- Firebase encrypts data at rest (GCP-managed)
- Token encryption with AES-256-CBC
- HTTPS-only sessions in production

### ❌ Critical Missing Components

**P0 Blockers:**
1. Multi-factor authentication (MFA)
2. Role-based access control (RBAC)
3. Persistent session store (Redis)
4. Comprehensive audit logging (Firestore/Cloud Logging)
5. Secure file access (signed URLs)
6. Encryption key management (GCP KMS)

**P1 Production:**
7. Rate limiting (@nestjs/throttler)
8. Security headers (Helmet.js)
9. Automated data retention
10. Account activity monitoring

**P2 Nice-to-Have:**
11. Secret rotation mechanism
12. Anomaly detection
13. IP whitelisting

---

## Implementation Phases

## Phase 1: Certification Blockers (4 weeks) - P0

### Story 1.1: Multi-Factor Authentication (MFA)
**Effort:** 1 week | **Priority:** P0

#### What to Build

**Backend Domain** (`/backend/src/auth/domain/`):
- `MFAEnrollment.ts` - Entity tracking MFA method (TOTP)
- `MFAStatus` enum - `NOT_ENROLLED`, `ENROLLED`, `VERIFIED`, `SUSPENDED`
- `MFAPolicy.ts` - Enforcement rules

**Backend Application** (`/backend/src/auth/application/use-cases/`):
- `EnrollMFAUseCase.ts` - Generate TOTP secret, return QR code
- `VerifyMFAUseCase.ts` - Validate TOTP token
- `CheckMFARequiredUseCase.ts` - Return enforcement status

**Backend Infrastructure** (`/backend/src/auth/infrastructure/`):
- `MFARepository.ts` - Firestore persistence (`/users/{userId}/mfa`)
- `TOTPProvider.ts` - Wrapper around `otplib`

**Backend Presentation**:
- `MFAGuard.ts` - Guard checking `mfaStatus === 'VERIFIED'`
- Add endpoints: `POST /auth/mfa/enroll`, `POST /auth/mfa/verify`, `GET /auth/mfa/status`

**Frontend**:
- `MFAEnrollmentModal.tsx` - Display QR code, input field
- `MFAVerificationModal.tsx` - Challenge screen on sign-in
- Update `AuthProvider.tsx` to trigger MFA check

**Firestore Schema:**
```
/users/{userId}
  └── mfa/
      └── {enrollmentId}
          ├── method: 'TOTP'
          ├── secret: string (encrypted)
          ├── status: 'ENROLLED' | 'VERIFIED'
          ├── enrolledAt: timestamp
          └── lastVerifiedAt: timestamp
```

**Libraries:**
- `otplib` - TOTP generation/validation
- `qrcode` - QR code generation

**Integration Points:**
- Modify `/backend/src/shared/presentation/guards/FirebaseAuthGuard.ts`
- Add MFA check after Firebase token validation
- Add `mfaStatus` field to User domain model

**Migration:**
- Existing users: `mfaStatus = 'NOT_ENROLLED'` by default
- 30-day grace period before enforcement
- Environment variable: `MFA_ENFORCEMENT_DATE`

**Verification:**
- Unit tests: TOTP validation, state transitions
- E2E test: Sign up → enroll → verify → sign out → sign in with MFA
- Manual: Use Google Authenticator to scan QR

---

### Story 1.2: Role-Based Access Control (RBAC)
**Effort:** 1 week | **Priority:** P0

#### What to Build

**Backend Domain** (`/backend/src/auth/domain/`):
- `Role.ts` - Value object with permissions array
  ```typescript
  enum Permission {
    TICKET_CREATE = 'ticket:create',
    TICKET_EDIT_OWN = 'ticket:edit:own',
    TICKET_EDIT_ALL = 'ticket:edit:all',
    TICKET_DELETE = 'ticket:delete',
    WORKSPACE_MANAGE = 'workspace:manage',
    INTEGRATION_MANAGE = 'integration:manage',
    AUDIT_VIEW = 'audit:view',
  }
  ```

**Predefined Roles:**
- **OWNER**: All permissions
- **ADMIN**: All except workspace deletion
- **MEMBER**: Create/edit own tickets, view workspace
- **VIEWER**: Read-only access

**Backend Application**:
- `AssignRoleUseCase.ts` - Assign role to user (owner only)
- `CheckPermissionUseCase.ts` - Validate user has permission
- `RolePolicy.ts` - Permission checking logic

**Backend Presentation**:
- `PermissionGuard.ts` - NestJS guard
  ```typescript
  @UseGuards(FirebaseAuthGuard, PermissionGuard)
  @RequirePermission(Permission.TICKET_DELETE)
  async deleteTicket() {}
  ```

**Frontend**:
- `usePermissions.ts` - React hook for UI permission checks
- Hide buttons/menus based on permissions

**Firestore Schema:**
```
/workspaces/{workspaceId}
  └── members/
      └── {userId}
          ├── role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
          ├── permissions: string[] (cached)
          └── assignedAt: timestamp
```

**Integration Points:**
- Modify `/backend/src/workspaces/domain/Workspace.ts`
- Add `members: Map<userId, { role, joinedAt }>`
- Add `@RequirePermission()` decorators to controllers
- Update UI components to check permissions

**Migration:**
- Existing workspace owners → `OWNER` role
- Run migration script to populate members subcollection
- Default new members → `MEMBER` role

**Verification:**
- Unit tests: Permission checking logic
- Integration tests: API calls with different roles (403 when unauthorized)
- Manual: Create workspace, invite VIEWER, verify cannot delete tickets

---

### Story 1.3: Persistent Session Store (Redis)
**Effort:** 1 week | **Priority:** P0

#### What to Build

**Backend Domain** (`/backend/src/auth/domain/`):
- `Session.ts` - Entity with id, userId, deviceFingerprint, expiresAt, lastActivityAt
- `SessionRepository.ts` - Port interface

**Backend Infrastructure** (`/backend/src/auth/infrastructure/`):
- `RedisSessionStore.ts` - Implementation using `ioredis`
  ```typescript
  class RedisSessionStore implements SessionRepository {
    async create(session: Session): Promise<void>
    async findById(sessionId: string): Promise<Session | null>
    async updateActivity(sessionId: string): Promise<void>
    async revoke(sessionId: string): Promise<void>
    async revokeAllForUser(userId: string): Promise<void>
  }
  ```
- `SessionCleanupService.ts` - Cron job for expired sessions

**Redis Schema:**
```
session:{sessionId} -> {
  userId: string,
  deviceFingerprint: string,
  createdAt: timestamp,
  expiresAt: timestamp,
  lastActivityAt: timestamp
}

user_sessions:{userId} -> Set<sessionId>
```

**Environment Variables:**
```env
REDIS_URL=redis://localhost:6379
SESSION_TTL_SECONDS=86400  # 24 hours
SESSION_IDLE_TIMEOUT_SECONDS=3600  # 1 hour
```

**Integration Points:**
- Modify `/backend/src/shared/presentation/guards/FirebaseAuthGuard.ts`
- Create/update session after Firebase token validation
- Add `POST /auth/logout` endpoint (revoke session)
- Update frontend `AuthProvider.tsx` to call logout endpoint

**Libraries:**
- `ioredis` - Redis client
- `@nestjs/bull` - Optional for cleanup job

**Migration:**
- No data migration (sessions are ephemeral)
- Existing Firebase sessions expire naturally (<1 hour)
- New sessions created on next API call

**Verification:**
- Unit tests: Session CRUD operations
- Integration tests: Concurrent requests update lastActivityAt
- Manual: Sign in, check Redis, sign out, verify deleted

---

### Story 1.4: Comprehensive Audit Logging
**Effort:** 1 week | **Priority:** P0

#### What to Build

**Backend Domain** (`/backend/src/audit/domain/`):
- `AuditLog.ts` - Entity with id, timestamp, userId, sessionId, action, resource, outcome
- `AuditEvent.ts` - Value objects for event types:
  ```typescript
  interface AuditEvent {
    category: 'AUTH' | 'TICKET' | 'INTEGRATION' | 'WORKSPACE' | 'DATA_ACCESS';
    action: string;
    resource?: { type: string; id: string };
    outcome: 'SUCCESS' | 'FAILURE';
    metadata: Record<string, any>;
  }
  ```

**Backend Infrastructure** (`/backend/src/audit/infrastructure/`):
- `FirestoreAuditLogRepository.ts` - Write-only repository (immutable)
- Firestore schema:
  ```
  /audit_logs/{logId}
    ├── timestamp: timestamp (indexed)
    ├── userId: string (indexed)
    ├── category: string (indexed)
    ├── action: string
    ├── sessionId: string
    ├── resource: { type, id }
    ├── outcome: 'SUCCESS' | 'FAILURE'
    ├── metadata: object
    ├── ipAddress: string
    └── hash: string (SHA-256 chain for tamper detection)
  ```

**Backend Application** (`/backend/src/audit/application/`):
- `AuditLogService.ts` - Central logging service
  ```typescript
  async logAuthEvent(event: AuthEvent): Promise<void>
  async logTicketEvent(event: TicketEvent): Promise<void>
  async logIntegrationEvent(event: IntegrationEvent): Promise<void>
  async logDataAccess(event: DataAccessEvent): Promise<void>
  async queryLogs(filters: AuditLogFilters): Promise<AuditLog[]>
  ```
- `TamperDetectionService.ts` - Verify log chain integrity

**Backend Presentation**:
- `AuditController.ts` - Admin-only endpoints
  ```typescript
  GET /audit/logs?userId=X&category=AUTH&startDate=Y
  GET /audit/verify  # Check log chain integrity
  ```

**Events to Log:**

1. **Authentication:**
   - Login (success/failure)
   - MFA enrollment/verification
   - Logout, session revoked
   - Password changed

2. **Authorization:**
   - Permission denied (403 errors)
   - Role assignment changed
   - Workspace access granted/revoked

3. **Data Operations:**
   - Ticket created/updated/deleted
   - File uploaded/downloaded/deleted
   - Integration connected/disconnected
   - Encryption key rotated

4. **Sensitive Actions:**
   - User deleted account
   - Workspace deleted
   - Audit log queried (audit the auditors)

**Integration Points:**
- All use cases performing sensitive operations → Call `auditLogService.log*()`
- Modify `/backend/src/tickets/application/use-cases/CreateTicketUseCase.ts`
- Modify `/backend/src/auth/application/use-cases/EnrollMFAUseCase.ts`
- Modify `/backend/src/integrations/application/use-cases/ConnectGithubUseCase.ts`

**Retention:**
- 2 years in Firestore
- Archive to Cloud Storage after 1 year

**Verification:**
- Unit tests: Log creation, query filtering
- Integration tests: Perform action → verify log in Firestore
- Tamper detection: Modify log → verify integrity check fails
- Performance: 1000 concurrent writes (non-blocking)

---

### Story 1.5: Secure File Access (Signed URLs)
**Effort:** 3 days | **Priority:** P0

#### What to Build

**Backend Infrastructure:**
- Modify `/backend/src/tickets/infrastructure/storage/AttachmentStorageService.ts`
  ```typescript
  async getSignedUrl(
    filePath: string,
    expiresIn: number = 3600  // 1 hour
  ): Promise<string> {
    const [url] = await this.bucket.file(filePath).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresIn * 1000
    });
    return url;
  }
  ```
- Remove `makePublic()` call on upload

**Firebase Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /attachments/{workspaceId}/{ticketId}/{fileName} {
      // Deny all direct access - use signed URLs only
      allow read, write: if false;
    }
  }
}
```

**Backend Application:**
- Modify `GetTicketUseCase.ts` - Replace public URLs with signed URLs
- Add permission check before generating URL

**Backend Presentation:**
- Add endpoint: `GET /tickets/:id/attachments/:attachmentId/download`

**Frontend:**
- Modify `attachment.service.ts` - Fetch signed URL before download
- Update `AttachmentsList.tsx` - Click → fetch URL → open

**Migration:**
- Existing public files remain accessible
- New uploads use private storage + signed URLs
- Optional migration script to move old files

**Verification:**
- Unit test: Signed URL generation
- Integration test: Upload → get URL → verify accessible, verify expires
- Security test: Access file without signed URL → should fail

---

### Story 1.6: Encryption Key Management (GCP KMS)
**Effort:** 3 days | **Priority:** P0

#### What to Build

**Backend Domain** (`/backend/src/security/domain/`):
- `EncryptionKey.ts` - Entity with id, version, algorithm, createdAt, status

**Backend Infrastructure** (`/backend/src/security/infrastructure/`):
- `GCPKeyManagementService.ts` - Wrapper around GCP KMS
  ```typescript
  async encrypt(plaintext: string, keyVersion: string): Promise<string>
  async decrypt(ciphertext: string, keyVersion: string): Promise<string>
  async rotateKey(): Promise<string>
  async getActiveKeyVersion(): Promise<string>
  ```

**Backend Application:**
- `RotateEncryptionKeysUseCase.ts` - Re-encrypt all tokens
- Cron job: Daily check if key >90 days old → auto-rotate

**Modify Token Services:**
- `/backend/src/github/application/services/github-token.service.ts`
- `/backend/src/jira/application/services/jira-token.service.ts`
- `/backend/src/linear/application/services/linear-token.service.ts`
  - Remove `ENCRYPTION_KEY` environment variable
  - Use `keyManagementService.encrypt()` with active key version
  - Store key version with encrypted token

**Environment:**
```env
GCP_KMS_PROJECT_ID=forge-prod
GCP_KMS_LOCATION=global
GCP_KMS_KEYRING=forge-keys
GCP_KMS_KEY=token-encryption
# Remove ENCRYPTION_KEY entirely
```

**Firestore Schema Update:**
```
/integrations/github/{userId}
  ├── encryptedAccessToken: string
  ├── keyVersion: string  # NEW
  └── ...
```

**Migration Script:**
```typescript
// Re-encrypt all tokens with GCP KMS
async function migrateToKMS() {
  const tokens = await getAllEncryptedTokens();
  for (const token of tokens) {
    const plaintext = decryptWithOldKey(token.encrypted);
    const newCiphertext = await kms.encrypt(plaintext, activeKeyVersion);
    await updateToken(token.id, {
      encrypted: newCiphertext,
      keyVersion: activeKeyVersion
    });
  }
}
```

**Libraries:**
- `@google-cloud/kms` - GCP Key Management Service

**Verification:**
- Unit test: Encrypt/decrypt with KMS
- Integration test: Rotate key → verify old tokens still decryptable
- Security test: Remove KMS credentials → verify app fails (no fallback)

---

## Phase 2: Production Hardening (3 weeks) - P1

### Story 2.1: Rate Limiting
**Effort:** 2 days

- Install `@nestjs/throttler` with Redis backend
- Global limit: 100 requests/minute
- Auth endpoints: 5 requests/15 minutes
- Custom `AdaptiveRateLimitGuard` for per-user/IP tracking

### Story 2.2: Security Headers
**Effort:** 1 day

- Install `helmet` middleware
- Configure CSP, HSTS, X-Frame-Options, noSniff
- Enforce TLS 1.2+ minimum

### Story 2.3: Automated Data Retention
**Effort:** 3 days

- Build `DataRetentionService` with daily cron
- Audit logs: Archive after 1 year, delete after 2 years
- Sessions: Delete after 30 days inactive
- Tickets: Permanently delete after 90 days (soft delete)

### Story 2.4: Account Activity Monitoring
**Effort:** 2 days

- Track failed login attempts (5+ in 15 min → lock)
- Detect unusual IP (new country → email)
- Monitor concurrent sessions (5+ → alert)
- Dashboard: `GET /auth/activity`

---

## Phase 3: Compliance Polish (1-2 weeks) - P2

### Story 3.1: Secret Rotation
**Effort:** 3 days

- Admin endpoints for manual rotation
- Automated rotation every 90 days
- Email notifications

### Story 3.2: Anomaly Detection
**Effort:** 3 days

- Rule-based: API spikes, mass export, privilege escalation
- Optional ML-based detection

### Story 3.3: IP Whitelisting
**Effort:** 2 days

- Workspace-level IP allowlist
- Guard checking request IP
- Bypass for workspace owner

---

## Testing Strategy

### Unit Tests (80% coverage)
- MFA enrollment/verification logic
- Permission checking (RBAC)
- Session lifecycle
- Audit log tamper detection
- KMS encryption/decryption

### Integration Tests
- End-to-end MFA flow
- API calls with different roles (403 when unauthorized)
- Session persistence across requests
- Audit log creation
- Signed URL expiration

### Security Tests
- **OWASP ZAP scan** - XSS, CSRF, injection
- **Brute force** - 6 failed logins → rate limited
- **Permission escalation** - VIEWER trying DELETE → 403
- **Tamper detection** - Modify log → integrity fails
- **npm audit** - Dependency vulnerabilities

### Compliance Checklist
- [ ] MFA enforced
- [ ] RBAC implemented
- [ ] Sessions persist (Redis)
- [ ] Audit logs immutable
- [ ] Files use signed URLs
- [ ] Keys managed by KMS
- [ ] Rate limiting active
- [ ] Security headers configured
- [ ] Data retention automated
- [ ] Activity monitoring active
- [ ] TLS 1.2+ enforced
- [ ] No hardcoded secrets
- [ ] 2-year log retention

---

## Migration & Rollout

### Phased Rollout
1. **Week 1-2:** Staging environment (internal testing)
2. **Week 3:** Beta users (10-20 early adopters)
3. **Week 4:** Production with feature flags
   - MFA: New signups required, existing users 30-day grace
   - RBAC: Existing owners → OWNER role
   - Sessions: Created on next API call

### Feature Flags
```env
MFA_REQUIRED=false
RBAC_ENABLED=false
AUDIT_LOGGING_ENABLED=true
RATE_LIMITING_ENABLED=false
```

### Backward Compatibility
- Existing Firebase sessions expire naturally (<1 hour)
- Old encryption keys work during rotation
- Public file URLs remain valid (no broken links)
- RBAC defaults to full access (no breaking change)

### Rollback Plan
- Disable MFA via feature flag
- Bypass RBAC if misconfigured
- Revert to Firebase sessions if Redis fails
- Monitor: 401/403 error rates, MFA success rate

---

## Dependencies

### Required Services
- **Redis** - Session store (Render addon or AWS ElastiCache)
- **GCP KMS** - Key management (requires GCP project)
- **Cloud Storage** - Audit log archival

### Required Libraries
- `otplib` - TOTP
- `qrcode` - QR generation
- `ioredis` - Redis client
- `@google-cloud/kms` - Key management
- `@nestjs/throttler` - Rate limiting
- `helmet` - Security headers

### Environment Variables
```env
# MFA
MFA_ENFORCEMENT_DATE=2026-03-15

# Sessions
REDIS_URL=redis://localhost:6379
SESSION_TTL_SECONDS=86400
SESSION_IDLE_TIMEOUT_SECONDS=3600

# Encryption
GCP_KMS_PROJECT_ID=forge-prod
GCP_KMS_LOCATION=global
GCP_KMS_KEYRING=forge-keys
GCP_KMS_KEY=token-encryption

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Feature Flags
MFA_REQUIRED=false
RBAC_ENABLED=false
AUDIT_LOGGING_ENABLED=true
```

---

## Effort Estimate

| Phase | Stories | Effort | Priority |
|-------|---------|--------|----------|
| Phase 1: Blockers | 6 | 4 weeks | P0 |
| Phase 2: Hardening | 4 | 1.5 weeks | P1 |
| Phase 3: Polish | 3 | 1.5 weeks | P2 |
| **Total** | **13** | **8-10 weeks** | |

**Timeline:** 8-10 weeks implementation + 2-4 weeks external audit = **3-4 months to certification**

**Cost Estimate:**
- Engineering: 8-10 weeks × 1 FTE = $40-50k
- External audit: $15-30k
- **Total: $55-80k**

---

## Success Criteria

**SOC 2 Type 2 audit will pass when:**
- ✅ CC6 (Logical Access) - MFA + RBAC
- ✅ CC7 (Monitoring) - Audit logs with 2-year retention
- ✅ A1 (Availability) - Persistent sessions, rate limiting
- ✅ All gaps from assessment addressed
- ✅ Penetration test finds no critical vulnerabilities
- ✅ Compliance documentation complete

---

## Next Steps

1. **Review this roadmap** with engineering team
2. **Prioritize Phase 1** (4 weeks for blockers)
3. **Set up infrastructure** (Redis, GCP KMS)
4. **Create implementation tickets** in sprint backlog
5. **Schedule kickoff** when ready to start

**Recommended Start Date:** After Epic 24 completion (Jira/Linear export)
**Target Completion:** Q2 2026
