# Mastra Telemetry Usage Guide

## Overview

The **WorkflowTelemetry** service provides structured observability for ticket generation workflows. It tracks workflow execution, LLM calls, step transitions, and performance metrics.

**Purpose:**
- Debug workflow behavior in development and production
- Monitor LLM performance and token usage
- Track step execution time and success rates
- Understand agent decision paths

---

## Architecture

### Location
```
backend/src/tickets/application/services/WorkflowTelemetry.ts
```

### Key Components
- **WorkflowTelemetry** - Main telemetry service
- **Step Tracking** - Records step execution
- **LLM Metrics** - Captures LLM call data
- **Formatted Output** - Console logs with emojis for visibility

---

## Installation & Setup

### 1. Service is Already Registered

The WorkflowTelemetry service is automatically registered in `TicketsModule`:

```typescript
// backend/src/tickets/tickets.module.ts
providers: [
  WorkflowTelemetry,
  // ... other services
]
```

### 2. Access via DI (NestJS)

Inject it in any NestJS service:

```typescript
import { WorkflowTelemetry } from './services/WorkflowTelemetry';

@Injectable()
export class MyService {
  constructor(private telemetry: WorkflowTelemetry) {}

  async doSomething() {
    this.telemetry.info('Something happened');
  }
}
```

### 3. Access via Static Method (Non-NestJS Context)

From anywhere in the codebase:

```typescript
import { WorkflowTelemetry } from './services/WorkflowTelemetry';

const telemetry = WorkflowTelemetry.getInstance();
telemetry.info('Event from non-NestJS context');
```

---

## Core Methods

### Workflow Lifecycle

#### Start Workflow
```typescript
telemetry.startWorkflow(workflowId, ticketId, workspaceId);
// Output: 🚀 [WorkflowTelemetry:start] Workflow started
```

**Parameters:**
- `workflowId` - Unique workflow execution ID
- `ticketId` - Ticket being generated
- `workspaceId` - User workspace

#### Complete Workflow
```typescript
telemetry.completeWorkflow(workflowId, status, metadata);
// Output: ✅ [WorkflowTelemetry:complete] Workflow completed with status: success
```

**Parameters:**
- `workflowId` - Execution ID
- `status` - 'success' | 'failed' | 'suspended'
- `metadata` - Optional custom data (will be stringified)

#### Fail Workflow
```typescript
telemetry.failWorkflow(workflowId, error, metadata);
// Output: ❌ [WorkflowTelemetry:failed] Error: Connection timeout
```

---

### Step Tracking

#### Start Step
```typescript
telemetry.startStep(stepId, stepName, workflowId);
// Output: 📍 [extractIntent] Starting step
```

**Parameters:**
- `stepId` - Unique step identifier
- `stepName` - Display name ("Extract Intent", "Generate Draft", etc.)
- `workflowId` - Parent workflow ID

#### Complete Step
```typescript
telemetry.completeStep(
  stepId,
  duration,      // milliseconds
  outputSize,    // bytes or token count
  metadata       // optional
);
// Output: ✅ [extractIntent] Completed in 2345ms | Output: 512 bytes
```

**Parameters:**
- `stepId` - Step identifier
- `duration` - Execution time in milliseconds
- `outputSize` - Data size (bytes or tokens)
- `metadata` - Optional custom data

#### Transition Between Steps
```typescript
telemetry.transitionStep(fromStepId, toStepId);
// Output: ➡️ [extractIntent → detectType] Step transition
```

#### Record Step Error
```typescript
telemetry.stepError(stepId, error, metadata);
// Output: ⚠️ [extractIntent] Error: Invalid input format
```

---

### LLM Metrics

#### Record LLM Call
```typescript
telemetry.recordLLMCall(
  model,              // "qwen2.5-coder:latest"
  prompt,             // original prompt text
  completion,         // LLM response text
  metrics             // token counts, latency, etc.
);
```

**Full Example:**
```typescript
telemetry.recordLLMCall(
  'qwen2.5-coder:latest',
  'Generate acceptance criteria for: Add auth',
  'Acceptance criteria:\n1. User can login\n2. Sessions persist',
  {
    promptTokens: 45,
    completionTokens: 78,
    totalTokens: 123,
    duration: 2345,       // milliseconds
    temperature: 0.3,
    modelParameters: {
      top_p: 0.9,
      top_k: 40
    }
  }
);
// Output: 🤖 [qwen2.5-coder] Prompt: 45 tokens | Completion: 78 tokens | Duration: 2.3s
```

**Metrics Object:**
```typescript
interface LLMMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  duration: number;              // milliseconds
  temperature?: number;
  modelParameters?: Record<string, any>;
  success?: boolean;
  error?: string;
  cost?: number;                 // optional USD cost
}
```

#### Record LLM Error
```typescript
telemetry.recordLLMError(model, error, metadata);
// Output: ❌ [qwen2.5-coder] LLM Error: Connection timeout after 60s
```

---

### General Logging

#### Info
```typescript
telemetry.info('User submitted ticket creation form', { userId: '123' });
// Output: ℹ️ [WorkflowTelemetry] User submitted ticket creation form | {"userId":"123"}
```

