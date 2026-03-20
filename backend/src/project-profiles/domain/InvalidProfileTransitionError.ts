export class InvalidProfileTransitionError extends Error {
  constructor(
    public readonly from: string,
    public readonly to: string,
  ) {
    super(`Invalid profile status transition from '${from}' to '${to}'`);
    this.name = 'InvalidProfileTransitionError';
  }
}
