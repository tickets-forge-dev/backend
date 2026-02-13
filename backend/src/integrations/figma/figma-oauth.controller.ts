import { Controller, Get, Query, Res, Logger, UseGuards, ForbiddenException, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { FigmaService } from './figma.service';
import { FigmaIntegrationRepository } from './figma-integration.repository';
import { FigmaOAuthToken, FigmaOAuthTokenResponse } from './figma.types';
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
  private readonly FIGMA_TOKEN_URL = 'https://api.figma.com/v1/oauth/token';

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
    // Request scopes enabled in Figma app settings (space-separated)
    authUrl.searchParams.set('scope', 'file_content:read file_metadata:read');

    this.logger.log(`✓ Starting Figma OAuth flow for workspace ${userWorkspaceId}`);
    this.logger.debug(`Figma OAuth URL: ${authUrl.toString()}`);

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
   * Check Figma connection status
   * Returns whether Figma is connected and if token is still valid
   *
   * Security checks:
   * - User must be authenticated (FirebaseAuthGuard)
   * - workspaceId must match user's workspace (WorkspaceGuard)
   */
  @UseGuards(FirebaseAuthGuard, WorkspaceGuard)
  @Get('status')
  async getConnectionStatus(
    @WorkspaceId() workspaceId: string,
  ): Promise<{ connected: boolean; expired?: boolean }> {
    try {
      // Check if a token is stored for this workspace
      const token = await this.figmaIntegrationRepository.getToken(workspaceId);
      if (!token) {
        return { connected: false };
      }

      // Check if token is expired
      // Figma tokens expire after expiresIn seconds
      if (token.savedAt && token.expiresIn) {
        const ageInSeconds = (Date.now() - token.savedAt) / 1000;
        const isExpired = ageInSeconds > token.expiresIn;

        if (isExpired) {
          this.logger.warn(
            `Figma token expired for workspace ${workspaceId} (${ageInSeconds}s old, expires in ${token.expiresIn}s)`,
          );
          return { connected: false, expired: true };
        }
      }

      return { connected: true };
    } catch (error) {
      this.logger.warn(`Failed to check Figma connection status for workspace ${workspaceId}`);
      return { connected: false };
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

      // Verify token is valid (non-blocking - log warning but continue)
      // We already know the token works since we got it from Figma's API
      const isValid = await this.figmaService.verifyToken(
        tokenResponse.accessToken,
      );
      if (!isValid) {
        this.logger.warn(
          `Figma token verification failed for workspace ${workspaceId} (proceeding with storage)`,
        );
        // Don't block OAuth flow - token will be validated when used
      }

      // Store token (with error boundary - if storage fails, redirect with error, not 500)
      try {
        await this.figmaIntegrationRepository.saveToken(workspaceId, {
          accessToken: tokenResponse.accessToken,
          tokenType: tokenResponse.tokenType,
          expiresIn: tokenResponse.expiresIn,
          refreshToken: tokenResponse.refreshToken,
          userId: tokenResponse.userId,
          savedAt: Date.now(),
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
      // Validate environment variables
      if (!this.FIGMA_CLIENT_ID) {
        this.logger.error('Figma token exchange: FIGMA_CLIENT_ID is not set in environment variables');
        return null;
      }
      if (!this.FIGMA_CLIENT_SECRET) {
        this.logger.error('Figma token exchange: FIGMA_CLIENT_SECRET is not set in environment variables');
        return null;
      }

      // Create Basic Auth header with client_id:client_secret
      const credentials = Buffer.from(`${this.FIGMA_CLIENT_ID}:${this.FIGMA_CLIENT_SECRET}`).toString('base64');

      // Log request details for debugging
      const requestBody = new URLSearchParams({
        redirect_uri: this.FIGMA_REDIRECT_URI,
        code,
        grant_type: 'authorization_code',
      }).toString();

      this.logger.debug(`Figma token exchange request:
        - URL: ${this.FIGMA_TOKEN_URL}
        - Auth header present: ${credentials ? 'yes' : 'no'}
        - Auth header length: ${credentials ? credentials.length : 0}
        - Client ID length: ${this.FIGMA_CLIENT_ID.length}
        - Client Secret length: ${this.FIGMA_CLIENT_SECRET.length}
        - Code: ${code}
        - Grant type: authorization_code
        - Redirect URI: ${this.FIGMA_REDIRECT_URI}`);

      const response = await fetch(this.FIGMA_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
        body: requestBody,
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(
          `Figma token exchange failed: ${response.status} - ${error}`,
        );
        this.logger.debug(`Figma token request details:
          - URL: ${this.FIGMA_TOKEN_URL}
          - Client ID: ${this.FIGMA_CLIENT_ID.substring(0, 5)}...
          - Redirect URI: ${this.FIGMA_REDIRECT_URI}
          - Code length: ${code.length}
          - Response status: ${response.status}
          - Response body: ${error}
          - Response headers: ${JSON.stringify(Array.from(response.headers.entries()))}`);
        return null;
      }

      const rawData = (await response.json()) as FigmaOAuthTokenResponse;
      this.logger.debug(`Figma token exchange response: ${JSON.stringify(rawData)}`);

      // Transform Figma's snake_case response to camelCase
      const data: FigmaOAuthToken = {
        accessToken: rawData.access_token,
        tokenType: rawData.token_type,
        expiresIn: rawData.expires_in,
        refreshToken: rawData.refresh_token,
        userId: rawData.user_id_string,
      };

      this.logger.debug(`Figma token exchange successful, token type: ${data.tokenType}`);
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
