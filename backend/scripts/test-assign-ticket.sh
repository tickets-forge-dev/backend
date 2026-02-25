#!/bin/bash

# ==============================================================================
# Story 3.5-5: Assign Ticket to Developer - API Test Script
# ==============================================================================
# Tests the PATCH /tickets/:id/assign endpoint with various scenarios
#
# Prerequisites:
#   - Backend server running (http://localhost:3000)
#   - Valid Firebase auth token set in FIREBASE_TOKEN env var
#   - Valid workspace ID set in WORKSPACE_ID env var
#
# Usage:
#   export FIREBASE_TOKEN="your-firebase-id-token"
#   export WORKSPACE_ID="your-workspace-id"
#   ./test-assign-ticket.sh
# ==============================================================================

set -e # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
FIREBASE_TOKEN="${FIREBASE_TOKEN:-}"
WORKSPACE_ID="${WORKSPACE_ID:-}"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# ==============================================================================
# Helper Functions
# ==============================================================================

print_header() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

print_test() {
  echo -e "${YELLOW}TEST $((TESTS_RUN + 1)):${NC} $1"
  TESTS_RUN=$((TESTS_RUN + 1))
}

print_success() {
  echo -e "${GREEN}✓ PASS:${NC} $1"
  TESTS_PASSED=$((TESTS_PASSED + 1))
}

print_failure() {
  echo -e "${RED}✗ FAIL:${NC} $1"
  TESTS_FAILED=$((TESTS_FAILED + 1))
}

print_info() {
  echo -e "${BLUE}ℹ INFO:${NC} $1"
}

print_summary() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}TEST SUMMARY${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "Total Tests: $TESTS_RUN"
  echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
  echo -e "${RED}Failed: $TESTS_FAILED${NC}"

  if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed! ✓${NC}\n"
    exit 0
  else
    echo -e "\n${RED}Some tests failed. ✗${NC}\n"
    exit 1
  fi
}

# Check HTTP status code
check_status() {
  local expected=$1
  local actual=$2
  local test_name=$3

  if [ "$actual" -eq "$expected" ]; then
    print_success "$test_name (HTTP $actual)"
  else
    print_failure "$test_name (expected HTTP $expected, got HTTP $actual)"
  fi
}

# ==============================================================================
# Prerequisites Check
# ==============================================================================

print_header "Prerequisites Check"

if [ -z "$FIREBASE_TOKEN" ]; then
  echo -e "${RED}ERROR:${NC} FIREBASE_TOKEN environment variable not set"
  echo "Please set it with: export FIREBASE_TOKEN=\"your-token\""
  exit 1
fi
print_info "Firebase token: ${FIREBASE_TOKEN:0:20}... (${#FIREBASE_TOKEN} chars)"

if [ -z "$WORKSPACE_ID" ]; then
  echo -e "${RED}ERROR:${NC} WORKSPACE_ID environment variable not set"
  echo "Please set it with: export WORKSPACE_ID=\"your-workspace-id\""
  exit 1
fi
print_info "Workspace ID: $WORKSPACE_ID"

# Test API connectivity
print_test "API connectivity check"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" || echo "000")
if [ "$STATUS" = "000" ]; then
  print_failure "Cannot connect to API at $API_URL"
  exit 1
fi
print_success "API is reachable at $API_URL"

# ==============================================================================
# Test Setup: Create a Test Ticket
# ==============================================================================

print_header "Setup: Create Test Ticket"

print_info "Creating draft ticket for testing..."

CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/tickets" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "'"$WORKSPACE_ID"'",
    "title": "[TEST] Assignment Test Ticket",
    "description": "Test ticket for assignment functionality",
    "type": "task",
    "priority": "medium"
  }')

STATUS=$(echo "$CREATE_RESPONSE" | tail -n1)
BODY=$(echo "$CREATE_RESPONSE" | head -n-1)

if [ "$STATUS" -ne 201 ]; then
  echo -e "${RED}ERROR:${NC} Failed to create test ticket (HTTP $STATUS)"
  echo "Response: $BODY"
  exit 1
fi

TICKET_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TICKET_ID" ]; then
  echo -e "${RED}ERROR:${NC} Could not extract ticket ID from response"
  echo "Response: $BODY"
  exit 1
fi

print_success "Created test ticket: $TICKET_ID"

# ==============================================================================
# Test 1: Assign Ticket to User
# ==============================================================================

print_header "Test 1: Assign Ticket to User"

USER_ID="test-user-dev-123"

print_test "Assign ticket to user: $USER_ID"

RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$API_URL/tickets/$TICKET_ID/assign" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'"$USER_ID"'"
  }')

STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

check_status 200 "$STATUS" "Assign ticket"

if echo "$BODY" | grep -q '"success":true'; then
  print_success "Response contains success:true"
