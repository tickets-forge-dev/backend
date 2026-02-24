import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { RequestDeviceCodeUseCase } from '../../application/use-cases/RequestDeviceCode.usecase';
import { PollDeviceTokenUseCase } from '../../application/use-cases/PollDeviceToken.usecase';
import { VerifyDeviceCodeUseCase } from '../../application/use-cases/VerifyDeviceCode.usecase';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshToken.usecase';
import { DeviceTokenDto } from '../dtos/device-token.dto';
import { DeviceVerifyDto } from '../dtos/device-verify.dto';
import { TokenRefreshDto } from '../dtos/token-refresh.dto';

/**
 * DeviceAuthController
 *
 * Implements the OAuth Device Flow for the CLI.
 *
 * Flow:
 *   CLI → POST /auth/device/request → { deviceCode, userCode, verificationUri }
 *   User opens browser → enters userCode at verificationUri
 *   Browser → POST /auth/device/verify (with Firebase Bearer token)
 *   CLI polls → POST /auth/device/token → { accessToken, refreshToken, ... }
 *   CLI uses accessToken as Bearer on all subsequent requests
 */
@Controller('auth')
export class DeviceAuthController {
  constructor(
    private readonly requestDeviceCodeUseCase: RequestDeviceCodeUseCase,
    private readonly pollDeviceTokenUseCase: PollDeviceTokenUseCase,
    private readonly verifyDeviceCodeUseCase: VerifyDeviceCodeUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  /**
   * POST /api/auth/device/request
   * Initiates the device flow — returns codes for CLI to display to user.
   * Public: no auth required.
   */
  @Post('device/request')
  @HttpCode(HttpStatus.OK)
  async requestDeviceCode() {
    return this.requestDeviceCodeUseCase.execute();
  }

  /**
   * POST /api/auth/device/token
   * CLI polls this while waiting for user to authorize.
   * Returns 400 { error: 'authorization_pending' } until user completes web flow.
   * Returns full DeviceFlowToken once authorized.
   * Public: no auth required (deviceCode acts as credential).
   */
  @Post('device/token')
  @HttpCode(HttpStatus.OK)
  async pollDeviceToken(
    @Body() dto: DeviceTokenDto,
    @Res() res: Response,
  ) {
    try {
      const token = await this.pollDeviceTokenUseCase.execute(dto.deviceCode);

      if (token === null) {
        // Still pending authorization
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: 'authorization_pending' });
      }

      return res.status(HttpStatus.OK).json(token);
    } catch (err) {
      if (err instanceof BadRequestException) {
        const response = err.getResponse() as string | { message: string };
        const message =
          typeof response === 'string' ? response : response.message;
        return res.status(HttpStatus.BAD_REQUEST).json({ error: message });
      }
      throw err;
    }
  }

  /**
   * POST /api/auth/device/verify
   * Browser calls this after user signs in and enters their code.
   * Requires Firebase ID token (user must be signed in on the web app).
   */
  @Post('device/verify')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyDeviceCode(@Request() req: any, @Body() dto: DeviceVerifyDto) {
    try {
      await this.verifyDeviceCodeUseCase.execute({
        userCode: dto.userCode,
        userId: req.user.uid,
      });
      return { success: true };
    } catch (err) {
      if (err instanceof BadRequestException) {
        const response = err.getResponse() as string | { message: string };
        const message =
          typeof response === 'string' ? response : response.message;
        throw new BadRequestException({ error: message });
      }
      throw err;
    }
  }

  /**
   * POST /api/auth/refresh
   * CLI uses this to get a new accessToken when the current one expires.
   * Public: refresh token acts as the credential.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: TokenRefreshDto) {
    return this.refreshTokenUseCase.execute(dto.refreshToken);
  }
}
