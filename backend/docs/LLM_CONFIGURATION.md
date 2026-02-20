# LLM Configuration Guide - Forge Backend

## Overview

The backend uses **Anthropic Claude** for all LLM operations via the Vercel AI SDK.

**Model:** `claude-3-haiku-20240307` (fast, cost-effective)

---

## Quick Start

### 1. Get API Key
- Go to https://console.anthropic.com
- Create account / Sign in
- Navigate to "API Keys" → Create new key
- Copy the key (starts with `sk-ant-api03-...`)

### 2. Configure .env
```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
ANTHROPIC_MODEL=claude-3-haiku-20240307
```

### 3. Start Backend
```bash
pnpm dev
```

You should see:
```
LLM ready: Anthropic (claude-3-haiku-20240307)
```

---

## LLM Services

Three services use the LLM:

| Service | Purpose |
|---------|---------|
| `TechSpecGeneratorImpl` | Question generation, tech spec sections |
| `DeepAnalysisServiceImpl` | Repository analysis, task classification |
| `PRDBreakdownService` | PRD parsing, epic/story generation |

All services use direct `generateText()` calls from Vercel AI SDK.

---

## Architecture

```
backend/src/shared/infrastructure/llm/
├── llm.config.ts           # LLMConfigService (model configuration)
└── providers/
    └── anthropic.provider.ts  # Unused stub (kept for reference)
```

Each LLM service creates its own Anthropic client instance using:
```typescript
import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';

const anthropic = createAnthropic({ apiKey });
const model = anthropic('claude-3-haiku-20240307');

const { text } = await generateText({
  model,
  system: systemPrompt,
  prompt: userPrompt,
  maxOutputTokens: 4096,
  temperature: 0.2,
});
```

---

## Model Selection

**Currently using:** `claude-3-haiku-20240307`
- Fast response times
- Cost-effective (~$0.25/MTok input, $1.25/MTok output)
- Good quality for structured JSON generation

**Note:** Claude 3.5 models (`claude-3-5-haiku-*`, `claude-3-5-sonnet-*`) may require upgraded API access.

---

## Troubleshooting

### Error: `model: claude-3-5-haiku-20241022`
**Cause:** Model not accessible with your API key
**Fix:** Use `claude-3-haiku-20240307` in `ANTHROPIC_MODEL`

### Error: `ANTHROPIC_API_KEY not set`
**Fix:** Add valid API key to `.env`

### Error: `Failed to parse response`
**Cause:** LLM returned non-JSON response
**Fix:** Automatic retry with stricter JSON prompt (built-in)

---

## Cost Estimate

Per ticket generation (all 4 steps):
- **Input:** ~2,000 tokens × $0.25/MTok = $0.0005
- **Output:** ~1,500 tokens × $1.25/MTok = $0.002
- **Total:** ~$0.003/ticket ($3 per 1,000 tickets)

---

**Current Status:**
- ✅ Anthropic integration working
- ✅ Model: claude-3-haiku-20240307
- ✅ All services using Vercel AI SDK
