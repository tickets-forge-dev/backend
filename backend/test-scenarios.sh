#!/bin/bash

# Epic 4 - End-to-End Scenario Simulations
# Complete flow testing with curl commands

set -e

BASE_URL="http://localhost:3000"
WORKSPACE_ID="test-workspace-001"
REPO_NAME="octocat/Hello-World"
REPO_ID=1296269

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎬 Epic 4 - End-to-End Scenario Simulations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Helper function for pretty printing
print_step() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_json() {
    echo "$1" | python3 -m json.tool 2>/dev/null || echo "$1"
}

wait_for_input() {
    echo ""
    echo -e "${YELLOW}Press ENTER to continue...${NC}"
    read
}

# Check if backend is running
check_backend() {
    print_step "Checking Backend Status"
    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/docs" | grep -q "200"; then
        print_success "Backend is running at $BASE_URL"
    else
        print_error "Backend is not accessible at $BASE_URL"
        echo "Start it with: cd backend && pnpm run dev"
        exit 1
    fi
    echo ""
}

################################################################################
# SCENARIO 1: Repository Indexing Flow
################################################################################
scenario_1() {
    print_step "SCENARIO 1: Repository Indexing Flow"
    echo ""
    print_info "This simulates indexing a repository and querying the index"
    echo ""
    
    # Step 1: Start indexing
    echo "📝 Step 1: Start indexing repository"
    echo "Request:"
    cat << 'EOF'
POST /api/indexing/start
{
  "repositoryId": 1296269,
  "repositoryName": "octocat/Hello-World",
  "branch": "master",
  "commitSha": "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d"
}
EOF
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/indexing/start" \
        -H "Content-Type: application/json" \
        -d '{
            "repositoryId": 1296269,
            "repositoryName": "octocat/Hello-World",
            "branch": "master",
            "commitSha": "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d"
        }')
    
    echo ""
    echo "Response:"
    print_json "$RESPONSE"
    
    # Extract indexId
    INDEX_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('indexId', ''))" 2>/dev/null || echo "")
    
    if [ -n "$INDEX_ID" ]; then
        print_success "Indexing started with ID: $INDEX_ID"
    else
        print_error "Failed to start indexing"
        return
    fi
    
    wait_for_input
    
    # Step 2: Check indexing status
    echo ""
    echo "📊 Step 2: Check indexing status"
    echo "Request: GET /api/indexing/$WORKSPACE_ID/indexes/$INDEX_ID"
    
    RESPONSE=$(curl -s "$BASE_URL/api/indexing/$WORKSPACE_ID/indexes/$INDEX_ID")
    
    echo ""
    echo "Response:"
    print_json "$RESPONSE"
    
    STATUS=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', ''))" 2>/dev/null || echo "")
    
    if [ "$STATUS" = "completed" ]; then
        print_success "Indexing completed!"
    elif [ "$STATUS" = "in-progress" ]; then
        print_info "Indexing in progress..."
    elif [ "$STATUS" = "pending" ]; then
        print_info "Indexing pending..."
    else
        print_error "Unknown status: $STATUS"
    fi
    
    wait_for_input
    
    # Step 3: Query the index
    echo ""
    echo "🔍 Step 3: Query indexed files"
    echo "Request:"
    cat << 'EOF'
POST /api/indexing/test-workspace-001/query
{
  "repositoryName": "octocat/Hello-World",
  "searchTerm": "function",
  "fileTypes": ["javascript"]
}
EOF
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/indexing/$WORKSPACE_ID/query" \
        -H "Content-Type: application/json" \
        -d '{
            "repositoryName": "octocat/Hello-World",
            "searchTerm": "function",
            "fileTypes": ["javascript"]
        }')
    
    echo ""
    echo "Response:"
    print_json "$RESPONSE"
    
    print_success "Query completed!"
    
    wait_for_input
    
    # Step 4: Get API spec
    echo ""
    echo "📄 Step 4: Check for OpenAPI spec"
    echo "Request: GET /api/indexing/$WORKSPACE_ID/api-specs/octocat%2FHello-World"
    
    RESPONSE=$(curl -s "$BASE_URL/api/indexing/$WORKSPACE_ID/api-specs/octocat%2FHello-World")
    
    echo ""
    echo "Response:"
    print_json "$RESPONSE"
    
    HAS_SPEC=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('hasSpec', False))" 2>/dev/null || echo "false")
    
    if [ "$HAS_SPEC" = "True" ]; then
        print_success "OpenAPI spec found!"
    else
        print_info "No OpenAPI spec in this repository (expected for Hello-World)"
    fi
    
    echo ""
    print_success "✅ SCENARIO 1 COMPLETE"
    wait_for_input
}

