# Story 3-1: Validation Engine - Multi-criteria Scoring

**Epic:** 3 - Clarification & Validation  
**Status:** In Progress  
**Created:** 2026-02-02

## Story Overview

Build a validation engine that scores generated AEC tickets against multiple criteria to ensure quality and completeness before presenting them to users.

## User Story

**As a** user creating executable tickets  
**I want** generated tickets to be automatically validated for quality  
**So that** I can trust the output meets production standards without manual review

## Business Value

- **Quality Assurance**: Catch incomplete or low-quality tickets before developers see them
- **Trust Building**: Users gain confidence in AI-generated output
- **Reduced Rework**: Fewer back-and-forth iterations when tickets are validated upfront
- **Foundation for Clarification**: Validation scores identify what needs clarification (Story 3-2)

## Acceptance Criteria

### AC #1: Validation Criteria Definition
- [ ] Define 5-7 validation criteria for AEC tickets:
  - Completeness (all required sections present)
  - Clarity (requirements are specific and unambiguous)
  - Testability (acceptance criteria are measurable)
  - Feasibility (no obvious technical impossibilities)
  - Consistency (no contradictions within the ticket)
  - Context Alignment (matches repository code if context provided)
  - Scope Appropriateness (not too broad or too narrow)

### AC #2: Scoring Algorithm
- [ ] Each criterion has:
  - Weight (importance: 0.0-1.0)
  - Scoring function (returns 0.0-1.0)
  - Pass threshold (minimum score to pass)
- [ ] Overall score calculated as weighted average
- [ ] Minimum overall threshold: 0.7 (70%)

### AC #3: ValidationResult Domain Model
- [ ] Create `ValidationResult` value object with:
  - `criterion: ValidatorType` (enum of validator types)
  - `passed: boolean`
  - `score: number` (0.0-1.0)
  - `weight: number` (0.0-1.0)
  - `issues: string[]` (specific problems found)
  - `blockers: string[]` (critical issues preventing pass)
  - `message: string` (summary explanation)

### AC #4: ValidationEngine Service
- [ ] Application service: `ValidationEngine`
- [ ] Method: `validate(aec: AEC): Promise<ValidationResult[]>`
- [ ] Runs all validators in parallel
- [ ] Returns array of validation results
- [ ] Deterministic (same input = same output)

### AC #5: Individual Validators
- [ ] Implement validator for each criterion
- [ ] Each validator is a separate class/function
- [ ] Validators use LLM for subjective criteria (clarity, feasibility)
- [ ] Validators use rules for objective criteria (completeness, testability)

### AC #6: AEC Domain Integration
- [ ] Add `validationResults: ValidationResult[]` to AEC aggregate
- [ ] Add method: `validate(results: ValidationResult[]): void`
- [ ] Updates AEC status based on validation
- [ ] Stores validation results for UI display

### AC #7: Persistence
- [ ] ValidationResults stored in Firestore with AEC
- [ ] Mapped to/from domain correctly
- [ ] Can retrieve validation history

### AC #8: Step 6 Integration
- [ ] Update GenerationOrchestrator Step 6 (currently stub)
- [ ] Call ValidationEngine after ticket drafting
- [ ] Store results in AEC
- [ ] Continue to next step (questions) regardless of score

## Technical Specifications

### Domain Layer

**ValidationResult Value Object:**
```typescript
enum ValidatorType {
  COMPLETENESS = 'completeness',
  CLARITY = 'clarity',
  TESTABILITY = 'testability',
  FEASIBILITY = 'feasibility',
  CONSISTENCY = 'consistency',
  CONTEXT_ALIGNMENT = 'context_alignment',
  SCOPE = 'scope',
}

interface ValidationResultProps {
  criterion: ValidatorType;
  passed: boolean;
  score: number;        // 0.0 to 1.0
  weight: number;       // 0.0 to 1.0
  issues: string[];
  blockers: string[];
  message: string;
}

class ValidationResult {
  static create(props: ValidationResultProps): ValidationResult
  get weightedScore(): number  // score * weight
  isPassing(): boolean
  hasCriticalIssues(): boolean
}
```

**AEC Updates:**
```typescript
class AEC {
  private validationResults: ValidationResult[] = [];
  
  validate(results: ValidationResult[]): void {
    this.validationResults = results;
    // Update status or flags if needed
  }
  
  get overallValidationScore(): number {
    // Calculate weighted average
  }
  
  get validationPassed(): boolean {
    // Check if all critical validators passed
  }
}
```

### Application Layer

**ValidationEngine Service:**
```typescript
interface IValidationEngine {
  validate(aec: AEC): Promise<ValidationResult[]>;
}

class ValidationEngine implements IValidationEngine {
  constructor(
    private validators: IValidator[],
    private llmService: ILLMContentGenerator
  ) {}
  
  async validate(aec: AEC): Promise<ValidationResult[]> {
    // Run all validators in parallel
    const results = await Promise.all(
      this.validators.map(v => v.validate(aec))
    );
    return results;
  }
}
```

**Validator Interface:**
```typescript
interface IValidator {
  readonly type: ValidatorType;
  readonly weight: number;
  readonly passThreshold: number;
  
  validate(aec: AEC): Promise<ValidationResult>;
}
```

### Infrastructure Layer

