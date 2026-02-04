# Step Telemetry Implementation - Complete LLM Metrics & Tracing

**Date**: 2026-02-04  
**Status**: ✅ Complete  
**Story**: 8.2 (Step Tracing) + 8.3 (LLM Metrics) + 8.4 (Agent Tracing)  
**Branch**: `mastra-observability`

---

## Overview

Added comprehensive telemetry tracking to workflow steps with:
- **Basic Tracking**: Step start/end, duration, status
- **LLM Metrics**: Token counts, model, temperature, latency
- **Call Tracking**: All LLM calls within each step
- **Agent Tracing**: Which agents executed and their tool calls

**Result**: Complete visibility into ticket generation workflow execution.

---

## Architecture

### New Utility: `StepTelemetryTracker`

**File**: `backend/src/tickets/workflows/step-telemetry.utils.ts`

Standardized telemetry tracking for all steps:

```typescript
// Create tracker for a step
const tracker = new StepTelemetryTracker('1', 'Extract Intent');

// Start step
tracker.startStep({ aecId: 'ticket_123', workflowRunId: 'wf_456' });

// Track LLM call
const llmTracker = tracker.startLLMCall('MastraContentGenerator', {
  model: 'qwen2.5-coder:latest',
  temperature: 0.3,
});

// ... make LLM call ...

// Complete LLM call with metrics
llmTracker.complete(45, 78);  // promptTokens, completionTokens

// Track agent calls
tracker.recordAgentCall('QuickPreflightValidator', 'validate', 'success', 8456, {
  findingsCount: 2,
  criticalCount: 1,
});

// Complete step
tracker.completeStep({
  outputSize: 512,
  status: 'success',
  questionsCount: 5,
});
```

### Key Methods

#### `startStep(metadata)`
```typescript
tracker.startStep({
  aecId: 'ticket_123',
  workflowRunId: 'wf_abc',
  intent: '...',
  type: 'FEATURE',
  // ... any custom metadata
});
```

**Telemetry Output:**
```
📍 [extractIntent] Starting step
ℹ️ Step 1 [Extract Intent] started | {"aecId":"ticket_123","intent":"..."}
```

---

#### `startLLMCall(agent, metadata)` → `LLMCallTracker`
```typescript
const llmTracker = tracker.startLLMCall('MastraContentGenerator', {
  model: 'qwen2.5-coder:latest',
  temperature: 0.3,
  topP: 0.9,
  maxTokens: 2048,
});
```

**Returns tracker to complete/error:**
```typescript
llmTracker.complete(45, 78);  // promptTokens, completionTokens
llmTracker.error(error, { duration: 5000 });
```

**Telemetry Output:**
```
🤖 [qwen2.5-coder:latest] Prompt: 45 tokens | Completion: 78 tokens | Duration: 2.3s
ℹ️ Step 1: LLM call completed | {"model":"qwen2.5-coder:latest","tokens":123,"duration":2300}
```

---

#### `recordAgentCall(agentName, toolName, result, duration, metadata)`
```typescript
tracker.recordAgentCall(
  'QuickPreflightValidator',
  'validate',
  'success',
  8456,
  {
    findingsCount: 2,
    criticalCount: 1,
    categories: 'security, dependency',
  }
);
```

**Telemetry Output:**
```
ℹ️ Step 3: Agent tool call | {"agent":"QuickPreflightValidator","tool":"validate","result":"success","duration":8456,"findingsCount":2}
```

---

#### `completeStep(outputMetadata)`
```typescript
tracker.completeStep({
  outputSize: 512,
  status: 'success',
  questionsCount: 5,
  llmCallCount: 1,
  summary: '5 questions generated',
});
```

**Telemetry Output:**
```
✅ [1] Completed in 2456ms | Output: 512 bytes
ℹ️ Step 1 [Extract Intent] completed | {"duration":2456,"llmCallCount":1,"questionsCount":5}
```

---

## Steps Updated with Telemetry

### Step 0: Initialize and Lock ✅
- **Current**: Basic telemetry (workflow start/complete)
- **Metrics**: Workflow ID, AEC lock status, index readiness
- **LLM Calls**: None

