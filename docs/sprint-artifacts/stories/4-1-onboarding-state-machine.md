# Story 4.1: Onboarding State Machine

**Epic:** Epic 4 - Enhanced Onboarding  
**Priority:** P0 CRITICAL  
**Effort:** 1 day  
**Status:** drafted  

## Objective
Implement the state machine that guides new users through: signup → team creation → role selection → (conditional) GitHub setup. This controls the flow and validates transitions.

## Acceptance Criteria
- [ ] State machine with 5 states: signup, team_created, role_selected, github_setup, complete
- [ ] Valid transitions enforced (can't skip steps)
- [ ] Progress persisted to localStorage
- [ ] Resume from incomplete onboarding
- [ ] Only Developers see GitHub setup step
- [ ] All states trigger appropriate UI renders
- [ ] Test all transition paths
- [ ] 0 TypeScript errors

## Technical Details

### Files to Create
```
client/src/services/
  └── onboarding.service.ts

client/src/stores/
  └── onboarding.store.ts

client/src/core/components/onboarding/
  ├── OnboardingStateDisplay.tsx
  └── OnboardingStateDisplay.spec.tsx
```

### State Machine Diagram
```
signup 
  ↓ (createTeam)
team_created 
  ↓ (selectRole)
role_selected 
  ↓ (Dev only)
github_setup (optional)
  ↓ (completeOnboarding)
complete
```

## Definition of Done
- ✅ All transitions tested
- ✅ LocalStorage persistence verified
- ✅ Resume functionality working
- ✅ 0 TypeScript errors

