#!/bin/bash

# ============================================================================
# ITERATIVE QUESTION REFINEMENT WORKFLOW - FULL INTEGRATION TEST
# Tests the complete ticket creation flow with 3-round question refinement
# ============================================================================

set -e

API_BASE="http://localhost:3000/api"
WORKSPACE_ID="workspace-test-123"  # Mock workspace
AUTH_TOKEN="Bearer test-token-123"  # Mock token

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ITERATIVE QUESTION REFINEMENT WORKFLOW - FULL E2E TEST${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}\n"

# ============================================================================
# STEP 1: Create Draft Ticket
# ============================================================================

echo -e "${YELLOW}[STEP 1] Creating Draft Ticket${NC}"
echo "POST /api/tickets"
echo "────────────────────────────────────────────────────────────────"

CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/tickets" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" \
  -d '{
    "title": "Add real-time notifications to dashboard",
    "description": "Users should receive real-time updates when team members make changes",
    "repositoryContext": {
      "owner": "anthropics",
      "name": "claude-code",
      "branch": "main"
    }
  }')

echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"

TICKET_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id' 2>/dev/null)

if [ -z "$TICKET_ID" ] || [ "$TICKET_ID" = "null" ]; then
  echo -e "${RED}❌ Failed to create ticket${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Ticket created with ID: $TICKET_ID${NC}\n"

# ============================================================================
# STEP 2: Start Question Round 1 (Initial Analysis)
# ============================================================================

echo -e "${YELLOW}[STEP 2] Starting Question Round 1${NC}"
echo "POST /api/tickets/$TICKET_ID/start-round"
echo "────────────────────────────────────────────────────────────────"

ROUND1_START=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/start-round" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" \
  -d '{
    "roundNumber": 1
  }')

echo "$ROUND1_START" | jq '.questionRounds[0].questions | .[0:2]' 2>/dev/null || echo "$ROUND1_START"

ROUND1_QUESTIONS=$(echo "$ROUND1_START" | jq '.questionRounds[0].questions' 2>/dev/null)
QUESTION_COUNT=$(echo "$ROUND1_QUESTIONS" | jq 'length' 2>/dev/null || echo "unknown")

echo -e "${GREEN}✅ Round 1 started with $QUESTION_COUNT questions${NC}\n"

# ============================================================================
# STEP 3: Submit Answers for Round 1
# ============================================================================

echo -e "${YELLOW}[STEP 3] Submitting Round 1 Answers${NC}"
echo "POST /api/tickets/$TICKET_ID/submit-answers"
echo "────────────────────────────────────────────────────────────────"

ROUND1_SUBMIT=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/submit-answers" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" \
  -d '{
    "roundNumber": 1,
    "answers": {
      "real-time-tech": "websocket",
      "user-notification-preference": "in-app",
      "authentication-mechanism": "jwt"
    }
  }')

echo "$ROUND1_SUBMIT" | jq '.nextAction' 2>/dev/null || echo "$ROUND1_SUBMIT"

NEXT_ACTION=$(echo "$ROUND1_SUBMIT" | jq -r '.nextAction' 2>/dev/null)

echo -e "${GREEN}✅ Round 1 answers submitted${NC}"
echo -e "📋 Next action: ${YELLOW}$NEXT_ACTION${NC}\n"

# ============================================================================
# STEP 4: Conditional Round 2 (if LLM decides to continue)
# ============================================================================

