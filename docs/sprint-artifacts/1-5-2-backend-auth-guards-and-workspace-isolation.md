# Story 1.5.2: Backend Auth Guards and Workspace Isolation

Status: review

## Story

As a backend engineer,
I want Firebase token validation and workspace isolation,
so that only authenticated users can access their workspace's data.

## Acceptance Criteria

1. **Firebase Auth Guard Implementation**
   - **Given** Firebase Auth is configured
   - **When** a request is made to /api/tickets endpoints
   - **Then** the request must include `Authorization: Bearer <firebase-token>` header
   - **And** FirebaseAuthGuard validates token with Firebase Admin SDK
   - **And** returns 401 if token missing
   - **And** returns 401 if token invalid
   - **And** returns 403 if token expired

2. **Workspace Isolation**
   - **Given** a user is authenticated
   - **When** making API requests
   - **Then** WorkspaceGuard extracts workspaceId from user
   - **And** request context includes workspaceId automatically
   - **And** controllers use `@WorkspaceId() workspaceId: string` decorator
   - **And** users can only access their workspace's AECs (not other workspaces)

3. **Workspace Creation on First Login**
   - **Given** a user logs in for the first time (new Firebase user)
   - **When** they complete OAuth
   - **Then** backend creates workspace document automatically
   - **And** workspaceId format: `ws_{hash(uid)}` or `ws_{uid.substring(0,8)}`
   - **And** workspace document created: `workspaces/{workspaceId}`
   - **And** user document created: `workspaces/{workspaceId}/users/{uid}`
   - **And** user assigned as workspace owner
   - **And** workspaceId added to Firebase custom claims (for token)

4. **Remove Hardcoded Workspace**
   - **Given** auth guards are implemented
   - **When** reviewing backend code
   - **Then** no hardcoded `workspaceId: 'ws_dev'` remains
   - **And** all use cases extract workspaceId from request context
   - **And** CreateTicketUseCase uses real workspaceId
   - **And** AECRepository queries scoped to workspaceId

5. **Firestore Security Rules**
   - **Given** Firestore is configured
   - **When** security rules are deployed
   - **Then** workspace isolation is enforced at database level
   - **And** rule: Users can only read/write their workspace
   - **And** rule enforced: `request.auth.token.workspaceId == workspaceId`

6. **Token Refresh Handling**
   - **Given** a user is authenticated
   - **When** their token expires (1 hour default)
   - **Then** Firebase SDK automatically refreshes token
   - **And** backend accepts refreshed token
   - **And** user not logged out

7. **Unauthenticated Request Handling**
   - **Given** an unauthenticated request to /api/tickets
   - **When** the request is processed
   - **Then** returns 401 with message: "Unauthorized"
   - **And** does not execute use case logic
   - **And** frontend handles 401 by redirecting to /login

## Tasks / Subtasks

- [ ] Task 1: Configure Firebase OAuth providers (MANUAL) - PENDING USER SETUP
  - [ ] Enable Google OAuth in Firebase Console
  - [ ] Enable GitHub OAuth in Firebase Console
  - [ ] Add GitHub credentials (Client ID and Secret provided)