### Step 1: Extract Intent ✅
- **Agent**: MastraContentGenerator
- **Metrics**: Intent extracted, keywords found
- **LLM Call**: 1 call (temperature: 0.3)
- **Tokens**: Input = title + description; Output = intent + keywords
- **Example Output**:
```
ℹ️ Step 1 [Extract Intent] started | {"aecId":"ticket_123"}
🤖 [mastra-default-llm] Prompt: 45 tokens | Completion: 78 tokens | Duration: 2.3s
ℹ️ Step 1: LLM call completed | {"model":"mastra-default-llm","promptTokens":45,"completionTokens":78,"totalTokens":123}
✅ [1] Completed in 2456ms | Output: 512 bytes
ℹ️ Step 1 [Extract Intent] completed | {"questionsCount":5,"llmCallCount":1}
```

---

### Step 2: Detect Type ✅
- **Agent**: MastraContentGenerator
- **Metrics**: Type detected (FEATURE, BUG, etc.)
- **LLM Call**: 1 call (temperature: 0.1 - deterministic)
- **Tokens**: Input = intent; Output = type classification
- **Example Output**:
```
ℹ️ Step 2 [Detect Type] started | {"type":"in-progress"}
🤖 [mastra-default-llm] Prompt: 25 tokens | Completion: 15 tokens | Duration: 0.8s
ℹ️ Step 2 [Detect Type] completed | {"detectedType":"FEATURE","duration":856}
```

---

### Step 3: Preflight Validation ✅
- **Agent**: QuickPreflightValidator (Mastra Agent with tools)
- **Metrics**: Findings count, critical issues, categories
- **Tool Calls**: getOrCreateWorkspace, validate
- **Agent Metrics**: Tool calls, execution time
- **Example Output**:
```
ℹ️ Step 3 [Preflight Validation] started | {"agent":"QuickPreflightValidator"}
ℹ️ Step 3: Agent tool call | {"agent":"QuickPreflightValidator","tool":"getOrCreateWorkspace"}
ℹ️ Step 3: Agent tool call | {"agent":"QuickPreflightValidator","tool":"validate","duration":8456,"findingsCount":2,"criticalCount":1}
✅ [3] Completed in 8567ms
ℹ️ Step 3 [Preflight Validation] completed | {"findingsCount":2,"hasCritical":true,"agent":"QuickPreflightValidator","duration":8567}
```

---

### Step 4: Review Findings (Suspension Point)
- **Status**: Not yet updated (user review step, minimal telemetry)
- **Future**: Track user decisions/skips

---

### Step 5: Gather Repository Context
- **Status**: Basic telemetry (ready for LLM metrics when added)
- **Future**: Add IndexQueryService call tracking

---

### Step 6: Gather API Context
- **Status**: Basic telemetry (skipped)
- **Future**: Add OpenAPI parsing telemetry

---

### Step 7: Generate Draft Content
- **Status**: Basic telemetry (ready for enhancement)
- **Future**: Track generation of AC, assumptions, repo paths

---

### Step 8: Generate Questions ✅
- **Agent**: FindingsToQuestionsAgent (LLM-based)
- **Metrics**: Questions count, question types
- **LLM Call**: 1 call (with findings + AC input)
- **Agent Tracking**: generateQuestions tool call
- **Example Output**:
```
ℹ️ Step 8 [Generate Questions] started | {"agent":"FindingsToQuestionsAgent","findingsCount":2,"acCount":3}
ℹ️ Step 8: Agent tool call | {"agent":"FindingsToQuestionsAgent","tool":"generateQuestions","questionsCount":5}
✅ [8] Completed in 3200ms | Output: 1024 bytes
ℹ️ Step 8 [Generate Questions] completed | {"questionsCount":5,"types":"radio, checkbox, text","agent":"FindingsToQuestionsAgent"}
```

---

### Step 9: Ask Questions (Suspension Point)
- **Status**: Not yet updated (user input step)
- **Future**: Track user answers, response times

---

### Step 10: Refine Draft
- **Status**: Ready for telemetry enhancement
- **Future**: Track AC refinement LLM call

---

### Step 11: Finalize Ticket
- **Status**: Ready for telemetry enhancement
- **Future**: Track final content assembly

---

### Step 12: Unlock
- **Status**: Basic telemetry (ready for metrics)
- **Future**: Track state persistence

---

## Console Output Examples

### Successful Workflow with Full Metrics

