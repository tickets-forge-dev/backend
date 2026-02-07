export class AECNotFoundError extends Error {
  constructor(public readonly aecId: string) {
    super(`AEC with id ${aecId} not found`);
    this.name = 'AECNotFoundError';
  }
}

export class InvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateTransitionError';
  }
}

export class InsufficientReadinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientReadinessError';
  }
}

export class ValidationFailedError extends Error {
  constructor(public readonly issues: any[]) {
    super('Validation failed');
    this.name = 'ValidationFailedError';
  }
}

export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

export class QuotaExceededError extends Error {
  constructor(
    public readonly used: number,
    public readonly limit: number,
  ) {
    super(`Ticket quota exceeded: ${used}/${limit}`);
    this.name = 'QuotaExceededError';
  }
}