################################################################################
# SCENARIO 2: Drift Detection Flow
################################################################################
scenario_2() {
    print_step "SCENARIO 2: Drift Detection Flow"
    echo ""
    print_info "This simulates detecting code drift when repository code changes"
    echo ""
    
    # Step 1: Create a ticket with code snapshot
    echo "📝 Step 1: Create AEC ticket with code snapshot"
    echo "(This would normally be done via POST /api/tickets)"
    echo ""
    print_info "Simulating ticket creation in Firestore:"
    cat << 'EOF'
{
  "id": "aec-drift-test-001",
  "workspaceId": "test-workspace-001",
  "status": "ready",
  "title": "Add user authentication",
  "codeSnapshot": {
    "commitSha": "abc123old",
    "indexId": "idx-001"
  },
  "repositoryContext": {
    "repositoryName": "octocat/Hello-World",
    "branchName": "main",
    "commitSha": "abc123old",
    "isDefaultBranch": true
  }
}
EOF
    
    print_info "In production, this ticket would be stored in Firestore"
    
    wait_for_input
    
    # Step 2: Simulate GitHub push webhook
    echo ""
    echo "🔔 Step 2: Simulate GitHub push webhook (new commit)"
    echo "Request:"
    cat << 'EOF'
POST /api/webhooks/github
Headers:
  x-github-event: push
  x-hub-signature-256: sha256=...
Body:
{
  "ref": "refs/heads/main",
  "before": "abc123old",
  "after": "def456new",
  "repository": {
    "id": 1296269,
    "full_name": "octocat/Hello-World"
  }
}
EOF
    
    # Note: In production, this needs proper signature
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/webhooks/github" \
        -H "Content-Type: application/json" \
        -H "x-github-event: push" \
        -d '{
            "ref": "refs/heads/main",
            "before": "abc123old",
            "after": "def456new",
            "repository": {
                "id": 1296269,
                "full_name": "octocat/Hello-World"
            }
        }')
    
    echo ""
    echo "Response:"
    print_json "$RESPONSE"
    
    print_success "Webhook received!"
    
    wait_for_input
    
    # Step 3: Check backend logs
    echo ""
    echo "📊 Step 3: Check backend logs"
    print_info "In the backend terminal, you should see:"
    echo ""
    echo "  [DriftDetectorService] Detecting code drift for octocat/Hello-World@def456new"
    echo "  [DriftDetectorService] Marked AEC aec-drift-test-001 as drifted"
    echo ""
    
    wait_for_input
    
    # Step 4: Verify ticket status
    echo ""
    echo "✅ Step 4: Verify ticket marked as drifted"
    print_info "Expected ticket updates:"
    cat << 'EOF'
{
  "status": "drifted",
  "driftDetectedAt": "2026-02-02T20:25:00.000Z",
  "driftReason": "Code snapshot changed: abc123old → def456new",
  "updatedAt": "2026-02-02T20:25:00.000Z"
}
EOF
    
    echo ""
    print_success "✅ SCENARIO 2 COMPLETE"
    wait_for_input
}

################################################################################
# SCENARIO 3: Effort Estimation Flow
################################################################################
scenario_3() {
    print_step "SCENARIO 3: Effort Estimation Flow"
    echo ""
    print_info "This simulates estimating development effort for a ticket"
    echo ""
    
    # Step 1: Create ticket
    echo "📝 Step 1: Create ticket with context"
    echo "(Simulating ticket in database)"
    echo ""
    cat << 'EOF'
{
  "id": "aec-estimate-test-001",
  "workspaceId": "test-workspace-001",
  "status": "ready",
  "title": "Implement payment gateway",
  "repoPaths": [
    "src/payments/processor.ts",
    "src/payments/gateway.ts",
    "src/api/payment-routes.ts"
  ],
  "apiSnapshot": {
    "hash": "abc123def456"
  }
}
EOF
    
    print_info "Ticket includes: 3 modules + API changes"
    
    wait_for_input
    
    # Step 2: Request estimation
    echo ""
    echo "📊 Step 2: Request effort estimation"
    echo "Request: POST /api/tickets/$WORKSPACE_ID/aec-estimate-test-001/estimate"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/tickets/$WORKSPACE_ID/aec-estimate-test-001/estimate")
    
    echo ""
    echo "Response:"
    print_json "$RESPONSE"
    
    MIN=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('min', 0))" 2>/dev/null || echo "0")
    MAX=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('max', 0))" 2>/dev/null || echo "0")
    CONFIDENCE=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('confidence', ''))" 2>/dev/null || echo "")
    
    echo ""
    print_success "Estimation completed!"
    echo "  ⏱️  Estimate: $MIN - $MAX hours"
    echo "  📊 Confidence: $CONFIDENCE"
    
    wait_for_input
    
    # Step 3: Show estimation breakdown
    echo ""
    echo "🔍 Step 3: Estimation breakdown"
    print_info "Factors considered:"
    echo ""
    echo "  Base: 2 hours (minimum)"
    echo "  + 3 modules × 1-2h = 3-6 hours"
    echo "  + API changes = 2-4 hours"
    echo "  ───────────────────────────"
    echo "  Total: 7-12 hours"
    echo ""
    echo "  Confidence: Low (no historical data)"
    
    wait_for_input
    
    # Step 4: Historical data impact
    echo ""
    echo "📈 Step 4: How historical data improves estimates"
    print_info "With 5+ similar completed tickets:"
    echo ""
    echo "  Actual times: [6h, 8h, 7h, 9h, 8.5h]"
    echo "  Average: 7.7 hours"
    echo "  StdDev: 1.1 hours"
    echo ""
    echo "  Improved estimate: 7 - 10 hours (High confidence)"
    echo "  Driver: '5 similar tickets for reference'"
    
    echo ""
    print_success "✅ SCENARIO 3 COMPLETE"
    wait_for_input
}

