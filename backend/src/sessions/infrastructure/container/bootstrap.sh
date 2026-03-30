#!/bin/bash
# backend/src/sessions/infrastructure/container/bootstrap.sh
# Runs inside the E2B sandbox to set up the development environment
# Environment variables are injected by the backend before running this script

set -euo pipefail

echo "[forge-sandbox] Starting bootstrap..."

# 1. Configure git credentials
git config --global credential.helper '!f() { echo "username=x-access-token"; echo "password=${GITHUB_TOKEN}"; }; f'
git config --global user.name "Forge Cloud Develop"
git config --global user.email "cloud-develop@forge-ai.dev"

# 2. Clone repository
if [ -n "${REPO_URL:-}" ] && [ -n "${GITHUB_TOKEN:-}" ]; then
  echo "[forge-sandbox] Cloning ${REPO_URL}..."
  git clone "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git" /home/user/workspace
  cd /home/user/workspace

  # 3. Create feature branch
  echo "[forge-sandbox] Creating branch ${BRANCH_NAME}..."
  git checkout -b "${BRANCH_NAME}"
else
  echo "[forge-sandbox] No repo URL or token — skipping clone"
  mkdir -p /home/user/workspace
fi

# 4. Configure Forge MCP server
sed \
  -e "s|{{FORGE_API_URL}}|${FORGE_API_URL:-}|g" \
  -e "s|{{FORGE_SESSION_JWT}}|${FORGE_SESSION_JWT:-}|g" \
  -e "s|{{TICKET_ID}}|${TICKET_ID:-}|g" \
  /home/user/.forge-mcp-config-template.json > /home/user/.forge-mcp.json

# 5. Build system prompt from template
sed \
  -e "s|{{TICKET_ID}}|${TICKET_ID:-}|g" \
  /home/user/system-prompt-template.txt > /home/user/system-prompt.txt

echo "[forge-sandbox] Bootstrap complete. Ready to start Claude Code."
