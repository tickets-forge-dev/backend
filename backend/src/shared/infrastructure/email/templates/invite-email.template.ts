/**
 * Invite Email Template
 *
 * Linear-inspired minimal email template for team invitations.
 * Includes team name, invite button, link fallback, and expiry notice.
 *
 * Part of: Story 3.4 - Email Invitation System
 * Layer: Infrastructure (Email Templates)
 */

export interface InviteEmailData {
  teamName: string;
  inviteUrl: string;
}

/**
 * Generate HTML email content for team invitation
 */
export function generateInviteEmailHtml(data: InviteEmailData): string {
  const { teamName, inviteUrl } = data;

  // Validate required fields
  if (!teamName || !teamName.trim()) {
    throw new Error('teamName is required for email template');
  }
  if (!inviteUrl || !inviteUrl.trim()) {
    throw new Error('inviteUrl is required for email template');
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
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
    .button:hover {
      background: #4E5AC2;
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
    .footer p {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">You've been invited to join ${escapeHtml(teamName)}</div>

    <div class="message">
      <p>You've been invited to collaborate on <strong>${escapeHtml(teamName)}</strong>.</p>
      <p>Click the button below to accept the invitation and get started.</p>
    </div>

    <div class="button-container">
      <a href="${escapeHtml(inviteUrl)}" class="button">Accept Invitation</a>
    </div>

    <div class="link-fallback">
      <p>Or copy and paste this link into your browser:</p>
      <p><a href="${escapeHtml(inviteUrl)}">${escapeHtml(inviteUrl)}</a></p>
    </div>

    <div class="footer">
      <p><strong>Note:</strong> This invitation will expire in 7 days.</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of invite email (fallback for email clients without HTML support)
 */
export function generateInviteEmailText(data: InviteEmailData): string {
  const { teamName, inviteUrl } = data;

  // Validate required fields
  if (!teamName || !teamName.trim()) {
    throw new Error('teamName is required for email template');
  }
  if (!inviteUrl || !inviteUrl.trim()) {
    throw new Error('inviteUrl is required for email template');
  }

  return `
You've been invited to join ${teamName}

You've been invited to collaborate on ${teamName}.

Accept your invitation by visiting:
${inviteUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.
  `.trim();
}

/**
 * Escape HTML special characters to prevent XSS
 * Handles null/undefined by converting to empty string
 */
function escapeHtml(text: string | null | undefined): string {
  if (text === null || text === undefined) {
    return '';
  }

  const str = String(text); // Convert to string in case it's not
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => map[char]);
}