```
🚀 [WorkflowTelemetry:start] Workflow started

📍 [extractIntent] Starting step
ℹ️ Step 1 [Extract Intent] started | {"aecId":"ticket_123","workflowRunId":"wf_abc"}
🤖 [mastra-default-llm] Prompt: 45 tokens | Completion: 78 tokens | Duration: 2.3s
ℹ️ Step 1: LLM call completed | {"promptTokens":45,"completionTokens":78,"totalTokens":123,"duration":2300,"temperature":0.3}
✅ [1] Completed in 2456ms | Output: 512 bytes
ℹ️ Step 1 [Extract Intent] completed | {"duration":2456,"llmCallCount":1,"questionsCount":5}

📍 [detectType] Starting step
ℹ️ Step 2 [Detect Type] started | {"aecId":"ticket_123","intent":"Add authentication"}
🤖 [mastra-default-llm] Prompt: 25 tokens | Completion: 15 tokens | Duration: 0.8s
✅ [2] Completed in 856ms | Output: 20 bytes
ℹ️ Step 2 [Detect Type] completed | {"detectedType":"FEATURE","duration":856}

📍 [preflightValidation] Starting step
ℹ️ Step 3 [Preflight Validation] started | {"agent":"QuickPreflightValidator","type":"FEATURE"}
ℹ️ Step 3: Agent tool call | {"agent":"QuickPreflightValidator","tool":"validate","duration":8456,"findingsCount":2,"criticalCount":1}
✅ [3] Completed in 8567ms | Output: 200 bytes
ℹ️ Step 3 [Preflight Validation] completed | {"findingsCount":2,"hasCritical":true,"agent":"QuickPreflightValidator","duration":8567}

📍 [generateQuestions] Starting step
ℹ️ Step 8 [Generate Questions] started | {"agent":"FindingsToQuestionsAgent","findingsCount":2,"acCount":3}
ℹ️ Step 8: Agent tool call | {"agent":"FindingsToQuestionsAgent","tool":"generateQuestions","questionsCount":5}
🤖 [mastra-default-llm] Prompt: 156 tokens | Completion: 234 tokens | Duration: 3.2s
✅ [8] Completed in 3200ms | Output: 1024 bytes
ℹ️ Step 8 [Generate Questions] completed | {"questionsCount":5,"types":"radio, checkbox","agent":"FindingsToQuestionsAgent"}

✅ [WorkflowTelemetry:complete] Workflow completed with status: success
```

---

## Metrics Schema

### Per-Step Metrics
```json
{
  "stepId": "1",
  "stepName": "Extract Intent",
  "startTime": "2026-02-04T17:00:00Z",
  "duration": 2456,
  "status": "completed",
  "llmMetrics": {
    "callCount": 1,
    "totalTokens": 123,
    "totalDuration": 2300,
    "model": "mastra-default-llm",
    "temperature": 0.3
  },
  "agentMetrics": {
    "agent": "MastraContentGenerator",
    "method": "extractIntent"
  },
  "output": {
    "questionsCount": 5,
    "keywordsCount": 3,
    "outputSize": 512
  }
}
```

### Per-LLM-Call Metrics
```json
{
  "model": "qwen2.5-coder:latest",
  "promptTokens": 45,
  "completionTokens": 78,
  "totalTokens": 123,
  "duration": 2300,
  "temperature": 0.3,
  "topP": 0.9,
  "success": true,
  "step": "1",
  "stepName": "Extract Intent",
  "agent": "MastraContentGenerator"
}
```

### Per-Agent-Call Metrics
```json
{
  "agent": "QuickPreflightValidator",
  "tool": "validate",
  "duration": 8456,
  "result": "success",
  "step": "3",
  "stepName": "Preflight Validation",
  "metadata": {
    "findingsCount": 2,
    "criticalCount": 1,
    "categories": "security, dependency",
    "repository": "tickets-forge/backend"
  }
}
```

---

## Usage in Workflow Steps

### Pattern 1: Simple LLM Call

```typescript
const tracker = new StepTelemetryTracker('1', 'Extract Intent');
tracker.startStep({ aecId, workflowRunId });

try {
  const llmTracker = tracker.startLLMCall('MyAgent', {
    model: 'qwen2.5-coder',
    temperature: 0.3,
  });

  const result = await agent.call(input);

  llmTracker.complete(promptTokens, completionTokens);

  tracker.completeStep({
    outputSize: result.length,
    status: 'success',
  });
  return result;
} catch (error) {
  tracker.errorStep(error);
  throw error;
}
```