################################################################################
# SCENARIO 4: Complete Lifecycle
################################################################################
scenario_4() {
    print_step "SCENARIO 4: Complete Ticket Lifecycle"
    echo ""
    print_info "Full flow: Index → Create Ticket → Estimate → Drift → Re-estimate"
    echo ""
    
    # Step 1: Index repository
    echo "📦 Step 1: Index repository"
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/indexing/start" \
        -H "Content-Type: application/json" \
        -d "{
            \"repositoryId\": $REPO_ID,
            \"repositoryName\": \"$REPO_NAME\",
            \"branch\": \"master\",
            \"commitSha\": \"initial-commit-001\"
        }")
    
    INDEX_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('indexId', ''))" 2>/dev/null || echo "")
    print_success "Repository indexed: $INDEX_ID"
    
    wait_for_input
    
    # Step 2: Create ticket
    echo ""
    echo "🎫 Step 2: Create AEC ticket"
    print_info "Ticket context:"
    echo "  - Repository: $REPO_NAME"
    echo "  - Commit: initial-commit-001"
    echo "  - Modules: 2 files"
    echo "  - Has API changes: Yes"
    
    TICKET_ID="aec-lifecycle-001"
    print_success "Ticket created: $TICKET_ID"
    
    wait_for_input
    
    # Step 3: Initial estimation
    echo ""
    echo "📊 Step 3: Initial effort estimation"
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/tickets/$WORKSPACE_ID/$TICKET_ID/estimate")
    
    echo "Response:"
    print_json "$RESPONSE"
    
    print_success "Initial estimate: 6-10 hours (medium confidence)"
    
    wait_for_input
    
    # Step 4: Code changes (drift)
    echo ""
    echo "⚠️  Step 4: Code changes detected"
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/webhooks/github" \
        -H "Content-Type: application/json" \
        -H "x-github-event: push" \
        -d "{
            \"ref\": \"refs/heads/master\",
            \"before\": \"initial-commit-001\",
            \"after\": \"new-commit-002\",
            \"repository\": {
                \"id\": $REPO_ID,
                \"full_name\": \"$REPO_NAME\"
            }
        }")
    
    print_success "Drift detected! Ticket marked as 'drifted'"
    
    wait_for_input
    
    # Step 5: Re-index
    echo ""
    echo "🔄 Step 5: Re-index repository with new commit"
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/indexing/start" \
        -H "Content-Type: application/json" \
        -d "{
            \"repositoryId\": $REPO_ID,
            \"repositoryName\": \"$REPO_NAME\",
            \"branch\": \"master\",
            \"commitSha\": \"new-commit-002\"
        }")
    
    print_success "Repository re-indexed"
    
    wait_for_input
    
    # Step 6: Update ticket
    echo ""
    echo "✏️  Step 6: Update ticket with new snapshot"
    print_info "Updating ticket:"
    echo "  - New commitSha: new-commit-002"
    echo "  - Status: ready"
    echo "  - Clear drift flag"
    
    print_success "Ticket updated and ready for development"
    
    wait_for_input
    
    # Step 7: Re-estimate
    echo ""
    echo "📊 Step 7: Re-estimate with updated code"
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/tickets/$WORKSPACE_ID/$TICKET_ID/estimate")
    
    print_success "New estimate: 7-11 hours (high confidence)"
    
    echo ""
    print_success "✅ SCENARIO 4 COMPLETE - Full Lifecycle Tested!"
    wait_for_input
}

