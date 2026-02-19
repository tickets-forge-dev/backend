# Epic 1: Team Foundation - Comprehensive Testing Plan

**Epic:** Team Foundation (Stories 1.1-1.10)
**Status:** Implementation complete, testing in progress
**Test Coverage Target:** 80%+ for critical paths

---

## Testing Status Overview

| Layer | Status | Tests | Coverage |
|-------|--------|-------|----------|
| Domain (Unit) | ✅ DONE | 55/55 passing | ~90% |
| Use Cases | ⏳ TODO | 0 tests | 0% |
| API Integration | ⏳ TODO | 0 tests | 0% |
| Frontend Components | ⏳ TODO | 0 tests | 0% |
| E2E Flows | ⏳ TODO | 0 tests | 0% |

---

## 1. Domain Layer Tests (DONE ✅)

**Location:** `backend/src/teams/domain/Team.spec.ts`, `backend/src/users/domain/User.spec.ts`
**Status:** 55/55 tests passing
**Coverage:** ~90%

### Team Domain (Team.spec.ts)
✅ Team creation with valid name
✅ Team creation fails with short name (< 3 chars)
✅ Team creation fails with long name (> 50 chars)
✅ Team creation fails with empty name
✅ Slug generation from team name
✅ Slug handles special characters
✅ Slug lowercases and replaces spaces
✅ Owner identification with isOwnedBy()
✅ Team name update returns new instance (immutability)
✅ Team settings update returns new instance
✅ Settings with default workspace
✅ Settings toggle allowMemberInvites

### User Domain (User.spec.ts)
✅ User creation with required fields
✅ Add team to user
✅ Remove team from user
✅ Switch current team
✅ Remove current team auto-switches to next
✅ Remove last team sets currentTeamId to null
✅ isMemberOfTeam() check
✅ hasTeams() check
✅ getCurrentTeamId() returns TeamId or null

---

## 2. Use Case Tests (TODO ⏳)

**Priority:** HIGH
**Estimated:** ~2-3 hours
**Files to create:** 5 test files

### 2.1 CreateTeamUseCase.spec.ts (Priority: P0)

**Test Cases:**
```typescript
describe('CreateTeamUseCase', () => {
  // Happy path
  it('should create team and add user as member', async () => {
    // Given: valid userId and team name
    // When: execute CreateTeamCommand
    // Then: team created, user added, currentTeamId set
  });

  it('should set allowMemberInvites to true by default', async () => {});
  it('should respect allowMemberInvites when provided', async () => {});
  it('should auto-switch to new team', async () => {});

  // Validation
  it('should reject team name < 3 characters', async () => {
    // Expect: InvalidTeamException
  });

  it('should reject team name > 50 characters', async () => {});
  it('should reject empty team name', async () => {});

  // Uniqueness
  it('should reject duplicate slug', async () => {
    // Given: team with slug "acme" exists
    // When: create team "ACME" (same slug)
    // Then: throw InvalidTeamException
  });

  // Edge cases
  it('should handle user not found', async () => {
    // Expect: Error with user not found message
  });
});
```

**Mocks needed:**
- `FirestoreTeamRepository` (mock `save()`, `isSlugUnique()`)
- `FirestoreUserRepository` (mock `getById()`, `save()`)

---

### 2.2 SwitchTeamUseCase.spec.ts (Priority: P0)

**Test Cases:**
```typescript
describe('SwitchTeamUseCase', () => {
  // Happy path
  it('should switch user to target team', async () => {
    // Given: user is member of teamA and teamB
    // When: switch to teamB
    // Then: user.currentTeamId = teamB
  });

  // Authorization
  it('should reject switch if user not member', async () => {
    // Given: user NOT member of teamX
    // When: switch to teamX
    // Then: throw ForbiddenException
  });

  // Error cases
  it('should reject if team does not exist', async () => {});
  it('should reject if user does not exist', async () => {});

  // Edge cases
  it('should allow switching to already current team (no-op)', async () => {});
});
```

---

### 2.3 UpdateTeamUseCase.spec.ts (Priority: P1)

**Test Cases:**
```typescript
describe('UpdateTeamUseCase', () => {
  // Happy path
  it('should update team name (owner only)', async () => {});
  it('should update settings (owner only)', async () => {});
  it('should update both name and settings', async () => {});

  // Authorization
  it('should reject if user is not owner', async () => {
    // Given: user is member but NOT owner
    // When: update team
    // Then: throw ForbiddenException
  });

  it('should reject if user not member at all', async () => {});

  // Validation
  it('should validate new team name length', async () => {});
  it('should check slug uniqueness if name changed', async () => {});

  // Edge cases
  it('should handle team not found', async () => {});
});
```