---

### Pattern 2: Agent with Tool Calls

```typescript
const tracker = new StepTelemetryTracker('3', 'Preflight Validation');
tracker.startStep({ aecId, workflowRunId, agent: 'QuickPreflightValidator' });

try {
  tracker.recordAgentCall('QuickPreflightValidator', 'getWorkspace', 'in-progress', 0);
  
  const workspace = await workspaceFactory.getOrCreateWorkspace(...);
  
  tracker.recordAgentCall('QuickPreflightValidator', 'validate', 'in-progress', 0);
  
  const startTime = Date.now();
  const findings = await validator.validate(aec, workspace);
  const duration = Date.now() - startTime;
  
  tracker.recordAgentCall('QuickPreflightValidator', 'validate', 'success', duration, {
    findingsCount: findings.length,
    criticalCount: findings.filter(f => f.severity === 'critical').length,
  });

  tracker.completeStep({
    outputSize: findings.length * 100,
    findingsCount: findings.length,
    status: 'success',
  });
  return findings;
} catch (error) {
  tracker.errorStep(error, { agent: 'QuickPreflightValidator' });
  throw error;
}
```

---

### Pattern 3: Multiple LLM Calls in One Step

```typescript
const tracker = new StepTelemetryTracker('7', 'Generate Draft');
tracker.startStep({ aecId, workflowRunId });

try {
  // Call 1: Generate AC
  const llm1 = tracker.startLLMCall('ContentGenerator', { model: 'qwen2.5' });
  const ac = await generateAC();
  llm1.complete(200, 300);

  // Call 2: Generate assumptions
  const llm2 = tracker.startLLMCall('ContentGenerator', { model: 'qwen2.5' });
  const assumptions = await generateAssumptions();
  llm2.complete(150, 250);

  // Summary
  const summary = tracker.getLLMSummary();
  console.log(`Step completed with ${summary.callCount} LLM calls, ${summary.totalTokens} total tokens`);

  tracker.completeStep({
    llmCalls: summary.callCount,
    totalTokens: summary.totalTokens,
    status: 'success',
  });
  
  return { ac, assumptions };
} catch (error) {
  tracker.errorStep(error);
  throw error;
}
```

---

## Benefits

✅ **Full Visibility**: See exactly what happens in each step  
✅ **LLM Cost Tracking**: Token counts for cost analysis  
✅ **Performance Metrics**: Duration per step and LLM call  
✅ **Agent Debugging**: Understand agent behavior and tool usage  
✅ **Error Tracing**: Quick diagnosis of failures  
✅ **Production Monitoring**: Track real-world performance  

---

## Future Enhancements

### Phase 5A: External Exporters
- Export metrics to Langfuse (with prompt replay)
- Export to DataDog (with dashboards)
- Export to OpenTelemetry (standards-based)

### Phase 5B: Analytics
- Aggregate metrics across workflows
- Calculate cost per ticket generation
- Identify slow steps for optimization
- Track LLM model performance

### Phase 5C: Alerting
- Alert on slow steps (> threshold)
- Alert on high token usage
- Alert on repeated failures
- Track SLA compliance

---

## Testing Recommendations

✅ Run full workflow and check console output  
✅ Verify metrics are logged for each step  
✅ Check LLM token counts are reasonable  
✅ Verify agent tool calls are tracked  
✅ Test error paths log properly  
✅ Monitor performance overhead (should be < 1%)  

---

## Files Modified

- `backend/src/tickets/workflows/ticket-generation.workflow.ts`
  - Added StepTelemetryTracker import
  - Updated extractIntentStep with full telemetry
  - Updated detectTypeStep with full telemetry
  - Updated preflightValidationStep with agent tracking
  - Updated generateQuestionsStep with agent tracking

## Files Created

- `backend/src/tickets/workflows/step-telemetry.utils.ts`
  - StepTelemetryTracker class
  - LLMCallTracker interface
  - WorkflowTelemetryFactory utility
  - Complete documentation

---

**Status**: Ready for Integration Testing  
**Next**: Complete remaining steps (5, 6, 7, 10, 11, 12)  
**Branch**: `mastra-observability`