#### Warn
```typescript
telemetry.warn('Slow LLM response detected', { duration: 45000 });
// Output: ⚠️ [WorkflowTelemetry] Slow LLM response detected | {"duration":45000}
```

#### Error
```typescript
telemetry.error('Failed to save workflow state', error);
// Output: ❌ [WorkflowTelemetry] Failed to save workflow state | {error message}
```

#### Debug
```typescript
telemetry.debug('Step input validation passed', stepData);
// Output: 🔍 [WorkflowTelemetry] Step input validation passed | {data}
```

---

## Usage Examples

### Example 1: Basic Workflow Tracking

```typescript
// In ticket creation use case
const workflowId = 'wf_abc123';
const ticketId = 'ticket_xyz789';

// Start tracking
this.telemetry.startWorkflow(workflowId, ticketId, workspaceId);

try {
  // Step 1
  this.telemetry.startStep('extractIntent', 'Extract Intent', workflowId);
  const intent = await this.generateIntent(title, description);
  this.telemetry.completeStep('extractIntent', 245, intent.length);
  
  // Step 2
  this.telemetry.startStep('detectType', 'Detect Type', workflowId);
  const type = await this.detectType(intent);
  this.telemetry.completeStep('detectType', 312, type.length);
  
  this.telemetry.transitionStep('extractIntent', 'detectType');
  
  // Workflow complete
  this.telemetry.completeWorkflow(workflowId, 'success', {
    stepsCompleted: 12,
    totalTime: 45000
  });
} catch (error) {
  this.telemetry.failWorkflow(workflowId, error);
  throw error;
}
```

### Example 2: LLM Call Tracking

```typescript
// In MastraContentGenerator
async callOllama(prompt: string): Promise<string> {
  const startTime = Date.now();
  const model = 'qwen2.5-coder:latest';
  
  try {
    const response = await this.mastra.generate({
      prompt,
      model,
      temperature: 0.3
    });
    
    const duration = Date.now() - startTime;
    
    // Record successful LLM call
    this.telemetry.recordLLMCall(
      model,
      prompt,
      response,
      {
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
        duration,
        temperature: 0.3,
        success: true
      }
    );
    
    return response.text;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Record failed LLM call
    this.telemetry.recordLLMError(
      model,
      error,
      { duration, prompt: prompt.substring(0, 100) }
    );
    
    throw error;
  }
}
```

### Example 3: Agent Tracing

```typescript
// In FindingsToQuestionsAgent
async execute(context: ExecutionContext): Promise<Question[]> {
  this.telemetry.info('Finding questions agent started', {
    agent: 'FindingsToQuestionsAgent',
    findings: context.findings.length
  });
  
  try {
    const questions = await this.generateQuestions(context.findings);
    
    this.telemetry.info('Questions generated', {
      agent: 'FindingsToQuestionsAgent',
      questionsCount: questions.length,
      categories: this.groupByCategory(questions)
    });
    
    return questions;
  } catch (error) {
    this.telemetry.error('Agent failed to generate questions', error);
    throw error;
  }
}
```

---

## Console Output Examples

### Healthy Workflow Execution
```
🚀 [WorkflowTelemetry:start] Workflow started
📍 [extractIntent] Starting step
✅ [extractIntent] Completed in 245ms | Output: 512 bytes
🤖 [qwen2.5-coder] Prompt: 45 tokens | Completion: 78 tokens | Duration: 2.3s
➡️ [extractIntent → detectType] Step transition
📍 [detectType] Starting step
✅ [detectType] Completed in 312ms | Output: 256 bytes
...
✅ [WorkflowTelemetry:complete] Workflow completed with status: success
```

### Error Scenario
```
🚀 [WorkflowTelemetry:start] Workflow started
📍 [extractIntent] Starting step
❌ [qwen2.5-coder] LLM Error: Connection timeout after 60s
⚠️ [extractIntent] Error: LLM call failed
❌ [WorkflowTelemetry:failed] Error: Connection timeout
```

### Warning for Slow LLM
```
🚀 [WorkflowTelemetry:start] Workflow started
🤖 [qwen2.5-coder] Prompt: 120 tokens | Completion: 256 tokens | Duration: 45.2s
⚠️ [WorkflowTelemetry] Slow LLM response detected | {"duration":45200}
```

---

## Metrics You Can Extract

### Per-Workflow Metrics
```typescript
telemetry.getWorkflowMetrics(workflowId);
// Returns:
{
  totalDuration: 45000,        // milliseconds
  stepsCompleted: 12,
  stepsFailed: 0,
  totalTokens: 12450,
  totalLLMCalls: 12,
  averageLLMLatency: 3750,     // per call
  estimatedCost: 0.045         // USD (if available)
}
```

### Per-Step Metrics
```typescript
telemetry.getStepMetrics(stepId);
// Returns:
{
  stepName: "Extract Intent",
  duration: 245,
  inputSize: 450,
  outputSize: 512,
  status: 'completed',
  timestamp: '2026-02-04T16:55:00Z',
  llmCalls: 1
}
```

