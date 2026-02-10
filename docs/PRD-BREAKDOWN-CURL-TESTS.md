# PRD Breakdown - cURL Test Suite

## Setup

```bash
# Set environment variables
export API_URL="http://localhost:3000/api"
export FIREBASE_TOKEN="your-firebase-token"  # Get from browser dev tools
export WORKSPACE_ID="your-workspace-id"
```

## Test 1: Analyze PRD Endpoint

### Basic PRD Analysis

```bash
curl -X POST "$API_URL/tickets/breakdown/prd" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -d '{
    "prdText": "# Product Requirements Document\n\n## Functional Requirements\n\nFR1: Users can create accounts with email or social login\nFR2: Users can log in securely and maintain sessions\nFR3: Users can view their profile and edit personal information\nFR4: Users can create, edit, and delete content items\nFR5: Users can search content by keywords\nFR6: Users can like and comment on content\nFR7: Users can follow other users\nFR8: System should send email notifications for interactions\n\n## Non-Functional Requirements\n\nPerformance: Page load < 2 seconds\nAvailability: 99.9% uptime\nSecurity: GDPR compliant",
    "repositoryOwner": "your-org",
    "repositoryName": "your-repo",
    "projectName": "Social Content Platform"
  }'
```

### Expected Response (200 OK)

```json
{
  "breakdown": {
    "tickets": [
      {
        "id": 101,
        "epicName": "User Authentication",
        "epicIndex": 1,
        "storyIndex": 1,
        "title": "Email account creation with validation",
        "description": "As a new user, I want to create an account with email...",
        "type": "feature",
        "priority": "high",
        "acceptanceCriteria": [
          {
            "given": "User is on signup page",
            "when": "User enters valid email and password",
            "then": "Account is created and user receives verification email"
          }
        ],
        "functionalRequirements": ["FR1"],
        "blockedBy": [],
        "technicalNotes": "Use Firebase Auth for email/password"
      }
      // ... more tickets
    ],
    "summary": {
      "totalTickets": 12,
      "epicCount": 4,
      "epics": [
        {
          "index": 1,
          "name": "User Authentication",
          "goal": "Users can securely register and authenticate",
          "stories": [
            // ... tickets for this epic
          ],
          "functionalRequirements": ["FR1", "FR2"]
        }
        // ... more epics
      ],
      "frCoverage": {
        "FR1": ["User Authentication"],
        "FR2": ["User Authentication", "Session Management"],
        "FR3": ["User Profile Management"],
        "FR4": ["Content Management"],
        "FR5": ["Content Discovery"],
        "FR6": ["Social Interactions"],
        "FR7": ["Social Interactions"],
        "FR8": ["Notifications"]
      },
      "frInventory": [
        {
          "id": "FR1",
          "description": "Users can create accounts with email or social login"
        }
        // ... all FRs
      ]
    }
  },
  "analysisTime": 2847,
  "estimatedTicketsCount": 12
}
```

### Error Cases

#### 1. Missing PRD text
```bash
curl -X POST "$API_URL/tickets/breakdown/prd" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -d '{
    "repositoryOwner": "org",
    "repositoryName": "repo"
  }'
```

**Expected:** 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "PRD text is required"
}
```

#### 2. PRD text too short
```bash
curl -X POST "$API_URL/tickets/breakdown/prd" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -d '{
    "prdText": "Too short",
    "repositoryOwner": "org",
    "repositoryName": "repo"
  }'
```

**Expected:** 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "PRD text is too short (9 chars). Minimum 100 characters required."
}
```

#### 3. Missing repository
```bash
curl -X POST "$API_URL/tickets/breakdown/prd" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -d '{
    "prdText": "A valid PRD text that is long enough to pass validation... " + (more text)
  }'
```

**Expected:** 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Repository owner and name are required"
}
```

#### 4. Unauthorized (no token)
```bash
curl -X POST "$API_URL/tickets/breakdown/prd" \
  -H "Content-Type: application/json" \
  -d '{
    "prdText": "...",
    "repositoryOwner": "org",
    "repositoryName": "repo"
  }'
