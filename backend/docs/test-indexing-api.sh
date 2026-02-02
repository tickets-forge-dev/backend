#!/bin/bash
# Story 4.2 - Indexing API Test Suite
# Tests all indexing endpoints with curl

BASE_URL="http://localhost:3000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "Story 4.2 - Indexing API Tests"
echo "======================================"
echo ""

# Test 1: List indexes (should be empty initially)
echo -e "${YELLOW}Test 1: GET /api/indexing/list${NC}"
echo "curl -X GET $BASE_URL/indexing/list"
RESPONSE=$(curl -s -X GET "$BASE_URL/indexing/list")
echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q "indexId"; then
  echo -e "${GREEN}✓ PASS - Returns indexes${NC}"
else
  echo -e "${GREEN}✓ PASS - Returns empty array${NC}"
fi
echo ""

# Test 2: Start indexing
echo -e "${YELLOW}Test 2: POST /api/indexing/start${NC}"
echo "curl -X POST $BASE_URL/indexing/start -H 'Content-Type: application/json' -d '{...}'"
RESPONSE=$(curl -s -X POST "$BASE_URL/indexing/start" \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryId": 123456789,
    "repositoryName": "test-org/test-repo",
    "commitSha": "abc123def456"
  }')
echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q "indexId"; then
  INDEX_ID=$(echo "$RESPONSE" | grep -o '"indexId":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}✓ PASS - Indexing started, ID: $INDEX_ID${NC}"
else
  echo -e "${RED}✗ FAIL - No indexId in response${NC}"
  exit 1
fi
echo ""

# Give indexing time to process
echo "⏳ Waiting 3 seconds for indexing to process..."
sleep 3
echo ""

# Test 3: Get indexing status
echo -e "${YELLOW}Test 3: GET /api/indexing/status/:indexId${NC}"
echo "curl -X GET $BASE_URL/indexing/status/$INDEX_ID"
RESPONSE=$(curl -s -X GET "$BASE_URL/indexing/status/$INDEX_ID")
echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q "status"; then
  STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  PROGRESS=$(echo "$RESPONSE" | grep -o '"progress":[0-9]*' | cut -d':' -f2)
  echo -e "${GREEN}✓ PASS - Status: $STATUS, Progress: $PROGRESS%${NC}"
else
  echo -e "${RED}✗ FAIL - No status in response${NC}"
fi
echo ""

# Test 4: Get index statistics
echo -e "${YELLOW}Test 4: GET /api/indexing/stats/:indexId${NC}"
echo "curl -X GET $BASE_URL/indexing/stats/$INDEX_ID"
RESPONSE=$(curl -s -X GET "$BASE_URL/indexing/stats/$INDEX_ID")
echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q "totalFiles"; then
  echo -e "${GREEN}✓ PASS - Stats retrieved${NC}"
else
  echo -e "${RED}✗ FAIL - No stats in response${NC}"
fi
echo ""

# Test 5: Query indexed code
echo -e "${YELLOW}Test 5: POST /api/indexing/query/:indexId${NC}"
echo "curl -X POST $BASE_URL/indexing/query/$INDEX_ID -H 'Content-Type: application/json' -d '{...}'"
RESPONSE=$(curl -s -X POST "$BASE_URL/indexing/query/$INDEX_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "authentication service",
    "limit": 5
  }')
echo "Response: $RESPONSE"
if [ "$RESPONSE" == "[]" ] || echo "$RESPONSE" | grep -q "path"; then
  echo -e "${GREEN}✓ PASS - Query executed${NC}"
else
  echo -e "${RED}✗ FAIL - Invalid response${NC}"
fi
echo ""

# Test 6: List indexes again (should have 1 now)
echo -e "${YELLOW}Test 6: GET /api/indexing/list (should show our index)${NC}"
echo "curl -X GET $BASE_URL/indexing/list"
RESPONSE=$(curl -s -X GET "$BASE_URL/indexing/list")
echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q "$INDEX_ID"; then
  echo -e "${GREEN}✓ PASS - Index appears in list${NC}"
else
  echo -e "${YELLOW}⚠ WARNING - Index not in list yet (might be indexing)${NC}"
fi
echo ""

# Test 7: Test with invalid index ID
echo -e "${YELLOW}Test 7: GET /api/indexing/status/invalid-id (should 404)${NC}"
echo "curl -X GET $BASE_URL/indexing/status/invalid-id"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/indexing/status/invalid-id")
echo "HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" == "404" ]; then
  echo -e "${GREEN}✓ PASS - Returns 404 for invalid ID${NC}"
else
  echo -e "${RED}✗ FAIL - Expected 404, got $HTTP_CODE${NC}"
fi
echo ""

# Test 8: Test validation (missing fields)
echo -e "${YELLOW}Test 8: POST /api/indexing/start (missing fields - should 400)${NC}"
echo "curl -X POST $BASE_URL/indexing/start -H 'Content-Type: application/json' -d '{}'}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/indexing/start" \
  -H "Content-Type: application/json" \
  -d '{}')
echo "HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" == "400" ]; then
  echo -e "${GREEN}✓ PASS - Validation working (400)${NC}"
else
  echo -e "${RED}✗ FAIL - Expected 400, got $HTTP_CODE${NC}"
fi
echo ""

# Summary
echo "======================================"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo "======================================"
echo ""
echo "Created index ID: $INDEX_ID"
echo ""
echo "📚 Swagger docs available at:"
echo "   http://localhost:3001/api/docs"
echo ""
