# Epic 4: Code Intelligence & Estimation - Complete Guide

**Status**: In Progress  
**Start Date**: 2026-02-01  
**Duration**: 4 weeks  
**Stories**: 7 (4.0 - 4.6)

---

## 🎯 Epic Goals

Transform Forge from an AI ticket writer into a **code-aware intelligent system** that:

1. **Connects to Real Code**: Analyze actual repository structure
2. **Detects Safety Zones**: Identify dangerous modifications automatically
3. **Provides Accurate Estimates**: Base effort on code complexity
4. **Tracks Code Changes**: Alert when code drifts from tickets

---

## 📊 Story Overview

| Story | Title | Duration | Status | Priority |
|-------|-------|----------|--------|----------|
| 4.0 | Branch Selection & Default Detection | 4 days | Ready | Critical |
| 4.1 | GitHub App Integration | 1 week | Backlog | High |
| 4.2 | Code Indexing | 1 week | Backlog | High |
| 4.6 | Safety Zones Detection | 1 week | Backlog | High |
| 4.5 | Effort Estimation | 3 days | Backlog | Medium |
| 4.3 | OpenAPI Spec Sync | 3 days | Backlog | Medium |
| 4.4 | Drift Detection | 3 days | Backlog | Low |

---

## 🏗️ Architecture Overview

### Before Epic 4:
```
User Input → AI → Ticket (hallucinated content)
```

### After Epic 4:
```
User Input → Repository Analysis → AI + Code Context → Validated Ticket
                    ↓
            Real code structure
            Actual file paths
            Safety zones
            Complexity metrics
            API contracts
```

---

## 📋 Story Details

### Story 4.0: Branch Selection & Default Detection

**Why First**: All other stories need to know which branch to analyze.

**What It Does**:
- Auto-detects repository default branch (main, master, develop, etc.)
- Allows manual branch selection via dropdown
- Stores branch context in AEC for drift detection
- Caches default branch per repository

**Deliverables**:
1. `repositoryContext` field added to AEC domain model
2. GitHub API client for branch operations
3. `BranchSelector` UI component
4. Backend validation for repository + branch access
5. Firestore schema migration

**User Experience**:
```
Before: [Title] [Description] [Generate]
After:  [Title] [Description] [Repository] [Branch ▼] [Generate]
```

**Technical Details**:
- GitHub API: `/repos/{owner}/{repo}` for default branch
- GitHub API: `/repos/{owner}/{repo}/branches` for list
- GitHub API: `/repos/{owner}/{repo}/commits/{branch}` for HEAD SHA
- Cache: 24-hour TTL per repository

**Files to Create/Modify**:
```
Backend:
  src/tickets/domain/aec/AEC.ts (add repositoryContext)
  src/tickets/domain/value-objects/RepositoryContext.ts (new)
  src/shared/infrastructure/github/github-api.service.ts (new)
  src/tickets/presentation/dto/CreateTicketDto.ts (add repo/branch)
  
Frontend:
  client/src/tickets/components/BranchSelector.tsx (new)
  client/src/services/github.service.ts (new)
  client/src/stores/tickets.store.ts (add repo/branch state)
  client/app/(main)/tickets/create/page.tsx (add BranchSelector)
```

**Acceptance Criteria**:
- [ ] User sees repository selector
- [ ] Default branch auto-selected
- [ ] User can manually select different branch
- [ ] Branch context stored in AEC
- [ ] Backend validates repository access
- [ ] Backend validates branch existence
- [ ] Commit SHA captured at generation time
- [ ] UI shows "(default)" indicator
- [ ] Error handling for deleted/invalid branches

**Design Document**: `docs/sprint-artifacts/4-1-branch-selection-design.md`

---

### Story 4.1: GitHub App Integration

**Depends On**: Story 4.0

**What It Does**:
- OAuth integration with GitHub
- Repository access permissions
- Webhook setup for push events
- Read-only access to code

**Key Features**:
- GitHub App installation flow
- Token management and refresh
- Rate limit handling
- Webhook receivers

**GitHub Permissions Required**:
- `contents: read` - Read code files
- `metadata: read` - Repository information
- `webhooks: write` - Drift detection

---

### Story 4.2: Code Indexing

**Depends On**: Stories 4.0, 4.1

**What It Does**:
- Parse repository file structure
- Build searchable index
- Store in Firestore
- Enable fast file lookups

**Indexing Strategy**:
```typescript
interface FileIndex {
  repositoryFullName: string;
  branchName: string;
  commitSha: string;
  files: FileEntry[];
  indexedAt: Date;
}

interface FileEntry {
  path: string;
  type: 'file' | 'directory';
  size: number;
  language: string;
  lastModified: Date;
  complexity?: number; // Lines of code
}
```

**Performance**:
- Index 1000 files in <10 seconds
- Cache indexes per branch
- Incremental updates via webhooks

---

### Story 4.6: Safety Zones Detection

**Depends On**: Stories 4.0, 4.2

**What It Does**:
- Analyze indexed files for danger patterns
- Classify files into zones (safe, caution, danger, readonly)
- Suggest safer alternatives
- Calculate risk scores

**Detection Methods**:
1. **Pattern-Based**: `/auth/`, `/payment/`, `/security/`
2. **Dependency Analysis**: Reference count >50 = danger
3. **Manual Config**: `.forge/safety-config.yaml`
4. **Historical**: Past incidents from git log

