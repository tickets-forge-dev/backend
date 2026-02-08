import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../../infrastructure/firebase/firebase.config';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No authorization token provided');
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      // Verify token with Firebase Admin SDK
      const decodedToken = await this.firebaseService.getAuth().verifyIdToken(token);

      // Attach decoded user to request for downstream guards/controllers
      request.user = decodedToken;

      return true;
    } catch (error: any) {
      console.error('Token verification failed:', error.message);

      if (error.code === 'auth/id-token-expired') {
        throw new UnauthorizedException('Token expired');
      } else if (error.code === 'auth/argument-error') {
        throw new UnauthorizedException('Invalid token format');
      }

      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
