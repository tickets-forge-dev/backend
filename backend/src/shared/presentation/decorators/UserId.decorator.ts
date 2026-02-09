import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract user ID (uid) from the Firebase decoded token on the request.
 * Must be used with FirebaseAuthGuard which sets request.user.
 */
export const UserId = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.uid ?? '';
});
