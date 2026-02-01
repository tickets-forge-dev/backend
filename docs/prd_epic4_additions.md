# Epic 4 Additions to PRD

## Epic 4: Code Intelligence & Estimation

### Overview
Connects tickets to actual codebase, enabling:
- Real validation based on code structure
- Safety zone detection
- Accurate effort estimation
- Drift detection when code changes

### New Story: 4.0 - Branch Selection & Default Detection

**Added**: 2026-02-01  
**Priority**: Critical (blocks all other Epic 4 stories)

**Problem**: 
- Default branch varies by repository (main, master, develop, etc.)
- PMs need to control which branch to analyze
- Code state differs across branches

**Solution**:
- Auto-detect default branch via GitHub API
- Cache default per repository
- Manual branch selector with metadata
- Store branch context in AEC for drift detection

**User Experience**:
```
Ticket Creation Form (Updated):
┌────────────────────────────────┐
│ Title *                        │
│ Description (optional)         │
│                                │
│ Repository & Branch *          │
│ ┌────────────────────────────┐ │
│ │ owner/repo-name      [✓]   │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │ Branch: main ▼   (default) │ │
│ └────────────────────────────┘ │
│                                │
│ [Generate Ticket]              │
└────────────────────────────────┘
```

**Technical Requirements**:

1. **AEC Schema Extension**:
```typescript
interface AEC {
  // ... existing fields
  repositoryContext: {
    repositoryFullName: string; // "owner/repo"
    branchName: string;         // "main"
    commitSha: string;          // HEAD at generation time
    isDefaultBranch: boolean;
    selectedAt: Date;
  };
}
```

2. **GitHub API Integration**:
- GET /repos/{owner}/{repo} - Fetch default branch
- GET /repos/{owner}/{repo}/branches - List all branches
- GET /repos/{owner}/{repo}/commits/{branch} - Get HEAD commit

3. **Default Branch Detection**:
- Query GitHub API for `default_branch` field
- Fallback to common defaults: main, master, develop, trunk
- Cache per repository (24-hour TTL)

4. **Branch Selector Component**:
- Dropdown with search
- Show branch metadata (last commit, author, CI status)
- Visual indicators (⭐ for default)
- Mobile responsive

**Edge Cases Handled**:
- No GitHub connected → Show "Connect GitHub" prompt
- Empty repository → Display error message
- Deleted branch → Use commit SHA for analysis
- Access revoked → Show reconnect flow
- Custom default branches → Auto-detect correctly

**Validation**:
- Frontend: Repository and branch required
- Backend: Verify repository access + branch existence
- Capture commit SHA for snapshot locking

**Success Metrics**:
- 95% of users stick with default branch
- 0 errors from invalid branch selection
- API response time <500ms

---

## Updated Story Sequence for Epic 4

**Original**: Stories 4.1-4.6 (6 stories)  
**Updated**: Stories 4.0-4.6 (7 stories)

### Story 4.0: Branch Selection (NEW)
**Duration**: 4 days  
**Blocks**: All other Epic 4 stories  
**Status**: Design complete, ready to implement

### Story 4.1: GitHub App Integration
**Duration**: 1 week  
**Depends on**: Story 4.0  
**Changes**: Now uses branch context from 4.0

### Story 4.2: Code Indexing
**Duration**: 1 week  
**Depends on**: Story 4.0, 4.1  
**Changes**: Indexes files from selected branch

### Story 4.6: Safety Zones
**Duration**: 1 week  
**Depends on**: Story 4.0, 4.2  
**Changes**: Analyzes code from correct branch

### Stories 4.3, 4.4, 4.5: OpenAPI, Drift, Estimation
**Changes**: All now branch-aware

---

## Impact on Existing Features

### Epic 2 (Ticket Creation) - Retroactive Enhancement
**Change**: Ticket creation form now requires repository + branch selection  
**Migration**: Existing tickets without branch context remain valid  
**UI Update**: Add BranchSelector component to CreateTicketForm

### Epic 3 (Validation) - Now Depends on Epic 4
**Reason**: Real validation requires code analysis from specific branch  
**Decision**: Skip Epic 3 → Build Epic 4 first → Return to Epic 3

### AEC Domain Model - Schema Update
**Change**: Add `repositoryContext` field (non-breaking)  
**Migration**: Existing AECs have `repositoryContext = null`  
**Validation**: New AECs must have repository context

---

## Implementation Timeline

### Phase 1: Story 4.0 (4 days)
- Day 1: Backend schema + GitHub API client
- Day 2: Frontend BranchSelector component
- Day 3: Integration + validation
- Day 4: Testing + edge cases

### Phase 2: Stories 4.1-4.2 (2 weeks)
- Week 1: GitHub App OAuth + webhooks
- Week 2: Code indexing from selected branch

### Phase 3: Stories 4.6, 4.5, 4.3, 4.4 (2 weeks)
- Week 1: Safety zones + estimation
- Week 2: OpenAPI sync + drift detection

**Total Epic 4 Duration**: ~4 weeks

---

## Risk Mitigation

**Risk**: Branch selection adds complexity to ticket creation  
**Mitigation**: Auto-select default, 95% of users never change it

**Risk**: GitHub API rate limits  
**Mitigation**: Cache default branches, batch requests

**Risk**: Deleted branches break drift detection  
**Mitigation**: Store commit SHA, can still analyze historical state

**Risk**: Users don't understand branch selection  
**Mitigation**: Clear UI labels, "(default)" indicator, help text

---

## Success Criteria for Epic 4

### Functional:
- ✅ 100% of new tickets have branch context
- ✅ Safety zones detect danger files accurately (85%+ precision)
- ✅ Estimation within 30% of actual effort
- ✅ Drift detection alerts when code changes

### Non-Functional:
- ✅ Branch selection <500ms response time
- ✅ Code indexing <30s for average repo
- ✅ Zero data loss during branch deletion
- ✅ 99.9% uptime for GitHub integration

### User Experience:
- ✅ 95% of users keep default branch
- ✅ <2% support tickets about branch selection
- ✅ 4.5+/5 confidence in generated tickets
- ✅ 0 production incidents from AI suggestions

---

## Documentation References

- **Branch Selection Design**: `docs/sprint-artifacts/4-1-branch-selection-design.md`
- **Safety Zones UI/UX**: `docs/ui-specs/safety-zones-ui-spec.md`
- **Safety Zones Spec**: `docs/prd_safety_zones_addition.md`
- **Sprint Status**: `docs/sprint-artifacts/sprint-status.yaml`

---

**Status**: ✅ Ready for Implementation  
**Next**: Begin Story 4.0 implementation  
**Date**: 2026-02-01
