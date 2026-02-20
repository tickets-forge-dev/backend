#!/bin/bash
# =============================================================================
# Device Flow Auth — End-to-End curl Tests
# =============================================================================
# Usage:
#   chmod +x auth-device-flow-tests.sh
#   ./auth-device-flow-tests.sh
#
# Prerequisites:
#   - Backend running: cd backend && pnpm dev   (default: http://localhost:3001)
#   - jq installed:  brew install jq
#
# For the full E2E test (TEST 7), you need a valid Firebase ID token.
# Get one from browser DevTools after signing into the app:
#   const token = await firebase.auth().currentUser.getIdToken(); console.log(token);
#
# Set it here or export it before running:
#   export FIREBASE_TOKEN="eyJhbGci..."
# =============================================================================

API_URL="${FORGE_API_URL:-http://localhost:3001/api}"
FIREBASE_TOKEN="${FIREBASE_TOKEN:-}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓ PASS${NC} $1"; }
fail() { echo -e "${RED}✗ FAIL${NC} $1"; }
info() { echo -e "${CYAN}  →${NC} $1"; }
section() { echo -e "\n${BOLD}${YELLOW}$1${NC}"; echo "$(printf '─%.0s' {1..60})"; }

check_status() {
  local got="$1" expected="$2" label="$3"
  if [ "$got" = "$expected" ]; then
    pass "$label (HTTP $got)"
  else
    fail "$label — expected HTTP $expected, got HTTP $got"
  fi
}

# =============================================================================
section "TEST 1 — POST /api/auth/device/request (happy path)"
# =============================================================================

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/device/request" \
  -H "Content-Type: application/json")

body=$(echo "$response" | head -n1)
status=$(echo "$response" | tail -n1)

check_status "$status" "200" "Request device code"
info "Response: $body"

# Extract values for later tests
DEVICE_CODE=$(echo "$body" | jq -r '.deviceCode // empty')
USER_CODE=$(echo "$body" | jq -r '.userCode // empty')
VERIFICATION_URI=$(echo "$body" | jq -r '.verificationUri // empty')

if [ -n "$DEVICE_CODE" ]; then
  pass "deviceCode present: ${DEVICE_CODE:0:8}..."
else
  fail "deviceCode missing from response"
fi

if [ -n "$USER_CODE" ] && echo "$USER_CODE" | grep -qE '^[A-Z2-9]{4}-[A-Z2-9]{4}$'; then
  pass "userCode format valid: $USER_CODE"
else
  fail "userCode missing or invalid format: $USER_CODE"
fi

if [ -n "$VERIFICATION_URI" ]; then
  pass "verificationUri present: $VERIFICATION_URI"
else
  fail "verificationUri missing"
fi

# =============================================================================
section "TEST 2 — POST /api/auth/device/token (pending — before user auth)"
# =============================================================================

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/device/token" \
  -H "Content-Type: application/json" \
  -d "{\"deviceCode\": \"$DEVICE_CODE\"}")

body=$(echo "$response" | head -n1)
status=$(echo "$response" | tail -n1)

check_status "$status" "400" "Poll pending device code returns 400"
error_code=$(echo "$body" | jq -r '.error // empty')

if [ "$error_code" = "authorization_pending" ]; then
  pass "error='authorization_pending' (correct OAuth Device Flow response)"
else
  fail "expected error='authorization_pending', got: $body"
fi

# =============================================================================
section "TEST 3 — POST /api/auth/device/token (invalid device code)"
# =============================================================================

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/device/token" \
  -H "Content-Type: application/json" \
  -d '{"deviceCode": "deadbeef00000000deadbeef00000000"}')

body=$(echo "$response" | head -n1)
status=$(echo "$response" | tail -n1)

check_status "$status" "400" "Invalid device code returns 400"
error_code=$(echo "$body" | jq -r '.error // empty')

if [ "$error_code" = "invalid_device_code" ]; then
  pass "error='invalid_device_code'"
else
  fail "expected error='invalid_device_code', got: $body"
fi

# =============================================================================
section "TEST 4 — POST /api/auth/device/token (missing deviceCode — validation)"
# =============================================================================

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/device/token" \
  -H "Content-Type: application/json" \
  -d '{}')

body=$(echo "$response" | head -n1)
status=$(echo "$response" | tail -n1)

check_status "$status" "400" "Missing deviceCode rejected by validation"
info "Response: $body"

# =============================================================================
section "TEST 5 — POST /api/auth/device/verify (no auth header — expect 401)"
# =============================================================================

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/device/verify" \
  -H "Content-Type: application/json" \
  -d "{\"userCode\": \"$USER_CODE\"}")

body=$(echo "$response" | head -n1)
status=$(echo "$response" | tail -n1)

check_status "$status" "401" "Verify without auth header returns 401"

# =============================================================================
section "TEST 6 — POST /api/auth/device/verify (invalid bearer — expect 401)"
# =============================================================================

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/device/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer not-a-real-firebase-token" \
  -d "{\"userCode\": \"$USER_CODE\"}")

body=$(echo "$response" | head -n1)
status=$(echo "$response" | tail -n1)

check_status "$status" "401" "Verify with invalid bearer returns 401"

# =============================================================================
section "TEST 7 — POST /api/auth/device/verify (invalid userCode format)"
# =============================================================================

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/device/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token" \
  -d '{"userCode": "not-valid-format"}')

body=$(echo "$response" | head -n1)
status=$(echo "$response" | tail -n1)

# Will be 401 (auth guard fires first) or 400 (validation)
if [ "$status" = "400" ] || [ "$status" = "401" ]; then
  pass "Invalid userCode format rejected (HTTP $status)"
