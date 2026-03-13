#!/bin/bash

# ==============================================================================
# End-to-End Ticket Flow Test Script
# ==============================================================================
# Tests the complete lifecycle: create → generate questions → submit answers
# (generates tech spec + wireframes) → refine wireframe → export → cleanup
#
# Prerequisites:
#   - Backend server running (http://localhost:3000)
#   - Valid Firebase auth token set in FIREBASE_TOKEN env var
#   - Valid team ID set in TEAM_ID env var
#
# Quick start (get token from browser devtools → Network → any /api request → Authorization header):
#   export FIREBASE_TOKEN="eyJhbG..."
#   export TEAM_ID="your-team-id"
#   ./scripts/test-e2e-ticket-flow.sh
#
# Options:
#   --skip-cleanup    Keep the test ticket after the run (for manual inspection)
#   --verbose         Show full response bodies
# ==============================================================================

set -euo pipefail

# ── Args ──
SKIP_CLEANUP=false
VERBOSE=false
for arg in "$@"; do
  case $arg in
    --skip-cleanup) SKIP_CLEANUP=true ;;
    --verbose) VERBOSE=true ;;
  esac
done

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
DIM='\033[0;90m'
NC='\033[0m'

# ── Config ──
API_URL="${API_URL:-http://localhost:3000/api}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Auto-generate Firebase token if not provided
if [ -z "${FIREBASE_TOKEN:-}" ]; then
  echo -e "${DIM}Generating Firebase token...${NC}"
  FIREBASE_TOKEN=$(node "$SCRIPT_DIR/get-test-token.js" 2>/dev/null)
  if [ -z "$FIREBASE_TOKEN" ]; then
    echo -e "${RED}ERROR:${NC} Failed to generate Firebase token"
    exit 1
  fi
fi

# Default team ID: personal workspace for the test user
TEAM_ID="${TEAM_ID:-personal_e2e-test-user}"

# ── Counters ──
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
TICKET_ID=""

# ==============================================================================
# Helpers
# ==============================================================================

log_header() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_step() {
  TESTS_RUN=$((TESTS_RUN + 1))
  echo -e "\n${YELLOW}[$TESTS_RUN]${NC} $1"
}

log_pass() {
  TESTS_PASSED=$((TESTS_PASSED + 1))
  echo -e "  ${GREEN}✓${NC} $1"
}

log_fail() {
  TESTS_FAILED=$((TESTS_FAILED + 1))
  echo -e "  ${RED}✗${NC} $1"
}

log_info() {
  echo -e "  ${DIM}→ $1${NC}"
}

log_body() {
  if $VERBOSE; then
    echo -e "  ${DIM}$(echo "$1" | head -c 500)${NC}"
  fi
}

# curl wrapper: returns "<body>\n<status_code>"
api() {
  local method=$1 path=$2
  shift 2
  curl -s -w "\n%{http_code}" \
    -X "$method" \
    "${API_URL}${path}" \
    -H "Authorization: Bearer ${FIREBASE_TOKEN}" \
    -H "x-team-id: ${TEAM_ID}" \
    -H "Content-Type: application/json" \
    "$@"
}

# Extract status (last line) and body (everything else)
parse_response() {
  local response="$1"
  RESP_STATUS=$(echo "$response" | tail -n1)
  RESP_BODY=$(echo "$response" | sed '$d')
}

# Check status code
assert_status() {
  local expected=$1 label=$2
  if [ "$RESP_STATUS" -eq "$expected" ]; then
    log_pass "$label (HTTP $RESP_STATUS)"
  else
    log_fail "$label — expected HTTP $expected, got $RESP_STATUS"
    log_body "$RESP_BODY"
  fi
}

# Check response body contains string
assert_contains() {
  local needle=$1 label=$2
  if echo "$RESP_BODY" | grep -q "$needle"; then
    log_pass "$label"
  else
    log_fail "$label — response missing '$needle'"
    log_body "$RESP_BODY"
  fi
}

# Extract JSON field (simple grep-based, no jq dependency)
json_field() {
  echo "$1" | grep -o "\"$2\":\"[^\"]*\"" | head -1 | cut -d'"' -f4
}

