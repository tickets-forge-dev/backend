# Safety Zones UI/UX Design Specification

## Overview
Visual system for displaying code modification safety zones in ticket detail view.
Linear-inspired minimalism with clear risk communication.

---

## Design Principles

1. **Color as Signal, Not Decoration**
   - Green = Safe to proceed
   - Yellow/Amber = Proceed with caution
   - Red = Requires special attention
   - Gray = Information only (read-only)

2. **Progressive Disclosure**
   - Summary view by default
   - Expand for details on demand
   - Critical warnings always visible

3. **Action-Oriented**
   - Every warning suggests next steps
   - Clear approval workflows
   - Alternative approaches offered

4. **Calm Design**
   - No alarm-fatigue
   - Professional tone
   - Reassuring guidance

---

## Component Hierarchy

```
┌─ SafetyOverview (Card)
│  ├─ SafetyScore (Badge + Progress)
│  ├─ RiskSummary (Quick stats)
│  └─ QuickActions (Acknowledge/Review)
│
├─ AffectedCodeZones (Card)
│  ├─ ZoneList
│  │  ├─ SafeZoneItem (collapsible)
│  │  ├─ CautionZoneItem (collapsible, expanded by default)
│  │  └─ DangerZoneItem (always expanded)
│  └─ ZoneFilters (Show: All / Caution+ / Danger only)
│
└─ ExecutionRestrictions (Card)
   ├─ RestrictionList
   └─ ApprovalWorkflow (if needed)
```

---

## 1. Safety Overview Component

### Visual Design

```
┌─────────────────────────────────────────────────────┐
│ 🛡️  Safety Assessment                              │
│                                                     │
│  ┌──────────────────┐                              │
│  │  Safety Score    │                              │
│  │      72/100      │  ━━━━━━━━━━░░░░ 72%         │
│  │    ⚠️  CAUTION    │                              │
│  └──────────────────┘                              │
│                                                     │
│  📊 Zone Breakdown:                                │
│  🟢 3 safe  🟡 2 caution  🔴 1 danger              │
│                                                     │
│  ⚠️  This ticket modifies security-critical code    │
│     Manual review required before execution         │
│                                                     │
│  [ View Details ]  [ Acknowledge Risks ]           │
└─────────────────────────────────────────────────────┘
```

### Component Props

```typescript
interface SafetyOverviewProps {
  safetyScore: number; // 0-100
  zoneBreakdown: {
    safe: number;
    caution: number;
    danger: number;
    readonly: number;
  };
  requiresApproval: boolean;
  topRisks: string[]; // ["Modifies auth code", "Changes API contract"]
  onAcknowledge?: () => void;
}
```

### Color Mapping

```typescript
const getSafetyColor = (score: number) => {
  if (score >= 75) return {
    bg: 'bg-[var(--green)]/10',
    border: 'border-[var(--green)]/20',
    text: 'text-[var(--green)]',
    badge: 'bg-[var(--green)]',
    label: 'SAFE'
  };
  
  if (score >= 50) return {
    bg: 'bg-[var(--amber)]/10',
    border: 'border-[var(--amber)]/20',
    text: 'text-[var(--amber)]',
    badge: 'bg-[var(--amber)]',
    label: 'CAUTION'
  };
  
  return {
    bg: 'bg-[var(--red)]/10',
    border: 'border-[var(--red)]/20',
    text: 'text-[var(--red)]',
    badge: 'bg-[var(--red)]',
    label: 'HIGH RISK'
  };
};
```

---

## 2. Zone List Component - Full Visual Design

### Complete Layout

