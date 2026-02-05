#!/bin/bash

# ============================================================================
# SIMPLE CURL TEST - ITERATIVE TICKET CREATION WORKFLOW
# ============================================================================
# This script demonstrates the full workflow with commented examples.
# For authentication, see CURL-TEST-GUIDE.md
# ============================================================================

API_BASE="http://localhost:3000/api"
WORKSPACE_ID="test-workspace-123"

# IMPORTANT: You need a valid Firebase ID token
# Get one by:
# 1. Using Firebase Console to create a test user
# 2. Using Firebase Admin SDK to generate a custom token
# 3. Temporarily disabling auth in tickets.controller.ts for development
#
# For testing, comment out auth headers to test locally if auth is disabled

AUTH_TOKEN="${FIREBASE_TEST_TOKEN:-Bearer test-token}"  # Replace with real token

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ITERATIVE TICKET CREATION - WORKFLOW TEST                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

# ============================================================================
# STEP 1: CREATE DRAFT TICKET
# ============================================================================

echo -e "${YELLOW}► STEP 1: Create Draft Ticket${NC}\n"

echo "Command:"
echo "--------"
cat << 'EOF'
curl -X POST "$API_BASE/tickets" \
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
  }' | jq '.'
EOF

echo ""
echo "Executing..."

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
  echo -e "\n${RED}❌ Failed to create ticket${NC}"
  echo -e "${YELLOW}Make sure you have:${NC}"
  echo "  1. Backend running on localhost:3000"
  echo "  2. Valid Firebase ID token in AUTH_TOKEN"
  echo "  3. See CURL-TEST-GUIDE.md for authentication setup"
  exit 1
fi

echo -e "\n${GREEN}✅ Ticket created: $TICKET_ID${NC}\n"

# ============================================================================
# STEP 2: START QUESTION ROUND 1
# ============================================================================

echo -e "${YELLOW}► STEP 2: Start Question Round 1${NC}\n"

echo "Command:"
echo "--------"
cat << EOF
curl -X POST "$API_BASE/tickets/$TICKET_ID/start-round" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: \$AUTH_TOKEN" \\
  -H "X-Workspace-Id: \$WORKSPACE_ID" \\
  -d '{
    "roundNumber": 1
  }' | jq '.questionRounds[0] | {count: (.questions | length), questions: .questions[0:2]}'
EOF

echo ""
echo "Executing..."

ROUND1_START=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/start-round" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" \
  -d '{
    "roundNumber": 1
  }')

echo "$ROUND1_START" | jq '.questionRounds[0] | {count: (.questions | length), roundNumber, generatedAt}' 2>/dev/null || echo "$ROUND1_START"

QUESTIONS=$(echo "$ROUND1_START" | jq '.questionRounds[0].questions' 2>/dev/null)
QUESTION_COUNT=$(echo "$QUESTIONS" | jq 'length' 2>/dev/null || echo "0")

echo -e "\n${GREEN}✅ Round 1 started with $QUESTION_COUNT questions${NC}\n"

# ============================================================================
# STEP 3: SUBMIT ANSWERS FOR ROUND 1
# ============================================================================

echo -e "${YELLOW}► STEP 3: Submit Round 1 Answers${NC}\n"

echo "Command:"
echo "--------"
cat << EOF
curl -X POST "$API_BASE/tickets/$TICKET_ID/submit-answers" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: \$AUTH_TOKEN" \\
  -H "X-Workspace-Id: \$WORKSPACE_ID" \\
  -d '{
    "roundNumber": 1,
    "answers": {
      "real-time-tech": "websocket",
      "notification-type": "in-app",
      "authentication": "jwt"
    }
  }' | jq '.nextAction'
EOF

echo ""
echo "Executing..."

ROUND1_SUBMIT=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/submit-answers" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" \
  -d '{
    "roundNumber": 1,
    "answers": {
      "real-time-tech": "websocket",
      "notification-type": "in-app",
      "authentication": "jwt"
    }
  }')

echo "$ROUND1_SUBMIT" | jq '{nextAction, status: .aec.status, roundsCompleted: (.aec.questionRounds | map(select(.answeredAt != null)) | length)}' 2>/dev/null || echo "$ROUND1_SUBMIT"

NEXT_ACTION=$(echo "$ROUND1_SUBMIT" | jq -r '.nextAction' 2>/dev/null)

echo -e "\n${GREEN}✅ Round 1 answers submitted${NC}"
echo -e "📋 LLM Decision: ${YELLOW}$NEXT_ACTION${NC}\n"

# ============================================================================
# STEP 4: CONDITIONAL ROUND 2 (if continuing)
# ============================================================================

