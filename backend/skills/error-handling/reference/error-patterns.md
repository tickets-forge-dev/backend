# Error Handling Patterns

## Typed Errors

```typescript
// Domain error — business rule violation
export class InsufficientBalanceError extends Error {
  constructor(public readonly available: number, public readonly required: number) {
    super(`Insufficient balance: ${available} < ${required}`);
    this.name = 'InsufficientBalanceError';
  }
}

// Application error — use case failure
export class TicketNotFoundError extends Error {
  constructor(public readonly ticketId: string) {
    super(`Ticket ${ticketId} not found`);
    this.name = 'TicketNotFoundError';
  }
}
```

## Controller Error Translation

```typescript
try {
  return await this.useCase.execute(command);
} catch (error) {
  if (error instanceof TicketNotFoundError) {
    throw new NotFoundException(error.message);
  }
  if (error instanceof InsufficientBalanceError) {
    throw new BadRequestException(error.message);
  }
  throw error; // Unknown errors bubble up to global handler
}
```

## Retry Pattern

```typescript
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
  throw new Error('Unreachable');
}
```

## Never Swallow

```typescript
// BAD
try { await save(data); } catch {}

// GOOD
try {
  await save(data);
} catch (error) {
  this.logger.error('Failed to save data', { error, data });
  throw error;
}
```
