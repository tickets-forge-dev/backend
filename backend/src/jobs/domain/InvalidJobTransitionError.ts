export class InvalidJobTransitionError extends Error {
  constructor(
    public readonly from: string,
    public readonly to: string,
  ) {
    super(`Invalid job status transition from '${from}' to '${to}'`);
    this.name = 'InvalidJobTransitionError';
  }
}
