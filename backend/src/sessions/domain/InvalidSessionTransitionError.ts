export class InvalidSessionTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid session transition: ${from} → ${to}`);
    this.name = 'InvalidSessionTransitionError';
  }
}