else
  fail "Expected 400 or 401 for invalid userCode, got $status"
fi
info "Response: $body"

# =============================================================================
section "TEST 8 — POST /api/auth/refresh (invalid refresh token)"
# =============================================================================

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "not-a-real-refresh-token"}')

body=$(echo "$response" | head -n1)
status=$(echo "$response" | tail -n1)

if [ "$status" = "401" ]; then
  pass "Invalid refresh token returns 401"
elif [ "$status" = "500" ] && echo "$body" | grep -q "FIREBASE_WEB_API_KEY"; then
  echo -e "${YELLOW}⚠  SKIP${NC} FIREBASE_WEB_API_KEY not set — add it to backend/.env to test refresh"
else
  fail "Invalid refresh token — expected HTTP 401, got HTTP $status"
fi
info "Response: $body"

# =============================================================================
section "TEST 9 — POST /api/auth/refresh (missing refreshToken — validation)"
# =============================================================================

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{}')

body=$(echo "$response" | head -n1)
status=$(echo "$response" | tail -n1)

check_status "$status" "400" "Missing refreshToken rejected by validation"
info "Response: $body"

# =============================================================================
section "TEST 10 — Full E2E (requires FIREBASE_TOKEN env var)"
# =============================================================================

if [ -z "$FIREBASE_TOKEN" ]; then
  echo -e "${YELLOW}⚠  Skipped — set FIREBASE_TOKEN to run full E2E test${NC}"
  echo "   Get your token from browser DevTools (after signing into the app):"
  echo "   const t = await firebase.auth().currentUser.getIdToken(); console.log(t);"
  echo "   Then: FIREBASE_TOKEN=eyJ... ./auth-device-flow-tests.sh"
else
  echo "Running full E2E with real Firebase token..."

  # Step 1: Request new device code
  e2e_response=$(curl -s -X POST "$API_URL/auth/device/request" \
    -H "Content-Type: application/json")
  e2e_device_code=$(echo "$e2e_response" | jq -r '.deviceCode')
  e2e_user_code=$(echo "$e2e_response" | jq -r '.userCode')
  info "Got userCode: $e2e_user_code"

  # Step 2: Verify (browser side — using provided Firebase token)
  verify_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/device/verify" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $FIREBASE_TOKEN" \
    -d "{\"userCode\": \"$e2e_user_code\"}")
  verify_body=$(echo "$verify_response" | head -n1)
  verify_status=$(echo "$verify_response" | tail -n1)

  check_status "$verify_status" "200" "Device verify with real Firebase token"
  info "Verify response: $verify_body"

  if [ "$verify_status" = "200" ]; then
    # Step 3: Poll for token (should now succeed)
    token_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/device/token" \
      -H "Content-Type: application/json" \
      -d "{\"deviceCode\": \"$e2e_device_code\"}")
    token_body=$(echo "$token_response" | head -n1)
    token_status=$(echo "$token_response" | tail -n1)

    check_status "$token_status" "200" "Poll device token after verification"

    if [ "$token_status" = "200" ]; then
      access_token=$(echo "$token_body" | jq -r '.accessToken // empty')
      refresh_token=$(echo "$token_body" | jq -r '.refreshToken // empty')
      user_email=$(echo "$token_body" | jq -r '.user.email // empty')
      team_id=$(echo "$token_body" | jq -r '.teamId // empty')

      [ -n "$access_token" ] && pass "accessToken present" || fail "accessToken missing"
      [ -n "$refresh_token" ] && pass "refreshToken present" || fail "refreshToken missing"
      [ -n "$user_email" ] && pass "user.email: $user_email" || fail "user.email missing"
      info "teamId: $team_id"

      # Step 4: Poll again — should be consumed
      consumed_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/device/token" \
        -H "Content-Type: application/json" \
        -d "{\"deviceCode\": \"$e2e_device_code\"}")
      consumed_body=$(echo "$consumed_response" | head -n1)
      consumed_status=$(echo "$consumed_response" | tail -n1)
      consumed_error=$(echo "$consumed_body" | jq -r '.error // empty')

      if [ "$consumed_status" = "400" ] && [ "$consumed_error" = "expired_token" ]; then
        pass "Second poll returns expired_token (device code consumed)"
      else
        fail "Second poll should return expired_token, got: HTTP $consumed_status $consumed_body"
      fi

      # Step 5: Refresh token
      refresh_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/refresh" \
        -H "Content-Type: application/json" \
        -d "{\"refreshToken\": \"$refresh_token\"}")
      refresh_body=$(echo "$refresh_response" | head -n1)
      refresh_status=$(echo "$refresh_response" | tail -n1)

      check_status "$refresh_status" "200" "Refresh token returns new accessToken"

      if [ "$refresh_status" = "200" ]; then
        new_access=$(echo "$refresh_body" | jq -r '.accessToken // empty')
        expires_at=$(echo "$refresh_body" | jq -r '.expiresAt // empty')
        [ -n "$new_access" ] && pass "New accessToken received" || fail "New accessToken missing"
        [ -n "$expires_at" ] && pass "expiresAt: $expires_at" || fail "expiresAt missing"

        # Step 6: Use new access token on a real authenticated endpoint
        me_response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/teams" \
          -H "Authorization: Bearer $new_access")
        me_body=$(echo "$me_response" | head -n1)
        me_status=$(echo "$me_response" | tail -n1)

        check_status "$me_status" "200" "GET /api/teams with refreshed accessToken (FirebaseAuthGuard accepts it)"
        info "Teams response: $me_body"
      fi
    fi
  fi
fi

# =============================================================================
echo -e "\n${BOLD}Done.${NC} Run with FIREBASE_TOKEN set to test the full E2E flow."
# =============================================================================
