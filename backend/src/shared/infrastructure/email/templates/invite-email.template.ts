/**
 * Invite Email Template
 *
 * Linear-inspired minimal email template for team invitations.
 * All styles are inline for Gmail compatibility (Gmail strips <style> blocks).
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
              <h1 style="font-size:22px;font-weight:600;color:#111;margin:0 0 16px 0;letter-spacing:-0.3px;">You've been invited to join ${escapeHtml(teamName)}</h1>
              <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 8px 0;">
                You've been invited to collaborate on <strong style="color:#111;">${escapeHtml(teamName)}</strong>.
              </p>
              <p style="font-size:15px;color:#555;line-height:1.6;margin:0;">
                Click the button below to accept the invitation and get started.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto;">
                <tr>
                  <td align="center" style="background-color:#5E6AD2;border-radius:8px;">
                    <a href="${escapeHtml(inviteUrl)}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background-color:#5E6AD2;">Accept Invitation</a>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;color:#9ca3af;margin:12px 0 0 0;text-align:center;">
                Or copy this link: <a href="${escapeHtml(inviteUrl)}" style="color:#5E6AD2;word-break:break-all;">${escapeHtml(inviteUrl)}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:0 32px 28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="border-top:1px solid #e5e5e5;padding-top:20px;font-size:13px;color:#9ca3af;line-height:1.5;">
                  <p style="margin:0 0 4px 0;"><strong style="color:#6b7280;">Note:</strong> This invitation will expire in 7 days.</p>
                  <p style="margin:0;">If you didn't expect this invitation, you can safely ignore this email.</p>
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
 * Generate plain text version of invite email (fallback for email clients without HTML support)
 */
export function generateInviteEmailText(data: InviteEmailData): string {
  const { teamName, inviteUrl } = data;

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
export function escapeHtml(text: string | null | undefined): string {
  if (text === null || text === undefined) {
    return '';
  }

  const str = String(text);
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => map[char]);
}
