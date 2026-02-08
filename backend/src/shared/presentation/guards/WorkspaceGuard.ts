import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by FirebaseAuthGuard

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Extract workspaceId from custom claims (if set) or generate from uid
    let workspaceId = user.workspaceId;

    if (!workspaceId) {
      // Generate workspaceId from uid (first 12 chars for readability)
      workspaceId = `ws_${user.uid.substring(0, 12)}`;
    }

    // Attach workspaceId to request for controllers
    request.workspaceId = workspaceId;

    return true;
  }
}