```

**Expected:** 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## Test 2: Bulk Create Tickets Endpoint

### Create tickets from breakdown

```bash
curl -X POST "$API_URL/tickets/breakdown/bulk-create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -d '{
    "tickets": [
      {
        "epicName": "User Authentication",
        "title": "Email account creation",
        "description": "As a new user, I want to create account with email...",
        "type": "feature",
        "priority": "high",
        "acceptanceCriteria": "[{\"given\":\"User on signup page\",\"when\":\"User enters email and password\",\"then\":\"Account created\"}]"
      },
      {
        "epicName": "User Authentication",
        "title": "Email verification",
        "description": "As a new user, I want to verify my email...",
        "type": "feature",
        "priority": "high",
        "acceptanceCriteria": "[{\"given\":\"User created account\",\"when\":\"User clicks verification link\",\"then\":\"Email verified\"}]"
      },
      {
        "epicName": "Content Management",
        "title": "Create content item",
        "description": "As a logged-in user, I want to create content...",
        "type": "feature",
        "priority": "high",
        "acceptanceCriteria": "[{\"given\":\"User logged in\",\"when\":\"User clicks Create button\",\"then\":\"Create form appears\"}]"
      }
    ]
  }'
```

### Expected Response (201 Created)

```json
{
  "createdCount": 3,
  "ticketIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ],
  "errors": []
}
```

### Partial Failure (Best-Effort)

```bash
# Create 5 tickets where one has invalid data
curl -X POST "$API_URL/tickets/breakdown/bulk-create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -d '{
    "tickets": [
      { "epicName": "Auth", "title": "Ticket 1", ... },
      { "epicName": "Auth", "title": "", ... },  # Missing title - will fail
      { "epicName": "Auth", "title": "Ticket 3", ... },
      { "epicName": "Auth", "title": "Ticket 4", ... },
      { "epicName": "Auth", "title": "Ticket 5", ... }
    ]
  }'
```

**Expected Response:** 201 Created (partial success)
```json
{
  "createdCount": 4,
  "ticketIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440002",
    "550e8400-e29b-41d4-a716-446655440003",
    "550e8400-e29b-41d4-a716-446655440004"
  ],
  "errors": [
    {
      "ticketTitle": "",
      "error": "Title is required"
    }
  ]
}
```

### Error Cases

#### 1. No tickets provided
```bash
curl -X POST "$API_URL/tickets/breakdown/bulk-create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -d '{ "tickets": [] }'
```

**Expected:** 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "No tickets provided for bulk creation"
}
```

#### 2. Exceeds limit (101 tickets)
```bash
# Create array with 101 tickets
curl -X POST "$API_URL/tickets/breakdown/bulk-create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -d '{ "tickets": [ /* 101 tickets */ ] }'
```

**Expected:** 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Bulk creation limit is 100 tickets. Please split into multiple requests."
}
```

---

## Full Integration Test Flow

### Complete End-to-End Flow

```bash
#!/bin/bash

API_URL="http://localhost:3000/api"
FIREBASE_TOKEN="your-token"

echo "=== 1. Analyze PRD ==="
BREAKDOWN=$(curl -s -X POST "$API_URL/tickets/breakdown/prd" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -d '{
    "prdText": "FR1: Authentication\nFR2: Content management\nFR3: Social features\nFR4: Notifications\nFR5: User profiles\nEach should be broken into 2-3 stories...",
    "repositoryOwner": "test-org",
    "repositoryName": "test-repo",
    "projectName": "Test Project"
  }')

echo "$BREAKDOWN" | jq '.'

# Extract estimated count
TICKET_COUNT=$(echo "$BREAKDOWN" | jq -r '.estimatedTicketsCount')
echo "Estimated tickets: $TICKET_COUNT"

echo ""
echo "=== 2. Extract tickets for bulk creation ==="
# Extract first 3 tickets from breakdown
TICKETS=$(echo "$BREAKDOWN" | jq '.breakdown.tickets[0:3] | map({
  epicName: .epicName,
  title: .title,
  description: .description,
  type: .type,
  priority: .priority,
  acceptanceCriteria: (.acceptanceCriteria | @json)
})')

echo "$TICKETS" | jq '.'

echo ""
echo "=== 3. Bulk create tickets ==="
CREATED=$(curl -s -X POST "$API_URL/tickets/breakdown/bulk-create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -d "{\"tickets\": $TICKETS}")

echo "$CREATED" | jq '.'

# Extract created count
CREATED_COUNT=$(echo "$CREATED" | jq -r '.createdCount')
TICKET_IDS=$(echo "$CREATED" | jq -r '.ticketIds[]')

echo ""
echo "=== 4. Verify created tickets ==="
echo "Created $CREATED_COUNT tickets:"
echo "$TICKET_IDS"

echo ""
echo "=== 5. Fetch created tickets ==="
for ID in $TICKET_IDS; do
  curl -s -X GET "$API_URL/tickets/$ID" \
    -H "Authorization: Bearer $FIREBASE_TOKEN" | jq '{
      id: .id,
      title: .title,
      status: .status,
      type: .type,
      priority: .priority
    }'
