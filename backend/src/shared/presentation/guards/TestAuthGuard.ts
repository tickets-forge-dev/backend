import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * Test guard that provides a mock user without Firebase authentication
 * Only used for development/testing - remove in production
 */
@Injectable()
export class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Provide a mock user for testing
    request.user = {
      uid: 'test-user-123',
      email: 'test@example.com',
      workspaceId: 'workspace-test-default',
    };

    return true;
  }
}