json_field_raw() {
  echo "$1" | grep -o "\"$2\":[^,}]*" | head -1 | sed "s/\"$2\"://"
}

# ==============================================================================
# Prerequisites
# ==============================================================================

log_header "Prerequisites"

if [ -z "$FIREBASE_TOKEN" ]; then
  echo -e "${RED}ERROR:${NC} FIREBASE_TOKEN not set."
  echo "Get it from browser devtools → Network → any /api request → Authorization header"
  echo "  export FIREBASE_TOKEN=\"eyJhbG...\""
  exit 1
fi
log_info "Token: ${FIREBASE_TOKEN:0:20}... (${#FIREBASE_TOKEN} chars)"

if [ -z "$TEAM_ID" ]; then
  echo -e "${RED}ERROR:${NC} TEAM_ID not set."
  echo "  export TEAM_ID=\"your-team-id\""
  exit 1
fi
log_info "Team: $TEAM_ID"

log_step "API health check"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL%/api}/health" 2>/dev/null || echo "000")
if [ "$HEALTH_STATUS" = "000" ]; then
  # Try the API root as fallback
  HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/tickets/quota" \
    -H "Authorization: Bearer ${FIREBASE_TOKEN}" \
    -H "x-team-id: ${TEAM_ID}" 2>/dev/null || echo "000")
fi
if [ "$HEALTH_STATUS" = "000" ]; then
  log_fail "Cannot reach API at ${API_URL}"
  exit 1
fi
log_pass "API reachable"

# ==============================================================================
# Step 1: Create Ticket (draft)
# ==============================================================================

log_header "Step 1 — Create Ticket"

log_step "POST /tickets — create feature ticket with wireframe + API spec"
parse_response "$(api POST /tickets -d '{
  "title": "[E2E Test] Dashboard Analytics Widget",
  "description": "Add a real-time analytics widget to the main dashboard showing active users, page views, and conversion rate. Should include a sparkline chart and auto-refresh every 30 seconds.",
  "type": "feature",
  "priority": "high",
  "includeWireframes": true,
  "includeApiSpec": true,
  "wireframeContext": "A card-based widget with a header showing the metric name, a large number, percentage change badge, and a small sparkline chart below. Three cards side by side: Active Users, Page Views, Conversion Rate. Below the cards, a date range picker."
}')"

assert_status 201 "Ticket created"
TICKET_ID=$(json_field "$RESP_BODY" "id")
if [ -n "$TICKET_ID" ]; then
  log_pass "Got ticket ID: $TICKET_ID"
else
  log_fail "Could not extract ticket ID"
  echo "$RESP_BODY"
  exit 1
fi

TICKET_STATUS=$(json_field "$RESP_BODY" "status")
log_info "Status: $TICKET_STATUS"
assert_contains '"includeWireframes":true' "Wireframes flag set"
assert_contains '"includeApiSpec":true' "API spec flag set"
log_body "$RESP_BODY"

# ==============================================================================
# Step 2: Get Ticket (verify creation)
# ==============================================================================

log_header "Step 2 — Verify Ticket"

log_step "GET /tickets/$TICKET_ID"
parse_response "$(api GET "/tickets/$TICKET_ID")"
assert_status 200 "Ticket retrieved"
assert_contains "$TICKET_ID" "ID matches"
assert_contains '"type":"feature"' "Type is feature"
assert_contains '"priority":"high"' "Priority is high"

# ==============================================================================
# Step 3: List Tickets (verify it appears)
# ==============================================================================

log_header "Step 3 — List Tickets"

log_step "GET /tickets — list all tickets"
parse_response "$(api GET /tickets)"
assert_status 200 "List retrieved"
assert_contains "$TICKET_ID" "New ticket appears in list"

# ==============================================================================
# Step 4: Generate Clarification Questions
# ==============================================================================

log_header "Step 4 — Generate Questions (LLM)"

log_step "POST /tickets/$TICKET_ID/generate-questions"
echo -e "  ${DIM}→ This calls the LLM — may take 10-30s...${NC}"
parse_response "$(api POST "/tickets/$TICKET_ID/generate-questions" --max-time 120)"
# NestJS returns 201 for @Post by default
if [ "$RESP_STATUS" -eq 200 ] || [ "$RESP_STATUS" -eq 201 ]; then
  log_pass "Questions generated (HTTP $RESP_STATUS)"
  TESTS_RUN=$((TESTS_RUN + 1))
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  assert_status 200 "Questions generated"
fi
assert_contains '"questions"' "Response has questions array"