**Example Validators:**

1. **CompletenessValidator** (Rule-based)
   - Checks all required sections present
   - Verifies minimum content length
   - Weight: 1.0 (critical)
   - Pass threshold: 0.9

2. **ClarityValidator** (LLM-based)
   - Uses LLM to assess requirement clarity
   - Identifies vague or ambiguous statements
   - Weight: 0.8
   - Pass threshold: 0.7

3. **TestabilityValidator** (Rule + LLM)
   - Checks if ACs are measurable
   - Verifies success criteria exist
   - Weight: 0.9
   - Pass threshold: 0.8

4. **ContextAlignmentValidator** (LLM-based)
   - If repository context provided, checks alignment
   - Verifies suggested files actually exist in codebase
   - Weight: 0.7 (only if context available)
   - Pass threshold: 0.7

### GenerationOrchestrator Update

**Step 6 (Currently Stub):**
```typescript
// Step 6: Validation
const validationResults = await this.executeStep(aec, 6, async () => {
  return await this.validationEngine.validate(aec);
});

// Store validation results
aec.validate(validationResults);
await this.aecRepository.update(aec);

// Log validation summary
const overallScore = aec.overallValidationScore;
console.log(`✅ Validation complete: ${(overallScore * 100).toFixed(0)}%`);

if (!aec.validationPassed) {
  console.warn('⚠️ Some validation criteria not met');
}

// Continue to next step regardless (questions can address issues)
```

## Architecture Decisions

### Decision 1: Separate Validators vs Monolithic
**Choice:** Separate validator classes  
**Rationale:** 
- Easy to add/remove validators
- Each validator can be tested independently
- Clear separation of concerns
- Can adjust weights per validator

### Decision 2: Parallel vs Sequential Validation
**Choice:** Parallel execution  
**Rationale:**
- Validators are independent
- Faster execution (especially with LLM calls)
- All issues identified in one pass

### Decision 3: Pass/Fail vs Score Only
**Choice:** Both - score + pass threshold  
**Rationale:**
- Scores show degree of quality
- Pass/fail provides clear gate for critical criteria
- Weighted scores allow nuanced assessment

### Decision 4: Block on Failure vs Continue
**Choice:** Continue to next steps (questions)  
**Rationale:**
- Questions step can address validation issues
- Don't want to completely block user
- Validation informs question generation (Story 3-2)
- User sees validation results in UI (Story 3-3)

## Tasks

### Task 1: Domain Models
- [ ] Create `ValidatorType` enum
- [ ] Create `ValidationResult` value object
- [ ] Add validation methods to AEC aggregate
- [ ] Write unit tests

### Task 2: Validator Interface & Base
- [ ] Define `IValidator` interface
- [ ] Create base validator class with common logic
- [ ] Set up validator registration pattern

### Task 3: Rule-Based Validators
- [ ] CompletenessValidator
- [ ] TestabilityValidator (rule portion)
- [ ] Write unit tests for each

### Task 4: LLM-Based Validators
- [ ] Add validation prompts to LLM service
- [ ] ClarityValidator
- [ ] FeasibilityValidator
- [ ] ConsistencyValidator
- [ ] ContextAlignmentValidator
- [ ] Write integration tests

### Task 5: ValidationEngine Service
- [ ] Create application service
- [ ] Implement parallel validation
- [ ] Calculate weighted scores
- [ ] Write tests with mock validators

### Task 6: Persistence
- [ ] Add ValidationResult to Firestore schema
- [ ] Update AECMapper to handle validation results
- [ ] Test persistence round-trip

### Task 7: GenerationOrchestrator Integration
- [ ] Replace Step 6 stub with actual validation
- [ ] Store results in AEC
- [ ] Add logging and error handling
- [ ] Test end-to-end generation flow

### Task 8: Testing
- [ ] Unit tests for all validators
- [ ] Integration tests for ValidationEngine
- [ ] End-to-end test: ticket creation → validation
- [ ] Test edge cases (missing sections, empty content, etc.)

## Testing Strategy

### Unit Tests
- Each validator independently
- ValidationResult value object
- AEC validation methods
- Score calculations

### Integration Tests
- ValidationEngine with multiple validators
- Persistence (save/load validation results)
- GenerationOrchestrator Step 6

### End-to-End Tests
- Create ticket → Generate → Validate → Verify results stored
- Test with good ticket (should pass all)
- Test with poor ticket (should fail some criteria)
- Test with repository context

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tasks completed
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests passing
- [ ] End-to-end test passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] No regression in existing tests
- [ ] Story demonstrated to stakeholders

## Dependencies

**Depends On:**
- Epic 2 (AEC domain model exists)
- Story 4-2 (Code indexing for context alignment validation)

**Blocks:**
- Story 3-2 (Question generation needs validation results)
- Story 3-3 (UI needs validation results to display)

## Notes

- Validators should be configurable (weights, thresholds) via config
- Consider making validator set pluggable for future custom validators
- LLM prompts for validation should be deterministic (temperature = 0)
- Validation is informative, not blocking - user always sees the ticket
- Future: Allow users to adjust validation criteria/weights

## Story Context Reference

Story context will be generated after story approval containing:
- Existing AEC domain model structure
- GenerationOrchestrator current implementation
- LLM service interface
- Repository patterns in use