done
```

---

## Identified Gaps & Issues

### 🔴 Critical Gaps

1. **Missing: Acceptance Criteria in BDD Format**
   - Frontend sends: `acceptanceCriteria: JSON.stringify(BDDCriterion[])`
   - Backend expects: `acceptanceCriteria` string
   - **Issue:** Need to verify JSON parsing in BulkCreateFromBreakdownUseCase
   - **Status:** ⚠️ Implemented but untested

2. **Missing: WorkspaceId Extraction**
   - Endpoint should extract from `@WorkspaceId()` decorator
   - BulkCreateFromBreakdownUseCase doesn't use it
   - **Issue:** Multi-workspace isolation not verified
   - **Status:** ⚠️ Decorator applied but not validated

3. **Missing: Error Response Format**
   - Backend throws BadRequestException
   - Frontend expects: `{ message, statusCode }`
   - **Issue:** May have inconsistent error formats
   - **Status:** ⚠️ Needs validation

### 🟡 Medium Gaps

4. **Missing: BDD Criteria Parsing Validation**
   - `acceptanceCriteria` is JSON string from frontend
   - Backend tries `JSON.parse()` with try-catch
   - **Issue:** Silent failure if invalid JSON, criteria not set
   - **Status:** ⚠️ Best-effort but logs warning

5. **Missing: User Email/ID Extraction**
   - `@UserEmail()` and `@UserId()` decorators used
   - Not passed to BulkCreateFromBreakdownUseCase
   - **Issue:** No tracking of who created tickets
   - **Status:** ⚠️ Might be needed for permissions

6. **Missing: Validation on Acceptance Criteria**
   - No validation that BDD criteria has required fields
   - No validation that Given/When/Then are non-empty
   - **Issue:** Could create tickets with empty criteria
   - **Status:** ⚠️ Untested

### 🟠 Minor Gaps

7. **Missing: Epic Name Storage**
   - Backend receives `epicName` in request
   - Adds to description: `**Epic:** ${epicName}`
   - **Issue:** Not stored as field, just in description
   - **Status:** ⚠️ Works but not ideal

8. **Missing: Frontend Error Handling**
   - Bulk create API failure handling incomplete
   - No UI feedback for partial failures
   - **Status:** ⚠️ Shows message but doesn't differentiate

9. **Missing: Acceptance Criteria Format Conversion**
   - Frontend: `BDDCriterion[]` (object with given/when/then)
   - Backend: Converts to string: `"Given ... When ... Then ..."`
   - **Issue:** May lose BDD structure on save
   - **Status:** ⚠️ Converted but not parsed back

### 🔵 Nice-to-Have

10. **Missing: Batch Creation Progress**
    - No progress updates during bulk creation
    - Frontend shows loading spinner but no per-ticket status
    - **Status:** ℹ️ Works fine but could be better UX

---

## Test Execution Checklist

- [ ] Test 1: Basic PRD analysis with valid input
- [ ] Test 2: PRD too short (< 100 chars)
- [ ] Test 3: Missing repository info
- [ ] Test 4: Missing authorization token
- [ ] Test 5: Bulk create with valid tickets
- [ ] Test 6: Bulk create partial failure
- [ ] Test 7: Bulk create exceeds limit (101+)
- [ ] Test 8: Verify created tickets in database
- [ ] Test 9: Verify acceptance criteria parsing
- [ ] Test 10: Verify workspace isolation

---

## Fix Priority

**P1 (Critical - Fix Before Deploy):**
- BDD criteria parsing validation
- Error response format consistency
- WorkspaceId isolation verification

**P2 (Important - Fix This Week):**
- Acceptance criteria field storage (not just in description)
- Frontend error handling for partial failures
- Batch creation progress tracking

**P3 (Nice-to-Have - Next Sprint):**
- Epic name as database field
- Better BDD criteria serialization
- Advanced progress UI

---

## Next Steps

1. Run curl tests to validate actual behavior
2. Fix identified gaps
3. Add integration tests
4. Document any found issues