---

### 2.4 GetTeamUseCase.spec.ts (Priority: P1)

**Test Cases:**
```typescript
describe('GetTeamUseCase', () => {
  // Happy path
  it('should return team with isOwner=true for owner', async () => {});
  it('should return team with isOwner=false for member', async () => {});

  // Authorization
  it('should reject if user not member', async () => {
    // Then: throw ForbiddenException
  });

  // Error cases
  it('should reject if team not found', async () => {});
  it('should reject if user not found', async () => {});
});
```

---

### 2.5 GetUserTeamsUseCase.spec.ts (Priority: P1)

**Test Cases:**
```typescript
describe('GetUserTeamsUseCase', () => {
  // Happy path
  it('should return all teams for user', async () => {
    // Then: returns TeamSummary[] with isCurrent flags
  });

  it('should mark current team with isCurrent=true', async () => {});
  it('should return empty array if user has no teams', async () => {});

  // Edge cases
  it('should handle user not found', async () => {});
  it('should handle user with no currentTeamId', async () => {
    // currentTeamId = null, all teams have isCurrent=false
  });
});
```

---

## 3. API Integration Tests (TODO ⏳)

**Priority:** HIGH
**Estimated:** ~3-4 hours
**Files to create:** 1 test file (`teams.controller.spec.ts`)

### Setup
```typescript
describe('TeamsController (e2e)', () => {
  let app: INestApplication;
  let firestore: Firestore;
  let testUser: { uid: string; token: string };

  beforeAll(async () => {
    // Initialize NestJS app with test configuration
    // Mock Firebase Auth for test tokens
    // Clear Firestore collections
  });

  afterAll(async () => {
    // Cleanup test data
    // Close app
  });
});
```

### 3.1 POST /teams (Create Team)

**Test Cases:**
```typescript
describe('POST /teams', () => {
  it('should create team with valid request', async () => {
    const response = await request(app.getHttpServer())
      .post('/teams')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({ name: 'Test Team', allowMemberInvites: true })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.team.name).toBe('Test Team');
    expect(response.body.team.slug).toBe('test-team');
    expect(response.body.team.ownerId).toBe(testUser.uid);
  });

  it('should reject without authentication', async () => {
    await request(app.getHttpServer())
      .post('/teams')
      .send({ name: 'Test Team' })
      .expect(401);
  });

  it('should reject name < 3 characters', async () => {
    await request(app.getHttpServer())
      .post('/teams')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({ name: 'AB' })
      .expect(400);
  });

  it('should reject name > 50 characters', async () => {});
  it('should reject missing name', async () => {});
  it('should set allowMemberInvites to true by default', async () => {});
});
```

---

### 3.2 GET /teams (List Teams)

**Test Cases:**
```typescript
describe('GET /teams', () => {
  it('should return all teams for user', async () => {
    // Given: user has 2 teams
    const response = await request(app.getHttpServer())
      .get('/teams')
      .set('Authorization', `Bearer ${testUser.token}`)
      .expect(200);

    expect(response.body.teams).toHaveLength(2);
    expect(response.body.currentTeamId).toBe(team1.id);
  });

  it('should return empty array if no teams', async () => {});
  it('should mark current team with isCurrent=true', async () => {});
  it('should reject without authentication', async () => {});
});
```

---

### 3.3 GET /teams/:id (Get Team)

**Test Cases:**
```typescript
describe('GET /teams/:id', () => {
  it('should return team if user is member', async () => {});
  it('should return isOwner=true for owner', async () => {});
  it('should return isOwner=false for member', async () => {});
  it('should reject if user not member (403)', async () => {});
  it('should return 404 if team not found', async () => {});
});
```

---

### 3.4 PATCH /teams/:id (Update Team)

**Test Cases:**
```typescript
describe('PATCH /teams/:id', () => {
  it('should update team name (owner only)', async () => {});
  it('should update settings', async () => {});
  it('should reject if user not owner (403)', async () => {});
  it('should validate name length', async () => {});
  it('should return 404 if team not found', async () => {});
});
```

---

### 3.5 POST /teams/switch (Switch Team)

