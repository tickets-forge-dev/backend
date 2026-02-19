# Phase 1: Team Foundation Sprint Plan

**Duration:** 2 weeks (10 business days)
**Start Date:** Ready to begin
**Team Capacity:** 1-3 developers
**Goal:** Build foundational multi-team infrastructure - Users can create teams, switch between them, and set up workspaces.

---

## 🎯 Phase 1 Overview

Transform Forge from single-user to multi-team platform. This phase establishes the core data model and API foundation for everything that follows.

### Critical Path (Must Complete)
- **Epic 1:** Team Foundation (10 stories)
- **Epic 2:** Workspace Management (8 stories)
- **Epic 4:** Enhanced Onboarding (4 stories)

### Success Definition
- ✅ Users can create teams
- ✅ Users can switch between multiple teams
- ✅ Users can create workspaces with 1-3 repos
- ✅ Role-based filtering (PM vs Dev) on new onboarding
- ✅ 0 TypeScript errors
- ✅ All acceptance criteria met

---

## 📊 Stories by Week

### **Week 1: Domain & Persistence Layer (Days 1-5)**

**Dev 1 - Epic 1 Backend Foundation (4 stories, 7 days)**
```
1-1: Team Domain Model                    ▓▓ 2 days
1-2: Team Repository (Firestore)          ▓▓ 2 days
1-3: User Domain Extension                ▓  1 day
1-4: Team Use Cases                       ▓▓▓ 3 days
     └─ Blocked: waiting for 1.1, 1.2, 1.3
```

**Dev 2 - Epic 2 Backend Foundation (4 stories, 6 days)**
```
2-1: Workspace Domain Model               ▓▓ 2 days
2-2: Workspace Repository (Firestore)     ▓▓ 2 days
2-3: Workspace Use Cases                  ▓▓ 2 days
     └─ Blocked: waiting for 2.1, 2.2
```

**Dev 3 - Epic 4 Onboarding (1 story, 1 day)**
```
4-1: Onboarding State Machine             ▓  1 day
```

### **Week 2: API & Frontend (Days 6-10)**

**Dev 1 - Epic 1 API & Frontend (6 stories, 8 days)**
```
1-5: Team API Endpoints                   ▓▓ 2 days
1-6: Team Service (Frontend)              ▓  1 day
1-7: Team Store (Zustand)                 ▓  1 day
1-8: Team Switcher UI                     ▓▓ 2 days
1-9: Team Settings Page                   ▓▓ 2 days
1-10: Create Team Dialog                  ▓  1 day
      └─ Dependencies chain from Day 1
```

**Dev 2 - Epic 2 API & Frontend (4 stories, 6 days)**
```
2-4: Workspace API Endpoints              ▓▓ 2 days
2-5: Workspace Service (Frontend)         ▓  1 day
2-6: Workspace Store                      ▓  1 day
2-7: Workspace Selector UI                ▓▓ 2 days
2-8: Workspace Management Page            ▓▓▓ 3 days
     └─ Dependencies chain from Day 1
```

**Dev 3 - Onboarding Frontend (3 stories, 4 days)**
```
4-2: Team Name Step                       ▓  1 day
4-3: Role Selection Step                  ▓▓ 2 days
4-4: Auth Flow Integration                ▓  1 day
     └─ Dependencies: 4.1 from Day 1
```

---

## 🔄 Story Dependencies & Order

### **Critical Path**
```
1-1 (Domain)
├─ 1-2 (Repo)
│  ├─ 1-3 (User Ext)
│  │  ├─ 1-4 (Use Cases)
│  │  │  └─ 1-5 (API)
│  │  │     ├─ 1-6 (Service)
│  │  │     ├─ 1-7 (Store)
│  │  │     └─ 1-8 (UI Switcher)
│  │  └─ 1-9 (Settings Page)
│  │  └─ 1-10 (Create Dialog)
│
2-1 (Domain) ⟶ 2-2 (Repo) ⟶ 2-3 (Use Cases) ⟶ 2-4 (API) ⟶ 2-5, 2-6, 2-7, 2-8
│
4-1 (State Machine) ⟶ 4-2, 4-3, 4-4
```