if [ "$NEXT_ACTION" = "continue-asking" ] || [ "$NEXT_ACTION" = "continue" ]; then
  echo -e "${YELLOW}► STEP 4: Start Question Round 2${NC}\n"

  echo "Executing..."
  ROUND2_START=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/start-round" \
    -H "Content-Type: application/json" \
    -H "Authorization: $AUTH_TOKEN" \
    -H "X-Workspace-Id: $WORKSPACE_ID" \
    -d '{
      "roundNumber": 2
    }')

  QUESTION_COUNT=$(echo "$ROUND2_START" | jq '.questionRounds[1].questions | length' 2>/dev/null || echo "0")
  echo -e "${GREEN}✅ Round 2 started with $QUESTION_COUNT questions${NC}\n"

  echo -e "${YELLOW}► STEP 5: Submit Round 2 Answers${NC}\n"

  echo "Executing..."
  ROUND2_SUBMIT=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/submit-answers" \
    -H "Content-Type: application/json" \
    -H "Authorization: $AUTH_TOKEN" \
    -H "X-Workspace-Id: $WORKSPACE_ID" \
    -d '{
      "roundNumber": 2,
      "answers": {
        "database": "redis",
        "queue": "rabbitmq",
        "scaling": "horizontal"
      }
    }')

  NEXT_ACTION=$(echo "$ROUND2_SUBMIT" | jq -r '.nextAction' 2>/dev/null)

  echo -e "${GREEN}✅ Round 2 answers submitted${NC}"
  echo -e "📋 LLM Decision: ${YELLOW}$NEXT_ACTION${NC}\n"

  # Optional Round 3
  if [ "$NEXT_ACTION" = "continue-asking" ] || [ "$NEXT_ACTION" = "continue" ]; then
    echo -e "${YELLOW}► STEP 6: Start Question Round 3 (Final)${NC}\n"

    curl -s -X POST "$API_BASE/tickets/$TICKET_ID/start-round" \
      -H "Content-Type: application/json" \
      -H "Authorization: $AUTH_TOKEN" \
      -H "X-Workspace-Id: $WORKSPACE_ID" \
      -d '{"roundNumber": 3}' > /dev/null

    echo -e "${GREEN}✅ Round 3 started${NC}\n"

    echo -e "${YELLOW}► STEP 7: Submit Round 3 Answers${NC}\n"

    curl -s -X POST "$API_BASE/tickets/$TICKET_ID/submit-answers" \
      -H "Content-Type: application/json" \
      -H "Authorization: $AUTH_TOKEN" \
      -H "X-Workspace-Id: $WORKSPACE_ID" \
      -d '{
        "roundNumber": 3,
        "answers": {
          "error-handling": "retry-with-backoff",
          "monitoring": "prometheus"
        }
      }' > /dev/null

    echo -e "${GREEN}✅ Round 3 answers submitted (Max rounds reached)${NC}\n"
  fi
fi

# ============================================================================
# STEP 8: FINALIZE SPECIFICATION
# ============================================================================

echo -e "${YELLOW}► STEP 8: Finalize Technical Specification${NC}\n"

echo "Executing..."
FINALIZE=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/finalize" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" \
  -d '{}')

echo "$FINALIZE" | jq '{status: .status, spec: (.techSpec | if . then "Generated ✅" else "Missing ❌" end), rounds: (.questionRounds | length)}' 2>/dev/null || echo "$FINALIZE"

echo -e "\n${GREEN}✅ Specification finalized${NC}\n"

# ============================================================================
# STEP 9: RETRIEVE FINAL STATE
# ============================================================================

echo -e "${YELLOW}► STEP 9: Retrieve Final Ticket State${NC}\n"

echo "Executing..."
FINAL=$(curl -s -X GET "$API_BASE/tickets/$TICKET_ID" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID")

echo "$FINAL" | jq '{
  status,
  rounds: (.questionRounds | length),
  currentRound,
  hasSpec: (.techSpec != null),
  acceptanceCriteria: (.techSpec.acceptanceCriteria | length),
  fileChanges: (.techSpec.fileChanges | length)
}' 2>/dev/null || echo "$FINAL"

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  WORKFLOW COMPLETE ✅                                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo "Ticket ID:     $TICKET_ID"
echo "Status:        $(echo "$FINAL" | jq -r '.status' 2>/dev/null || echo "unknown")"
echo "Rounds:        $(echo "$FINAL" | jq '.questionRounds | length' 2>/dev/null || echo "unknown")"
echo "Spec:          $(echo "$FINAL" | jq 'if .techSpec != null then "Generated ✅" else "Missing ❌" end' 2>/dev/null || echo "unknown")"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "  1. Review specification: GET /api/tickets/$TICKET_ID"
echo "  2. Validate specification"
echo "  3. Create GitHub issue"
echo "  4. Assign to team"

echo -e "\n${BLUE}For more details, see CURL-TEST-GUIDE.md${NC}\n"
