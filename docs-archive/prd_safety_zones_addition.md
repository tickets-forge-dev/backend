# Safety Zones Addition to PRD

## Add after section 9.3 (Clarification)

### 9.4 Safety Review (NEW)
Before export:
- Review zone classifications
- Acknowledge danger zones  
- Request required approvals
- Accept alternatives (optional)

### 9.5 Ready State (Updated)
- Green readiness
- Safety score ≥ threshold (NEW)
- Locked estimate
- Export enabled

---

## Add new section after 10.3

## 11. Safety Zones & Zone-Based Execution (NEW)

### 11.1 Purpose
Safety Zones provide intelligent guard-rails that:
- Detect dangerous code modifications
- Suggest safer alternatives
- Enforce approval workflows
- Reduce production risk

### 11.2 Zone Types

**Safe Zone (Green)**
- New files with no dependencies
- Isolated components/functions
- Test files
- Low-risk utility code
- **No restrictions apply**

**Caution Zone (Yellow)**
- Shared utilities (high usage)
- API contracts (versioned)
- Database schemas
- Config files with broad impact
- **Restrictions**: Preserve interfaces, add tests

**Danger Zone (Red)**
- Authentication/security code
- Payment processing
- Data migration scripts
- Core infrastructure
- Files with past incidents
- **Restrictions**: Security review, senior approvals, high test coverage

**Read-Only Zone (Gray)**
- External dependencies
- Third-party APIs
- Legacy "do not touch" modules
- Scheduled for deprecation
- **Restriction**: Cannot be modified

### 11.3 Detection Strategy

**Pattern-Based**
- Regex matching: `/auth/`, `/payment/`, `/security/`
- File path analysis
- Function name detection

**Dependency Analysis**
- Reference count (>50 refs = danger)
- Import graph traversal
- Breaking change impact

**Manual Configuration**
- Repo-specific `.forge/safety-config.yaml`
- Team-defined danger zones
- Custom restriction rules

**ML-Based (Future)**
- Learn from past incidents
- Predict risky changes
- Improve over time

### 11.4 AEC Schema Extension

```typescript
interface AEC {
  // ... existing fields
  
  // NEW: Safety metadata
  executionZones: ExecutionZone[];
  safetyScore: number; // 0-100
  restrictions: Restriction[];
  approvalRequired: boolean;
}

interface ExecutionZone {
  path: string;
  zoneType: 'safe' | 'caution' | 'danger' | 'readonly';
  riskScore: number; // 0-10
  reason: string;
  restrictions: string[];
  alternatives?: Alternative[];
  metadata: {
    referenceCount?: number;
    lastModified?: Date;
    contributors?: number;
    pastIncidents?: number;
  };
}

interface Restriction {
  type: 'no-delete' | 'preserve-interface' | 'require-review' | 'test-coverage-required';
  paths: string[];
  enforcedBy: 'agent' | 'ci' | 'human';
  requiredApprovers?: string[];
}

interface Alternative {
  title: string;
  description: string;
  steps: string[];
  safetyImprovement: number; // % improvement
}
```

### 11.5 Safety Score Calculation

```
Safety Score = 100 - (Σ zone_risk_score * zone_weight)

Weights:
- Safe zone: 0.1
- Caution zone: 0.3
- Danger zone: 0.8
- Read-only violation: 1.0

Thresholds:
- ≥75: SAFE (green) - Export enabled
- 50-74: CAUTION (amber) - Warnings shown
- <50: HIGH RISK (red) - Approval required
```

### 11.6 UI/UX Requirements

**Safety Overview Card**
- Safety score with color-coded badge
- Zone breakdown (count per type)
- Top risks summary
- Acknowledge button for high-risk tickets

**Zone Detail View**
- Expandable list of affected files
- Risk score per file (visual bar)
- Why dangerous (bullet points)
- Required restrictions (checkboxes)
- Alternative approaches (collapsible)
- GitHub link to view file

**Execution Restrictions Panel**
- Checklist of required approvals
- Request approval buttons
- Status tracking (pending/approved)
- Export button (disabled until cleared)

**Design Reference**: See `docs/ui-specs/safety-zones-ui-spec.md`

### 11.7 Approval Workflow

**Danger Zone Requirements:**
1. Security team review (for auth/payment/security)
2. Two senior engineer approvals
3. Test coverage ≥ 90%
4. Manual QA session (for critical paths)

**Enforcement:**
- Export to Jira/Linear blocked until approvals complete
- Status tracked in AEC.restrictions
- Audit log of all approvals
- Notification system for reviewers

### 11.8 Alternative Suggestion Algorithm

**For each danger zone:**
1. Analyze change intent
2. Generate safer approach:
   - Extract to new module (isolate risk)
   - Refactor first (reduce surface area)
   - Use adapter pattern (preserve interface)
   - Deprecate + replace (parallel implementation)
3. Calculate risk reduction
4. Present in UI with steps

**Example:**
```
Instead of modifying src/auth/session.ts (risk: 9.2):

Option A: Extract & Isolate (Preferred)
- Create src/auth/loginHandler.ts (new file)
- Move login logic to isolated module
- Keep session.ts focused on session mgmt
→ Risk reduction: 9.2 → 3.5 (62% safer)

Option B: Refactor First
- Split session.ts into smaller modules
- Isolate area needing modification
→ Risk reduction: 9.2 → 5.0 (46% safer)
```

### 11.9 Success Metrics

**Safety Outcomes:**
- 50% reduction in production incidents from tickets
- 3x increase in peer reviews for danger zones
- 0 security vulnerabilities from AI-generated tickets

**User Adoption:**
- 90% of users expand danger zone details
- 80% acknowledge risks for high-risk tickets
- 95% accept alternatives when suggested

**Engineering Trust:**
- User confidence score ≥ 4.5/5
- "Would recommend" NPS ≥ 50
- Ticket acceptance rate ≥ 85%

---

## Update Section 6 (Non-Goals)

Add to existing list:
- ❌ Automatic bypass of safety restrictions
- ❌ AI-only security decisions
- ❌ Zero human review for critical code

---

## Update Section 5 (KPIs)

Add to existing KPIs:
- Production incidents from tickets ↓ 50%
- Safety score ≥ 75 for 80% of tickets
- Time to acknowledge risks < 2 minutes
- Alternative acceptance rate ≥ 60%
