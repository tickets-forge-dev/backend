# Ticket Preview - UI Wireframes

**Status:** Design Reference
**Context:** What users see when viewing a ticket created from PRD Breakdown

---

## 🎯 TICKET DETAIL PAGE OVERVIEW

```
╔════════════════════════════════════════════════════════════════════╗
║                           FORGE                                    ║
║                    Sidebar | Tickets / 123e4...                   ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ← Back                                                            ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ EMAIL SIGNUP WITH PASSWORD VALIDATION                        │ ║
║  │ ────────────────────────────────────────────────────────────  │ ║
║  │                                                               │ ║
║  │ ◉ Draft  |  Type: feature  |  Priority: ◉ High               │ ║
║  │ Quality Score: 87 / 100  [?]                                 │ ║
║  │                                                               │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  ╔═══════════════════════════════════════════════════════════╗   ║
║  ║  SPECIFICATION              │ IMPLEMENTATION              ║   ║
║  ╠═══════════════════════════════════════════════════════════╣   ║
║  ║                                                            ║   ║
║  ║  PROBLEM STATEMENT                                         ║   ║
║  ║  ────────────────                                          ║   ║
║  ║  New users need a secure way to create accounts. Current   ║   ║
║  ║  process lacks password strength validation, leading to    ║   ║
║  ║  weak passwords and security issues.                       ║   ║
║  ║                                                            ║   ║
║  ║  SOLUTION                                                  ║   ║
║  ║  ────────                                                  ║   ║
║  ║  Implement signup form with:                               ║   ║
║  ║  - Real-time password strength meter                       ║   ║
║  ║  - Validation rules display                                ║   ║
║  ║  - Email format validation (RFC 5322)                      ║   ║
║  ║  - Duplicate email checking                                ║   ║
║  ║                                                            ║   ║
║  ║  ACCEPTANCE CRITERIA                                       ║   ║
║  ║  ──────────────────────                                    ║   ║
║  ║                                                            ║   ║
║  ║  ✓ Given: User is on signup page                           ║   ║
║  ║    When: User enters valid email                           ║   ║
║  ║    Then: Email is validated against RFC 5322              ║   ║
║  ║                                                            ║   ║
║  ║  ✓ Given: User enters password < 8 characters              ║   ║
║  ║    When: User clicks "Create Account"                      ║   ║
║  ║    Then: Show error "Password must be 8+ characters"       ║   ║
║  ║                                                            ║   ║
║  ║  ✓ Given: User submits form with valid data                ║   ║
║  ║    When: Email already exists in database                  ║   ║
║  ║    Then: Show error "Email already in use"                 ║   ║
║  ║                                                            ║   ║
║  ║  ✓ Given: User enters all required fields                  ║   ║
║  ║    When: User clicks "Create Account"                      ║   ║
║  ║    Then: Account created, redirected to dashboard          ║   ║
║  ║                                                            ║   ║
║  ║  TECHNICAL NOTES                                           ║   ║
║  ║  ────────────────                                          ║   ║
║  ║  - Use zxcvbn library for password strength                ║   ║
║  ║  - Frontend validation only (UX), backend required         ║   ║
║  ║  - Hash password with bcrypt on backend                    ║   ║
║  ║  - Add rate limiting to signup endpoint                    ║   ║
║  ║                                                            ║   ║
║  ║  [Scroll down for more...]                                 ║   ║
║  ║                                                            ║   ║
║  ╚═══════════════════════════════════════════════════════════╝   ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## 📐 SCREEN LAYOUT SECTIONS

### Header

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║  ← Back                                                           ║
║                                                                   ║
║  EMAIL SIGNUP WITH PASSWORD VALIDATION                           ║
║  (Hero title, large bold text)                                  ║
║  ─────────────────────────────────────────────────────────────  ║
║                                                                   ║
║  ◉ Draft  |  Type: feature  |  Priority: ◉ High                 ║
║  (Status badge, type badge, priority badge)                     ║
║                                                                   ║
║  Quality Score: 87 / 100  [?]                                   ║
║  (Circular progress, tooltip on hover)                          ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Tabs (Specification | Implementation)

```
┌───────────────────────────────────────────────────────┐
│ SPECIFICATION              │ IMPLEMENTATION          │
│ (Active underline)         │ (Inactive)              │
└───────────────────────────────────────────────────────┘
```

---

## 📋 TAB 1: SPECIFICATION (Active)

### Section 1: Overview Card

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║  Epic: User Authentication                                       ║
║  From PRD Breakdown (2026-02-10)                                ║
║                                                                   ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                                   ║
║  Description:                                                    ║
║  As a new user, I want to create an account with email and      ║
║  password so that I can access the platform securely.           ║
║                                                                   ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                                   ║
║  📎 Notes (Collapsible)                                          ║
║  None yet - Add notes about requirements, constraints, etc.      ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Section 2: Problem Statement

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║  PROBLEM STATEMENT                                               ║
║  ───────────────────  (Section header with left border)          ║
║                                                                   ║
║  New users need a secure way to create accounts. Current         ║
║  process lacks password strength validation, leading to          ║
║  weak passwords and security issues.                             ║
║                                                                   ║
║  The signup flow should enforce strong passwords and provide     ║
║  real-time feedback to users about password quality.             ║
║                                                                   ║
║  [Edit] [Delete]  (On hover)                                     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Section 3: Solution

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║  SOLUTION                                                        ║
║  ────────  (Section header with left border)                     ║
║                                                                   ║
║  Implement signup form with:                                     ║
║                                                                   ║
║  • Real-time password strength meter showing quality level       ║
║  • Validation rules display (min 8 chars, uppercase, number...)  ║
║  • Email format validation (RFC 5322 standard)                   ║
║  • Duplicate email checking against existing accounts            ║
║  • Clear error messages for validation failures                  ║
║  • Success confirmation after account creation                   ║
║                                                                   ║
║  The form should provide immediate feedback without page reload. ║
║                                                                   ║
║  [Edit] [Delete]  (On hover)                                     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Section 4: Acceptance Criteria (BDD)

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║  ACCEPTANCE CRITERIA                                             ║
║  ──────────────────────  (Section header with left border)       ║
║                                                                   ║
║  ✓ Given: User is on signup page                                 ║
║    When: User enters valid email                                 ║
║    Then: Email is validated against RFC 5322                    ║
║                                                                   ║
║  ✓ Given: User enters password < 8 characters                    ║
║    When: User clicks "Create Account"                            ║
║    Then: Show error "Password must be 8+ characters"             ║
║           (Password strength meter shows red)                    ║
║                                                                   ║
║  ✓ Given: User submits form with valid data                      ║
║    When: Email already exists in database                        ║
║    Then: Show error "Email already in use"                       ║
║           (Form remains with values preserved)                   ║
║                                                                   ║
║  ✓ Given: User enters all required fields correctly              ║
║    When: User clicks "Create Account"                            ║
║    Then: Account created in database                             ║
║           User redirected to dashboard                           ║
║           Welcome email sent                                     ║
║                                                                   ║
║  ✓ Given: Password strength is medium or higher                  ║
║    When: User submits form                                       ║
║    Then: Show success message "Account created!"                 ║
║                                                                   ║
║  [Add Criterion]  (Button to add more)                           ║
║  [Edit] [Delete]  (On hover)                                     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Section 5: File Changes (Layered)

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║  FILE CHANGES                                                    ║
║  ──────────────  (Section header with left border)               ║
║                                                                   ║
║  🔵 BACKEND (3 files)                                            ║
║  ──────────────────────                                          ║
║  • src/auth/auth.controller.ts                                   ║
║    └─ Add POST /auth/signup endpoint                             ║
║    └─ Validate email format, check duplicates                    ║
║                                                                   ║
║  • src/auth/services/signup.service.ts (NEW)                     ║
║    └─ Hash password with bcrypt                                  ║
║    └─ Save user to database                                      ║
║    └─ Send welcome email                                         ║
║                                                                   ║
║  • src/migrations/001-create-users-table.sql (NEW)               ║
║    └─ Create users table with email, password_hash               ║
║    └─ Add unique constraint on email                             ║
║                                                                   ║
║  🟢 FRONTEND (2 files)                                           ║
║  ──────────────────────                                          ║
║  • client/src/pages/auth/signup.tsx (NEW)                        ║
║    └─ SignupForm component with validation                       ║
║    └─ Password strength meter                                    ║
║    └─ Real-time feedback                                         ║
║                                                                   ║
║  • client/src/hooks/usePasswordStrength.ts (NEW)                 ║
║    └─ Validate password strength using zxcvbn                    ║
║    └─ Return strength level + feedback                           ║
║                                                                   ║
║  🟡 SHARED (1 file)                                              ║
║  ──────────────────                                              ║
║  • packages/shared-types/src/auth.types.ts                       ║
║    └─ Add SignupRequest, SignupResponse types                    ║
║    └─ Add PasswordStrength enum                                  ║
║                                                                   ║
║  [Edit] [Delete]  (On hover)                                     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Section 6: API Changes

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║  API ENDPOINTS                                                   ║
║  ──────────────  (Section header with left border)               ║
║                                                                   ║
║  POST /auth/signup                                               ║
║  ──────────────────────────────────────────────────────────────  ║
║                                                                   ║
║  Request:                                                        ║
║  {                                                               ║
║    "email": "user@example.com",                                  ║
║    "password": "SecurePass123!"                                  ║
║  }                                                               ║
║                                                                   ║
║  Response (201):                                                 ║
║  {                                                               ║
║    "id": "uuid",                                                 ║
║    "email": "user@example.com",                                  ║
║    "createdAt": "2026-02-10T10:30:00Z"                          ║
║  }                                                               ║
║                                                                   ║
║  Error Responses:                                                ║
║  • 400: Invalid email format                                     ║
║  • 409: Email already exists                                     ║
║  • 422: Password doesn't meet requirements                       ║
║  • 500: Server error                                             ║
║                                                                   ║
║  [Edit] [Delete]  (On hover)                                     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Section 7: Test Plan

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║  TEST PLAN                                                       ║
║  ─────────  (Section header with left border)                    ║
║                                                                   ║
║  UNIT TESTS (4)                                                  ║
║  ─────────────────                                               ║
║  • validateEmail() with valid RFC 5322 emails                    ║
║  • validatePassword() with various strength levels               ║
║  • hashPassword() produces bcrypt hashes                         ║
║  • checkPasswordStrength() returns correct levels                ║
║                                                                   ║
║  INTEGRATION TESTS (3)                                           ║
║  ──────────────────────                                          ║
║  • POST /auth/signup creates user in database                    ║
║  • Duplicate email prevents account creation                     ║
║  • Welcome email sent on successful signup                       ║
║                                                                   ║
║  E2E TESTS (2)                                                   ║
║  ────────────────                                                ║
║  • User fills form, sees validation feedback, creates account    ║
║  • User enters existing email, sees error message                ║
║                                                                   ║
║  EDGE CASES (4)                                                  ║
║  ──────────────────                                              ║
║  • SQL injection attempts rejected                               ║
║  • Very long email addresses handled                             ║
║  • Rate limiting prevents brute force                            ║
║  • XSS payloads escaped                                          ║
║                                                                   ║
║  [Edit] [Delete]  (On hover)                                     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Section 8: Scope (Collapsible)

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║  ▶ SCOPE                                                         ║
║  ──────  (Collapsed - shows ▶ arrow)                             ║
║                                                                   ║
║  Click to expand...                                              ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 🔧 TAB 2: IMPLEMENTATION (Inactive)

When user clicks "IMPLEMENTATION" tab:

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║  IMPLEMENTATION TAB SHOWS:                                        ║
║                                                                   ║
║  • API Endpoints (from above, same content)                      ║
║  • Backend Changes                                               ║
║  • Frontend Changes                                              ║
║  • File Changes                                                  ║
║  • Assets (attachments, screenshots)                             ║
║  • Validation (test results when ready)                          ║
║                                                                   ║
║  (Same layout, engineering-focused view)                         ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 🎨 DETAILED SECTION EXAMPLES

### Problem Statement Section (Edit View)

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║  PROBLEM STATEMENT                                               ║
║  ───────────────────  (Left border in blue/gray)                 ║
║                                                                   ║
║  ┌─────────────────────────────────────────────────────────────┐ ║
║  │ New users need a secure way to create accounts. Current      │ ║
║  │ process lacks password strength validation, leading to       │ ║
║  │ weak passwords and security issues.                          │ ║
║  │                                                               │ ║
║  │ The signup flow should enforce strong passwords and provide  │ ║
║  │ real-time feedback to users about password quality.          │ ║
║  └─────────────────────────────────────────────────────────────┘ ║
║                                                                   ║
║  [Edit Content]  [Delete Section]  (On hover)                    ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Acceptance Criteria with Edit Modal

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║  ┌─────────────────────────────────────────────────────────────┐ ║
║  │ Edit Acceptance Criterion                                   │ ║
║  ├─────────────────────────────────────────────────────────────┤ ║
║  │                                                               │ ║
║  │ Given (precondition):                                        │ ║
║  │ ┌─────────────────────────────────────────────────────────┐ ║
║  │ │ User is on signup page                                 │ ║
║  │ └─────────────────────────────────────────────────────────┘ ║
║  │                                                               │ ║
║  │ When (action):                                               │ ║
║  │ ┌─────────────────────────────────────────────────────────┐ ║
║  │ │ User enters valid email                                │ ║
║  │ └─────────────────────────────────────────────────────────┘ ║
║  │                                                               │ ║
║  │ Then (expected outcome):                                     │ ║
║  │ ┌─────────────────────────────────────────────────────────┐ ║
║  │ │ Email is validated against RFC 5322                   │ ║
║  │ └─────────────────────────────────────────────────────────┘ ║
║  │                                                               │ ║
║  │           [Cancel]  [Save Changes]                          ║
║  │                                                               │ ║
║  └─────────────────────────────────────────────────────────────┘ ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 📱 RESPONSIVE LAYOUT

### Desktop (1024px+)

```
Full 2-tab view, all sections visible, side-by-side sections
```

### Tablet (768px - 1023px)

```
- Tabs remain side-by-side
- Sections stack vertically
- File changes grid becomes single column
- Slightly reduced padding
```

### Mobile (< 768px)

```
- Tabs become dropdown selector
- All sections full width
- File changes list (no grid)
- Minimal padding
- Touch-friendly buttons (larger hit targets)
```

---

## 🎯 INTERACTIVE ELEMENTS

### Quality Score Tooltip

```
Hover over "Quality Score: 87 / 100" [?]
  ↓
