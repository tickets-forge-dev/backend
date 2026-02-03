# Epic 7 Completion Roadmap

**Epic**: Code-Aware Validation System
**Created**: 2026-02-03
**Status**: 70% Complete (7/10 stories done)
**Target Completion**: February 23, 2026

---

## Overview

This roadmap outlines the path to completing Epic 7, including remaining work on Story 7.10, testing strategy, rollout plan, and acceptance criteria for epic closure.

---

## Current State (2026-02-03)

### Completed Stories (7/10)
- ✅ **7.1**: Architecture Design
- ✅ **7.2**: Workspace Integration
- ✅ **7.3**: Quick Preflight Validator
- ✅ **7.5**: Validator Framework
- ✅ **7.6**: Findings to Questions Agent
- ✅ **7.8**: Drift Detection
- ✅ **7.9**: Ticket Input Validation

### In Progress (1/10)
- 🔄 **7.10**: Mastra Workflow Refactor (15% complete)
  - ✅ Phase A: Critical fixes (4/4)
  - ⏳ Phase B: High priority fixes (1/5)
  - ⏳ Phase C: Testing (0/10)
  - ⏳ Phase D: Frontend (0/3)

### Deferred (2/10)
- ⏸️ **7.4**: API Context Gathering → Epic 8
- ⏸️ **7.7**: Real-time Progress → Covered by 7.10

---

## Remaining Work Breakdown

### Story 7.10: Mastra Workflow Refactor

#### Phase B: High Priority Fixes (6-9 hours)

**Fix #6: Race Condition Prevention** (2-3 hours)
- Add locking fields to AEC domain:
  - `isLocked: boolean`
  - `lockedBy: string` (workflow ID)
  - `lockedAt: Date`
- Add methods: `lockForWorkflow()`, `unlock()`
- Update UpdateAECUseCase to check lock
- Add lock/unlock steps to workflow (step 0 and step 12)
- Update mapper to persist lock state

**Fix #7: State Transition Validation** (1-2 hours)
- Define state machine in AEC domain
- Add `transitionTo()` method with validation
- Define valid transitions per status
- Validate required fields (e.g., AC required for `ready`)
- Update all use cases to use `transitionTo()`

**Fix #8: Workspace Readiness Check** (2-3 hours)
- Add `getIndexStatus()` to IndexQueryService
- Update workflow step 5 to check readiness
- Return graceful message if indexing in progress
- Add UI banner: "Repository indexing in progress..."

**Fix #9: Async Error Handling** (1 hour)
- Add `markAsFailed()` to AEC domain
- Update CreateTicketUseCase catch block
- Ensure error persisted to Firestore
- Add retry logic (optional)

**Deliverable**: Data integrity, no race conditions, better error visibility.

---

#### Phase C: Testing (4-6 hours)

**Integration Tests** (3-4 hours)
- Test Case 1: Happy path without repository
- Test Case 2: Happy path with repository
- Test Case 3: Suspension at findings review
- Test Case 4: Suspension at questions
- Test Case 5: Service unavailable (graceful degradation)
- Test Case 6: Indexing in progress (graceful message)
- Test Case 7: User edit during workflow (blocked by lock)
- Test Case 8: Data persistence verification
- Test Case 9: State transition validation (reject invalid)
- Test Case 10: Resume after crash

**Manual Testing** (1-2 hours)
- Create ticket with various inputs
- Verify suspension points work
- Test user interactions (proceed/edit/cancel)
- Verify real-time progress updates
- Test error scenarios

**Deliverable**: High confidence in production readiness.

---

#### Phase D: Frontend Implementation (8-12 hours)

**Component 1: TicketGenerationProgress** (3-4 hours)
```typescript
// client/src/tickets/components/TicketGenerationProgress.tsx

Features:
- Step-by-step progress indicator
- Real-time updates via Firestore subscription
- Allow navigation away (non-blocking)
- "View Draft" button (shows partial content)

States:
- Loading (spinner)
- In Progress (steps with checkmarks/spinner/pending)
- Suspended (show appropriate modal/panel)
- Complete (transition to ticket detail)
- Failed (show error message)
```

**Component 2: FindingsReviewModal** (2-3 hours)
```typescript
// client/src/tickets/components/FindingsReviewModal.tsx

Features:
- Modal dialog (blocking)
- List of findings with severity badges
- Detailed message + suggestion per finding
- Action buttons: Proceed / Edit / Cancel
- Resume workflow on action

Design:
- Critical findings: Red background
- Warning findings: Yellow background
- Info findings: Blue background
```

