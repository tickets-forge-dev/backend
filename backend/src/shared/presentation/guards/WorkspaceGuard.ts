import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  private readonly logger = new Logger(WorkspaceGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by FirebaseAuthGuard

    this.logger.debug(`[WorkspaceGuard] Request: ${request.method} ${request.url}`);
    this.logger.debug(`[WorkspaceGuard] User: ${user ? user.uid : 'NOT SET'}`);

    if (!user) {
      this.logger.error('[WorkspaceGuard] User not authenticated');
      throw new UnauthorizedException('User not authenticated');
    }

    // Extract workspaceId from custom claims (if set) or generate from uid
    let workspaceId = user.workspaceId;

    if (!workspaceId) {
      // Generate workspaceId from uid (first 12 chars for readability)
      workspaceId = `ws_${user.uid.substring(0, 12)}`;
      this.logger.debug(`[WorkspaceGuard] Generated workspaceId: ${workspaceId}`);
    } else {
      this.logger.debug(`[WorkspaceGuard] Using existing workspaceId: ${workspaceId}`);
    }

    // Attach workspaceId to request for controllers
    request.workspaceId = workspaceId;
    this.logger.log(`[WorkspaceGuard] ✓ WorkspaceId set: ${workspaceId}`);

    return true;
  }
}
