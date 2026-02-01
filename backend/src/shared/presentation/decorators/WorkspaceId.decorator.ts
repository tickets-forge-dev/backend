import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract workspaceId from request context
 * Must be used with WorkspaceGuard which sets request.workspaceId
 */
export const WorkspaceId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.workspaceId;
  },
);