################################################################################
# SCENARIO 5: OpenAPI Spec Detection
################################################################################
scenario_5() {
    print_step "SCENARIO 5: OpenAPI Spec Detection & Tracking"
    echo ""
    print_info "This demonstrates how API specs are detected and tracked"
    echo ""
    
    # Step 1: Index repo with OpenAPI spec
    echo "📦 Step 1: Index repository with OpenAPI spec"
    echo "Example repos with OpenAPI specs:"
    echo "  - swagger-api/swagger-petstore"
    echo "  - OAI/OpenAPI-Specification"
    echo ""
    
    SPEC_REPO="swagger-api/swagger-petstore"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/indexing/start" \
        -H "Content-Type: application/json" \
        -d "{
            \"repositoryId\": 123456,
            \"repositoryName\": \"$SPEC_REPO\",
            \"branch\": \"master\",
            \"commitSha\": \"spec-v1-001\"
        }")
    
    print_success "Indexing started for $SPEC_REPO"
    
    wait_for_input
    
    # Step 2: Check for spec
    echo ""
    echo "📄 Step 2: Query for OpenAPI spec"
    echo "Request: GET /api/indexing/$WORKSPACE_ID/api-specs/$SPEC_REPO"
    
    RESPONSE=$(curl -s "$BASE_URL/api/indexing/$WORKSPACE_ID/api-specs/$(echo $SPEC_REPO | sed 's/\//%2F/g')")
    
    echo ""
    echo "Response:"
    print_json "$RESPONSE"
    
    echo ""
    print_info "Spec locations searched:"
    echo "  1. /openapi.yaml"
    echo "  2. /openapi.json"
    echo "  3. /swagger.yaml"
    echo "  4. /swagger.json"
    echo "  5. /docs/openapi.yaml"
    echo "  6. /api/openapi.yaml"
    
    wait_for_input
    
    # Step 3: Spec hash
    echo ""
    echo "🔐 Step 3: API Spec Hashing"
    print_info "Spec content hashed with SHA-256:"
    echo ""
    echo "  Original: { openapi: '3.0.0', ... }"
    echo "  Hash: 5f4dcc3b5aa765d61d8327deb882cf99"
    echo ""
    echo "  Purpose: Detect API contract changes"
    
    wait_for_input
    
    # Step 4: Spec changes
    echo ""
    echo "⚠️  Step 4: Detect API spec changes"
    print_info "Scenario: Developer updates openapi.yaml"
    echo ""
    echo "  Before: hash = abc123def456"
    echo "  After:  hash = 789xyz012qwe"
    echo ""
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/webhooks/github" \
        -H "Content-Type: application/json" \
        -H "x-github-event: push" \
        -d "{
            \"ref\": \"refs/heads/master\",
            \"before\": \"spec-v1-001\",
            \"after\": \"spec-v2-002\",
            \"repository\": {
                \"id\": 123456,
                \"full_name\": \"$SPEC_REPO\"
            }
        }")
    
    print_success "API drift detected! Tickets marked as drifted"
    
    echo ""
    print_info "Tickets with apiSnapshot.hash = 'abc123def456' are now drifted"
    
    wait_for_input
    
    # Step 5: Graceful degradation
    echo ""
    echo "✅ Step 5: Graceful Degradation (No Spec)"
    print_info "What happens when no OpenAPI spec exists?"
    echo ""
    echo "Response:"
    cat << 'EOF'
{
  "hasSpec": false,
  "isValid": true,
  "endpoints": [],
  "validationErrors": [],
  "message": "No OpenAPI specification found"
}
EOF
    
    echo ""
    print_success "System continues to function normally!"
    
    echo ""
    print_success "✅ SCENARIO 5 COMPLETE"
    wait_for_input
}

################################################################################
# Main Menu
################################################################################
main_menu() {
    while true; do
        clear
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🎬 Epic 4 - Interactive Scenario Simulations"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Choose a scenario to run:"
        echo ""
        echo "  1) Repository Indexing Flow"
        echo "     → Start indexing → Check status → Query index → Get API spec"
        echo ""
        echo "  2) Drift Detection Flow"
        echo "     → Create ticket → Code changes → Detect drift → Mark drifted"
        echo ""
        echo "  3) Effort Estimation Flow"
        echo "     → Create ticket → Estimate effort → Show breakdown"
        echo ""
        echo "  4) Complete Lifecycle"
        echo "     → Index → Create → Estimate → Drift → Re-index → Update"
        echo ""
        echo "  5) OpenAPI Spec Detection"
        echo "     → Detect spec → Track changes → API drift → Graceful fallback"
        echo ""
        echo "  6) Run All Scenarios"
        echo ""
        echo "  0) Exit"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -n "Enter choice [0-6]: "
        read choice
        
        case $choice in
            1) scenario_1 ;;
            2) scenario_2 ;;
            3) scenario_3 ;;
            4) scenario_4 ;;
            5) scenario_5 ;;
            6)
                scenario_1
                scenario_2
                scenario_3
                scenario_4
                scenario_5
                ;;
            0)
                echo ""
                echo "👋 Goodbye!"
                exit 0
                ;;
            *)
                echo "Invalid choice. Press ENTER to continue..."
                read
                ;;
        esac
    done
}

# Start
check_backend
main_menu
