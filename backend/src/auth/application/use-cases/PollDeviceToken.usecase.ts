import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirestoreDeviceCodeRepository } from '../../infrastructure/persistence/FirestoreDeviceCodeRepository';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';
import { FirestoreTeamRepository } from '../../../teams/infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';

export interface DeviceFlowToken {
  accessToken: string;
  refreshToken: string;
  userId: string;
  teamId: string;
  user: {
    email: string;
    displayName: string;
  };
}

@Injectable()
export class PollDeviceTokenUseCase {
  constructor(
    private readonly deviceCodeRepo: FirestoreDeviceCodeRepository,
    private readonly firebaseService: FirebaseService,
    private readonly teamRepository: FirestoreTeamRepository,
    private readonly userRepository: FirestoreUserRepository,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Returns the full DeviceFlowToken when authorized, or null when still pending.
   * Throws BadRequestException with error codes per OAuth Device Flow spec.
   */
  async execute(deviceCode: string): Promise<DeviceFlowToken | null> {
    const record = await this.deviceCodeRepo.findByDeviceCode(deviceCode);

    if (!record) {
      throw new BadRequestException('invalid_device_code');
    }

    // Check expiry
    if (record.status === 'expired' || record.expiresAt < new Date()) {
      throw new BadRequestException('expired_token');
    }

    if (record.status === 'consumed') {
      throw new BadRequestException('expired_token');
    }

    if (record.status === 'pending') {
      return null; // Caller returns 400 authorization_pending
    }

    // status === 'authorized' — exchange custom token for Firebase ID token
    if (!record.customToken || !record.userId) {
      throw new BadRequestException('authorization_pending');
    }

    const apiKey = this.configService.get<string>('FIREBASE_WEB_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'FIREBASE_WEB_API_KEY is not configured',
      );
    }

    // Exchange Firebase custom token → ID token + refresh token
    const exchangeRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: record.customToken, returnSecureToken: true }),
      },
    );

    if (!exchangeRes.ok) {
      const err = (await exchangeRes.json()) as { error?: { message?: string } };
      throw new InternalServerErrorException(
        `Firebase token exchange failed: ${err?.error?.message ?? 'Unknown error'}`,
      );
    }

    const { idToken, refreshToken } = (await exchangeRes.json()) as {
      idToken: string;
      refreshToken: string;
      expiresIn: string;
    };

    // Get Firebase user record for email/displayName
    const userRecord = await this.firebaseService
      .getAuth()
      .getUser(record.userId);

    // Get the user's current team (respects memberships, not just ownership)
    let teamId = '';
    const user = await this.userRepository.getById(record.userId);
    if (user) {
      const currentTeamId = user.getCurrentTeamId();
      if (currentTeamId) {
        teamId = currentTeamId.getValue();
      } else {
        // Fallback: first team from user's team list
        const userTeams = user.getTeams();
        if (userTeams.length > 0) {
          teamId = userTeams[0].getValue();
        }
      }
    }

    // Final fallback: owned teams (for users not yet synced to User document)
    if (!teamId) {
      const ownedTeams = await this.teamRepository.getByOwnerId(record.userId);
      const activeTeam = ownedTeams.find((t) => !t.isDeleted());
      teamId = activeTeam?.getId().getValue() ?? '';
    }

    // Consume the device code so it cannot be polled again
    await this.deviceCodeRepo.markConsumed(deviceCode);

    return {
      accessToken: idToken,
      refreshToken,
      userId: record.userId,
      teamId,
      user: {
        email: userRecord.email ?? '',
        displayName: userRecord.displayName ?? userRecord.email ?? '',
      },
    };
  }
}
