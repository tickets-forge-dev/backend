import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../shared/infrastructure/email/EmailService';
import { FirestoreUserRepository } from '../users/infrastructure/persistence/FirestoreUserRepository';
import {
  generateAssignmentEmailHtml,
  generateAssignmentEmailText,
  generateApprovalEmailHtml,
  generateApprovalEmailText,
  generateReviewEmailHtml,
  generateReviewEmailText,
  generateImplementationStartedEmailHtml,
  generateImplementationStartedEmailText,
} from './templates/notification-email.template';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly appUrl: string;

  constructor(
    private readonly emailService: EmailService,
    private readonly userRepository: FirestoreUserRepository,
  ) {
    this.appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
  }

  async notifyTicketAssigned(
    ticketId: string,
    assignedUserId: string,
    ticketTitle: string,
  ): Promise<void> {
    try {
      const user = await this.userRepository.getById(assignedUserId);
      if (!user) {
        this.logger.warn(`Cannot send assignment notification: user ${assignedUserId} not found`);
        return;
      }

      const email = user.getEmail();
      if (!email) {
        this.logger.warn(`Cannot send assignment notification: user ${assignedUserId} has no email`);
        return;
      }

      const ticketUrl = `${this.appUrl}/tickets/${ticketId}`;
      const subject = `[Forge] You've been assigned: ${ticketTitle}`;
      const textBody = generateAssignmentEmailText({ ticketTitle, ticketUrl });
      const htmlBody = generateAssignmentEmailHtml({ ticketTitle, ticketUrl });

      await this.emailService.sendEmail(email, subject, textBody, htmlBody);
      this.logger.log(`Assignment notification sent to ${email} for ticket ${ticketId}`);
    } catch (error) {
      this.logger.warn(`Failed to send assignment notification for ticket ${ticketId}`, error);
    }
  }

  async notifyTicketReady(
    ticketId: string,
    assignedUserId: string,
    ticketTitle: string,
  ): Promise<void> {
    try {
      const user = await this.userRepository.getById(assignedUserId);
      if (!user) {
        this.logger.warn(`Cannot send approval notification: user ${assignedUserId} not found`);
        return;
      }

      const email = user.getEmail();
      if (!email) {
        this.logger.warn(`Cannot send approval notification: user ${assignedUserId} has no email`);
        return;
      }

      const ticketUrl = `${this.appUrl}/tickets/${ticketId}`;
      const subject = `[Forge] Ticket ready to execute: ${ticketTitle}`;
      const textBody = generateApprovalEmailText({ ticketTitle, ticketUrl });
      const htmlBody = generateApprovalEmailHtml({ ticketTitle, ticketUrl });

      await this.emailService.sendEmail(email, subject, textBody, htmlBody);
      this.logger.log(`Approval notification sent to ${email} for ticket ${ticketId}`);
    } catch (error) {
      this.logger.warn(`Failed to send approval notification for ticket ${ticketId}`, error);
    }
  }

  async notifyTicketReadyForReview(
    ticketId: string,
    assignedUserId: string,
    ticketTitle: string,
  ): Promise<void> {
    try {
      const user = await this.userRepository.getById(assignedUserId);
      if (!user) {
        this.logger.warn(`Cannot send review notification: user ${assignedUserId} not found`);
        return;
      }

      const email = user.getEmail();
      if (!email) {
        this.logger.warn(`Cannot send review notification: user ${assignedUserId} has no email`);
        return;
      }

      const ticketUrl = `${this.appUrl}/tickets/${ticketId}`;
      const subject = `[Forge] Ticket ready for review: ${ticketTitle}`;
      const textBody = generateReviewEmailText({ ticketTitle, ticketUrl });
      const htmlBody = generateReviewEmailHtml({ ticketTitle, ticketUrl });

      await this.emailService.sendEmail(email, subject, textBody, htmlBody);
      this.logger.log(`Review notification sent to ${email} for ticket ${ticketId}`);
    } catch (error) {
      this.logger.warn(`Failed to send review notification for ticket ${ticketId}`, error);
    }
  }

  async notifyImplementationStarted(
    ticketId: string,
    creatorUserId: string,
    ticketTitle: string,
  ): Promise<void> {
    try {
      const user = await this.userRepository.getById(creatorUserId);
      if (!user) {
        this.logger.warn(`Cannot send implementation-started notification: user ${creatorUserId} not found`);
        return;
      }

      const email = user.getEmail();
      if (!email) {
        this.logger.warn(`Cannot send implementation-started notification: user ${creatorUserId} has no email`);
        return;
      }

      const ticketUrl = `${this.appUrl}/tickets/${ticketId}`;
      const subject = `[Forge] Development started: ${ticketTitle}`;
      const textBody = generateImplementationStartedEmailText({ ticketTitle, ticketUrl });
      const htmlBody = generateImplementationStartedEmailHtml({ ticketTitle, ticketUrl });

      await this.emailService.sendEmail(email, subject, textBody, htmlBody);
      this.logger.log(`Implementation-started notification sent to ${email} for ticket ${ticketId}`);
    } catch (error) {
      this.logger.warn(`Failed to send implementation-started notification for ticket ${ticketId}`, error);
    }
  }
}