# Extract question count
Q_COUNT=$(echo "$RESP_BODY" | grep -o '"id"' | wc -l)
log_info "Got $Q_COUNT questions"

# Extract first question ID for answer submission
FIRST_Q_ID=$(json_field "$RESP_BODY" "id")
log_info "First question ID: $FIRST_Q_ID"
log_body "$RESP_BODY"

# ==============================================================================
# Step 5: Submit Answers (generates Tech Spec + Wireframes)
# ==============================================================================

log_header "Step 5 — Submit Answers → Tech Spec + Wireframes (LLM)"

# Build answers map: answer every question with a reasonable default
# Extract all question IDs
Q_IDS=$(echo "$RESP_BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

ANSWERS_JSON="{"
FIRST=true
for qid in $Q_IDS; do
  if $FIRST; then
    FIRST=false
  else
    ANSWERS_JSON+=","
  fi
  ANSWERS_JSON+="\"$qid\":\"Use the default / recommended approach\""
done
ANSWERS_JSON+="}"

log_step "POST /tickets/$TICKET_ID/submit-answers"
echo -e "  ${DIM}→ This generates the full tech spec + wireframes — may take 30-90s...${NC}"
parse_response "$(api POST "/tickets/$TICKET_ID/submit-answers" -d "{
  \"answers\": $ANSWERS_JSON
}" --max-time 300)"

# NestJS returns 201 for @Post by default
if [ "$RESP_STATUS" -eq 200 ] || [ "$RESP_STATUS" -eq 201 ]; then
  log_pass "Answers submitted, spec generated (HTTP $RESP_STATUS)"
  TESTS_RUN=$((TESTS_RUN + 1))
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  assert_status 200 "Answers submitted, spec generated"
fi
assert_contains '"techSpec"' "Response has techSpec"
assert_contains '"problemStatement"' "Tech spec has problemStatement"
assert_contains '"solution"' "Tech spec has solution"
assert_contains '"acceptanceCriteria"' "Tech spec has acceptanceCriteria"

# Check for wireframes
if echo "$RESP_BODY" | grep -q '"excalidrawData"'; then
  log_pass "Excalidraw wireframe data present"

  # Check wireframe has elements
  if echo "$RESP_BODY" | grep -q '"elements":\['; then
    ELEM_COUNT=$(echo "$RESP_BODY" | grep -o '"type":"rectangle"\|"type":"text"\|"type":"ellipse"\|"type":"diamond"\|"type":"arrow"' | wc -l)
    log_info "Wireframe has ~$ELEM_COUNT elements"
  fi
else
  log_info "No excalidrawData in response (wireframes may have failed gracefully)"
fi

# Check for API spec
if echo "$RESP_BODY" | grep -q '"apiChanges"'; then
  log_pass "API changes section present"
  if echo "$RESP_BODY" | grep -q '"endpoints":\['; then
    EP_COUNT=$(echo "$RESP_BODY" | grep -o '"route"' | wc -l)
    log_info "API spec has ~$EP_COUNT endpoints"
  fi
else
  log_info "No apiChanges section"
fi

SPEC_SCORE=$(json_field_raw "$RESP_BODY" "qualityScore")
log_info "Quality score: $SPEC_SCORE"
log_body "$RESP_BODY"

# ==============================================================================
# Step 6: Refine Wireframe (if wireframes were generated)
# ==============================================================================

log_header "Step 6 — Refine Wireframe (LLM)"

# Extract excalidraw elements for refinement
if echo "$RESP_BODY" | grep -q '"excalidrawData"'; then
  log_step "POST /tickets/$TICKET_ID/refine-wireframe"
  echo -e "  ${DIM}→ Sending refinement instruction to LLM...${NC}"

  # Extract elements using node (grep is too fragile for nested JSON)
  ELEMENTS_JSON=$(echo "$RESP_BODY" | node -e "
    let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
      try{
        const o=JSON.parse(d);
        const els=o.techSpec?.visualExpectations?.excalidrawData?.elements;
        if(els&&els.length)process.stdout.write(JSON.stringify(els));
        else process.stdout.write('[]');
      }catch(e){process.stdout.write('[]');}
    });
  ")

  if [ -n "$ELEMENTS_JSON" ] && [ "$ELEMENTS_JSON" != "[]" ]; then
    parse_response "$(api POST "/tickets/$TICKET_ID/refine-wireframe" -d "{
      \"instruction\": \"Add a refresh button icon in the top-right corner of each analytics card\",
      \"currentElements\": $ELEMENTS_JSON
    }" --max-time 120)"

    assert_status 200 "Wireframe refined"
    assert_contains '"elements"' "Response has refined elements"

    REFINED_COUNT=$(echo "$RESP_BODY" | grep -o '"type"' | wc -l)
    log_info "Refined wireframe has ~$REFINED_COUNT elements"
  else
    log_info "Could not extract elements for refinement — skipping"
    TESTS_RUN=$((TESTS_RUN + 1))
  fi
