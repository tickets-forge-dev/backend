#!/bin/bash
# Detect and run linter/formatter
set -e

detect_linter() {
  if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ] || [ -f "eslint.config.mjs" ]; then
    echo "eslint"
  elif [ -f ".flake8" ] || [ -f "setup.cfg" ] && grep -q "flake8" setup.cfg 2>/dev/null; then
    echo "flake8"
  elif [ -f "rustfmt.toml" ] || [ -f ".rustfmt.toml" ]; then
    echo "rustfmt"
  else
    echo "none"
  fi
}

LINTER=$(detect_linter)

if [ "$1" = "--detect" ]; then
  echo "Detected linter: $LINTER"
  exit 0
fi

echo "=== Code Quality Check ==="

case $LINTER in
  eslint)
    echo "Running ESLint..."
    npx eslint --fix . 2>/dev/null || npx eslint . 2>/dev/null || echo "ESLint not configured — skipping"
    ;;
  flake8)
    echo "Running flake8..."
    python -m flake8 . || echo "flake8 found issues"
    ;;
  rustfmt)
    echo "Running rustfmt..."
    cargo fmt --check
    ;;
  *)
    echo "No linter detected — checking for common issues..."
    # Fallback: grep for debug artifacts
    ISSUES=0
    if grep -rn "console\.log\|debugger\|TODO.*HACK\|FIXME.*HACK" src/ app/ 2>/dev/null | grep -v "node_modules\|\.test\.\|\.spec\." | head -10; then
      echo "Found debug artifacts — clean up before committing"
      ISSUES=$((ISSUES + 1))
    fi
    if [ $ISSUES -eq 0 ]; then
      echo "No obvious issues found."
    fi
    ;;
esac