```
┌──────────────────────────────────────────────────────────┐
│ 📂 Affected Code                                         │
│                                                          │
│ Filter: [All] [Caution+] [Danger Only]                  │
│                                                          │
│ ┌─ 🟢 Safe Zone (3 files) ─────────────────────────┐   │
│ │  ▶ src/components/LoginForm.tsx                   │   │
│ │     New component - isolated changes               │   │
│ │                                                    │   │
│ │  ▶ src/components/LoginButton.tsx                 │   │
│ │  ▶ tests/login.test.tsx                           │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌─ 🟡 Caution Zone (2 files) ───────────────────────┐   │
│ │  ▼ src/utils/validation.ts                         │   │
│ │     ⚠️  Shared by 23 files                          │   │
│ │     Risk Score: ━━━━━━━░░░ 6.5/10                 │   │
│ │                                                    │   │
│ │     Restrictions:                                  │   │
│ │     • Preserve public interface                    │   │
│ │     • Add integration tests                        │   │
│ │                                                    │   │
│ │     💡 Alternative: Create new validation util     │   │
│ │        instead of modifying this one               │   │
│ │                                                    │   │
│ │     Modified by: 5 engineers (last 6 months)       │   │
│ │     [ View in GitHub ] [ Show Dependencies ]       │   │
│ │                                                    │   │
│ │  ▼ src/api/client.ts                              │   │
│ │     ⚠️  API contract - versioned                   │   │
│ │     Risk Score: ━━━━━░░░░░ 5.0/10                 │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌─ 🔴 Danger Zone (1 file) ─────────────────────────┐   │
│ │  ▼ src/auth/session.ts                             │   │
│ │     🚨 SECURITY CRITICAL                            │   │
│ │     Risk Score: ━━━━━━━━━█ 9.2/10                 │   │
│ │                                                    │   │
│ │     Why dangerous:                                 │   │
│ │     • Handles user authentication                  │   │
│ │     • Modified by 3+ engineers recently            │   │
│ │     • Past incidents: 2 security bugs              │   │
│ │                                                    │   │
│ │     Required approvals:                            │   │
│ │     ☐ Security team review                         │   │
│ │     ☐ 2 senior engineer sign-offs                  │   │
│ │                                                    │   │
│ │     💡 Recommended approach:                       │   │
│ │     Instead of modifying session.ts directly:      │   │
│ │     1. Extract login logic to new module           │   │
│ │     2. Add comprehensive tests                     │   │
│ │     3. Peer review with security focus             │   │
│ │                                                    │   │
│ │     [ Request Security Review ] [ View File ]      │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Individual Zone States

### Safe Zone (Collapsed)

```
┌─ 🟢 src/components/LoginForm.tsx ──────────────────┐
│  New component - no dependencies                   │
│  [ Expand Details ]                                │
└─────────────────────────────────────────────────────┘
```

### Safe Zone (Expanded)

```
┌─ 🟢 src/components/LoginForm.tsx ──────────────────┐
│  ✓ New component - isolated changes                │
│  Risk Score: ━━░░░░░░░░ 2.0/10                    │
│                                                    │
│  Why safe:                                         │
│  • New file - no existing dependencies             │
│  • Standard React component pattern                │
│  • Covered by tests                                │
│                                                    │
│  No restrictions apply                             │
│                                                    │
│  [ View in GitHub ] [ Collapse ]                   │
└─────────────────────────────────────────────────────┘
```

### Caution Zone (Always Expanded)

```
┌─ 🟡 src/utils/validation.ts ───────────────────────┐
│  ⚠️  High usage - shared by 23 files                │
│  Risk Score: ━━━━━━━░░░ 6.5/10                    │
│                                                    │
│  Why caution:                                      │
│  • Widely used across codebase                     │
│  • Interface changes would break dependents        │
│  • No integration tests currently                  │
│                                                    │
│  Restrictions:                                     │
│  • ⚠️  Preserve existing function signatures        │
│  • ✓ Add integration tests (required)              │
│  • ℹ️  Consider deprecation path for old API       │
│                                                    │
│  💡 Safer alternative:                             │
│  Create src/utils/validationV2.ts instead          │
│  • Isolates changes to new file                    │
│  • Allows gradual migration                        │
│  • Reduces blast radius to 0 files                 │
│                                                    │
│  Usage statistics:                                 │
│  • 23 files depend on this                         │
│  • Modified by: 5 engineers (6 months)             │
│  • Last incident: 3 months ago (minor)             │
│                                                    │
│  [ View Dependencies ] [ Show History ]            │
└─────────────────────────────────────────────────────┘
```

### Danger Zone (Always Expanded, Prominent)

```
┌─ 🔴 src/auth/session.ts ───────────────────────────┐
│  🚨 SECURITY CRITICAL - REVIEW REQUIRED             │
│  Risk Score: ━━━━━━━━━█ 9.2/10                    │
│                                                    │
│  ⚠️  WARNING: This file handles user authentication │
│     Any bugs could compromise user accounts         │
│                                                    │
│  Risk factors:                                     │
│  • 🔒 Security-critical code path                   │
│  • 👥 Modified by 3+ engineers recently             │
│  • 🐛 Past incidents: 2 security bugs               │
│  • ⏰ High-traffic endpoint (1M+ req/day)          │
│                                                    │
│  Required before merge:                            │
│  ☐ Security team review (est. 1-2 days)           │
│     Contact: security@company.com                  │
│  ☐ Two senior engineer approvals                  │
│     Suggested: @alice (Auth), @bob (Security)      │
│  ☐ Test coverage ≥ 90% (current: 72%)             │
│  ☐ Manual penetration testing                     │
│                                                    │
│  💡 RECOMMENDED SAFER APPROACH:                    │
│  Instead of modifying session.ts directly:         │
│                                                    │
│  Option A: Extract & Isolate (Preferred)          │
│  1. Create src/auth/loginHandler.ts (new)         │
│  2. Move login logic to isolated module            │
│  3. Keep session.ts focused on session mgmt        │
│  4. Add comprehensive tests to new module          │
│  → Risk reduction: 9.2 → 3.5                       │
│                                                    │
│  Option B: Refactor First                         │
│  1. Split session.ts into smaller modules          │
│  2. Isolate the area you need to modify           │
│  3. Then apply changes to small module             │
│  → Risk reduction: 9.2 → 5.0                       │
│                                                    │
│  Past incidents in this file:                      │
│  • 2024-11-15: Token expiration bug (P1)           │
│  • 2024-08-22: Session fixation vulnerability      │
│                                                    │
│  [ Request Security Review ]                       │
│  [ View Past Incidents ]                           │
│  [ Show Blame History ]                            │
└─────────────────────────────────────────────────────┘
```

### Read-Only Zone

```
┌─ ⚪ src/legacy/oldAuth.ts ─────────────────────────┐
│  ℹ️  READ ONLY - Referenced for context            │
│                                                    │
│  This file should not be modified:                 │
│  • Legacy code - scheduled for removal Q2 2026     │
│  • Being replaced by new auth system               │
│  • Any changes will be overwritten                 │
│                                                    │
│  [ View Migration Plan ]                           │
└─────────────────────────────────────────────────────┘
```

---

## 4. Risk Score Visualization

### Progress Bar Component

```typescript
interface RiskBarProps {
  score: number; // 0-10
  showLabel?: boolean;
}

