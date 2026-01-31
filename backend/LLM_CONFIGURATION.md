# LLM Configuration Guide - Forge Backend

## Overview

The backend supports **dual LLM providers** for flexibility:
- **Ollama** - Local debugging (free, fast iteration, no API costs)
- **Anthropic/Claude** - Production (high quality, API-based)

Toggle via `LLM_PROVIDER` environment variable.

---

## Quick Start

### Option 1: Ollama (Local Debug) - RECOMMENDED FOR DEVELOPMENT

**1. Install Ollama**
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
```

**2. Start Ollama Server**
```bash
ollama serve
```

**3. Pull a Model**
```bash
# Recommended: Qwen 2.5 Coder (fast, good for code tasks)
ollama pull qwen2.5-coder:latest

# Alternatives:
ollama pull llama3.1        # General purpose
ollama pull deepseek-coder  # Code-focused
ollama pull codellama       # Meta's code model
```

**4. Configure .env**
```bash
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_FAST_MODEL=qwen2.5-coder:latest
OLLAMA_MAIN_MODEL=qwen2.5-coder:latest
```

**5. Start Backend**
```bash
npm run dev
```

You should see:
```
🔧 LLM Provider: Ollama (DEBUG MODE)
   Fast model: qwen2.5-coder:latest
   Main model: qwen2.5-coder:latest
   Base URL: http://localhost:11434/v1
✅ MastraContentGenerator initialized with provider: ollama
```

---

### Option 2: Anthropic/Claude (Production)

**1. Get API Key**
- Go to https://console.anthropic.com
- Create account / Sign in
- Navigate to "API Keys" → Create new key
- Copy the key (starts with `sk-ant-api03-...`)

**2. Configure .env**
```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
ANTHROPIC_FAST_MODEL=claude-3-5-haiku-20241022
ANTHROPIC_MAIN_MODEL=claude-3-5-sonnet-20241022
```

**3. Start Backend**
```bash
npm run dev
```

You should see:
```
🚀 LLM Provider: Anthropic/Claude (PRODUCTION MODE)
   Fast model: claude-3-5-haiku-20241022
   Main model: claude-3-5-sonnet-20241022
✅ MastraContentGenerator initialized with provider: anthropic
```

---

## Model Selection Strategy

### Fast Model (Steps 1, 2, 7)
Used for classification and quick tasks:
- **Intent extraction** - Parse user input
- **Type detection** - Classify as feature/bug/task
- **Question generation** - Generate clarification questions

**Ollama:** `qwen2.5-coder:latest` (4GB, fast, good quality)
**Anthropic:** `claude-3-5-haiku-20241022` (cheap, fast)

### Main Model (Step 5)
Used for content generation requiring quality:
- **Ticket drafting** - Generate acceptance criteria, assumptions, repo paths

**Ollama:** `qwen2.5-coder:latest` (same model, or upgrade to 14B version)
**Anthropic:** `claude-3-5-sonnet-20241022` (high quality)

---

## Architecture

### Port/Adapter Pattern
```
Application Layer (ports)
  └── ILLMContentGenerator.ts (interface)
          ↑
Infrastructure Layer (adapters)
  ├── MastraContentGenerator.ts (implementation)
  ├── LLMConfigService.ts (provider toggle)
  └── providers/
      ├── ollama.provider.ts (local debug)
      └── anthropic.provider.ts (production)
```

### Dependency Injection
```typescript
// In use case
constructor(
  @Inject(LLM_CONTENT_GENERATOR)
  private llmGenerator: ILLMContentGenerator,
) {}

// Usage
const intent = await this.llmGenerator.extractIntent({
  title: 'Add user auth',
  description: 'Users should be able to sign up',
});
```

---

## Switching Providers

**Development → Production:**
1. Change `.env`: `LLM_PROVIDER=ollama` → `LLM_PROVIDER=anthropic`
2. Add `ANTHROPIC_API_KEY=sk-ant-...`
3. Restart backend

**No code changes required!** The interface abstraction handles the switch.

---

## Cost Comparison

### Ollama (Local)
- **Cost:** $0 (runs on your machine)
- **Speed:** Fast (depends on your GPU/CPU)
- **Quality:** Good (qwen2.5-coder is solid)
- **Best for:** Development, iteration, testing

### Anthropic/Claude
- **Cost:** ~$0.02/ticket (estimate for 4 steps)
  - Haiku: $0.25/MTok input, $1.25/MTok output
  - Sonnet: $3/MTok input, $15/MTok output
- **Speed:** 2-5 seconds per step
- **Quality:** Excellent
- **Best for:** Production, demo, stakeholder reviews

---

## Troubleshooting

### Ollama Connection Issues

**Error:** `fetch failed` or `ECONNREFUSED`
**Fix:** Ensure Ollama is running: `ollama serve`

**Error:** `model not found`
**Fix:** Pull the model: `ollama pull qwen2.5-coder:latest`

### Anthropic API Issues

**Error:** `Invalid API key`
**Fix:** Check `ANTHROPIC_API_KEY` in .env (should start with `sk-ant-api03-`)

**Error:** `Rate limit exceeded`
**Fix:** Wait 60 seconds or upgrade Anthropic plan

### Developer Role Issue (Ollama)

**Already handled!** The `ollamaCompatibleFetch` middleware converts 'developer' → 'system' automatically.

---

## Verification

### Test Ollama Setup
```bash
# Check Ollama is running
curl http://localhost:11434/v1/models

# Test with qwen2.5-coder
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5-coder:latest",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Test Backend Integration
```bash
# Start backend
npm run dev

# Look for log messages:
# 🔧 LLM Provider: Ollama (DEBUG MODE)
# ✅ MastraContentGenerator initialized
```

---

## Production Checklist

Before deploying to production:

- [ ] Switch `LLM_PROVIDER=anthropic` in production .env
- [ ] Add valid `ANTHROPIC_API_KEY`
- [ ] Set appropriate models (Haiku for fast, Sonnet for main)
- [ ] Remove Ollama configuration from production environment
- [ ] Test end-to-end ticket generation flow
- [ ] Monitor API costs in Anthropic console

---

**Current Status:**
- ✅ Dual provider architecture implemented
- ✅ Ollama provider with developer role fix
- ✅ Anthropic provider ready
- ✅ Environment-based toggle working
- ⏳ Waiting for .env configuration

**Next:** Configure your preferred provider in `backend/.env`
