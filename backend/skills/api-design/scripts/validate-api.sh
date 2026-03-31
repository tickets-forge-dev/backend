#!/bin/bash
# Scan for common API design issues
set -e

echo "=== API Design Check ==="

ISSUES=0

if [ "$1" = "--scan" ]; then
  echo "Scanning for existing API patterns..."
  echo ""
  echo "Controllers found:"
  find src/ -name "*controller*" -o -name "*router*" 2>/dev/null | head -20
  echo ""
  echo "Route decorators:"
  grep -rn "@Get\|@Post\|@Put\|@Patch\|@Delete\|router\.\(get\|post\|put\|patch\|delete\)" src/ 2>/dev/null | head -20
  exit 0
fi

# Check for verb-based URLs (anti-pattern)
echo "Checking for verb-based URLs..."
if grep -rn "getAll\|getUser\|createUser\|deleteUser\|updateUser" src/*/presentation/ src/*/routes/ 2>/dev/null | grep -i "path\|route\|@Get\|@Post" | head -5; then
  echo "WARNING: Found verb-based URL patterns — prefer resource-oriented URLs"
  ISSUES=$((ISSUES + 1))
else
  echo "  OK"
fi

# Check for missing validation
echo "Checking for unvalidated endpoints..."
ENDPOINTS=$(grep -rn "@Post\|@Put\|@Patch" src/ 2>/dev/null | wc -l)
VALIDATED=$(grep -rn "@Body().*Dto\|@Body().*dto\|validate\|ValidationPipe" src/ 2>/dev/null | wc -l)
echo "  Endpoints with body: $ENDPOINTS"
echo "  With validation: $VALIDATED"
if [ "$ENDPOINTS" -gt "$VALIDATED" ]; then
  echo "  WARNING: Some endpoints may lack input validation"
  ISSUES=$((ISSUES + 1))
fi

echo ""
if [ $ISSUES -eq 0 ]; then
  echo "API design checks passed."
else
  echo "$ISSUES issue(s) found."
fi
