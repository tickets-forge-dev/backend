#!/bin/bash
# Check documentation coverage for exported functions
set -e

echo "=== Documentation Coverage ==="

# Count exported functions
EXPORTED=$(grep -rn "^export function\|^export async function\|^export class\|^export const.*=.*=>" src/ 2>/dev/null | grep -v "node_modules\|\.test\.\|\.spec\.\|\.d\.ts" | wc -l)

# Count documented exports (JSDoc or TSDoc before export)
DOCUMENTED=$(grep -B1 "^export function\|^export async function\|^export class" src/ 2>/dev/null | grep -c "\*/\|@description\|@param" || true)

echo "Exported symbols: $EXPORTED"
echo "With JSDoc: $DOCUMENTED"

if [ "$EXPORTED" -gt 0 ]; then
  COVERAGE=$((DOCUMENTED * 100 / EXPORTED))
  echo "Coverage: ${COVERAGE}%"
else
  echo "No exports found."
fi

# Check for stale TODOs
echo ""
echo "Open TODOs:"
grep -rn "TODO\|FIXME\|HACK\|XXX" src/ 2>/dev/null | grep -v "node_modules" | head -10 || echo "  None found"