else
  log_step "Skipping wireframe refinement (no wireframes generated)"
  TESTS_RUN=$((TESTS_RUN + 1))
fi

# ==============================================================================
# Step 7: Export Tech Spec
# ==============================================================================

log_header "Step 7 — Export"

log_step "GET /tickets/$TICKET_ID/export/markdown"
EXPORT_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "${API_URL}/tickets/$TICKET_ID/export/markdown" \
  -H "Authorization: Bearer ${FIREBASE_TOKEN}" \
  -H "x-team-id: ${TEAM_ID}")
RESP_STATUS=$(echo "$EXPORT_RESPONSE" | tail -n1)
RESP_BODY=$(echo "$EXPORT_RESPONSE" | sed '$d')

assert_status 200 "Markdown export"
if echo "$RESP_BODY" | grep -q "# "; then
  log_pass "Export contains markdown headings"
  LINES=$(echo "$RESP_BODY" | wc -l)
  log_info "Export is $LINES lines"
else
  log_info "Export body may be empty or different format"
fi

# ==============================================================================
# Step 8: Update Ticket
# ==============================================================================

log_header "Step 8 — Update Ticket"

log_step "PATCH /tickets/$TICKET_ID — update title"
parse_response "$(api PATCH "/tickets/$TICKET_ID" -d '{
  "title": "[E2E Test] Dashboard Analytics Widget (updated)"
}')"
assert_status 200 "Ticket updated"
assert_contains "updated" "Title updated in response"

# ==============================================================================
# Step 9: Validation Tests
# ==============================================================================

log_header "Step 9 — Validation & Error Handling"

log_step "POST /tickets — missing title (should fail)"
parse_response "$(api POST /tickets -d '{
  "description": "no title"
}')"
assert_status 400 "Rejected missing title"

log_step "GET /tickets/aec_nonexistent-id — not found"
parse_response "$(api GET /tickets/aec_00000000-0000-0000-0000-000000000000)"
assert_status 404 "Not found for invalid ID"

log_step "POST /tickets/$TICKET_ID/refine-wireframe — missing fields (should fail)"
parse_response "$(api POST "/tickets/$TICKET_ID/refine-wireframe" -d '{}')"
assert_status 400 "Rejected empty refinement request"

# ==============================================================================
# Cleanup
# ==============================================================================

log_header "Cleanup"

if $SKIP_CLEANUP; then
  log_info "Skipping cleanup (--skip-cleanup). Ticket: $TICKET_ID"
else
  log_step "DELETE /tickets/$TICKET_ID"
  parse_response "$(api DELETE "/tickets/$TICKET_ID")"
  if [ "$RESP_STATUS" -eq 204 ] || [ "$RESP_STATUS" -eq 200 ]; then
    log_pass "Test ticket deleted"
  else
    log_info "Could not delete (HTTP $RESP_STATUS) — manual cleanup needed"
  fi
fi

# ==============================================================================
# Summary
# ==============================================================================

log_header "Results"
echo -e "  Total:  $TESTS_RUN"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "  ${GREEN}All tests passed ✓${NC}"
  echo ""
  exit 0
else
  echo -e "  ${RED}Some tests failed ✗${NC}"
  echo ""
  exit 1
fi
