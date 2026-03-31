#!/bin/bash
# Auto-detect test runner and execute tests
# Usage: bash scripts/run-tests.sh [--detect|--all|<path>]

set -e

detect_runner() {
  if [ -f "vitest.config.ts" ] || [ -f "vitest.config.js" ]; then
    echo "vitest"
  elif [ -f "jest.config.ts" ] || [ -f "jest.config.js" ] || grep -q '"jest"' package.json 2>/dev/null; then
    echo "jest"
  elif [ -f "pytest.ini" ] || [ -f "pyproject.toml" ] && grep -q "pytest" pyproject.toml 2>/dev/null; then
    echo "pytest"
  elif [ -f "go.mod" ]; then
    echo "go-test"
  elif [ -f "Cargo.toml" ]; then
    echo "cargo-test"
  else
    echo "unknown"
  fi
}

RUNNER=$(detect_runner)

if [ "$1" = "--detect" ]; then
  echo "Detected test runner: $RUNNER"
  case $RUNNER in
    vitest) echo "Run: npx vitest run" ;;
    jest) echo "Run: npx jest" ;;
    pytest) echo "Run: python -m pytest" ;;
    go-test) echo "Run: go test ./..." ;;
    cargo-test) echo "Run: cargo test" ;;
    *) echo "Could not detect test runner. Check project config." ;;
  esac
  exit 0
fi

echo "Running tests with: $RUNNER"

case $RUNNER in
  vitest)
    if [ "$1" = "--all" ]; then
      npx vitest run
    elif [ -n "$1" ]; then
      npx vitest run "$1"
    else
      npx vitest run --changed
    fi
    ;;
  jest)
    if [ "$1" = "--all" ]; then
      npx jest
    elif [ -n "$1" ]; then
      npx jest "$1"
    else
      npx jest --onlyChanged
    fi
    ;;
  pytest)
    if [ "$1" = "--all" ]; then
      python -m pytest -v
    elif [ -n "$1" ]; then
      python -m pytest "$1" -v
    else
      python -m pytest -v --last-failed
    fi
    ;;
  go-test)
    go test ./... -v
    ;;
  cargo-test)
    cargo test
    ;;
  *)
    echo "ERROR: Could not detect test runner"
    exit 1
    ;;
esac