const RiskBar = ({ score, showLabel = true }: RiskBarProps) => {
  const segments = 10;
  const filled = Math.ceil(score);
  
  const getSegmentColor = (index: number) => {
    if (index >= filled) return 'bg-[var(--border)]';
    if (score >= 8) return 'bg-[var(--red)]';
    if (score >= 5) return 'bg-[var(--amber)]';
    return 'bg-[var(--green)]';
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 w-6 rounded-sm transition-colors",
              getSegmentColor(i)
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">
          {score.toFixed(1)}/10
        </span>
      )}
    </div>
  );
};
```

### Visual Examples

```
Low Risk (2.5/10):    ━━░░░░░░░░ 2.5/10 🟢
Medium Risk (5.5/10):  ━━━━━░░░░░ 5.5/10 🟡
High Risk (8.2/10):    ━━━━━━━━░░ 8.2/10 🔴
Critical (9.5/10):     ━━━━━━━━━█ 9.5/10 🚨
```

---

## 5. Execution Restrictions Panel

```
┌─────────────────────────────────────────────────────┐
│ 🔒 Execution Requirements                           │
│                                                     │
│  This ticket requires the following before merge:   │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ ☐ Security Team Review                        │ │
│  │   Status: Pending                              │ │
│  │   Contact: security@company.com                │ │
│  │   Est. turnaround: 1-2 business days          │ │
│  │   [ Request Review ]                           │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ ☐ Senior Engineer Approvals (2 required)      │ │
│  │   Suggested reviewers:                         │ │
│  │   • @alice (Auth expert, 5yr exp)             │ │
│  │   • @bob (Security specialist, SOC2 cert)     │ │
│  │   [ Request Approvals ]                        │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ ☐ Test Coverage ≥ 90%                         │ │
│  │   Current: 72% (needs 18% more)               │ │
│  │   Focus on: Authentication flows               │ │
│  │   [ View Coverage Report ]                     │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ ☐ Manual QA Session                           │ │
│  │   Assign to: QA team                           │ │
│  │   Test cases: 12 scenarios prepared            │ │
│  │   [ View Test Plan ]                           │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ℹ️  All requirements must be met before this       │
│     ticket can be exported to Jira/Linear          │
│                                                     │
│  [ Mark as Acknowledged ] [ Export (Disabled) ]    │
└─────────────────────────────────────────────────────┘
```

---

## 6. Mobile/Responsive Design

### Mobile Collapsed View

```
┌─────────────────────────┐
│ 🛡️  Safety: 72/100      │
│ ━━━━━━━░░░ ⚠️ CAUTION   │
│                         │
│ 🟢 3  🟡 2  🔴 1       │
│                         │
│ ⚠️ 1 danger zone         │
│ Review required         │
│                         │
│ [ View Details ]        │
└─────────────────────────┘
```

### Mobile Zone Item

```
┌─────────────────────────┐
│ 🔴 session.ts           │
│ 🚨 SECURITY CRITICAL     │
│                         │
│ Risk: 9.2/10            │
│ ━━━━━━━━━█              │
│                         │
│ [ View Details ]        │
└─────────────────────────┘
```

---

## 7. Color Palette

```css
:root {
  /* Zone Colors */
  --zone-safe: #10b981;
  --zone-safe-bg: rgba(16, 185, 129, 0.1);
  --zone-safe-border: rgba(16, 185, 129, 0.2);
  
  --zone-caution: #f59e0b;
  --zone-caution-bg: rgba(245, 158, 11, 0.1);
  --zone-caution-border: rgba(245, 158, 11, 0.2);
  
  --zone-danger: #ef4444;
  --zone-danger-bg: rgba(239, 68, 68, 0.1);
  --zone-danger-border: rgba(239, 68, 68, 0.2);
  
  --zone-readonly: #6b7280;
  --zone-readonly-bg: rgba(107, 114, 128, 0.1);
  --zone-readonly-border: rgba(107, 114, 128, 0.2);
}
```

---

## 8. Accessibility

### Screen Reader Support

```tsx
<div
  role="region"
  aria-labelledby="safety-heading"
  aria-describedby="safety-description"
