import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { FigmaService } from './figma.service';
import { FigmaIntegrationRepository } from './figma-integration.repository';
import { FigmaOAuthToken } from './figma.types';

/**
 * Figma OAuth Controller
 * Handles OAuth flow for connecting Figma to workspaces
 *
 * Flow:
 * 1. Frontend redirects to /figma/oauth/start?workspaceId=...&returnUrl=...
 * 2. Controller redirects to Figma OAuth endpoint
 * 3. User authorizes in Figma
 * 4. Figma redirects to /figma/oauth/callback?code=...&state=...
 * 5. Controller exchanges code for token
 * 6. Controller stores token and redirects back to frontend
 */
@Controller('integrations/figma/oauth')
export class FigmaOAuthController {
  private readonly logger = new Logger(FigmaOAuthController.name);

  // These would come from environment variables
  private readonly FIGMA_CLIENT_ID = process.env.FIGMA_CLIENT_ID || '';
  private readonly FIGMA_CLIENT_SECRET = process.env.FIGMA_CLIENT_SECRET || '';
  private readonly FIGMA_REDIRECT_URI =
    process.env.FIGMA_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/integrations/figma/oauth/callback';
  private readonly FIGMA_AUTH_URL = 'https://www.figma.com/oauth';
  private readonly FIGMA_TOKEN_URL = 'https://www.figma.com/api/oauth/token';

  constructor(
    private readonly figmaService: FigmaService,
    private readonly figmaIntegrationRepository: FigmaIntegrationRepository,
  ) {}

  /**
   * Start Figma OAuth flow
   * Redirects to Figma authorization endpoint
   */
  @Get('start')
  async startOAuth(
    @Query('workspaceId') workspaceId: string,
    @Query('returnUrl') returnUrl: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!workspaceId || !returnUrl) {
      res.status(400).json({
        error: 'Missing required parameters: workspaceId, returnUrl',
      });
      return;
    }

    // Store state for callback validation (in production, use secure session storage)
    const state = Buffer.from(
      JSON.stringify({ workspaceId, returnUrl, timestamp: Date.now() }),
    ).toString('base64');

    const authUrl = new URL(`${this.FIGMA_AUTH_URL}`);
    authUrl.searchParams.set('client_id', this.FIGMA_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', this.FIGMA_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'file_content_read');

    this.logger.debug(`Starting Figma OAuth flow for workspace ${workspaceId}`);
    res.redirect(authUrl.toString());
  }

  /**
   * Figma OAuth callback
   * Exchanges authorization code for access token
   */
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!code || !state) {
      res.status(400).json({
        error: 'Missing authorization code or state',
      });
      return;
    }

    try {
      // Decode state
      const decodedState = JSON.parse(
        Buffer.from(state, 'base64').toString('utf-8'),
      );
      const { workspaceId, returnUrl } = decodedState;

      // Exchange code for token
      const tokenResponse = await this.exchangeCodeForToken(code);
      if (!tokenResponse) {
        res.status(400).json({
          error: 'Failed to exchange code for token',
        });
        return;
      }

      // Verify token is valid
      const isValid = await this.figmaService.verifyToken(
        tokenResponse.accessToken,
      );
      if (!isValid) {
        res.status(400).json({
          error: 'Invalid access token received from Figma',
        });
        return;
      }

      // Store token
      await this.figmaIntegrationRepository.saveToken(workspaceId, {
        accessToken: tokenResponse.accessToken,
        tokenType: tokenResponse.tokenType,
        expiresIn: tokenResponse.expiresIn,
        scope: tokenResponse.scope,
      });

      this.logger.debug(`Successfully connected Figma for workspace ${workspaceId}`);

      // Redirect back to frontend with success
      const callbackUrl = new URL(returnUrl);
      callbackUrl.searchParams.set('status', 'success');
      callbackUrl.searchParams.set('provider', 'figma');
      res.redirect(callbackUrl.toString());
    } catch (error) {
      this.logger.error(
        `Figma OAuth callback error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      // Try to redirect to returnUrl with error
      try {
        const errorUrl = new URL(state);
        errorUrl.searchParams.set('status', 'error');
        errorUrl.searchParams.set('provider', 'figma');
        errorUrl.searchParams.set(
          'error',
          error instanceof Error ? error.message : 'Unknown error',
        );
        res.redirect(errorUrl.toString());
      } catch {
        res.status(500).json({
          error: 'OAuth callback processing failed',
        });
      }
    }
  }

  /**
   * Exchange Figma authorization code for access token
   * @private
   */
  private async exchangeCodeForToken(code: string): Promise<FigmaOAuthToken | null> {
    try {
      const response = await fetch(this.FIGMA_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.FIGMA_CLIENT_ID,
          client_secret: this.FIGMA_CLIENT_SECRET,
          redirect_uri: this.FIGMA_REDIRECT_URI,
          code,
          grant_type: 'authorization_code',
        }).toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(
          `Figma token exchange failed: ${response.status} - ${error}`,
        );
        return null;
      }

      const data = (await response.json()) as FigmaOAuthToken;
      return data;
    } catch (error) {
      this.logger.error(
        `Figma token exchange error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }
}
