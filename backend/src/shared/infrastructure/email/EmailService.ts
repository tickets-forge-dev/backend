/**
 * EmailService (Port - Interface)
 *
 * Abstract email service for sending transactional emails.
 * Allows swapping email providers (SendGrid, AWS SES, etc.) without changing business logic.
 *
 * Part of: Story 3.4 - Email Invitation System
 * Layer: Infrastructure (Port/Interface)
 */

export abstract class EmailService {
  /**
   * Send an invitation email to a new team member
   *
   * @param to - Recipient email address
   * @param teamName - Name of the team they're being invited to
   * @param inviteToken - JWT token for accepting the invitation
   * @throws Error if email sending fails
   */
  abstract sendInviteEmail(
    to: string,
    teamName: string,
    inviteToken: string
  ): Promise<void>;
}
