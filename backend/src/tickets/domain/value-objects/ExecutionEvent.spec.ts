import { ExecutionEvent, ExecutionEventType, createExecutionEvent } from './ExecutionEvent';

describe('ExecutionEvent', () => {
  it('creates a decision event with all fields', () => {
    const event = createExecutionEvent({
      type: ExecutionEventType.DECISION,
      title: 'Used token bucket algorithm',
      description: 'Chose token bucket over sliding window for better burst handling',
    });

    expect(event.id).toMatch(/^evt_/);
    expect(event.type).toBe('decision');
    expect(event.title).toBe('Used token bucket algorithm');
    expect(event.description).toContain('token bucket');
    expect(event.createdAt).toBeInstanceOf(Date);
  });

  it('creates a risk event', () => {
    const event = createExecutionEvent({
      type: ExecutionEventType.RISK,
      title: 'Added Redis dependency',
      description: 'Rate limiting requires Redis, which is not in the current stack',
    });

    expect(event.type).toBe('risk');
  });

  it('creates a scope_change event', () => {
    const event = createExecutionEvent({
      type: ExecutionEventType.SCOPE_CHANGE,
      title: 'Added burst recovery',
      description: 'Added burst recovery mechanism not in original spec',
    });

    expect(event.type).toBe('scope_change');
  });

  it('throws if title is empty', () => {
    expect(() =>
      createExecutionEvent({
        type: ExecutionEventType.DECISION,
        title: '',
        description: 'Some description',
      }),
    ).toThrow('Title is required');
  });

  it('throws if description is empty', () => {
    expect(() =>
      createExecutionEvent({
        type: ExecutionEventType.DECISION,
        title: 'Some title',
        description: '',
      }),
    ).toThrow('Description is required');
  });
});
