/**
 * SendGridEmailService (Adapter)
 *
 * SendGrid implementation of EmailService.
 * Sends transactional emails using SendGrid API.
 *
 * Part of: Story 3.4 - Email Invitation System
 * Layer: Infrastructure (Adapter)
 */

import { Injectable, Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';
import { EmailService } from './EmailService';
import {
  generateInviteEmailHtml,
  generateInviteEmailText,
} from './templates/invite-email.template';

@Injectable()
export class SendGridEmailService extends EmailService {
  private readonly logger = new Logger(SendGridEmailService.name);
  private readonly fromEmail: string;
  private readonly appUrl: string;

  constructor() {
    super();

    // Validate required environment variables
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    const appUrl = process.env.APP_URL;

    if (!apiKey) {
      throw new Error(
        'SENDGRID_API_KEY is not configured. Please set it in your .env file.'
      );
    }

    if (!fromEmail) {
      throw new Error(
        'SENDGRID_FROM_EMAIL is not configured. Please set it in your .env file.'
      );
    }

    if (!appUrl) {
      throw new Error(
        'APP_URL is not configured. Please set it in your .env file.'
      );
    }

    // Validate APP_URL format
    try {
      const url = new URL(appUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('APP_URL must use http:// or https:// protocol');
      }
    } catch (error) {
      throw new Error(
        `APP_URL is not a valid URL: ${appUrl}. ` +
        'Example: http://localhost:3001 or https://forge.app'
      );
    }

    // Initialize SendGrid with API key
    sgMail.setApiKey(apiKey);

    this.fromEmail = fromEmail;
    this.appUrl = appUrl.replace(/\/$/, ''); // Remove trailing slash

    this.logger.log('SendGridEmailService initialized');
  }

  /**
   * Send an invitation email to a new team member
   *
   * @param to - Recipient email address
   * @param teamName - Name of the team they're being invited to
   * @param inviteToken - JWT token for accepting the invitation
   * @throws Error if email sending fails
   */
  async sendInviteEmail(
    to: string,
    teamName: string,
    inviteToken: string
  ): Promise<void> {
    // Validate inputs
    if (!to || !to.trim()) {
      throw new Error('Recipient email address is required');
    }
    if (!this.isValidEmail(to)) {
      throw new Error(`Invalid recipient email address: ${to}`);
    }
    if (!teamName || !teamName.trim()) {
      throw new Error('Team name is required');
    }
    if (!inviteToken || !inviteToken.trim()) {
      throw new Error('Invite token is required');
    }

    try {
      const inviteUrl = `${this.appUrl}/invite/${inviteToken}`;

      const html = generateInviteEmailHtml({ teamName, inviteUrl });
      const text = generateInviteEmailText({ teamName, inviteUrl });

      // Sanitize team name for subject to prevent injection
      const safeTeamName = this.sanitizeForSubject(teamName);

      const msg = {
        to: to.trim().toLowerCase(),
        from: this.fromEmail,
        subject: `You've been invited to join ${safeTeamName}`,
        text,
        html,
      };

      await sgMail.send(msg);

      this.logger.log(`Invite email sent successfully to ${to}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send invite email to ${to}`, error);
      throw new Error(`Failed to send invite email: ${errorMessage}`);
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    // RFC 5322 compliant email regex (simplified but strict)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitize text for email subject line (prevent header injection)
   */
  private sanitizeForSubject(text: string): string {
    // Remove newlines and control characters that could be used for header injection
    return text
      .replace(/[\r\n\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100); // Limit length
  }
}