**Output**:
```typescript
interface ExecutionZone {
  path: string;
  zoneType: 'safe' | 'caution' | 'danger' | 'readonly';
  riskScore: number; // 0-10
  reason: string;
  restrictions: string[];
  alternatives?: Alternative[];
}
```

---

### Story 4.5: Effort Estimation

**What It Does**:
- Analyze code complexity
- Calculate effort based on file changes
- Consider historical velocity
- Provide confidence intervals

**Factors**:
- Lines of code to modify
- File complexity
- Number of dependencies
- Test coverage requirements
- Historical similar tickets

---

### Story 4.3: OpenAPI Spec Sync

**What It Does**:
- Detect OpenAPI specs in repository
- Parse API contracts
- Version tracking
- Detect breaking changes

---

### Story 4.4: Drift Detection

**What It Does**:
- Compare current branch HEAD vs ticket commit SHA
- Alert when referenced files change
- Show diff of changes
- Suggest ticket updates

---

## 🎯 Implementation Order

### Week 1: Foundation
- **Day 1-4**: Story 4.0 (Branch Selection)
  - Backend schema updates
  - GitHub API client
  - Frontend components
  - Integration testing

### Week 2: GitHub Integration
- **Day 1-3**: Story 4.1 OAuth + App setup
- **Day 4-5**: Webhook infrastructure

### Week 3: Code Intelligence
- **Day 1-4**: Story 4.2 (Code Indexing)
- **Day 5-7**: Story 4.6 (Safety Zones) - start

### Week 4: Advanced Features
- **Day 1-3**: Story 4.6 (Safety Zones) - complete
- **Day 4-5**: Story 4.5 (Estimation)
- **Day 6**: Stories 4.3, 4.4 (OpenAPI, Drift) - planning

---

## 🧪 Testing Strategy

### Unit Tests
- AEC domain model with repositoryContext
- Branch detection logic
- Safety zone classification
- Estimation algorithms

### Integration Tests
- GitHub API mocking
- End-to-end ticket creation with branch
- Code indexing pipeline
- Safety zone detection accuracy

### E2E Tests
- User selects branch → generates ticket → sees safety zones
- Branch deleted → graceful degradation
- Code changes → drift detected

---

## 📈 Success Metrics

### Technical:
- ✅ 100% of tickets have branch context
- ✅ Code indexing <30s for average repo
- ✅ Safety zone detection 85%+ precision
- ✅ Estimation within 30% of actual
- ✅ API response time <500ms

### Product:
- ✅ 95% of users keep default branch
- ✅ 0 production incidents from AI tickets
- ✅ 50% reduction in clarification questions
- ✅ 4.5+/5 user confidence score

### Business:
- ✅ Unique competitive advantage (safety zones)
- ✅ Trustworthy estimates enable better planning
- ✅ Code-aware = enterprise-ready

---

## 🚧 Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| GitHub rate limits | High | Cache aggressively, batch requests |
| Large repos slow indexing | Medium | Incremental indexing, pagination |
| False positive safety zones | Medium | Allow manual overrides |
| Branch selection confusing | Low | Auto-select default, clear UI |
| Users lack GitHub access | High | Clear error messages, setup guide |

---

## 📚 Documentation

### Design Documents:
- [Branch Selection Design](./4-1-branch-selection-design.md)
- [Safety Zones UI/UX](../ui-specs/safety-zones-ui-spec.md)
- [Safety Zones Specification](../prd_safety_zones_addition.md)

### API References:
- [GitHub REST API](https://docs.github.com/en/rest)
- [GitHub Apps](https://docs.github.com/en/developers/apps)

### Internal:
- [Epic 4 PRD Additions](../prd_epic4_additions.md)
- [Sprint Status](./sprint-status.yaml)

---

## 🎓 Key Learnings

### Why Epic 4 Before Epic 3:
- Validation without code = hallucination
- Safety zones need real file analysis
- Estimates need complexity metrics
- Epic 3 becomes valuable only after Epic 4

### Why Branch Selection First:
- Everything else depends on knowing which branch
- Auto-detection prevents user confusion
- Commit SHA enables drift detection
- Non-negotiable foundation

---

## 🚀 Getting Started

### Prerequisites:
- ✅ Epic 1: Foundation complete
- ✅ Epic 1.5: Auth complete
- ✅ Epic 2: Ticket creation complete
- ✅ GitHub account for testing
- ✅ Test repository with multiple branches

### Setup Steps:
1. Create GitHub OAuth App
2. Configure environment variables
3. Run database migrations
4. Test branch detection locally
5. Begin Story 4.0 implementation

---

## 🏁 Definition of Done (Epic 4)

- [ ] All 7 stories complete
- [ ] 100% of tickets have branch context
- [ ] Safety zones visible in UI
- [ ] Code indexing functional
- [ ] Drift detection alerts working
- [ ] Estimation based on real complexity
- [ ] Documentation updated
- [ ] Tests passing (unit + integration + e2e)
- [ ] Demo video created
- [ ] User feedback collected

---

**Next Step**: Begin Story 4.0 implementation

**Current Status**: Documentation complete, ready to code ✅

**Last Updated**: 2026-02-01