**Test Cases:**
```typescript
describe('POST /teams/switch', () => {
  it('should switch current team', async () => {});
  it('should reject if user not member (403)', async () => {});
  it('should return 404 if team not found', async () => {});
  it('should handle switching to already current team', async () => {});
});
```

---

## 4. Frontend Component Tests (TODO ⏳)

**Priority:** MEDIUM
**Estimated:** ~4-5 hours
**Framework:** Jest + React Testing Library

### 4.1 TeamSwitcher.test.tsx

**Test Cases:**
```typescript
describe('TeamSwitcher', () => {
  // Rendering
  it('should render current team name', () => {});
  it('should render role badge (Owner/Member)', () => {});
  it('should hide team name when sidebar collapsed', () => {});

  // Interactions
  it('should open dropdown on click', () => {});
  it('should list all teams with role badges', () => {});
  it('should mark current team with checkmark', () => {});
  it('should call switchTeam on team selection', () => {});
  it('should open CreateTeamDialog on "Create Team" click', () => {});

  // Loading states
  it('should show loading state while fetching teams', () => {});
  it('should show error message on load failure', () => {});
  it('should show "No teams" message if empty', () => {});

  // Auto-load
  it('should load teams on mount', () => {
    // Expect: useTeamStore.loadTeams() called
  });
});
```

---

### 4.2 TeamSettings.test.tsx

**Test Cases:**
```typescript
describe('TeamSettings', () => {
  // Owner view
  it('should render edit button for owner', () => {});
  it('should show edit form on "Edit Team" click', () => {});
  it('should validate team name (3-50 chars)', () => {});
  it('should enable Save button when changes made', () => {});
  it('should call updateTeam on save', () => {});
  it('should show delete button in Danger Zone', () => {});
  it('should open delete confirmation dialog', () => {});

  // Member view
  it('should show read-only view for member', () => {});
  it('should not show edit button for member', () => {});

  // Loading states
  it('should show loading while fetching team', () => {});
  it('should show error on load failure', () => {});
});
```

---

### 4.3 CreateTeamDialog.test.tsx

**Test Cases:**
```typescript
describe('CreateTeamDialog', () => {
  // Rendering
  it('should render trigger button', () => {});
  it('should open dialog on trigger click', () => {});
  it('should render form with name input and checkbox', () => {});

  // Validation
  it('should disable Create button if name < 3 chars', () => {});
  it('should enable Create button if name >= 3 chars', () => {});

  // Interactions
  it('should call createTeam on submit', () => {});
  it('should close dialog on success', () => {});
  it('should show error message on failure', () => {});
  it('should reset form on close', () => {});
  it('should support Enter key to submit', () => {});

  // Callbacks
  it('should call onSuccess callback after creation', () => {});
});
```

---

## 5. E2E User Flows (TODO ⏳)

**Priority:** MEDIUM-LOW (nice to have)
**Estimated:** ~3-4 hours
**Framework:** Playwright or Cypress

### 5.1 Flow: Create First Team (Onboarding)

**Steps:**
1. New user signs up
2. User sees "Create Team" prompt
3. User enters team name "Acme Engineering"
4. User clicks "Create Team"
5. Team created, sidebar shows "Acme Engineering"
6. User badge shows "Owner"

**Assertions:**
- Team appears in sidebar
- Role badge shows "Owner"
- Settings page shows team details

---

### 5.2 Flow: Switch Teams

**Steps:**
1. User has 2 teams (Team A, Team B)
2. User clicks team switcher in sidebar
3. User sees both teams with checkmark on current
4. User clicks Team B
5. Team switcher updates to show Team B

**Assertions:**
- Team switcher shows Team B
- Checkmark moved to Team B
- All tickets filtered to Team B context

---

### 5.3 Flow: Edit Team (Owner)

**Steps:**
1. Owner navigates to Settings
2. Owner clicks "Edit Team"
3. Owner changes name to "New Name"
4. Owner toggles "Allow Member Invites"
5. Owner clicks "Save Changes"
6. Success message shown

**Assertions:**
- Team name updated in sidebar
- Settings reflect new values
- Toast/success message shown

---

### 5.4 Flow: Delete Team

**Steps:**
1. Owner navigates to Settings
2. Owner clicks "Delete Team" in Danger Zone
3. Confirmation dialog appears
4. Owner confirms deletion
5. Team deleted, user switched to next team