else
  print_failure "Response missing success:true: $BODY"
fi

# ==============================================================================
# Test 2: Verify Assignment (Get Ticket)
# ==============================================================================

print_header "Test 2: Verify Assignment"

print_test "Get ticket and verify assignedTo field"

GET_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/tickets/$TICKET_ID" \
  -H "Authorization: Bearer $FIREBASE_TOKEN")

STATUS=$(echo "$GET_RESPONSE" | tail -n1)
BODY=$(echo "$GET_RESPONSE" | head -n-1)

check_status 200 "$STATUS" "Get ticket"

if echo "$BODY" | grep -q "\"assignedTo\":\"$USER_ID\""; then
  print_success "Ticket correctly assigned to $USER_ID"
else
  print_failure "Ticket not assigned or wrong user: $BODY"
fi

# ==============================================================================
# Test 3: Reassign to Different User
# ==============================================================================

print_header "Test 3: Reassign to Different User"

NEW_USER_ID="test-user-dev-456"

print_test "Reassign ticket to different user: $NEW_USER_ID"

RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$API_URL/tickets/$TICKET_ID/assign" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'"$NEW_USER_ID"'"
  }')

STATUS=$(echo "$RESPONSE" | tail -n1)

check_status 200 "$STATUS" "Reassign ticket"

# Verify reassignment
GET_RESPONSE=$(curl -s -X GET "$API_URL/tickets/$TICKET_ID" \
  -H "Authorization: Bearer $FIREBASE_TOKEN")

if echo "$GET_RESPONSE" | grep -q "\"assignedTo\":\"$NEW_USER_ID\""; then
  print_success "Ticket reassigned to $NEW_USER_ID"
else
  print_failure "Ticket not reassigned: $GET_RESPONSE"
fi

# ==============================================================================
# Test 4: Unassign Ticket (userId = null)
# ==============================================================================

print_header "Test 4: Unassign Ticket"

print_test "Unassign ticket (set userId to null)"

RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$API_URL/tickets/$TICKET_ID/assign" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": null
  }')

STATUS=$(echo "$RESPONSE" | tail -n1)

check_status 200 "$STATUS" "Unassign ticket"

# Verify unassignment
GET_RESPONSE=$(curl -s -X GET "$API_URL/tickets/$TICKET_ID" \
  -H "Authorization: Bearer $FIREBASE_TOKEN")

if echo "$GET_RESPONSE" | grep -q '"assignedTo":null'; then
  print_success "Ticket unassigned (assignedTo is null)"
else
  print_failure "Ticket still assigned: $GET_RESPONSE"
fi

# ==============================================================================
# Test 5: Empty userId String (Should Fail)
# ==============================================================================

print_header "Test 5: Validation - Empty userId"

print_test "Attempt to assign with empty userId string (should fail)"

RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$API_URL/tickets/$TICKET_ID/assign" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": ""
  }')

STATUS=$(echo "$RESPONSE" | tail -n1)

check_status 400 "$STATUS" "Reject empty userId"

# ==============================================================================
# Test 6: Nonexistent Ticket (Should Fail)
# ==============================================================================

print_header "Test 6: Error Handling - Nonexistent Ticket"

print_test "Attempt to assign nonexistent ticket (should fail)"

RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$API_URL/tickets/aec_nonexistent/assign" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123"
  }')

STATUS=$(echo "$RESPONSE" | tail -n1)

check_status 404 "$STATUS" "Ticket not found"

# ==============================================================================
# Test 7: Assign Same User Twice (Idempotent)
# ==============================================================================

print_header "Test 7: Idempotency - Assign Same User Twice"

IDEMPOTENT_USER="test-user-idempotent"

print_test "Assign user first time"

RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$API_URL/tickets/$TICKET_ID/assign" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'"$IDEMPOTENT_USER"'"
  }')

STATUS=$(echo "$RESPONSE" | tail -n1)
check_status 200 "$STATUS" "First assignment"

print_test "Assign same user second time (idempotent)"

RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$API_URL/tickets/$TICKET_ID/assign" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'"$IDEMPOTENT_USER"'"
  }')

STATUS=$(echo "$RESPONSE" | tail -n1)
check_status 200 "$STATUS" "Second assignment (idempotent)"

# ==============================================================================
# Cleanup
# ==============================================================================

print_header "Cleanup"

print_info "Deleting test ticket: $TICKET_ID"

DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/tickets/$TICKET_ID" \
  -H "Authorization: Bearer $FIREBASE_TOKEN")

STATUS=$(echo "$DELETE_RESPONSE" | tail -n1)

if [ "$STATUS" -eq 204 ]; then
  print_success "Test ticket deleted"
else
  print_info "Could not delete test ticket (HTTP $STATUS) - manual cleanup may be needed"
fi

# ==============================================================================
# Summary
# ==============================================================================

print_summary
