# Story 7.11: Mastra Observability & Distributed Tracing

## Overview
Implement Mastra's built-in observability system to provide distributed tracing, LLM metrics, and agent decision visibility across the ticket generation workflow.

**Epic**: Story 7 - HITL Workflow Integration  
**Phase**: Phase D - Observability  
**Branch**: `mastra-observability`  
**Status**: 🔄 In Progress

## Problem Statement
The current ticket generation workflow lacks proper observability:
- No distributed tracing for workflow steps
- No LLM token metrics or latency tracking
- Agent decisions are not traced
- Difficult to debug complex multi-step workflows in production
- No integration with monitoring/alerting platforms

## Solution
Implement Mastra's observability layer with:
1. **Distributed Tracing** - Trace workflow steps, agents, and LLM calls
2. **Token Metrics** - Capture prompt/completion tokens and costs
3. **Latency Tracking** - Measure step and LLM call duration
4. **Sensitive Data Filtering** - Redact tokens, passwords, keys
5. **External Exporters** - Optional integration with Langfuse, DataDog, OTEL

## Acceptance Criteria

### Foundation (Phase 1)
- ✅ Observability configured in MastraService
- ✅ DefaultExporter persists traces to storage
- ✅ SensitiveDataFilter redacts sensitive data
- ✅ PinoLogger enabled for structured logging
- ✅ Environment variables added for observability config

### Workflow Tracing (Phase 2)
- ✅ All 12 workflow steps emit traces
- ✅ Step inputs/outputs captured in traces
- ✅ Step duration and status tracked
- ✅ Step transitions logged
- ✅ Traces viewable in Mastra Studio

### Agent Tracing (Phase 3)
- ✅ FindingsToQuestionsAgent traces agent execution
- ✅ QuickPreflightValidator traces validation steps
- ✅ Tool calls traced with args/results
- ✅ Agent decisions logged with reasoning

### LLM Metrics (Phase 4)
- ✅ Token usage captured (prompt + completion)
- ✅ Prompt/completion pairs recorded
- ✅ Model and latency tracked
- ✅ Cost estimation calculated

### External Exporters (Phase 5 - Optional)
- ✅ Langfuse exporter configured
- ✅ DataDog exporter configured
- ✅ OpenTelemetry exporter configured
- ✅ Documentation for each exporter

## Implementation Details

### Files to Create
```
backend/src/shared/infrastructure/observability/
├── observability.config.ts      # Central observability config
├── exporters.ts                  # Exporter setup & factory
├── helpers.ts                    # Tracing helpers & decorators
└── types.ts                       # TypeScript interfaces
```

### Files to Modify
- `backend/src/shared/infrastructure/mastra/mastra.service.ts` - Add Observability
- `backend/src/tickets/workflows/ticket-generation.workflow.ts` - Add step tracing
- `backend/src/tickets/application/services/MastraContentGenerator.ts` - LLM tracing
- `backend/src/validation/agents/FindingsToQuestionsAgent.ts` - Agent tracing
- `backend/src/validation/agents/QuickPreflightValidator.ts` - Agent tracing
- `backend/.env` - Observability environment variables

### Environment Variables
```bash
# Enable observability
MASTRA_OBSERVABILITY_ENABLED=true

# Storage for traces (LibSQL)
MASTRA_OBSERVABILITY_STORAGE=libsql://mastra.db

# Sampling strategy: 'always' (100%), 'never' (0%), or fraction (0.1 = 10%)
MASTRA_OBSERVABILITY_SAMPLING=always

# Optional: Mastra Cloud integration
MASTRA_CLOUD_ACCESS_TOKEN=optional

# Optional: External exporter configs
LANGFUSE_API_KEY=optional
LANGFUSE_BASE_URL=optional
DATADOG_API_KEY=optional
```

## Technical Architecture

### Observability Stack
```
┌─────────────────────────────────────────┐
│     Mastra Workflow / Agents / LLMs    │
└──────────────┬──────────────────────────┘
               │ (auto-instrumented)
┌──────────────▼──────────────────────────┐
│    Observability Layer                  │
│  - Tracing                              │
│  - Span Processing (SensitiveDataFilter)│
│  - Logging                              │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┬──────────┐
    │          │          │          │
┌───▼──┐  ┌───▼──┐  ┌───▼──┐  ┌───▼──┐
│Local │  │Cloud │  │OTEL  │  │Other │
│Store │  │Export│  │Export│  │Export│
└──────┘  └──────┘  └──────┘  └──────┘
    │        │         │          │
┌───▼────────▼─────────▼──────────▼──┐
│  Mastra Studio / Cloud / 3rd Party │
└────────────────────────────────────┘
```

## Tracing Examples

### Workflow Step Trace
```json
{
  "stepId": "extractIntent",
  "stepName": "Extract Intent",
  "status": "completed",
  "duration": 2712,
  "input": { "title": "Add auth feature", ... },
  "output": { "intent": "...", "keywords": [...] },
  "timestamp": "2026-02-04T07:10:00Z"
}
```

### LLM Call Trace
```json
{
  "model": "qwen2.5-coder:latest",
  "promptTokens": 358,
  "completionTokens": 139,
  "totalTokens": 497,
  "duration": 2712,
  "latency": "2.7s",
  "temperature": 0.3,
  "success": true
}
```

### Agent Tool Call Trace
```json
{
  "agentId": "quick-preflight-validator",
  "toolName": "execute_command",
  "args": { "command": "grep -r 'import' ." },
  "result": { "matches": 42, "time": "125ms" },
  "success": true
}
```

## Testing Strategy

### Unit Tests
- [ ] Observability config loads correctly
- [ ] Exporters initialize without errors
- [ ] SensitiveDataFilter redacts sensitive fields
- [ ] Logger captures all severity levels

### Integration Tests
- [ ] Full workflow emits 12 traces (1 per step)
- [ ] Traces include correct metadata
- [ ] LLM calls capture token metrics
- [ ] Agent tool calls traced properly

### Manual Testing
- [ ] Run workflow and verify Mastra Studio shows traces
- [ ] Check that sensitive data is redacted
- [ ] Verify trace duration accuracy
- [ ] Test optional exporters (Langfuse, etc.)

## Success Metrics
- ✅ Observability overhead < 5% latency impact
- ✅ All traces persisted to storage
- ✅ Traces visible in Mastra Studio within 1s
- ✅ No sensitive data leakage in traces
- ✅ Token metrics accurate (±5%)
- ✅ External exporters working if configured

## Dependencies
- `@mastra/observability` - Mastra observability package
- `@mastra/loggers` - PinoLogger for structured logging
- Optional: `langfuse` (for Langfuse exporter)
- Optional: `dd-trace` (for DataDog exporter)

## References
- [Mastra Observability Docs](https://mastra.ai/docs/observability/tracing/overview)
- [Mastra Logging Guide](https://mastra.ai/docs/observability/logging)
- [Exporters Reference](https://mastra.ai/docs/observability/tracing/exporters)

## Timeline
- **Phase 1**: 1-2 hours (Foundation)
- **Phase 2**: 2-3 hours (Workflow tracing)
- **Phase 3**: 2-3 hours (Agent tracing)
- **Phase 4**: 1-2 hours (LLM metrics)
- **Phase 5**: 1-2 hours (External exporters - optional)

**Total**: 7-12 hours depending on scope

## Notes
- Start with local storage (DefaultExporter) for MVP
- External exporters can be added incrementally
- Observability should not impact production performance
- Traces should expire/rotate to prevent storage bloat