**Component 3: QuestionsWizard** (3-5 hours)
```typescript
// client/src/tickets/components/QuestionsWizard.tsx

Features:
- Wizard-style form (one question at a time)
- Side panel showing draft content (context)
- Navigation: Previous / Next buttons
- Action buttons: Skip All / Submit
- Support question types: text, textarea, multiple choice, single choice

States:
- Question view (current question)
- Review view (all answers)
- Submitting (loading)
```

**Hook: useWorkflowProgress** (1-2 hours)
```typescript
// client/src/tickets/hooks/useWorkflowProgress.ts

Features:
- Subscribe to AEC.generationState in Firestore
- Return current workflow state
- Handle reconnection (if user loses connection)
- Unsubscribe on unmount

Usage:
const { workflowState, currentStep, findings, questions } = useWorkflowProgress(aecId);
```

**Deliverable**: Complete HITL UI, transparent progress.

---

## Timeline (3-Week Completion)

### Week 1: Feb 3-9 (Backend Complete)
**Goal**: Finish Phase B+C, deploy backend to staging

| Day | Tasks | Hours | Status |
|-----|-------|-------|--------|
| Mon Feb 3 | Phase A complete (DONE) | - | ✅ |
| Tue Feb 4 | Fix #6 (race conditions) | 3 | ⏳ |
| Wed Feb 5 | Fix #7 (state validation) | 2 | ⏳ |
| Thu Feb 6 | Fix #8 (readiness check) | 3 | ⏳ |
| Fri Feb 7 | Fix #9 (error handling) | 1 | ⏳ |
| Sat-Sun | Integration tests (10 cases) | 4 | ⏳ |

**Deliverable**: Backend ready for production, all tests passing.

---

### Week 2: Feb 10-16 (Frontend Complete)
**Goal**: Finish Phase D, deploy frontend to staging, alpha test

| Day | Tasks | Hours | Status |
|-----|-------|-------|--------|
| Mon Feb 10 | TicketGenerationProgress component | 4 | ⏳ |
| Tue Feb 11 | FindingsReviewModal component | 3 | ⏳ |
| Wed Feb 12 | QuestionsWizard component (part 1) | 3 | ⏳ |
| Thu Feb 13 | QuestionsWizard component (part 2) | 2 | ⏳ |
| Fri Feb 14 | useWorkflowProgress hook | 2 | ⏳ |
| Sat-Sun | Alpha testing (internal team) | 4 | ⏳ |

**Deliverable**: Complete HITL UI, alpha feedback collected.

---

### Week 3: Feb 17-23 (Beta + Production)
**Goal**: Beta rollout, iterate, production launch

| Day | Tasks | Hours | Status |
|-----|-------|-------|--------|
| Mon Feb 17 | Bug fixes from alpha | 3 | ⏳ |
| Tue Feb 18 | Beta rollout (10-20 users) | 2 | ⏳ |
| Wed Feb 19 | Monitor beta metrics | 2 | ⏳ |
| Thu Feb 20 | Iterate based on feedback | 3 | ⏳ |
| Fri Feb 21 | Production deployment prep | 2 | ⏳ |
| Sat Feb 22 | Production rollout (phased) | 3 | ⏳ |
| Sun Feb 23 | Monitor production metrics | 2 | ⏳ |

**Deliverable**: Epic 7 complete, fully deployed to production.

---

## Testing Strategy

### Unit Tests (Completed)
- ✅ Validator tests (7 validators)
- ✅ Agent tests (3 agents)
- ✅ Domain tests (AEC, RepositoryContext)

### Integration Tests (Phase C)
**Backend Workflow Tests**:
```typescript
describe('Ticket Generation Workflow', () => {
  it('should complete happy path without repository', async () => {
    const aec = await createTicket({ title: 'Test', repositoryContext: null });
    await waitForWorkflowCompletion(aec.id);
    const result = await getAEC(aec.id);
    expect(result.status).toBe('ready');
    expect(result.acceptanceCriteria).toBeDefined();
  });

  it('should suspend at findings review if critical issues', async () => {
    const aec = await createTicket({ title: 'Delete production database' });
    await waitForSuspension(aec.id);
    const result = await getAEC(aec.id);
    expect(result.generationState.status).toBe('suspended');
    expect(result.generationState.suspensionReason).toBe('critical_findings');
  });

  // ... 8 more test cases
});
```

