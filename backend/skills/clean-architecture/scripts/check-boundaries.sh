#!/bin/bash
# Check for clean architecture boundary violations
# Scans for cross-layer imports that shouldn't exist

set -e

echo "=== Clean Architecture Boundary Check ==="

VIOLATIONS=0

# Domain must not import from infrastructure or presentation
echo "Checking domain layer..."
if grep -rn "from.*infrastructure\|from.*presentation\|require.*infrastructure\|require.*presentation" src/*/domain/ 2>/dev/null; then
  echo "VIOLATION: Domain layer imports from infrastructure/presentation"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "  OK — domain is clean"
fi

# Domain must not import frameworks
echo "Checking domain for framework imports..."
if grep -rn "from '@nestjs\|from 'express\|from 'firebase\|from 'mongoose\|from 'typeorm\|from 'prisma" src/*/domain/ 2>/dev/null; then
  echo "VIOLATION: Domain imports framework packages"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "  OK — no framework imports in domain"
fi

# Controllers should not import repositories directly
echo "Checking presentation layer..."
if grep -rn "Repository\|REPOSITORY" src/*/presentation/ 2>/dev/null | grep -v "import type\|// " ; then
  echo "WARNING: Presentation layer references repositories (should go through use cases)"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "  OK — presentation uses use cases only"
fi

echo ""
if [ $VIOLATIONS -eq 0 ]; then
  echo "All boundary checks passed."
else
  echo "$VIOLATIONS violation(s) found. Fix before proceeding."
fi

exit $VIOLATIONS
