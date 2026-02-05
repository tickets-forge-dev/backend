#!/bin/bash

API_BASE="http://localhost:3000/api"

echo -e "╔════════════════════════════════════════════════════════╗"
echo -e "║  ITERATIVE TICKET CREATION WORKFLOW - E2E TEST        ║"
echo -e "╚════════════════════════════════════════════════════════╝\n"

# ============================================================================
# STEP 1: Create Draft Ticket (WITHOUT repository context to avoid GitHub requirement)
# ============================================================================

echo -e "\n📝 STEP 1: Create Draft Ticket"
echo "   POST /api/tickets"
echo "────────────────────────────────────────────────────────────"

CREATE=$(curl -s -X POST "$API_BASE/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Add real-time notifications to dashboard",
    "description": "Users should receive real-time updates when team members make changes"
  }')

echo "$CREATE" | jq '.'
TICKET_ID=$(echo "$CREATE" | jq -r '.id')

if [ "$TICKET_ID" = "null" ] || [ -z "$TICKET_ID" ]; then
  echo "❌ Failed to create ticket"
  exit 1
fi

echo -e "\n✅ Ticket created: ${TICKET_ID}\n"

# ============================================================================
# STEP 2: Start Question Round 1
# ============================================================================

echo -e "❓ STEP 2: Start Question Round 1"
echo "   POST /api/tickets/$TICKET_ID/start-round"
echo "────────────────────────────────────────────────────────────"

ROUND1=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/start-round" \
  -H "Content-Type: application/json" \
  -d '{"roundNumber": 1}')

echo "$ROUND1" | jq '.questionRounds[0] | {
  roundNumber,
  questionCount: (.questions | length),
  firstQuestion: .questions[0].text
}'

QUESTION_COUNT=$(echo "$ROUND1" | jq '.questionRounds[0].questions | length')
echo -e "\n✅ Round 1 started with ${QUESTION_COUNT} questions\n"

# ============================================================================
# STEP 3: Submit Round 1 Answers
# ============================================================================

echo -e "💬 STEP 3: Submit Round 1 Answers"
echo "   POST /api/tickets/$TICKET_ID/submit-answers"
echo "────────────────────────────────────────────────────────────"

# For testing, provide sample answers (we don't have the actual question IDs)
ROUND1_SUBMIT=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/submit-answers" \
  -H "Content-Type: application/json" \
  -d '{
    "roundNumber": 1,
    "answers": {
      "tech-choice": "websocket",
      "notification-scope": "dashboard",
      "auth-method": "jwt"
    }
  }')

echo "$ROUND1_SUBMIT" | jq '{nextAction, status: .aec.status, roundsComplete: (.aec.questionRounds | map(select(.answeredAt != null)) | length)}'

NEXT_ACTION=$(echo "$ROUND1_SUBMIT" | jq -r '.nextAction')
echo -e "\n✅ Answers submitted. Next action: ${NEXT_ACTION}\n"

# ============================================================================
# CONDITIONAL: Round 2 (if LLM decides to continue)
# ============================================================================

if [ "$NEXT_ACTION" = "continue-asking" ] || [ "$NEXT_ACTION" = "continue" ]; then
  echo -e "❓ STEP 4: Start Question Round 2"
  echo "   POST /api/tickets/$TICKET_ID/start-round"
  echo "────────────────────────────────────────────────────────────"

  ROUND2=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/start-round" \
    -H "Content-Type: application/json" \
    -d '{"roundNumber": 2}')

  QUESTION_COUNT=$(echo "$ROUND2" | jq '.questionRounds[1].questions | length')
  echo "$ROUND2" | jq '.questionRounds[1] | {
    roundNumber,
    questionCount: (.questions | length)
  }'
  echo -e "\n✅ Round 2 started with ${QUESTION_COUNT} questions\n"

  echo -e "💬 STEP 5: Submit Round 2 Answers"
  echo "   POST /api/tickets/$TICKET_ID/submit-answers"
  echo "────────────────────────────────────────────────────────────"

  ROUND2_SUBMIT=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/submit-answers" \
    -H "Content-Type: application/json" \
    -d '{
      "roundNumber": 2,
      "answers": {
        "persistence-layer": "redis",
        "message-queue": "rabbitmq",
        "scaling": "horizontal"
      }
    }')

  echo "$ROUND2_SUBMIT" | jq '{nextAction, status: .aec.status}'
  
  NEXT_ACTION=$(echo "$ROUND2_SUBMIT" | jq -r '.nextAction')
  echo -e "\n✅ Round 2 submitted. Next action: ${NEXT_ACTION}\n"

  # Conditional Round 3
  if [ "$NEXT_ACTION" = "continue-asking" ] || [ "$NEXT_ACTION" = "continue" ]; then
    echo -e "❓ STEP 6: Start Question Round 3 (Final)"
    curl -s -X POST "$API_BASE/tickets/$TICKET_ID/start-round" \
      -H "Content-Type: application/json" \
      -d '{"roundNumber": 3}' | jq '.questionRounds[2] | {roundNumber, questionCount: (.questions | length)}'
    
    echo -e "\n✅ Round 3 started\n"

    echo -e "💬 STEP 7: Submit Round 3 Answers"
    curl -s -X POST "$API_BASE/tickets/$TICKET_ID/submit-answers" \
      -H "Content-Type: application/json" \
      -d '{
        "roundNumber": 3,
        "answers": {
          "error-handling": "retry-exponential-backoff",
          "monitoring": "prometheus"
        }
      }' > /dev/null
    
    echo -e "✅ Round 3 submitted (max rounds reached)\n"
  fi
fi

# ============================================================================
# STEP 8: Finalize Specification
# ============================================================================

echo -e "🎯 STEP 8: Finalize Technical Specification"
echo "   POST /api/tickets/$TICKET_ID/finalize"
echo "────────────────────────────────────────────────────────────"

FINAL_SPEC=$(curl -s -X POST "$API_BASE/tickets/$TICKET_ID/finalize" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "$FINAL_SPEC" | jq '{
  status,
  specGenerated: (.techSpec != null),
  specFields: if .techSpec then (.techSpec | keys | length) else 0 end,
  acceptanceCriteria: if .techSpec then (.techSpec.acceptanceCriteria | length) else 0 end,
  fileChanges: if .techSpec then (.techSpec.fileChanges | length) else 0 end
}'

echo -e "\n✅ Specification finalized\n"

# ============================================================================
# STEP 9: Retrieve Final State
# ============================================================================

echo -e "📋 STEP 9: Final Ticket State"
echo "   GET /api/tickets/$TICKET_ID"
echo "────────────────────────────────────────────────────────────"

FINAL=$(curl -s -X GET "$API_BASE/tickets/$TICKET_ID")

echo "$FINAL" | jq '{
  id,
  title,
  status,
  rounds: (.questionRounds | length),
  currentRound,
  hasSpec: (.techSpec != null),
  specSize: if .techSpec then "✅ Generated" else "❌ Missing" end
}'

echo ""
echo -e "╔════════════════════════════════════════════════════════╗"
echo -e "║  ✅ WORKFLOW TEST COMPLETE                            ║"
echo -e "╚════════════════════════════════════════════════════════╝\n"

echo "Ticket ID: $TICKET_ID"
echo "Status: $(echo "$FINAL" | jq -r '.status')"
echo "Rounds Completed: $(echo "$FINAL" | jq '.questionRounds | length')"
echo "Spec Generated: $(echo "$FINAL" | jq 'if .techSpec then "✅" else "❌" end')"
