#!/bin/bash

# Feedback API Edge Case Testing Script
# Tests various scenarios to ensure robustness

API_URL="http://localhost:3000/api"
BEARER_TOKEN="your-firebase-token-here"  # Replace with actual token if needed

echo "==================================="
echo "Feedback API Edge Case Tests"
echo "==================================="
echo ""

# Test 1: Valid feedback submission
echo "TEST 1: Valid feedback submission"
curl -X POST "$API_URL/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "improvement",
    "message": "Great app! Would love to see dark mode.",
    "url": "https://forge-ai.dev/tickets"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 2: Missing message field (should fail)
echo "TEST 2: Missing message field"
curl -X POST "$API_URL/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "bug",
    "url": "https://forge-ai.dev/tickets"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 3: Empty message string (should fail)
echo "TEST 3: Empty message string"
curl -X POST "$API_URL/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "feature",
    "message": "",
    "url": "https://forge-ai.dev"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 4: Invalid feedback type (should fail)
echo "TEST 4: Invalid feedback type"
curl -X POST "$API_URL/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "invalid_type",
    "message": "This should fail",
    "url": "https://forge-ai.dev"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 5: Missing type field (should fail)
echo "TEST 5: Missing type field"
curl -X POST "$API_URL/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Missing type field",
    "url": "https://forge-ai.dev"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 6: Very long message (5000+ characters)
echo "TEST 6: Very long message (5000+ characters)"
LONG_MESSAGE=$(python3 -c "print('A' * 5001)")
curl -X POST "$API_URL/feedback" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"bug\",
    \"message\": \"$LONG_MESSAGE\",
    \"url\": \"https://forge-ai.dev\"
  }" \
  -w "\nStatus: %{http_code}\n\n"

# Test 7: XSS attempt in message
echo "TEST 7: XSS attempt in message"
curl -X POST "$API_URL/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "improvement",
    "message": "<script>alert(\"XSS\")</script> This is a test",
    "url": "https://forge-ai.dev"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 8: SQL Injection attempt
echo "TEST 8: SQL Injection attempt in message"
curl -X POST "$API_URL/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "bug",
    "message": "\"; DROP TABLE users; --",
    "url": "https://forge-ai.dev"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 9: Null/undefined values
echo "TEST 9: Null message"
curl -X POST "$API_URL/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "feature",
    "message": null,
    "url": "https://forge-ai.dev"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 10: Extra fields (should be ignored)
echo "TEST 10: Extra fields in request"
curl -X POST "$API_URL/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "improvement",
    "message": "Valid message",
    "url": "https://forge-ai.dev",
    "extra_field": "should be ignored",
    "admin": true,
    "userId": "hacked"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 11: Whitespace-only message
echo "TEST 11: Whitespace-only message"
curl -X POST "$API_URL/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "bug",
    "message": "   \n\t  ",
    "url": "https://forge-ai.dev"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 12: Unicode characters
echo "TEST 12: Unicode characters in message"
curl -X POST "$API_URL/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "feature",
    "message": "Great app! 🎉 Works perfectly. 你好 مرحبا",
    "url": "https://forge-ai.dev"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 13: Missing Content-Type header
echo "TEST 13: Missing Content-Type header"
curl -X POST "$API_URL/feedback" \
  -d 'type=bug&message=Invalid format&url=https://forge-ai.dev' \
  -w "\nStatus: %{http_code}\n\n"

# Test 14: Invalid JSON
echo "TEST 14: Invalid JSON syntax"
curl -X POST "$API_URL/feedback" \
  -H "Content-Type: application/json" \
  -d '{invalid json}' \
  -w "\nStatus: %{http_code}\n\n"

# Test 15: All valid types
echo "TEST 15: Testing all valid feedback types"
for TYPE in "bug" "feature" "improvement" "other"; do
  echo "  Type: $TYPE"
  curl -s -X POST "$API_URL/feedback" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"$TYPE\",
      \"message\": \"Testing $TYPE type\",
      \"url\": \"https://forge-ai.dev\"
    }" | jq -r '.success'
done
echo ""

echo "==================================="
echo "Tests Complete"
echo "==================================="
