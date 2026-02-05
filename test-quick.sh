#!/bin/bash

API_BASE="http://localhost:3000/api"
WORKSPACE_ID="test-workspace-123"

echo "=== STEP 1: Create Draft Ticket ==="
CREATE=$(curl -s -X POST "$API_BASE/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Add real-time notifications to dashboard",
    "description": "Users should receive real-time updates",
    "repositoryFullName": "anthropics/claude-code",
    "branchName": "main"
  }')

echo "$CREATE" | jq '.'
TICKET_ID=$(echo "$CREATE" | jq -r '.id')
echo "Ticket ID: $TICKET_ID"
echo ""

# Verify ticket was created
if [ "$TICKET_ID" = "null" ] || [ -z "$TICKET_ID" ]; then
  echo "❌ Failed to create ticket"
  exit 1
fi

echo "=== STEP 2: Start Question Round 1 ==="
ROUND1=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/start-round" \
  -H "Content-Type: application/json" \
  -d '{"roundNumber": 1}')

echo "$ROUND1" | jq '{
  status: .status,
  currentRound: .currentRound,
  questionCount: (.questionRounds[0].questions | length),
  firstQuestion: .questionRounds[0].questions[0]
}'
echo ""

echo "=== STEP 3: Submit Round 1 Answers ==="
ROUND1_ANSWERS=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/submit-answers" \
  -H "Content-Type: application/json" \
  -d '{
    "roundNumber": 1,
    "answers": {
      "tech-choice": "websocket",
      "notification-scope": "dashboard",
      "auth-method": "jwt"
    }
  }')

echo "$ROUND1_ANSWERS" | jq '{nextAction, status: .aec.status}'
NEXT_ACTION=$(echo "$ROUND1_ANSWERS" | jq -r '.nextAction')
echo ""

if [ "$NEXT_ACTION" = "continue-asking" ] || [ "$NEXT_ACTION" = "continue" ]; then
  echo "=== STEP 4: Start Question Round 2 ==="
  curl -s -X POST "$API_BASE/tickets/$TICKET_ID/start-round" \
    -H "Content-Type: application/json" \
    -d '{"roundNumber": 2}' | jq '{
    status: .status,
    questionCount: (.questionRounds[1].questions | length),
    currentRound: .currentRound
  }'
  echo ""

  echo "=== STEP 5: Submit Round 2 Answers ==="
  curl -s -X POST "$API_BASE/tickets/$TICKET_ID/submit-answers" \
    -H "Content-Type: application/json" \
    -d '{
      "roundNumber": 2,
      "answers": {
        "persistence": "redis",
        "queue": "rabbitmq"
      }
    }' | jq '.nextAction'
  echo ""
fi

echo "=== STEP 6: Finalize Spec ==="
FINAL=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/finalize" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "$FINAL" | jq '{
  status,
  hasSpec: (.techSpec != null),
  specFields: (.techSpec | keys | length),
  problemStatement: (.techSpec.problemStatement | split(".")[0])
}'
echo ""

echo "=== FINAL STATE ==="
curl -s -X GET "$API_BASE/tickets/$TICKET_ID" | jq '{
  id,
  status,
  rounds: (.questionRounds | length),
  currentRound,
  hasSpec: (.techSpec != null)
}'

echo ""
echo "✅ WORKFLOW TEST COMPLETE"