### Per-LLM-Call Metrics
```typescript
telemetry.getLLMCallMetrics(callId);
// Returns:
{
  model: 'qwen2.5-coder:latest',
  promptTokens: 45,
  completionTokens: 78,
  totalTokens: 123,
  duration: 2345,
  cost: 0.002,
  temperature: 0.3,
  success: true
}
```

---

## Best Practices

### 1. Always Track Workflow Lifecycle
```typescript
// ✅ Good: Start and complete are paired
telemetry.startWorkflow(id, ticketId, workspaceId);
try {
  // ... work
  telemetry.completeWorkflow(id, 'success');
} catch (error) {
  telemetry.failWorkflow(id, error);
}

// ❌ Avoid: Forgetting to complete workflow
telemetry.startWorkflow(id, ticketId, workspaceId);
// ... work but no completeWorkflow() call
```

### 2. Record All LLM Calls
```typescript
// ✅ Good: Every LLM call is tracked
await this.mastra.generate(prompt);
this.telemetry.recordLLMCall(model, prompt, response, metrics);

// ❌ Avoid: Silent LLM calls
const response = await this.mastra.generate(prompt);
// no telemetry recorded
```

### 3. Include Duration in Step Completion
```typescript
// ✅ Good: Measure actual execution time
const start = Date.now();
const result = await this.executeStep();
const duration = Date.now() - start;
this.telemetry.completeStep(stepId, duration, result.size);

// ❌ Avoid: Guessing durations
this.telemetry.completeStep(stepId, 1000, 512); // hardcoded values
```

### 4. Use Meaningful Metadata
```typescript
// ✅ Good: Structured metadata
this.telemetry.info('Workflow completed', {
  stepsCompleted: 12,
  totalTime: 45000,
  questionsGenerated: 5,
  avgStepDuration: 3750
});

// ❌ Avoid: Opaque strings
this.telemetry.info('Done');
```

### 5. Log Errors with Context
```typescript
// ✅ Good: Error with context
this.telemetry.error('LLM call failed', error, {
  model: 'qwen2.5-coder',
  retryAttempt: 2,
  stepId: 'extractIntent'
});

// ❌ Avoid: Error alone
this.telemetry.error('Error', error);
```

---

## Debugging with Telemetry

### Find Slow Steps
```bash
# Look for high duration in console output
✅ [generateDraft] Completed in 12456ms | Output: 2048 bytes
# 12.4s is slow - investigate the LLM call within this step
```

### Find Token-Heavy Calls
```bash
# Look for high token counts
🤖 [qwen2.5-coder] Prompt: 450 tokens | Completion: 256 tokens | Duration: 8.9s
# 450 prompt tokens is high - consider prompt optimization
```

### Identify Failures
```bash
# Look for ❌ symbols
❌ [WorkflowTelemetry:failed] Error: Connection timeout
# Workflow failed - check the error message and context
```

### Correlate Steps to LLM Calls
```
📍 [generateDraft] Starting step
  🤖 [qwen2.5-coder] Prompt: 200 tokens | Completion: 500 tokens | Duration: 5.1s
✅ [generateDraft] Completed in 5234ms | Output: 4096 bytes
# LLM call is the bottleneck - 5.1s out of 5.2s total
```

---

## Integration with Monitoring Tools

### Export to ELK Stack (Future)
Telemetry can be extended to export logs to:
- Elasticsearch
- Logstash  
- Kibana

### Export to DataDog (Future)
Telemetry can push metrics to DataDog for:
- Dashboard visualization
- Alerting
- Trend analysis

### Export to Langfuse (Future)
Telemetry can integrate with Langfuse for:
- LLM call replay
- Prompt evaluation
- Cost tracking

---

## FAQ

### Q: Where are logs stored?
**A:** Currently, logs print to console (stdout). In production, they're captured by your logging infrastructure (Docker, Kubernetes, Cloud Logging, etc.).

### Q: Can I disable telemetry?
**A:** Not yet. Telemetry is always on but adds minimal overhead. Future versions will support toggling.

### Q: What's the performance impact?
**A:** Telemetry adds < 1% latency. It's designed to be lightweight.

### Q: Can I export to custom systems?
**A:** Yes! Extend `WorkflowTelemetry` class to add custom exporters (DataDog, Slack, etc.).

### Q: How do I correlate telemetry with Firestore logs?
**A:** Use the `workflowId` - it's passed to both telemetry and stored in the AEC document.

### Q: Should I log sensitive data?
**A:** No! Avoid logging user credentials, API keys, passwords. The `SensitiveDataFilter` will redact common patterns, but be explicit in code.

---

## Next Steps

1. **View Console Output** - Start a workflow and watch the console logs
2. **Add Custom Telemetry** - Add telemetry calls to your code
3. **Analyze Metrics** - Use the output to optimize performance
4. **Set Up Monitoring** - (Future) Export to external tools

---

**Related Documentation:**
- [Mastra Documentation](https://mastra.ai/docs)
- [Epic 8: Observability & Distributed Tracing](./epics.md#epic-8-observability--distributed-tracing)
- [WorkflowTelemetry Source](../backend/src/tickets/application/services/WorkflowTelemetry.ts)
