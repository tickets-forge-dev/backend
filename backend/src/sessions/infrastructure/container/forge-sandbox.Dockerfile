# backend/src/sessions/infrastructure/container/forge-sandbox.Dockerfile
# E2B sandbox template for Cloud Develop sessions
# Build: e2b template build --name "forge-dev" --dockerfile forge-sandbox.Dockerfile

FROM e2bdev/base:latest

# System tools
RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*

# Node.js 20 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Claude Code CLI (pinned version — bump via weekly CI rebuild)
RUN npm install -g @anthropic-ai/claude-code@latest

# Pre-create Claude config directory to skip first-run prompts
# Claude Code uses ANTHROPIC_API_KEY from env — no login needed
RUN mkdir -p /home/user/.claude && \
    echo '{"hasCompletedOnboarding":true,"hasAcknowledgedTerms":true}' > /home/user/.claude/settings.json && \
    chown -R user:user /home/user/.claude

# Also set up for root (in case commands run as root)
RUN mkdir -p /root/.claude && \
    echo '{"hasCompletedOnboarding":true,"hasAcknowledgedTerms":true}' > /root/.claude/settings.json

# Forge MCP server
COPY forge-mcp-server/ /home/user/forge-mcp-server/
RUN cd /home/user/forge-mcp-server && npm install && npm run build && \
    chown -R user:user /home/user/forge-mcp-server

# Bootstrap script
COPY bootstrap.sh /home/user/bootstrap.sh
RUN chmod +x /home/user/bootstrap.sh && chown user:user /home/user/bootstrap.sh

# MCP config template
COPY forge-mcp-config.json /home/user/.forge-mcp-config-template.json
RUN chown user:user /home/user/.forge-mcp-config-template.json

# System prompt template
COPY system-prompt.txt /home/user/system-prompt-template.txt
RUN chown user:user /home/user/system-prompt-template.txt
