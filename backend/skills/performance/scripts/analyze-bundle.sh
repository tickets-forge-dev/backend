#!/bin/bash
# Analyze frontend bundle size
set -e

echo "=== Bundle Analysis ==="

if [ -f "next.config.js" ] || [ -f "next.config.mjs" ] || [ -f "next.config.ts" ]; then
  echo "Next.js detected"
  if [ -d ".next" ]; then
    echo "Build exists. Analyzing..."
    du -sh .next/static/chunks/*.js 2>/dev/null | sort -rh | head -10
    echo ""
    echo "Total .next/static:"
    du -sh .next/static/ 2>/dev/null
  else
    echo "No build found. Run 'npm run build' first for analysis."
  fi
elif [ -f "vite.config.ts" ] || [ -f "vite.config.js" ]; then
  echo "Vite detected"
  if [ -d "dist" ]; then
    echo "Build exists. Largest files:"
    find dist -name "*.js" -exec du -sh {} \; 2>/dev/null | sort -rh | head -10
  else
    echo "No build found. Run 'npm run build' first for analysis."
  fi
elif [ -f "package.json" ]; then
  echo "Node project detected. Checking node_modules size:"
  du -sh node_modules/ 2>/dev/null || echo "No node_modules"
  echo ""
  echo "Largest dependencies:"
  du -sh node_modules/*/ 2>/dev/null | sort -rh | head -10
fi