**Frontend Component Tests**:
```typescript
describe('TicketGenerationProgress', () => {
  it('should show progress indicator during generation', () => {
    render(<TicketGenerationProgress aecId="test-id" />);
    expect(screen.getByText('Generating ticket content...')).toBeInTheDocument();
  });

  it('should update steps in real-time', async () => {
    // Mock Firestore updates
    // Verify checkmarks appear as steps complete
  });

  // ... more component tests
});
```

### End-to-End Tests (Production Monitoring)
- Track completion rates in production
- Monitor for errors/crashes
- Measure user satisfaction

---

## Rollout Plan

### Stage 1: Staging Deployment (Week 1)
**Audience**: Development team only
**Goal**: Verify backend works end-to-end
**Actions**:
- Deploy backend to staging
- Run all integration tests
- Manual testing via API (Postman)
- Fix any critical bugs

**Success Criteria**:
- All integration tests pass
- No runtime errors in logs
- Data persisted correctly

---

### Stage 2: Alpha Testing (Week 2)
**Audience**: Internal team (5-10 people)
**Goal**: Validate frontend UX, collect feedback
**Actions**:
- Deploy frontend to staging
- Create 5-10 test tickets
- Monitor suspension points
- Collect UX feedback

**Success Criteria**:
- Workflow completes > 90% of the time
- Users find suspension points helpful
- No critical bugs reported

---

### Stage 3: Beta Rollout (Week 3)
**Audience**: Select users (10-20)
**Goal**: Validate at scale, identify edge cases
**Actions**:
- Enable for beta users in production
- Create 20-30 real tickets
- Monitor metrics (completion rate, time, abandonment)
- Iterate based on data

**Success Criteria**:
- Completion rate > 95%
- Time to ready < 60 seconds (median)
- Abandonment rate < 5%
- Positive user feedback

---

### Stage 4: Production Launch (Week 3)
**Audience**: All users
**Goal**: Full rollout, monitor metrics
**Actions**:
- Gradual rollout (10% → 50% → 100%)
- Monitor error rates
- Track user satisfaction
- Set up alerts for failures

**Success Criteria**:
- Error rate < 1%
- User satisfaction > 80%
- Support tickets < 5 per week

---

## Success Metrics

### Quantitative
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Workflow Completion Rate | > 95% | TBD | ⏳ |
| Time to Ready (median) | < 60s | TBD | ⏳ |
| User Actions Required (median) | 0-2 | TBD | ⏳ |
| Abandonment Rate | < 5% | TBD | ⏳ |
| Edit Rate After Completion | < 20% | TBD | ⏳ |
| Crash Recovery Rate | 100% | TBD | ⏳ |

### Qualitative
- [ ] Users feel more confident in generated tickets
- [ ] Users appreciate transparency of progress
- [ ] Users find questions helpful (not annoying)
- [ ] Users trust critical findings
- [ ] Team velocity increases (fewer back-and-forth iterations)

---

## Acceptance Criteria (Epic Closure)

### Functional Requirements
- [ ] All 10 stories complete (7.1-7.10)
- [ ] Workflow executes without runtime errors
- [ ] Workflow suspends at critical decision points
- [ ] User can review findings and proceed/edit/cancel
- [ ] User can answer questions and refine draft
- [ ] Generated content persisted to AEC
- [ ] Real-time progress visible in UI
- [ ] Workflow resumes after server crash
- [ ] Graceful degradation when services unavailable

### Non-Functional Requirements
- [ ] All integration tests passing (10/10)
- [ ] Code coverage > 80%
- [ ] No critical bugs in production
- [ ] Documentation complete (architecture, UX, API)
- [ ] Performance acceptable (< 60s median completion time)
- [ ] Cost acceptable (< $50/month LLM APIs)

### Business Requirements
- [ ] Completion rate > 95%
- [ ] User satisfaction > 80%
- [ ] Edit rate < 20%
- [ ] Support tickets < 5/week
- [ ] Team velocity improvement measurable

---

## Risk Management

### Risk #1: Timeline Slippage
**Likelihood**: MEDIUM
**Impact**: HIGH
**Mitigation**:
- Phase-based approach allows partial delivery
- Focus on MVP first (skip nice-to-haves)
- Daily standup to catch blockers early
- Buffer time in Week 3 (17% contingency)

### Risk #2: Frontend Complexity
**Likelihood**: MEDIUM
**Impact**: MEDIUM
**Mitigation**:
- Comprehensive UX spec already created
- Wireframes provide clear direction
- Use existing component library (shadcn)
- Pair programming for complex components