Tooltip appears:

┌─────────────────────────────────────┐
│ Quality Score Breakdown             │
├─────────────────────────────────────┤
│ Problem Statement:      20 / 20 ✓   │
│ Solution:               22 / 25      │
│ Acceptance Criteria:    15 / 15 ✓   │
│ File Changes:            8 / 10      │
│ API Changes:            10 / 10 ✓   │
│ Test Plan:               8 / 10      │
│ ─────────────────────────────────── │
│ TOTAL:                  87 / 100     │
│                                      │
│ Next: Add missing API details        │
└─────────────────────────────────────┘
```

### Edit Button (Hover State)

```
Card Section (hover)
  ↓
[Edit] [Delete] buttons appear
  ↓
Click [Edit]
  ↓
Modal or inline editor opens
```

### Status Badge Click

```
Click "Draft" badge
  ↓
Dropdown menu:
  ◉ Draft
  ○ Complete
  ↓
Select "Complete"
  ↓
Status updates
```

---

## 🎨 COLOR CODING

### Layer Colors (File Changes)

```
BACKEND:     🔵 Blue   (#3b82f6)
FRONTEND:    🟢 Green  (#10b981)
SHARED:      🟡 Yellow (#f59e0b)
INFRA:       🟣 Purple (#8b5cf6)
DOCS:        🟠 Orange (#f97316)
```

### BDD Criteria Colors

```
Given:  🔵 Blue background, #3b82f6 border
When:   🟠 Amber background, #f59e0b border
Then:   🟢 Green background, #10b981 border
```

### Priority Colors

```
Low:     🔵 Blue (#3b82f6)
Medium:  🟡 Yellow (#f59e0b)
High:    🟠 Orange (#f97316)
Urgent:  🔴 Red (#ef4444)
```

---

## ✅ SECTIONS CHECKLIST

- [x] Problem Statement
- [x] Solution
- [x] Acceptance Criteria (BDD)
- [x] File Changes (Layered)
- [x] API Endpoints
- [x] Test Plan
- [x] Scope (collapsible)
- [x] Assumptions (collapsible)
- [x] Affected Code (collapsible)
- [x] Estimate (collapsible)

---

## 🔧 EDIT CAPABILITIES

Users can:

```
✓ Edit problem statement
✓ Edit solution
✓ Add/edit/delete acceptance criteria
✓ Add notes
✓ Edit file changes
✓ Change status (Draft → Complete)
✓ Delete entire sections (if needed)
✗ Cannot reorder sections
✗ Cannot change acceptance criteria structure (must delete & recreate)
```

---

## 🚀 Call-to-Action Buttons (Bottom Right)

```
Fixed buttons at bottom right:

┌──────────────────────┐
│ [Generate Questions] │  (Only if no tech spec yet)
│ [Start Development]  │  (Navigate to dev tools)
│ [Export Spec]        │  (Download as MD/XML)
└──────────────────────┘
```

---

## 📊 DATA FLOW

```
Ticket Created (from PRD Breakdown)
  ├─ Status: draft
  ├─ Epic Name: "User Authentication"
  ├─ All sections auto-populated from LLM
  │
  ↓ User views ticket
  │
  ├─ Shows all sections
  ├─ Quality Score: 87/100
  ├─ Tabs: Specification | Implementation
  │
  ↓ User edits sections
  │
  ├─ Edit buttons on each section
  ├─ Changes saved to database
  ├─ Quality score recalculated
  │
  ↓ User marks as Complete
  │
  └─ Status: complete
     Ready for development
```

---

**This is the final ticket preview that users see after PRD Breakdown creates tickets!** 🎫

