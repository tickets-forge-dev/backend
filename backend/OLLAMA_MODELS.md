# Ollama Models Reference

## Currently Available Models

Run `curl -s http://localhost:11434/api/tags | jq '.models[].name'` to see all available models.

### Cloud Models (No download required)
These models are routed through Ollama to remote servers:
- `minimax-m2:cloud` ✅ **Currently configured**
- `deepseek-v3.1:671b-cloud` - Large reasoning model
- `qwen3-vl:235b-cloud` - Vision + language model
- `qwen3-coder:480b-cloud` - Large coding model
- `glm-4.6:cloud` - General purpose model
- `gpt-oss:20b-cloud` - GPT-style model

### Local Models (Requires download)
These run entirely on your machine:
- `qwen2.5-coder:latest` - 7.6B coding model (good for dev)
- Add more with: `ollama pull <model-name>`

## How to Switch Models

### Option 1: Edit `.env` file
```bash
# In backend/.env
OLLAMA_FAST_MODEL=deepseek-v3.1:671b-cloud
OLLAMA_MAIN_MODEL=deepseek-v3.1:671b-cloud
```

### Option 2: Use environment variables
```bash
# When starting the server
OLLAMA_FAST_MODEL=qwen2.5-coder:latest pnpm run dev
```

## Model Selection Guidelines

### For Fast Operations (Steps 1, 2, 7)
Intent extraction, type detection, question generation:
- **Recommended**: `minimax-m2:cloud` or `gpt-oss:20b-cloud`
- **Alternative**: `qwen2.5-coder:latest` (local, faster)

### For Main Operations (Step 5)
Draft generation with reasoning:
- **Recommended**: `minimax-m2:cloud` or `deepseek-v3.1:671b-cloud`
- **Alternative**: `qwen3-coder:480b-cloud` (for coding-specific tasks)

### For Vision Tasks (Future)
If you need image understanding:
- **Use**: `qwen3-vl:235b-cloud`

## Testing Different Models

```bash
# Test with cloud model (no setup)
echo '{"title": "Add login button", "description": "Users need to log in"}' | \
  curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d @-

# Switch to local model
sed -i '' 's/minimax-m2:cloud/qwen2.5-coder:latest/g' backend/.env
pnpm run dev

# Switch back
sed -i '' 's/qwen2.5-coder:latest/minimax-m2:cloud/g' backend/.env
```

## Performance Comparison

| Model | Type | Size | Speed | Quality | API Cost |
|-------|------|------|-------|---------|----------|
| `minimax-m2:cloud` | Cloud | ? | Fast | Good | Ollama routing |
| `deepseek-v3.1:671b-cloud` | Cloud | 671B | Slower | Excellent | Ollama routing |
| `qwen2.5-coder:latest` | Local | 7.6B | Very Fast | Good | None |
| `qwen3-coder:480b-cloud` | Cloud | 480B | Slow | Excellent | Ollama routing |

## Troubleshooting

### "Model not found" error
```bash
# Check available models
curl -s http://localhost:11434/api/tags | jq '.models[].name'

# For local models, pull first
ollama pull qwen2.5-coder:latest
```

### Slow response times
- Cloud models require internet connection
- Use local models for faster iteration
- Check Ollama logs: `journalctl -u ollama -f` (Linux) or Ollama app logs (Mac)

### Out of memory
- Local models require sufficient RAM/VRAM
- Use cloud models if running on limited hardware
- Or use smaller quantized models
