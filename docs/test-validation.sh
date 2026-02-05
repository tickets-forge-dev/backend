#!/bin/bash

echo "=== Testing Validation System ==="
echo ""

# Get auth token (you'll need to replace this with a real token)
# For now, let's just test the validation logic directly

echo "Test 1: Creating a minimal ticket (should have validation issues)"
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "title": "Fix bug",
    "description": "It does not work"
  }' 2>&1 | head -20

echo ""
echo "==================================="
echo ""

