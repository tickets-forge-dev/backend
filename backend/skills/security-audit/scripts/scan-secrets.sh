#!/bin/bash
# Scan for hardcoded secrets, API keys, and sensitive data
set -e

echo "=== Security: Secrets Scan ==="

VIOLATIONS=0

# Common secret patterns
PATTERNS=(
  'AKIA[0-9A-Z]{16}'                    # AWS Access Key
  'sk-[a-zA-Z0-9]{20,}'                 # OpenAI/Stripe secret key
  'ghp_[a-zA-Z0-9]{36}'                 # GitHub personal token
  'password\s*[:=]\s*["\x27][^"\x27]+'  # Hardcoded passwords
  'secret\s*[:=]\s*["\x27][^"\x27]+'    # Hardcoded secrets
  'api[_-]?key\s*[:=]\s*["\x27][^"\x27]+' # API keys
  'Bearer\s+[a-zA-Z0-9._-]{20,}'        # Hardcoded bearer tokens
)

for pattern in "${PATTERNS[@]}"; do
  MATCHES=$(grep -rn --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" --include="*.py" \
    -E "$pattern" src/ app/ 2>/dev/null | grep -v "node_modules\|\.env\.\|\.example\|test\|spec\|mock" || true)
  if [ -n "$MATCHES" ]; then
    echo "FOUND potential secret:"
    echo "$MATCHES"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done

# Check for .env files that shouldn't be committed
if git ls-files --cached | grep -E '\.env$' | grep -v '\.example' | grep -v '\.template'; then
  echo "WARNING: .env file is tracked by git"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

echo ""
if [ $VIOLATIONS -eq 0 ]; then
  echo "No secrets found."
else
  echo "$VIOLATIONS potential secret(s) found. Review and fix."
fi

exit 0
