/**
 * Notification Email Templates
 *
 * HTML + text templates for notification emails.
 * Follows the Linear-inspired design from invite-email.template.ts.
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

export function generateAssignmentEmailHtml(data: AssignmentEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Assigned</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 500px;
      margin: 40px auto;
      padding: 40px 20px;
      background: #ffffff;
      border-radius: 8px;
    }
    .header {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #111;
    }
    .message {
      font-size: 16px;
      margin-bottom: 30px;
      color: #555;
    }
    .button-container {
      margin: 30px 0;
      text-align: center;
    }
    .button {
      display: inline-block;
      background: #5E6AD2;
      color: #ffffff;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      font-size: 16px;
    }
    .link-fallback {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 14px;
      color: #666;
    }
    .link-fallback a {
      color: #5E6AD2;
      word-break: break-all;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 14px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">You've been assigned a ticket</div>

    <div class="message">
      <p>You've been assigned to <strong>${escapeHtml(data.ticketTitle)}</strong>.</p>
      <p>Click below to view the ticket details and get started.</p>
    </div>

    <div class="button-container">
      <a href="${escapeHtml(data.ticketUrl)}" class="button">View Ticket</a>
    </div>

    <div class="link-fallback">
      <p>Or copy and paste this link into your browser:</p>
      <p><a href="${escapeHtml(data.ticketUrl)}">${escapeHtml(data.ticketUrl)}</a></p>
    </div>

    <div class="footer">
      <p>This is an automated notification from Forge.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
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

export function generateApprovalEmailHtml(data: ApprovalEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Ready</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 500px;
      margin: 40px auto;
      padding: 40px 20px;
      background: #ffffff;
      border-radius: 8px;
    }
    .header {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #111;
    }
    .message {
      font-size: 16px;
      margin-bottom: 30px;
      color: #555;
    }
    .message code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 14px;
    }
    .button-container {
      margin: 30px 0;
      text-align: center;
    }
    .button {
      display: inline-block;
      background: #5E6AD2;
      color: #ffffff;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      font-size: 16px;
    }
    .link-fallback {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 14px;
      color: #666;
    }
    .link-fallback a {
      color: #5E6AD2;
      word-break: break-all;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 14px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">Ticket ready to execute</div>

    <div class="message">
      <p><strong>${escapeHtml(data.ticketTitle)}</strong> has been approved and is ready for execution.</p>
      <p>You can start implementation by running <code>forge execute</code> in your terminal, or view the ticket details below.</p>
    </div>

    <div class="button-container">
      <a href="${escapeHtml(data.ticketUrl)}" class="button">View Ticket</a>
    </div>

    <div class="link-fallback">
      <p>Or copy and paste this link into your browser:</p>
      <p><a href="${escapeHtml(data.ticketUrl)}">${escapeHtml(data.ticketUrl)}</a></p>
    </div>

    <div class="footer">
      <p>This is an automated notification from Forge.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
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

export interface ReviewEmailData {
  ticketTitle: string;
  ticketUrl: string;
}

export function generateReviewEmailHtml(data: ReviewEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Ready for Review</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 500px;
      margin: 40px auto;
      padding: 40px 20px;
      background: #ffffff;
      border-radius: 8px;
    }
    .header {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #111;
    }
    .message {
      font-size: 16px;
      margin-bottom: 30px;
      color: #555;
    }
    .button-container {
      margin: 30px 0;
      text-align: center;
    }
    .button {
      display: inline-block;
      background: #5E6AD2;
      color: #ffffff;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      font-size: 16px;
    }
    .link-fallback {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 14px;
      color: #666;
    }
    .link-fallback a {
      color: #5E6AD2;
      word-break: break-all;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 14px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">Ticket ready for review</div>

    <div class="message">
      <p>The spec for <strong>${escapeHtml(data.ticketTitle)}</strong> has been finalized and is ready for your review.</p>
      <p>Review the ticket details and approve it when you're satisfied.</p>
    </div>

    <div class="button-container">
      <a href="${escapeHtml(data.ticketUrl)}" class="button">Review Ticket</a>
    </div>

    <div class="link-fallback">
      <p>Or copy and paste this link into your browser:</p>
      <p><a href="${escapeHtml(data.ticketUrl)}">${escapeHtml(data.ticketUrl)}</a></p>
    </div>

    <div class="footer">
      <p>This is an automated notification from Forge.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
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
