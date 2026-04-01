#!/bin/bash
# Scan for database query patterns and potential issues
set -e

echo "=== Database Query Analysis ==="

if [ "$1" = "--scan" ]; then
  echo "Scanning for database patterns..."
  echo ""
  echo "ORM/DB libraries detected:"
  grep -rn "from.*prisma\|from.*typeorm\|from.*mongoose\|from.*firebase\|from.*knex\|from.*sequelize" src/ 2>/dev/null | head -5 || echo "  None detected in imports"
  echo ""
  echo "Repository files:"
  find src/ -name "*Repository*" -o -name "*repository*" 2>/dev/null | head -10
  exit 0
fi

ISSUES=0

# Check for queries inside loops (N+1 pattern)
echo "Checking for N+1 patterns..."
if grep -rn "for.*await.*find\|for.*await.*get\|\.forEach.*await.*find\|\.map.*await.*find" src/ 2>/dev/null | grep -v "node_modules\|\.test\.\|\.spec\." | head -5; then
  echo "WARNING: Possible N+1 query — database call inside a loop"
  ISSUES=$((ISSUES + 1))
else
  echo "  OK — no obvious N+1 patterns"
fi

# Check for unbounded queries
echo "Checking for unbounded queries..."
if grep -rn "\.findAll()\|\.find({})\|\.get()\b" src/ 2>/dev/null | grep -v "limit\|take\|pageSize\|\.test\.\|\.spec\." | head -5; then
  echo "WARNING: Possible unbounded query — consider adding pagination"
  ISSUES=$((ISSUES + 1))
else
  echo "  OK"
fi

# Check for SELECT * equivalent
echo "Checking for over-fetching..."
if grep -rn "select: \*\|SELECT \*" src/ 2>/dev/null | head -5; then
  echo "WARNING: SELECT * found — fetch only needed fields"
  ISSUES=$((ISSUES + 1))
else
  echo "  OK"
fi

echo ""
if [ $ISSUES -eq 0 ]; then
  echo "No database issues found."
else
  echo "$ISSUES potential issue(s). Review before proceeding."
fi