**Assertions:**
- Team removed from team list
- User auto-switched to remaining team
- Deleted team not accessible

---

### 5.5 Flow: Member View (Read-only)

**Steps:**
1. Member (not owner) navigates to Settings
2. Member sees team info
3. Member sees "Only owners can edit" message
4. No edit button visible

**Assertions:**
- Team info displayed
- Edit controls hidden
- Delete button hidden

---

## 6. Test Execution Plan

### Phase 1: Core Tests (HIGH Priority - Run First)
**Duration:** ~6 hours
```bash
# 1. Use Case Tests (5 files)
pnpm test CreateTeamUseCase.spec.ts
pnpm test SwitchTeamUseCase.spec.ts
pnpm test UpdateTeamUseCase.spec.ts
pnpm test GetTeamUseCase.spec.ts
pnpm test GetUserTeamsUseCase.spec.ts

# 2. API Integration Tests (1 file)
pnpm test:e2e teams.controller.spec.ts
```

**Exit Criteria:**
- All use case tests passing (estimated 25-30 tests)
- All API integration tests passing (estimated 20-25 tests)
- Coverage: 80%+ for use cases, 90%+ for controllers

---

### Phase 2: Frontend Tests (MEDIUM Priority)
**Duration:** ~5 hours
```bash
# Component tests
pnpm test TeamSwitcher.test.tsx
pnpm test TeamSettings.test.tsx
pnpm test CreateTeamDialog.test.tsx
```

**Exit Criteria:**
- All component tests passing (estimated 30-35 tests)
- Coverage: 70%+ for components

---

### Phase 3: E2E Tests (MEDIUM-LOW Priority - Optional)
**Duration:** ~4 hours
```bash
# E2E flows
pnpm test:e2e team-flows.spec.ts
```

**Exit Criteria:**
- 5 critical flows tested end-to-end
- All flows passing in headless mode

---

## 7. Test Data Setup

### Fixtures Needed
```typescript
// test/fixtures/teams.ts
export const mockTeams = {
  team1: {
    id: 'team-1',
    name: 'Acme Engineering',
    slug: 'acme-engineering',
    ownerId: 'user-1',
    settings: { allowMemberInvites: true },
  },
  team2: {
    id: 'team-2',
    name: 'Beta Corp',
    slug: 'beta-corp',
    ownerId: 'user-2',
    settings: { allowMemberInvites: false },
  },
};

// test/fixtures/users.ts
export const mockUsers = {
  owner: {
    uid: 'user-1',
    email: 'owner@example.com',
    currentTeamId: 'team-1',
    teams: ['team-1'],
  },
  member: {
    uid: 'user-2',
    email: 'member@example.com',
    currentTeamId: 'team-1',
    teams: ['team-1', 'team-2'],
  },
};
```

---

## 8. Coverage Goals

| Layer | Target Coverage | Critical Paths |
|-------|----------------|----------------|
| Domain | 90%+ | ✅ Already met |
| Use Cases | 80%+ | Create, Switch, Update |
| Controllers | 90%+ | Auth, validation, errors |
| Components | 70%+ | User interactions |
| E2E | 5 flows | Core user journeys |

---

## 9. Continuous Integration

### GitHub Actions Workflow
```yaml
name: Epic 1 Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: pnpm install

      - name: Run domain tests
        run: pnpm test:domain

      - name: Run use case tests
        run: pnpm test:usecases

      - name: Run API tests
        run: pnpm test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 10. Next Steps After Testing

Once all tests pass:
1. ✅ Code review (if working in a team)
2. ✅ Update documentation with test results
3. ✅ Merge to main branch
4. ✅ Deploy to staging environment
5. ✅ Manual QA testing
6. ✅ Proceed to **Epic 2: Workspace Management**

---

## Summary

**Total Test Files to Create:** 9 files
**Estimated Time:** 15-20 hours
**Priority:** HIGH for Phase 1 (use cases + API), MEDIUM for Phase 2 (frontend)

**Current Status:**
- ✅ Domain tests: 55/55 passing
- ⏳ Use case tests: 0 (5 files to create)
- ⏳ API tests: 0 (1 file to create)
- ⏳ Component tests: 0 (3 files to create)
- ⏳ E2E tests: 0 (optional)

**Recommended Action:** Start with Phase 1 (Use Case Tests + API Integration Tests) as they provide the highest value for validating business logic and API contracts.
