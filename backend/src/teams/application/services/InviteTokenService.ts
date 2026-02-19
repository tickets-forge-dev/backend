/**
 * InviteTokenService
 *
 * Generates and verifies JWT tokens for team member invitations.
 * Tokens expire after 7 days and contain member/team identification.
 *
 * Part of: Story 3.4 - Email Invitation System
 * Layer: Application (Service)
 */

import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';

export interface InviteTokenPayload {
  memberId: string;
  teamId: string;
  email: string;
  iat: number; // Issued at (timestamp)
  exp: number; // Expiration (timestamp)
}

export interface GenerateTokenInput {
  memberId: string;
  teamId: string;
  email: string;
}

@Injectable()
export class InviteTokenService {
  private readonly logger = new Logger(InviteTokenService.name);
  private readonly secret: string;
  private readonly expiresIn = '7d' as const; // 7 days

  constructor() {
    const secret = process.env.JWT_INVITE_SECRET;

    if (!secret) {
      throw new Error(
        'JWT_INVITE_SECRET is not configured. Please set it in your .env file.'
      );
    }

    // Validate secret strength (minimum 32 characters for HS256)
    if (secret.length < 32) {
      throw new Error(
        'JWT_INVITE_SECRET must be at least 32 characters long for security. ' +
        'Generate a secure secret with: openssl rand -hex 32'
      );
    }

    this.secret = secret;
    this.logger.log('InviteTokenService initialized');
  }

  /**
   * Generate a JWT token for a team invitation
   *
   * @param input - Member ID, team ID, and email
   * @returns Signed JWT token (valid for 7 days)
   */
  generateInviteToken(input: GenerateTokenInput): string {
    const { memberId, teamId, email } = input;

    // Validate inputs
    if (!memberId || !memberId.trim()) {
      throw new Error('memberId is required');
    }
    if (!teamId || !teamId.trim()) {
      throw new Error('teamId is required');
    }
    if (!email || !email.trim()) {
      throw new Error('email is required');
    }
    if (!this.isValidEmail(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }

    const payload = {
      memberId: memberId.trim(),
      teamId: teamId.trim(),
      email: email.trim().toLowerCase(),
    };

    const options: SignOptions = {
      expiresIn: this.expiresIn,
      algorithm: 'HS256', // Explicit algorithm to prevent algorithm confusion attacks
    };

    const token = jwt.sign(payload, this.secret, options);

    this.logger.log(`Generated invite token for member ${memberId}`);

    return token;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  /**
   * Verify and decode an invite token
   *
   * @param token - JWT token to verify
   * @returns Decoded token payload
   * @throws Error if token is invalid or expired
   */
  verifyInviteToken(token: string): InviteTokenPayload {
    // Validate input
    if (!token || !token.trim()) {
      throw new Error('Invite token is required');
    }

    // Sanitize token (remove whitespace)
    const sanitizedToken = token.trim();

    try {
      const decoded = jwt.verify(sanitizedToken, this.secret, {
        algorithms: ['HS256'], // Only allow HS256 to prevent algorithm confusion
      }) as InviteTokenPayload;

      // Validate decoded payload structure
      if (!decoded.memberId || !decoded.teamId || !decoded.email) {
        throw new Error('Invalid token payload structure');
      }

      this.logger.log(`Verified invite token for member ${decoded.memberId}`);

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        this.logger.warn(`Invite token expired: ${error.message}`);
        throw new Error('Invite token has expired. Please request a new invitation.');
      }

      if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn(`Invalid invite token: ${error.message}`);
        throw new Error('Invalid invite token.');
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to verify invite token: ${errorMessage}`, error);
      throw new Error('Failed to verify invite token.');
    }
  }
}