>
  <h2 id="safety-heading">Safety Assessment</h2>
  <p id="safety-description" className="sr-only">
    This section displays code modification safety zones.
    Danger zones require additional review before execution.
  </p>
  
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <Badge aria-label={`Safety score: ${score} out of 100. Status: ${status}`}>
      {score}/100 {status}
    </Badge>
  </div>
</div>

<div
  role="alert"
  aria-live="assertive"
  className={zoneType === 'danger' ? 'danger-zone' : ''}
>
  {zoneType === 'danger' && (
    <span>
      Warning: This file contains security-critical code.
      Manual review required before modification.
    </span>
  )}
</div>
```

### Keyboard Navigation

- **Tab**: Navigate between zones
- **Space**: Expand/collapse zone
- **Enter**: Open file in GitHub
- **Arrow Keys**: Navigate within zone list
- **Escape**: Collapse all zones

---

## Implementation Checklist

### Phase 1: MVP (Add to Story 2.4) - 2 hours
- [ ] Create SafetyOverview component
- [ ] Add zone badges to affected code section
- [ ] Simple risk score display (0-100)
- [ ] Collapsed/expanded states
- [ ] Basic color coding

### Phase 2: Full Feature (Story 4.6) - 1 week
- [ ] Real zone detection logic
- [ ] Detailed zone metadata
- [ ] Alternative suggestions UI
- [ ] Restriction tracking
- [ ] Approval workflow

### Phase 3: Polish - 2 days
- [ ] Animations (framer-motion)
- [ ] Mobile responsive design
- [ ] GitHub integration (view file links)
- [ ] Historical data display
- [ ] Accessibility audit

---

## Success Metrics

**Engagement:**
- 90%+ of users expand danger zones
- 80%+ acknowledge risks for high-risk tickets
- <2 min avg time reviewing zones

**Safety Outcomes:**
- 50% reduction in incidents from tickets
- 3x increase in peer reviews for danger zones
- User confidence score: 4.5+/5

---

## Files to Create

```
client/src/tickets/components/
├── SafetyOverview.tsx
├── ZoneList.tsx
├── ZoneItem.tsx
├── RiskBar.tsx
└── ExecutionRestrictions.tsx
```

Would you like me to:
1. **Implement Phase 1 (MVP)** now?
2. **Create the React components** based on this spec?
3. **Add to current ticket detail page**?
4. **Move to next story** and come back later?
