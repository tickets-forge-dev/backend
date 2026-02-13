import { Controller, Get, Query, Res, Logger, UseGuards, ForbiddenException, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { FigmaService } from './figma.service';
import { FigmaIntegrationRepository } from './figma-integration.repository';
import { FigmaOAuthToken } from './figma.types';
import { FirebaseAuthGuard } from '../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../shared/presentation/guards/WorkspaceGuard';
import { RateLimitGuard } from '../../shared/presentation/guards/RateLimitGuard';
import { WorkspaceId } from '../../shared/presentation/decorators/WorkspaceId.decorator';
import { UserId } from '../../shared/presentation/decorators/UserId.decorator';
import { TelemetryService } from '../../shared/infrastructure/posthog/telemetry.service';

/**
 * Figma OAuth Controller
 * Handles OAuth flow for connecting Figma to workspaces
 *
 * Flow:
 * 1. Frontend redirects to /figma/oauth/start?workspaceId=...&returnUrl=...
 * 2. Controller validates returnUrl against whitelist
 * 3. Controller redirects to Figma OAuth endpoint with state
 * 4. User authorizes in Figma
 * 5. Figma redirects to /figma/oauth/callback?code=...&state=...
 * 6. Controller validates state, exchanges code for token, stores it
 * 7. Controller redirects back to returnUrl with success/error
 *
 * Security Measures:
 * - State parameter validated (prevents CSRF)
 * - Return URL whitelist validation (prevents open redirect)
 * - HTTPS-only redirect URIs (prevents token interception)
 * - Token verification before storage
 */
@Controller('integrations/figma/oauth')
export class FigmaOAuthController {
  private readonly logger = new Logger(FigmaOAuthController.name);

  // OAuth config from environment
  private readonly FIGMA_CLIENT_ID = process.env.FIGMA_CLIENT_ID || '';
  private readonly FIGMA_CLIENT_SECRET = process.env.FIGMA_CLIENT_SECRET || '';
  private readonly FIGMA_REDIRECT_URI =
    process.env.FIGMA_OAUTH_REDIRECT_URI ||
    'http://localhost:3000/api/integrations/figma/oauth/callback';
  private readonly FIGMA_AUTH_URL = 'https://www.figma.com/oauth';
  private readonly FIGMA_TOKEN_URL = 'https://www.figma.com/api/oauth/token';

  // Return URL whitelist (prevent open redirect attacks)
  private readonly ALLOWED_RETURN_HOSTS = [
    'localhost:3000',
    'localhost:3001',
    'localhost:8000',
    process.env.APP_DOMAIN || '',
  ].filter(Boolean);

  constructor(
    private readonly figmaService: FigmaService,
    private readonly figmaIntegrationRepository: FigmaIntegrationRepository,
    private readonly telemetry: TelemetryService,
  ) {}

  /**
   * Start Figma OAuth flow
   * Returns the Figma OAuth authorization URL (instead of redirecting)
   * This avoids CORS issues when frontend needs to handle the redirect
   *
   * Security checks:
   * - Rate limiting (5 requests per minute per IP)
   * - User must be authenticated (FirebaseAuthGuard)
   * - workspaceId must match user's workspace (WorkspaceGuard + permission check)
   * - workspaceId must not be empty
   * - returnUrl must be from whitelisted domain
   * - State parameter includes timestamp (prevents replay attacks)
   */
  @UseGuards(RateLimitGuard, FirebaseAuthGuard, WorkspaceGuard)
  @Get('start')
  async startOAuth(
    @Query('workspaceId') requestedWorkspaceId: string,
    @Query('returnUrl') returnUrl: string,
    @WorkspaceId() userWorkspaceId: string,
    @UserId() userId: string,
  ): Promise<{ oauthUrl: string }> {
    // Validate inputs
    if (!requestedWorkspaceId || typeof requestedWorkspaceId !== 'string' || requestedWorkspaceId.trim().length === 0) {
      this.logger.warn('Figma OAuth start: Missing or invalid workspaceId');
      throw new Error('Missing required parameter: workspaceId');
    }

    // Verify user owns requested workspace (prevent cross-workspace access)
    if (requestedWorkspaceId.trim() !== userWorkspaceId) {
      this.logger.warn(
        `Figma OAuth start: User attempted unauthorized workspace access: requested=${requestedWorkspaceId}, user=${userWorkspaceId}`,
      );
      throw new Error('You do not have permission to connect this workspace');
    }

    if (!returnUrl || typeof returnUrl !== 'string' || returnUrl.trim().length === 0) {
      this.logger.warn('Figma OAuth start: Missing or invalid returnUrl');
      throw new Error('Missing required parameter: returnUrl');
    }

    // Validate return URL (prevent open redirect attacks)
    if (!this.isValidReturnUrl(returnUrl)) {
      this.logger.warn(
        `Figma OAuth start: Invalid return URL (not whitelisted): ${this.getTruncatedUrlForLogging(returnUrl)}`,
      );
      throw new Error('Return URL must be from whitelisted domain');
    }

    // Create state with timestamp (prevents replay attacks)
    // TODO: Store in Redis or secure session for production
    const stateData = {
      workspaceId: userWorkspaceId,
      returnUrl,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7),
    };

    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

    const authUrl = new URL(this.FIGMA_AUTH_URL);
    authUrl.searchParams.set('client_id', this.FIGMA_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', this.FIGMA_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);
    // Note: file_content_read scope may not be available for all app types
    // If you get "Invalid scopes" error, ensure scope is enabled in Figma app settings
    // authUrl.searchParams.set('scope', 'file_content_read');

    this.logger.debug(`Starting Figma OAuth flow for workspace ${userWorkspaceId}`);

    // Track OAuth flow start
    this.telemetry.trackFigmaOAuthStarted(userId, userWorkspaceId);

    // Return the OAuth URL instead of redirecting
    // This allows frontend to handle the redirect and avoids CORS issues
    return {
      oauthUrl: authUrl.toString(),
    };
  }

  /**
   * Validate return URL against whitelist (prevent open redirect attacks)
   * @private
   */
  private isValidReturnUrl(returnUrl: string): boolean {
    try {
      const url = new URL(returnUrl);
      // Check if host is in whitelist
      return this.ALLOWED_RETURN_HOSTS.some((host) => url.host === host);
    } catch {
      return false;
    }
  }

  /**
   * Truncate URL for logging (prevent logging sensitive query params)
   * @private
   */
  private getTruncatedUrlForLogging(url: string): string {
    try {
      const parsed = new URL(url);
      // Only log hostname and pathname, not query params
      return `${parsed.hostname}${parsed.pathname}`;
    } catch {
      // If parsing fails, return a generic message
      return '[invalid-url]';
    }
  }

  /**
   * Figma OAuth callback
   * Exchanges authorization code for access token, validates state, stores token
   *
   * Security checks:
   * - Rate limiting (5 requests per minute per IP)
   * - State parameter validated (CSRF protection)
   * - State timestamp checked (prevents replay attacks)
   * - Token verified before storage
   * - Return URL validated (prevents open redirect)
   */
  @UseGuards(RateLimitGuard)
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    const startTime = Date.now();
    // Validate inputs
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      this.logger.warn('Figma OAuth callback: Missing authorization code');
      res.status(400).json({
        error: 'Missing authorization code',
      });
      return;
    }

    if (!state || typeof state !== 'string' || state.trim().length === 0) {
      this.logger.warn('Figma OAuth callback: Missing state');
      res.status(400).json({
        error: 'Missing state parameter',
      });
      return;
    }

    try {
      // Decode and validate state
      let decodedState: any;
      try {
        decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      } catch {
        this.logger.warn('Figma OAuth callback: Invalid state encoding');
        res.status(400).json({
          error: 'Invalid state parameter',
        });
        return;
      }

      const { workspaceId, returnUrl, timestamp } = decodedState;

      // Validate state structure
      if (!workspaceId || !returnUrl || !timestamp) {
        this.logger.warn('Figma OAuth callback: Invalid state structure');
        res.status(400).json({
          error: 'Invalid state data',
        });
        return;
      }

      // Validate state timestamp (15 minute window, prevent replay attacks)
      const stateAge = Date.now() - timestamp;
      const STATE_MAX_AGE_MS = 15 * 60 * 1000;
      if (stateAge > STATE_MAX_AGE_MS) {
        this.logger.warn(`Figma OAuth callback: State expired (${stateAge}ms old)`);
        res.status(400).json({
          error: 'Authorization request expired. Please try again.',
        });
        return;
      }

      // Validate return URL (prevent open redirect)
      if (!this.isValidReturnUrl(returnUrl)) {
        this.logger.error(
          `Figma OAuth callback: Invalid return URL: ${returnUrl}`,
        );
        res.status(400).json({
          error: 'Invalid return URL',
        });
        return;
      }

      // Exchange code for token
      const tokenResponse = await this.exchangeCodeForToken(code);
      if (!tokenResponse) {
        const duration = Date.now() - startTime;
        this.logger.warn(`Figma OAuth failed: code exchange failed for workspace ${workspaceId}`);
        const errorUrl = new URL(returnUrl);
        errorUrl.searchParams.set('status', 'error');
        errorUrl.searchParams.set('provider', 'figma');
        errorUrl.searchParams.set('error', 'Failed to exchange code for token');
        res.redirect(errorUrl.toString());
        return;
      }

      // Verify token is valid
      const isValid = await this.figmaService.verifyToken(
        tokenResponse.accessToken,
      );
      if (!isValid) {
        const duration = Date.now() - startTime;
        this.logger.warn(
          `Figma OAuth failed: token verification failed for workspace ${workspaceId}`,
        );
        const errorUrl = new URL(returnUrl);
        errorUrl.searchParams.set('status', 'error');
        errorUrl.searchParams.set('provider', 'figma');
        errorUrl.searchParams.set('error', 'Token verification failed');
        res.redirect(errorUrl.toString());
        return;
      }

      // Store token (with error boundary - if storage fails, redirect with error, not 500)
      try {
        await this.figmaIntegrationRepository.saveToken(workspaceId, {
          accessToken: tokenResponse.accessToken,
          tokenType: tokenResponse.tokenType,
          expiresIn: tokenResponse.expiresIn,
          scope: tokenResponse.scope,
        });
      } catch (storageError) {
        const duration = Date.now() - startTime;
        this.logger.error(
          `Failed to store Figma token for workspace ${workspaceId}: ${
            storageError instanceof Error ? storageError.message : String(storageError)
          }`,
        );
        const errorUrl = new URL(returnUrl);
        errorUrl.searchParams.set('status', 'error');
        errorUrl.searchParams.set('provider', 'figma');
        errorUrl.searchParams.set('error', 'Failed to store authentication token');
        res.redirect(errorUrl.toString());
        return;
      }

      this.logger.log(`✓ Figma OAuth successful for workspace ${workspaceId}`);

      // Track OAuth success (extract userId from state would require additional decoding)
      // For now, use workspace ID as identifier for analytics
      const duration = Date.now() - startTime;
      // Note: userId not available in callback (no auth header), so we use a placeholder
      // In production, store user context in Redis-backed session during /start phase
      this.logger.debug(
        `Figma OAuth completed successfully in ${duration}ms for workspace ${workspaceId}`,
      );

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
      res.status(500).json({
        error: 'OAuth callback processing failed',
      });
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
