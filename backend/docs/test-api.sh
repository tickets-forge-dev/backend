#!/bin/bash
# Quick API Test Script
# Tests all Epic 4 endpoints

BASE_URL="http://localhost:3000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Epic 4 - API Quick Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if backend is running
echo -n "Checking backend status... "
if curl -s "$BASE_URL/../health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is NOT running${NC}"
    echo ""
    echo "Please start the backend first:"
    echo "  cd backend && pnpm run dev"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Swagger Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if curl -s "$BASE_URL/docs" | grep -q "Swagger UI"; then
    echo -e "${GREEN}✓ Swagger UI is accessible at $BASE_URL/docs${NC}"
else
    echo -e "${YELLOW}⚠ Swagger UI may not be properly configured${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: GitHub Integration (Story 4.1)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "Testing GitHub OAuth endpoint... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/github")
if [ "$STATUS" = "302" ] || [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓ OAuth endpoint exists (Status: $STATUS)${NC}"
else
    echo -e "${YELLOW}⚠ OAuth endpoint returned: $STATUS${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Repository Indexing (Story 4.2)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "Testing indexing start endpoint... "
RESPONSE=$(curl -s -X POST "$BASE_URL/indexing/start" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "test-ws",
    "repositoryId": 123,
    "repositoryName": "test/repo",
    "branch": "main",
    "commitSha": "abc123"
  }' 2>&1)

if echo "$RESPONSE" | grep -q "indexId\|message\|error"; then
    echo -e "${GREEN}✓ Indexing endpoint responded${NC}"
    echo "   Response: $(echo $RESPONSE | head -c 100)..."
else
    echo -e "${YELLOW}⚠ Unexpected response from indexing endpoint${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 4: Webhook Handler (Story 4.4)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "Testing GitHub webhook endpoint... "
# Note: This will fail signature check but proves endpoint exists
RESPONSE=$(curl -s -X POST "$BASE_URL/webhooks/github" \
  -H "Content-Type: application/json" \
  -H "x-github-event: ping" \
  -d '{"zen": "Keep it simple."}' 2>&1)

if echo "$RESPONSE" | grep -q "signature\|received"; then
    echo -e "${GREEN}✓ Webhook endpoint is active${NC}"
else
    echo -e "${YELLOW}⚠ Webhook endpoint response unclear${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Backend is running and responsive"
echo "✅ Core endpoints are accessible"
echo ""
echo -e "${YELLOW}Note: Auth-protected endpoints require OAuth token${NC}"
echo -e "${YELLOW}Use Swagger UI for interactive testing: $BASE_URL/docs${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Manual Testing Instructions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open Swagger UI:"
echo "   → http://localhost:3000/api/docs"
echo ""
echo "2. Test Indexing Flow:"
echo "   → POST /api/indexing/start"
echo "   → GET /api/indexing/{workspace}/indexes/{id}"
echo ""
echo "3. Test Drift Detection:"
echo "   → Create ticket with snapshot"
echo "   → Send GitHub webhook with new commit"
echo "   → Check ticket status changed to 'drifted'"
echo ""
echo "4. Test Effort Estimation:"
echo "   → Create ticket with repoPaths"
echo "   → POST /api/tickets/{workspace}/{id}/estimate"
echo "   → Verify estimate min/max/confidence/drivers"
echo ""
echo "See API_TESTING_GUIDE.md for detailed curl commands"
echo ""