### Risk #3: Production Issues
**Likelihood**: LOW
**Impact**: HIGH
**Mitigation**:
- Gradual rollout (10% → 50% → 100%)
- Feature flag (can disable instantly)
- Comprehensive monitoring and alerts
- Rollback plan (revert to GenerationOrchestrator)

### Risk #4: User Adoption
**Likelihood**: LOW
**Impact**: MEDIUM
**Mitigation**:
- Alpha testing reveals UX issues early
- Beta feedback drives iteration
- In-app onboarding (tutorial/walkthrough)
- Support documentation ready

---

## Dependencies

### Internal (Epic Dependencies)
- ✅ Epic 4: Repository Indexing (COMPLETE)
- ✅ Epic 6: LLM Infrastructure (COMPLETE)
- 🔄 Epic 7: Code-Aware Validation (THIS EPIC)
- ⏸️ Epic 8: Implementation Assistance (BLOCKED on Epic 7)
- ⏸️ Epic 9: Code Generation (BLOCKED on Epic 7)

### External (Technology Dependencies)
- ✅ Mastra Framework (stable, documented)
- ✅ Firebase/Firestore (reliable)
- ✅ Anthropic/OpenAI APIs (99.9% uptime)
- ✅ LibSQL (Mastra-managed, proven)

---

## Budget

### Time Budget
| Phase | Estimated | Actual | Remaining |
|-------|-----------|--------|-----------|
| Stories 7.1-7.9 | 40h | 50h | - |
| Story 7.10 Phase A | 4h | 4h | - |
| Story 7.10 Phase B | 9h | 2h | 7h |
| Story 7.10 Phase C | 6h | 0h | 6h |
| Story 7.10 Phase D | 12h | 0h | 12h |
| Alpha Testing | 4h | 0h | 4h |
| Beta Testing | 6h | 0h | 6h |
| Production Rollout | 3h | 0h | 3h |
| **TOTAL** | **84h** | **56h** | **38h** |

**Projected Total**: 94 hours (10% over estimate, acceptable)

### Cost Budget (LLM APIs)
| Month | Estimated | Actual | Status |
|-------|-----------|--------|--------|
| January | $20 | $15 | ✅ Under |
| February | $30 | TBD | ⏳ On track |
| March | $50 | TBD | ⏳ Projected |

**Annual Projected**: $500-600 (well within budget)

---

## Communication Plan

### Daily Standups (During Story 7.10)
- What was completed yesterday?
- What's planned for today?
- Any blockers?
- On track for weekly milestone?

### Weekly Updates (Stakeholders)
- Progress summary (% complete)
- Metrics update (if in testing/production)
- Risks/issues
- Next week's plan

### Epic Closure (Feb 23)
- Demo to stakeholders
- Metrics review (quantitative + qualitative)
- Retrospective (lessons learned)
- Handoff to Epic 8 team

---

## Retrospective Planning

### Questions to Answer
1. **What went well?**
   - What practices should we continue?
   - What decisions were correct?

2. **What could improve?**
   - What slowed us down?
   - What would we do differently?

3. **Actions for next epic**
   - Specific process improvements
   - Technology/architecture changes
   - Team structure adjustments

### Data to Collect
- Velocity per story
- Bug count (critical/high/medium/low)
- Test coverage per component
- Time spent on rework
- User satisfaction scores

---

## Next Epic Preview (Epic 8)

**Title**: Implementation Assistance
**Goal**: Guide developers through ticket implementation with AI assistance
**Dependencies**: Epic 7 (validated tickets with structured ACs)
**Stories**:
- 8.1: Task breakdown (AC → subtasks)
- 8.2: Code scaffolding (generate boilerplate)
- 8.3: Test generation (generate test cases from ACs)
- 8.4: PR review assistance (validate against ACs)
- 8.5: Documentation generation (README, API docs)

**Estimated Duration**: 6-8 weeks

---

## Conclusion

Epic 7 is **70% complete** with clear path to completion in **3 weeks**.

**Remaining Work**:
- Week 1: Backend fixes + testing (Phase B+C)
- Week 2: Frontend implementation + alpha (Phase D)
- Week 3: Beta + production rollout

**Risk Level**: LOW (no major blockers, clear plan)

**Confidence**: HIGH (85% confident in Feb 23 delivery)

**Recommendation**: Proceed with plan, maintain daily standups, monitor risks.

---

**Last Updated**: 2026-02-03
**Next Update**: 2026-02-10 (after Week 1 completion)
