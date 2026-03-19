/**
 * Notification Email Templates
 *
 * HTML + text templates for notification emails.
 * All styles are inline for Gmail compatibility (Gmail strips <style> blocks).
 */

import { escapeHtml } from '../../shared/infrastructure/email/templates/invite-email.template';

export interface AssignmentEmailData {
  ticketTitle: string;
  ticketUrl: string;
}

export interface ApprovalEmailData {
  ticketTitle: string;
  ticketUrl: string;
}

export interface ReviewEmailData {
  ticketTitle: string;
  ticketUrl: string;
}

/**
 * Shared email shell — wraps content in a consistent layout with inline styles.
 */
function emailShell(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header bar -->
          <tr>
            <td style="background-color:#18181B;padding:24px 32px;">
              <span style="font-size:18px;font-weight:600;color:#ffffff;letter-spacing:-0.3px;">Forge</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 40px 32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:0 32px 28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="border-top:1px solid #e5e5e5;padding-top:20px;font-size:13px;color:#9ca3af;line-height:1.5;">
                  This is an automated notification from Forge.
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Bulletproof email button — uses table layout for maximum client compatibility.
 */
function emailButton(url: string, label: string, bgColor = '#5E6AD2'): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto;">
  <tr>
    <td align="center" style="background-color:${bgColor};border-radius:8px;">
      <a href="${escapeHtml(url)}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background-color:${bgColor};">${label}</a>
    </td>
  </tr>
</table>
<p style="font-size:13px;color:#9ca3af;margin:12px 0 0 0;text-align:center;">
  Or copy this link: <a href="${escapeHtml(url)}" style="color:#5E6AD2;word-break:break-all;">${escapeHtml(url)}</a>
</p>`;
}

// ─── Assignment ─────────────────────────────────────────

export function generateAssignmentEmailHtml(data: AssignmentEmailData): string {
  return emailShell('Ticket Assigned', `
    <h1 style="font-size:22px;font-weight:600;color:#111;margin:0 0 16px 0;letter-spacing:-0.3px;">You've been assigned a ticket</h1>
    <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 8px 0;">
      You've been assigned to <strong style="color:#111;">${escapeHtml(data.ticketTitle)}</strong>.
    </p>
    <p style="font-size:15px;color:#555;line-height:1.6;margin:0;">
      Click below to view the ticket details and get started.
    </p>
    ${emailButton(data.ticketUrl, 'View Ticket')}
  `);
}

export function generateAssignmentEmailText(data: AssignmentEmailData): string {
  return `
You've been assigned a ticket

You've been assigned to: ${data.ticketTitle}

View the ticket:
${data.ticketUrl}

This is an automated notification from Forge.
  `.trim();
}

// ─── Approval / Ready ───────────────────────────────────

export function generateApprovalEmailHtml(data: ApprovalEmailData): string {
  return emailShell('Ticket Ready', `
    <h1 style="font-size:22px;font-weight:600;color:#111;margin:0 0 16px 0;letter-spacing:-0.3px;">Ticket ready to execute</h1>
    <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 8px 0;">
      <strong style="color:#111;">${escapeHtml(data.ticketTitle)}</strong> has been approved and is ready for execution.
    </p>
    <p style="font-size:15px;color:#555;line-height:1.6;margin:0;">
      You can start implementation by running
      <code style="background:#f4f4f5;padding:2px 6px;border-radius:4px;font-size:13px;color:#18181B;">forge execute</code>
      in your terminal.
    </p>
    ${emailButton(data.ticketUrl, 'View Ticket', '#16a34a')}
  `);
}

export function generateApprovalEmailText(data: ApprovalEmailData): string {
  return `
Ticket ready to execute

${data.ticketTitle} has been approved and is ready for execution.

You can start implementation by running: forge execute

View the ticket:
${data.ticketUrl}

This is an automated notification from Forge.
  `.trim();
}

// ─── Review ─────────────────────────────────────────────

export function generateReviewEmailHtml(data: ReviewEmailData): string {
  return emailShell('Ticket Ready for Review', `
    <h1 style="font-size:22px;font-weight:600;color:#111;margin:0 0 16px 0;letter-spacing:-0.3px;">Ticket ready for review</h1>
    <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 8px 0;">
      The spec for <strong style="color:#111;">${escapeHtml(data.ticketTitle)}</strong> has been finalized and is ready for your review.
    </p>
    <p style="font-size:15px;color:#555;line-height:1.6;margin:0;">
      Review the ticket details and approve it when you're satisfied.
    </p>
    ${emailButton(data.ticketUrl, 'Review Ticket', '#d97706')}
  `);
}

export function generateReviewEmailText(data: ReviewEmailData): string {
  return `
Ticket ready for review

The spec for ${data.ticketTitle} has been finalized and is ready for your review.

Review and approve the ticket:
${data.ticketUrl}

This is an automated notification from Forge.
  `.trim();
}