### **Parallelization Opportunity**
- **Days 1-5:** Dev 1, Dev 2, Dev 3 work independently on domain/persistence
- **Days 6-10:** Dev 1 proceeds with API/Frontend once domain complete; Dev 3 builds onboarding UI

---

## 📋 Stories Overview

### **Epic 1: Team Foundation (10 stories, 17 days)**

| Story | Title | Days | Type | Prerequisites |
|-------|-------|------|------|---|
| 1-1 | Team Domain Model | 2 | Domain | None |
| 1-2 | Team Repository | 2 | Infra | 1-1 |
| 1-3 | User Domain Extension | 1 | Domain | 1-1 |
| 1-4 | Team Use Cases | 3 | Application | 1-1, 1-2, 1-3 |
| 1-5 | Team API Endpoints | 2 | Presentation | 1-4 |
| 1-6 | Team Service (Frontend) | 1 | Service | 1-5 |
| 1-7 | Team Store | 1 | State | 1-5 |
| 1-8 | Team Switcher UI | 2 | Component | 1-7 |
| 1-9 | Team Settings Page | 2 | Page | 1-7 |
| 1-10 | Create Team Dialog | 1 | Component | 1-7 |

### **Epic 2: Workspace Management (8 stories, 15 days)**

| Story | Title | Days | Type | Prerequisites |
|-------|-------|------|------|---|
| 2-1 | Workspace Domain Model | 2 | Domain | None |
| 2-2 | Workspace Repository | 2 | Infra | 2-1 |
| 2-3 | Workspace Use Cases | 2 | Application | 2-1, 2-2 |
| 2-4 | Workspace API Endpoints | 2 | Presentation | 2-3 |
| 2-5 | Workspace Service | 1 | Service | 2-4 |
| 2-6 | Workspace Store | 1 | State | 2-4 |
| 2-7 | Workspace Selector | 2 | Component | 2-6 |
| 2-8 | Workspace Management Page | 3 | Page | 2-6 |

### **Epic 4: Enhanced Onboarding (4 stories, 5 days)**

| Story | Title | Days | Type | Prerequisites |
|-------|-------|------|------|---|
| 4-1 | State Machine | 1 | Application | None |
| 4-2 | Team Name Step | 1 | Component | 4-1 |
| 4-3 | Role Selection | 2 | Component | 4-1 |
| 4-4 | Auth Integration | 1 | Integration | 4-1, 4-3 |

---

## 🔐 Firestore Schema (Phase 1)

```yaml
# Users collection (extended)
/users/{userId}
  userId: string
  email: string
  displayName: string
  photoURL: string

  # NEW: Multi-team support
  currentTeamId: string (nullable)
  teams: string[]  # Array of TeamIds

  createdAt: timestamp
  updatedAt: timestamp

# Teams collection (NEW)
/teams/{teamId}
  id: string (unique)
  name: string
  slug: string (indexed, unique)
  ownerId: string (indexed)
  settings:
    defaultWorkspaceId: string
    allowMemberInvites: boolean
  createdAt: timestamp
  updatedAt: timestamp

# Workspaces under teams (NEW)
/teams/{teamId}/workspaces/{workspaceId}
  id: string (unique within team)
  teamId: string
  name: string
  repositories:
    - name: string
      owner: string
      url: string
      branch: string
  createdBy: string (UID)
  createdAt: timestamp
  updatedAt: timestamp
```

### **Required Firestore Indexes**

```yaml
- Collection: teams
  Fields: (slug: Ascending)

- Collection: teams
  Fields: (ownerId: Ascending)

- Collection: teams/{teamId}/workspaces
  Fields: (createdAt: Descending)
```

---

## 🚦 Definition of Done (Phase 1)

For each story to be marked **done**, it must meet:

### **Domain Stories (1-1, 1-3, 2-1, 4-1)**
- ✅ Entity/value object created with all properties
- ✅ Validation rules implemented
- ✅ Factory pattern used for construction
- ✅ 100% unit test coverage
- ✅ 0 TypeScript errors
- ✅ Code review approved

### **Infrastructure Stories (1-2, 2-2)**
- ✅ Repository interface implemented
- ✅ All CRUD operations working
- ✅ Firestore indexes configured
- ✅ Mapper translates between domain/persistence
- ✅ 100% test coverage (mock Firestore)
- ✅ 0 TypeScript errors

### **Application Stories (1-4, 2-3, 4-2, 4-3)**
- ✅ All use cases/services implemented
- ✅ Validation and error handling
- ✅ 100% test coverage
- ✅ No business logic in layers above
- ✅ 0 TypeScript errors

### **Presentation/Frontend Stories (1-5 through 1-10, 2-4 through 2-8, 4-4)**
- ✅ API endpoints or components working
- ✅ DTO validation (class-validator)
- ✅ Integration tests passing
- ✅ Manual testing in browser/Postman
- ✅ Proper error handling & user feedback
- ✅ 0 TypeScript errors
- ✅ Build passes

### **All Stories**
- ✅ Code committed with co-author tag
- ✅ No linting errors (ESLint/Prettier)
- ✅ Documentation (if needed)

---

## 💡 Implementation Guidance

### **Architecture (Clean Architecture)**
```
Presentation (Controllers/Components)
    ↓ (Data Transfer Objects)
Application (Use Cases/Services)
    ↓ (Domain Models)
Domain (Entities/Value Objects)
    ↑ (Repository Interface)
Infrastructure (Firestore/HTTP)
```

### **Naming Conventions**
- Domain entities: `Team.ts`, `Workspace.ts`
- Use cases: `CreateTeamUseCase.ts`
- Frontend services: `team.service.ts`
- Frontend stores: `team.store.ts` (Zustand)
- Components: `TeamSwitcher.tsx`, `CreateTeamDialog.tsx`

### **Testing Strategy**
- Domain: Unit tests only (mock-free)
- Application: Unit tests with mocked repositories
- Infrastructure: Unit tests with mock Firestore
- Components: Component tests with mock services

### **Error Handling**
- Domain: Throw `DomainException` subclasses
- Application: Translate to `BadRequestException`, `ForbiddenException`
- Controllers: Catch exceptions, return standardized errors
- Frontend: Show user-friendly error messages

---

## 🎯 Success Metrics

### **Velocity**
- **Target:** 22 stories, 37 days total work ÷ 10 days elapsed = 2.2 stories/dev/week
- **Actual:** Track as work progresses

### **Quality**
- **Test Coverage:** Domain 100%, Application 95%+, Infra 90%+
- **Build:** 0 TypeScript errors, all tests green
- **Code Review:** All PRs approved before merge

### **Timeline**
- **Week 1:** Complete all domain & persistence layer
- **Week 2:** Complete all API & frontend
- **By Day 10:** Phase 1 complete, ready for Phase 2 (Members & Roles)

---

## 🚀 Ready to Start?

### **Prerequisites**
- [ ] Read IMPLEMENTATION-PLAN.md for overall context
- [ ] Understand clean architecture pattern
- [ ] Familiar with NestJS + Firebase (backend)
- [ ] Familiar with Next.js + Zustand (frontend)

### **Getting Started**
1. Create feature branches: `feature/epic-1-team-foundation`, etc.
2. Start with Story 1-1 (Team Domain Model)
3. Update sprint-status.yaml as you mark stories ready-for-dev
4. Mark story as in-progress when starting work
5. Create PR when ready for review

### **Daily Standup Points**
- What story are you working on?
- Any blockers?
- When moving to next story?
- Any architectural decisions to discuss?

---

**Status:** 🟢 Ready to Begin Phase 1
**Created:** 2026-02-17
**Last Updated:** 2026-02-17
