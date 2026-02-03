# ✅ Ollama + Mastra - Quick Start

## Current Status: WORKING ✅

The backend is successfully configured to use Ollama with Mastra agents.

## Configuration
```bash
# In backend/.env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_FAST_MODEL=minimax-m2:cloud
OLLAMA_MAIN_MODEL=minimax-m2:cloud
```

## How to Use

### 1. Start Ollama (if not running)
```bash
ollama serve
```

### 2. Verify Ollama is running
```bash
curl -s http://localhost:11434/api/tags | jq '.models[].name'
```

You should see `minimax-m2:cloud` in the list (cloud models don't need pulling).

### 3. Start Backend
```bash
cd backend
pnpm run dev
```

You should see:
```
🔧 LLM Provider: Ollama (DEBUG MODE)
   Fast model: minimax-m2:cloud
   Main model: minimax-m2:cloud
   Base URL: http://localhost:11434
```

### 4. Test It Works
Backend logs should show successful LLM calls when tickets are created.

## Switching Models

### Use Different Cloud Model
```bash
# Edit backend/.env
OLLAMA_FAST_MODEL=deepseek-v3.1:671b-cloud
OLLAMA_MAIN_MODEL=deepseek-v3.1:671b-cloud
```

### Use Local Model
```bash
# Pull the model first
ollama pull qwen2.5-coder:latest

# Edit backend/.env
OLLAMA_FAST_MODEL=qwen2.5-coder:latest
OLLAMA_MAIN_MODEL=qwen2.5-coder:latest
```

## Troubleshooting

### "Could not find config for provider ollama"
✅ Fixed! Make sure you:
- Restarted backend after changes
- Using `generateLegacy()` not `generate()`

### "Connection refused"
Check Ollama is running:
```bash
ollama serve
```

### Slow responses
- Cloud models require internet
- Switch to local model for faster iteration
- Or wait a bit (cloud models are remote)

## Architecture

```
Backend (NestJS)
   ↓
MastraContentGenerator
   ↓
Mastra Agent (generateLegacy)
   ↓
@ai-sdk/openai (createOpenAI)
   ↓
http://localhost:11434/v1 (Ollama OpenAI-compatible API)
   ↓
Ollama → minimax-m2:cloud (routes to remote server)
```

## Key Files
- `backend/.env` - Configuration
- `backend/src/shared/infrastructure/mastra/llm.config.ts` - Model selection
- `backend/src/shared/infrastructure/mastra/MastraContentGenerator.ts` - Agent creation
- `backend/src/shared/infrastructure/mastra/providers/ollama.provider.ts` - Provider setup

## More Info
- Full details: `OLLAMA_MASTRA_FIX.md`
- Model options: `backend/OLLAMA_MODELS.md`
