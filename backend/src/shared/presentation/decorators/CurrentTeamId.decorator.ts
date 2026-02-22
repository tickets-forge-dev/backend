import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract currentTeamId from request context
 * Must be used with WorkspaceGuard which sets request.currentTeamId
 * Returns null if user is in personal workspace (no team selected)
 */
export const CurrentTeamId = createParamDecorator((data: unknown, ctx: ExecutionContext): string | null => {
  const request = ctx.switchToHttp().getRequest();
  return request.currentTeamId || null;
});
