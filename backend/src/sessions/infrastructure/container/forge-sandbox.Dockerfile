# backend/src/sessions/infrastructure/container/forge-sandbox.Dockerfile
# E2B sandbox template for Cloud Develop sessions
# Build: e2b template build --name "forge-dev" --dockerfile forge-sandbox.Dockerfile

FROM e2b/base:latest

# System tools
RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*

# Node.js 20 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Claude Code CLI (pinned version — bump via weekly CI rebuild)
RUN npm install -g @anthropic-ai/claude-code@1.0.34

# Bootstrap script
COPY bootstrap.sh /root/bootstrap.sh
RUN chmod +x /root/bootstrap.sh

# MCP config template
COPY forge-mcp-config.json /root/.forge-mcp-config-template.json

# System prompt template
COPY system-prompt.txt /root/system-prompt-template.txt