if [ "$NEXT_ACTION" = "continue-asking" ] || [ "$NEXT_ACTION" = "continue" ]; then
  echo -e "${YELLOW}[STEP 4] Starting Question Round 2${NC}"
  echo "POST /api/tickets/$TICKET_ID/start-round"
  echo "────────────────────────────────────────────────────────────────"

  ROUND2_START=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/start-round" \
    -H "Content-Type: application/json" \
    -H "Authorization: $AUTH_TOKEN" \
    -H "X-Workspace-Id: $WORKSPACE_ID" \
    -d '{
      "roundNumber": 2
    }')

  echo "$ROUND2_START" | jq '.questionRounds[1].questions | .[0:2]' 2>/dev/null || echo "$ROUND2_START"

  ROUND2_QUESTIONS=$(echo "$ROUND2_START" | jq '.questionRounds[1].questions' 2>/dev/null)
  QUESTION_COUNT=$(echo "$ROUND2_QUESTIONS" | jq 'length' 2>/dev/null || echo "unknown")

  echo -e "${GREEN}✅ Round 2 started with $QUESTION_COUNT questions${NC}\n"

  # ============================================================================
  # STEP 5: Submit Answers for Round 2
  # ============================================================================

  echo -e "${YELLOW}[STEP 5] Submitting Round 2 Answers${NC}"
  echo "POST /api/tickets/$TICKET_ID/submit-answers"
  echo "────────────────────────────────────────────────────────────────"

  ROUND2_SUBMIT=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/submit-answers" \
    -H "Content-Type: application/json" \
    -H "Authorization: $AUTH_TOKEN" \
    -H "X-Workspace-Id: $WORKSPACE_ID" \
    -d '{
      "roundNumber": 2,
      "answers": {
        "database-for-notifications": "redis",
        "message-queue": "rabbitmq",
        "scaling-approach": "horizontal"
      }
    }')

  echo "$ROUND2_SUBMIT" | jq '.nextAction' 2>/dev/null || echo "$ROUND2_SUBMIT"

  NEXT_ACTION=$(echo "$ROUND2_SUBMIT" | jq -r '.nextAction' 2>/dev/null)

  echo -e "${GREEN}✅ Round 2 answers submitted${NC}"
  echo -e "📋 Next action: ${YELLOW}$NEXT_ACTION${NC}\n"

  # ============================================================================
  # STEP 6: Optional Round 3 (if still needed)
  # ============================================================================

  if [ "$NEXT_ACTION" = "continue-asking" ] || [ "$NEXT_ACTION" = "continue" ]; then
    echo -e "${YELLOW}[STEP 6] Starting Question Round 3 (Final)${NC}"
    echo "POST /api/tickets/$TICKET_ID/start-round"
    echo "────────────────────────────────────────────────────────────────"

    ROUND3_START=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/start-round" \
      -H "Content-Type: application/json" \
      -H "Authorization: $AUTH_TOKEN" \
      -H "X-Workspace-Id: $WORKSPACE_ID" \
      -d '{
        "roundNumber": 3
      }')

    echo "$ROUND3_START" | jq '.questionRounds[2].questions | .[0:2]' 2>/dev/null || echo "$ROUND3_START"

    ROUND3_QUESTIONS=$(echo "$ROUND3_START" | jq '.questionRounds[2].questions' 2>/dev/null)
    QUESTION_COUNT=$(echo "$ROUND3_QUESTIONS" | jq 'length' 2>/dev/null || echo "unknown")

    echo -e "${GREEN}✅ Round 3 started with $QUESTION_COUNT questions${NC}\n"

    # ============================================================================
    # STEP 7: Submit Answers for Round 3
    # ============================================================================

    echo -e "${YELLOW}[STEP 7] Submitting Round 3 Answers${NC}"
    echo "POST /api/tickets/$TICKET_ID/submit-answers"
    echo "────────────────────────────────────────────────────────────────"

    ROUND3_SUBMIT=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/submit-answers" \
      -H "Content-Type: application/json" \
      -H "Authorization: $AUTH_TOKEN" \
      -H "X-Workspace-Id: $WORKSPACE_ID" \
      -d '{
        "roundNumber": 3,
        "answers": {
          "error-handling-strategy": "retry-with-exponential-backoff",
          "monitoring-approach": "prometheus"
        }
      }')

    echo "$ROUND3_SUBMIT" | jq '.nextAction' 2>/dev/null || echo "$ROUND3_SUBMIT"

    NEXT_ACTION=$(echo "$ROUND3_SUBMIT" | jq -r '.nextAction' 2>/dev/null)

    echo -e "${GREEN}✅ Round 3 answers submitted${NC}"
    echo -e "📋 Next action: ${YELLOW}$NEXT_ACTION${NC}\n"
  fi
fi

# ============================================================================
# STEP 8: Finalize Technical Specification
# ============================================================================

echo -e "${YELLOW}[STEP 8] Finalizing Technical Specification${NC}"
echo "POST /api/tickets/$TICKET_ID/finalize"
echo "────────────────────────────────────────────────────────────────"

FINALIZE=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/finalize" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" \
  -d '{}')

echo "$FINALIZE" | jq '.techSpec | keys[0:10]' 2>/dev/null || echo "$FINALIZE"

TECH_SPEC=$(echo "$FINALIZE" | jq '.techSpec' 2>/dev/null)

if [ -n "$TECH_SPEC" ] && [ "$TECH_SPEC" != "null" ]; then
  echo -e "${GREEN}✅ Technical specification generated${NC}\n"

  # Show spec summary
  echo -e "${BLUE}TECHNICAL SPEC SUMMARY:${NC}"
  echo "$FINALIZE" | jq '.techSpec | {problemStatement: .problemStatement, acceptanceCriteria: (.acceptanceCriteria | length), fileChanges: (.fileChanges | length)}' 2>/dev/null
else
  echo -e "${RED}⚠️  No technical spec generated${NC}\n"
fi

# ============================================================================
# STEP 9: Retrieve Final Ticket State
# ============================================================================

echo -e "${YELLOW}[STEP 9] Retrieving Final Ticket State${NC}"
echo "GET /api/tickets/$TICKET_ID"
echo "────────────────────────────────────────────────────────────────"

FINAL=$(curl -s -X GET "$API_BASE/tickets/$TICKET_ID" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID")

echo "$FINAL" | jq '{status: .status, rounds: (.questionRounds | length), currentRound: .currentRound, hasSpec: (.techSpec != null)}' 2>/dev/null || echo "$FINAL"

echo -e "\n${GREEN}✅ WORKFLOW COMPLETE${NC}\n"

# ============================================================================
# TEST SUMMARY
# ============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}WORKFLOW SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo "Ticket ID:      $TICKET_ID"
echo "Rounds:         $(echo "$FINAL" | jq '.questionRounds | length' 2>/dev/null || echo "unknown")"
echo "Current Round:  $(echo "$FINAL" | jq '.currentRound' 2>/dev/null || echo "unknown")"
echo "Status:         $(echo "$FINAL" | jq -r '.status' 2>/dev/null || echo "unknown")"
echo "Spec Generated: $(echo "$FINAL" | jq 'if .techSpec != null then "Yes ✅" else "No ❌" end' 2>/dev/null || echo "unknown")"
echo ""
echo -e "${GREEN}Ready for validation and ticket creation!${NC}"
