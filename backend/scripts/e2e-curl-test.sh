#!/bin/bash
# E2E Curl Test for Ticket Creation Flow
# Usage: ./scripts/e2e-curl-test.sh

set -e

API_URL="http://localhost:3000/api"
WORKSPACE_ID="ws_test-e2e"

echo "🧪 E2E Ticket Creation Test"
echo "================================"

# Step 1: Create a ticket (only title required)
echo ""
echo "📝 Step 1: Creating ticket..."
RESPONSE=$(curl -s -X POST "${API_URL}/tickets" \
  -H "Content-Type: application/json" \
  -H "x-workspace-id: ${WORKSPACE_ID}" \
  -d '{"title": "E2E Test - Add user authentication"}')

echo "Response: $RESPONSE"

# Extract AEC ID
AEC_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$AEC_ID" ]; then
  echo "❌ Failed to create ticket - no ID returned"
  exit 1
fi

echo "✅ Ticket created: $AEC_ID"

# Step 2: Poll for status updates
echo ""
echo "📊 Step 2: Polling for generation progress..."
for i in {1..20}; do
  sleep 3
  TICKET=$(curl -s "${API_URL}/tickets/${AEC_ID}" -H "x-workspace-id: ${WORKSPACE_ID}")
  
  STATUS=$(echo "$TICKET" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
  CURRENT_STEP=$(echo "$TICKET" | grep -o '"currentStep":[0-9]*' | head -1 | cut -d':' -f2)
  
  echo "  [$i] Status: $STATUS | Step: $CURRENT_STEP"
  
  # Check for terminal states
  if [ "$STATUS" = "ready" ] || [ "$STATUS" = "validated" ]; then
    echo ""
    echo "✅ SUCCESS! Ticket generation completed."
    echo "   Final status: $STATUS"
    echo ""
    echo "Final ticket:"
    echo "$TICKET" | python3 -m json.tool 2>/dev/null || echo "$TICKET"
    exit 0
  fi
  
  if [ "$STATUS" = "suspended_findings" ]; then
    echo ""
    echo "⏸️  Ticket suspended for findings review."
    echo "Run: curl -X POST ${API_URL}/workflows/resume-findings -d '{\"aecId\":\"${AEC_ID}\",\"action\":\"proceed\"}'"
    exit 0
  fi
  
  if [ "$STATUS" = "suspended_questions" ]; then
    echo ""
    echo "⏸️  Ticket suspended for questions."
    echo "Run: curl -X POST ${API_URL}/workflows/skip-questions -d '{\"aecId\":\"${AEC_ID}\"}'"
    exit 0
  fi
  
  if [ "$STATUS" = "failed" ]; then
    echo ""
    echo "❌ Ticket generation failed."
    echo "$TICKET" | python3 -m json.tool 2>/dev/null || echo "$TICKET"
    exit 1
  fi
done

echo ""
echo "⚠️  Timeout - still generating after 60s"
echo "Final status: $STATUS"
