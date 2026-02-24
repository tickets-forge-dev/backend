import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract teamId from request context.
 * Must be used with WorkspaceGuard which sets request.teamId from the x-team-id header
 * (or falls back to the user's current team from Firestore).
 */
export const TeamId = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.teamId;
});