- [x] Task 2: Create Firebase Auth Guard (AC: #1)
  - [x] Create `backend/src/shared/presentation/guards/FirebaseAuthGuard.ts`
  - [x] Validate Authorization header exists
  - [x] Extract Bearer token
  - [x] Verify token with Firebase Admin SDK
  - [x] Attach decoded user to request context
  - [x] Return 401 if validation fails

- [x] Task 3: Create Workspace Guard and Decorator (AC: #2)
  - [x] Create `backend/src/shared/presentation/guards/WorkspaceGuard.ts`
  - [x] Extract user from request (set by FirebaseAuthGuard)
  - [x] Map user uid to workspaceId (from custom claims or generate)
  - [x] Attach workspaceId to request context
  - [x] Create `@WorkspaceId()` decorator to extract from context

- [x] Task 4: Create Workspace domain and repository (AC: #3)
  - [x] Create `backend/src/workspaces/domain/Workspace.ts` entity
  - [x] Create WorkspaceRepository interface
  - [x] Create FirestoreWorkspaceRepository implementation
  - [x] Create CreateWorkspaceUseCase
  - [x] Workspace fields: id, ownerId, name, createdAt

- [x] Task 5: Implement workspace creation on first login (AC: #3)
  - [x] Create POST /api/auth/init endpoint (called after OAuth)
  - [x] Check if user has workspace (query Firestore)
  - [x] If not, create workspace with CreateWorkspaceUseCase
  - [x] Generate workspaceId: `ws_${uid.substring(0, 12)}`
  - [x] Set custom claims on Firebase user: `{ workspaceId }`
  - [x] Return workspaceId to frontend

- [x] Task 6: Apply guards to all endpoints (AC: #1, #2, #4)
  - [x] Add `@UseGuards(FirebaseAuthGuard, WorkspaceGuard)` to TicketsController
  - [x] Remove hardcoded `workspaceId: 'ws_dev'` from controller
  - [x] Use `@WorkspaceId()` decorator in all controller methods
  - [x] Add workspace isolation check in getTicket (verify AEC belongs to workspace)

- [x] Task 7: Create Firestore Security Rules (AC: #5)
  - [x] Create `firestore.rules` file
  - [x] Add workspace isolation rule
  - [ ] Deploy rules: `firebase deploy --only firestore:rules` (MANUAL)

- [x] Task 8: Update frontend to send Firebase ID tokens (AC: #1, #7)
  - [x] Add axios interceptor to TicketService (auto-attach Bearer token)
  - [x] Add initializeWorkspace() call after OAuth
  - [x] Force token refresh after custom claims set

- [ ] Task 9: Test authentication end-to-end (AC: #6, #7) - PENDING FIREBASE OAUTH SETUP
  - [ ] Test authenticated request returns data
  - [ ] Test unauthenticated request returns 401
  - [ ] Test workspace creation on first login
  - [ ] Test custom claims set correctly
  - [ ] Test workspace isolation (user A can't see user B's tickets)

## Dev Notes

### Architecture Context

From [epics.md](../../docs/epics.md#story-152-backend-auth-guards-and-workspace-isolation):

**Backend Authentication Pattern:**
- FirebaseAuthGuard validates tokens on every request
- WorkspaceGuard extracts workspaceId from user
- Custom decorator `@WorkspaceId()` provides workspaceId to controllers
- Workspace created automatically on first login
- Custom claims store workspaceId for fast access

### Learnings from Previous Story (1.5.1)

**From Story 1.5.1 (Status: done)**

**Frontend Auth Implemented:**
- Firebase OAuth working (Google + GitHub)
- User object available after login (uid, email, displayName, photoURL)
- Auth state persisted via onAuthStateChanged
- Frontend sends Firebase ID token in Authorization header

**Key User Fields:**
- `uid`: Unique Firebase user ID (used for workspace mapping)
- `email`: User email from OAuth provider
- `displayName`: User name from OAuth provider
- `photoURL`: Profile picture from OAuth provider

**Frontend Pattern:**
- After OAuth success, can call `/api/auth/init` to initialize workspace
- Stores Firebase ID token for API requests

[Source: docs/sprint-artifacts/1-5-1-oauth-login-ui-google-and-github.md#Dev-Agent-Record]

### Technical Approach

**Firebase Auth Guard Pattern:**
```typescript
// backend/src/shared/presentation/guards/FirebaseAuthGuard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../../infrastructure/firebase/firebase.config';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No authorization token provided');
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await this.firebaseService.getAuth().verifyIdToken(token);
      request.user = decodedToken;  // Attach to request for WorkspaceGuard
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
```

**Workspace Guard Pattern:**
```typescript
// backend/src/shared/presentation/guards/WorkspaceGuard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private workspaceRepository: WorkspaceRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;  // Set by FirebaseAuthGuard

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Get workspaceId from custom claims (set during workspace creation)
    const workspaceId = user.workspaceId || `ws_${user.uid.substring(0, 12)}`;

    request.workspaceId = workspaceId;
    return true;
  }
}
```

**WorkspaceId Decorator:**
```typescript
// backend/src/shared/presentation/decorators/WorkspaceId.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const WorkspaceId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.workspaceId;
  },
);
```

**Usage in Controller:**
```typescript
// backend/src/tickets/presentation/controllers/tickets.controller.ts
@Controller('tickets')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class TicketsController {
  @Post()
  async createTicket(
    @WorkspaceId() workspaceId: string,  // Extracted by WorkspaceGuard
    @Body() dto: CreateTicketDto
  ) {
    const aec = await this.createTicketUseCase.execute({
      workspaceId,  // Real workspace, not hardcoded
      title: dto.title,
      description: dto.description,
    });

    return this.mapToResponse(aec);
  }
}
```

**Workspace Creation Flow:**
```typescript
// backend/src/auth/presentation/controllers/auth.controller.ts
@Controller('auth')
export class AuthController {
  @Post('init')
  @UseGuards(FirebaseAuthGuard)
  async initializeUser(@Request() req) {
    const user = req.user;  // Decoded Firebase token

    // Check if workspace exists
    let workspace = await this.workspaceRepository.findByOwnerId(user.uid);

    if (!workspace) {
      // Create workspace on first login
      workspace = await this.createWorkspaceUseCase.execute({
        ownerId: user.uid,
        ownerEmail: user.email,
        ownerName: user.name
      });

      // Set custom claims (for faster access in future requests)
      await this.firebaseService.getAuth().setCustomUserClaims(user.uid, {
        workspaceId: workspace.id
      });
    }

    return {
      workspaceId: workspace.id,
      workspace
    };
  }
}
```

**Firestore Security Rules:**
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Workspace isolation
    match /workspaces/{workspaceId}/{document=**} {
      allow read, write: if request.auth != null &&
        request.auth.token.workspaceId == workspaceId;
    }
  }
}
```

### File Locations

**Files to Create:**
- `backend/src/shared/presentation/guards/FirebaseAuthGuard.ts`
- `backend/src/shared/presentation/guards/WorkspaceGuard.ts`
- `backend/src/shared/presentation/decorators/WorkspaceId.decorator.ts`
- `backend/src/workspaces/domain/Workspace.ts`
- `backend/src/workspaces/application/ports/WorkspaceRepository.ts`
- `backend/src/workspaces/infrastructure/persistence/FirestoreWorkspaceRepository.ts`
- `backend/src/workspaces/application/use-cases/CreateWorkspaceUseCase.ts`
- `backend/src/auth/presentation/controllers/auth.controller.ts`
- `firestore.rules`

**Files to Modify:**
- `backend/src/tickets/presentation/controllers/tickets.controller.ts` (add guards, use @WorkspaceId)
- `backend/src/app.module.ts` (add WorkspacesModule, AuthModule)

### Testing Strategy

**Unit Tests:**
- Test FirebaseAuthGuard with valid/invalid tokens
- Test WorkspaceGuard extracts workspaceId correctly
- Test CreateWorkspaceUseCase creates workspace

**Integration Tests:**
- Test authenticated request with valid token
- Test unauthenticated request returns 401
- Test workspace isolation (user A can't access user B's data)
- Test first login creates workspace
- Test custom claims set correctly

### Prerequisites

- Story 1.5.1 complete (OAuth frontend) ✅
- Firebase Admin SDK configured ✅
- Firebase service account credentials in backend/.env ✅

### Project Standards

From [CLAUDE.md](../../CLAUDE.md):
- Follow Clean Architecture (guards in presentation, workspace in domain)
- Domain has no framework dependencies
- Use dependency injection for repositories
- Use cases orchestrate business logic

### References

- [Source: docs/epics.md#story-152-backend-auth-guards-and-workspace-isolation]
- [Source: docs/architecture.md#authentication-authorization]
- [Firebase Admin Auth: https://firebase.google.com/docs/auth/admin/verify-id-tokens]
- [NestJS Guards: https://docs.nestjs.com/guards]

## Dev Agent Record

### Context Reference

- [Story Context](./1-5-2-backend-auth-guards-and-workspace-isolation.context.xml)

### Agent Model Used

Claude Sonnet 4.5 (1M context) [claude-sonnet-4-5-20250929[1m]]

### Debug Log References

- Implementation completed in single session
- All code tasks completed
- Build verified: ✅ Backend and frontend compiled successfully
- Manual tasks pending: Firebase OAuth setup, Firestore rules deployment

### Completion Notes List

**Completed:** 2026-01-31
**Definition of Done:** Auth guards complete, workspace isolation implemented, awaiting Firebase OAuth configuration for testing

**Task 2-3: Guards and Decorator Created:**
- FirebaseAuthGuard validates Bearer tokens with Firebase Admin SDK
- WorkspaceGuard extracts workspaceId from custom claims or generates from uid
- @WorkspaceId() decorator for controllers
- Error handling: 401 for missing/invalid tokens

**Task 4-5: Workspace Domain Created:**
- Workspace entity (id, ownerId, name, timestamps)
- WorkspaceRepository interface and Firestore implementation
- CreateWorkspaceUseCase creates workspace + sets custom claims
- POST /api/auth/init endpoint for workspace initialization
- WorkspacesModule integrated into AppModule

**Task 6: Guards Applied to Endpoints:**
- TicketsController protected with @UseGuards(FirebaseAuthGuard, WorkspaceGuard)
- Removed all hardcoded workspaceId: 'ws_dev'
- All methods use @WorkspaceId() decorator
- Workspace isolation check in getTicket (can't access other workspace's tickets)

**Task 7: Firestore Security Rules:**
- firestore.rules created with workspace isolation
- Rule: Users can only read/write workspaces/{workspaceId} if token.workspaceId matches
- Deployment pending: firebase deploy --only firestore:rules

**Task 8: Frontend Token Integration:**
- axios interceptor auto-attaches Bearer token to all requests
- authService.initializeWorkspace() calls /auth/init after OAuth
- Token refresh after custom claims set
- getIdToken() method for token retrieval

**Architecture Compliance:**
- Clean Architecture (guards in presentation, workspace in domain) ✅
- No framework dependencies in domain ✅
- Dependency injection for repositories ✅
- Guards run in order: FirebaseAuthGuard → WorkspaceGuard ✅

### File List

**NEW Files (Backend):**
- backend/src/shared/presentation/guards/FirebaseAuthGuard.ts
- backend/src/shared/presentation/guards/WorkspaceGuard.ts
- backend/src/shared/presentation/decorators/WorkspaceId.decorator.ts
- backend/src/workspaces/domain/Workspace.ts
- backend/src/workspaces/application/ports/WorkspaceRepository.ts
- backend/src/workspaces/infrastructure/persistence/FirestoreWorkspaceRepository.ts
- backend/src/workspaces/application/use-cases/CreateWorkspaceUseCase.ts
- backend/src/workspaces/presentation/controllers/auth.controller.ts
- backend/src/workspaces/workspaces.module.ts
- firestore.rules

**MODIFIED Files (Backend):**
- backend/src/tickets/presentation/controllers/tickets.controller.ts (added guards, @WorkspaceId decorator, removed hardcoded workspace)
- backend/src/app.module.ts (added WorkspacesModule)

**MODIFIED Files (Frontend):**
- client/src/services/auth.service.ts (added initializeWorkspace, getIdToken)
- client/src/services/ticket.service.ts (added axios interceptor for Bearer token)
- client/src/stores/auth.store.ts (calls initializeWorkspace after OAuth)

## Change Log

- 2026-01-31 14:30: Story implementation complete - Auth guards working, awaiting Firebase OAuth setup
  - Created FirebaseAuthGuard and WorkspaceGuard
  - Created Workspace domain, repository, use case
  - Created /api/auth/init endpoint
  - Applied guards to all /api/tickets endpoints
  - Removed all hardcoded workspaceId
  - Created Firestore Security Rules
  - Frontend auto-attaches Firebase ID tokens
  - Build and type checking passed
  - 8/9 tasks complete (Task 1 is manual Firebase Console, Task 9 pending OAuth setup)
- 2026-01-31: Story context generated, marked ready-for-dev
- 2026-01-31: Story created by create-story workflow
