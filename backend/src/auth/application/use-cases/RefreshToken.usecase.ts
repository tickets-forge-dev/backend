import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RefreshTokenResult {
  accessToken: string;
  expiresAt: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(private readonly configService: ConfigService) {}

  async execute(refreshToken: string): Promise<RefreshTokenResult> {
    const apiKey = this.configService.get<string>('FIREBASE_WEB_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'FIREBASE_WEB_API_KEY is not configured',
      );
    }

    const res = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      },
    );

    if (!res.ok) {
      throw new UnauthorizedException(
        'Session expired. Run `forge login` to re-authenticate.',
      );
    }

    const data = (await res.json()) as { id_token: string; expires_in: string };
    const expiresAt = new Date(
      Date.now() + parseInt(data.expires_in, 10) * 1000,
    ).toISOString();

    return {
      accessToken: data.id_token,
      expiresAt,
    };
  }
}
