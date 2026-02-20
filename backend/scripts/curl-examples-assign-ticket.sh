#!/bin/bash

# ==============================================================================
# Quick curl Examples for Ticket Assignment API
# ==============================================================================
# Manual curl commands for testing PATCH /tickets/:id/assign
#
# Setup:
#   1. Set your Firebase token:
#      export FIREBASE_TOKEN="your-firebase-id-token"
#
#   2. Set your ticket ID:
#      export TICKET_ID="aec_xxxxx"
#
#   3. Run individual commands below
# ==============================================================================

API_URL="${API_URL:-http://localhost:3000}"
FIREBASE_TOKEN="${FIREBASE_TOKEN:-YOUR_TOKEN_HERE}"
TICKET_ID="${TICKET_ID:-aec_xxxxx}"

echo "===================================================================="
echo "Ticket Assignment API - curl Examples"
echo "===================================================================="
echo "API URL: $API_URL"
echo "Ticket ID: $TICKET_ID"
echo "Token: ${FIREBASE_TOKEN:0:20}..."
echo ""

# ==============================================================================
# Example 1: Assign ticket to user
# ==============================================================================

echo "# 1. Assign ticket to user"
echo "# -------------------------"
cat <<'EOF'
curl -X PATCH "http://localhost:3000/tickets/$TICKET_ID/assign" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-dev-123"
  }'
EOF
echo ""
echo "Run it:"
echo "------"

curl -X PATCH "$API_URL/tickets/$TICKET_ID/assign" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-dev-123"
  }' | jq '.' 2>/dev/null || cat

echo ""
echo ""

# ==============================================================================
# Example 2: Unassign ticket (userId = null)
# ==============================================================================

echo "# 2. Unassign ticket (set userId to null)"
echo "# ----------------------------------------"
cat <<'EOF'
curl -X PATCH "http://localhost:3000/tickets/$TICKET_ID/assign" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": null
  }'
EOF
echo ""
echo "Run it:"
echo "------"

curl -X PATCH "$API_URL/tickets/$TICKET_ID/assign" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": null
  }' | jq '.' 2>/dev/null || cat

echo ""
echo ""

# ==============================================================================
# Example 3: Get ticket to verify assignment
# ==============================================================================

echo "# 3. Get ticket and check assignedTo field"
echo "# -----------------------------------------"
cat <<'EOF'
curl -X GET "http://localhost:3000/tickets/$TICKET_ID" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  | jq '.assignedTo'
EOF
echo ""
echo "Run it:"
echo "------"

curl -X GET "$API_URL/tickets/$TICKET_ID" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  2>/dev/null | jq '.assignedTo' 2>/dev/null || echo "Error: jq not installed or request failed"

echo ""
echo ""

# ==============================================================================
# Example 4: Reassign to different user
# ==============================================================================

echo "# 4. Reassign to different user"
echo "# ------------------------------"
cat <<'EOF'
curl -X PATCH "http://localhost:3000/tickets/$TICKET_ID/assign" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-dev-456"
  }'
EOF
echo ""
echo "Run it:"
echo "------"

curl -X PATCH "$API_URL/tickets/$TICKET_ID/assign" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-dev-456"
  }' | jq '.' 2>/dev/null || cat

echo ""
echo ""

# ==============================================================================
# Example 5: Error case - empty userId
# ==============================================================================

echo "# 5. Error case - empty userId (should return 400)"
echo "# ------------------------------------------------"
cat <<'EOF'
curl -X PATCH "http://localhost:3000/tickets/$TICKET_ID/assign" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": ""
  }'
EOF
echo ""
echo "Run it:"
echo "------"

curl -X PATCH "$API_URL/tickets/$TICKET_ID/assign" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": ""
  }' | jq '.' 2>/dev/null || cat

echo ""
echo ""

# ==============================================================================
# Example 6: Error case - nonexistent ticket
# ==============================================================================

echo "# 6. Error case - nonexistent ticket (should return 404)"
echo "# -------------------------------------------------------"
cat <<'EOF'
curl -X PATCH "http://localhost:3000/tickets/aec_nonexistent/assign" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123"
  }'
EOF
echo ""
echo "Run it:"
echo "------"

curl -X PATCH "$API_URL/tickets/aec_nonexistent/assign" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123"
  }' | jq '.' 2>/dev/null || cat

echo ""
echo ""

echo "===================================================================="
echo "Examples complete!"
echo "===================================================================="
echo ""
echo "Note: Set environment variables before running:"
echo "  export FIREBASE_TOKEN=\"your-firebase-id-token\""
echo "  export TICKET_ID=\"aec_xxxxx\""
echo ""
