/**
 * ConsoleEmailService (Adapter)
 *
 * No-op implementation of EmailService for local development.
 * Logs emails to console instead of sending them.
 *
 * Layer: Infrastructure (Adapter)
 */

import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './EmailService';

@Injectable()
export class ConsoleEmailService extends EmailService {
  private readonly logger = new Logger(ConsoleEmailService.name);

  constructor() {
    super();
    this.logger.warn(
      'Using ConsoleEmailService — emails will be logged, not sent. Set SENDGRID_API_KEY to enable real emails.',
    );
  }

  async sendInviteEmail(
    to: string,
    teamName: string,
    inviteToken: string,
  ): Promise<void> {
    this.logger.log(
      `[DEV] Invite email:\n  To: ${to}\n  Team: ${teamName}\n  Token: ${inviteToken}`,
    );
  }

  async sendEmail(
    to: string,
    subject: string,
    textBody: string,
    _htmlBody?: string,
  ): Promise<void> {
    this.logger.log(
      `[DEV] Email:\n  To: ${to}\n  Subject: ${subject}\n  Body: ${textBody}`,
    );
  }
}
