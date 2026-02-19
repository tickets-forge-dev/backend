# SendGrid Email Setup & Spam Prevention

This document explains how to configure SendGrid for the email invitation system and ensure emails don't go to spam.

## Required Environment Variables

Add these variables to your `backend/.env` file:

```env
# SendGrid Configuration (Story 3.4)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
APP_URL=http://localhost:3001
JWT_INVITE_SECRET=your-secure-random-secret-here
```

### Variable Descriptions

- **SENDGRID_API_KEY**: Your SendGrid API key (starts with `SG.`)
- **SENDGRID_FROM_EMAIL**: The verified sender email address
- **APP_URL**: Base URL of your frontend application (used for invite links)
- **JWT_INVITE_SECRET**: Secret key for signing invite tokens (should be different from SESSION_SECRET)

---

## SendGrid Account Setup

### 1. Create SendGrid Account

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Choose the **Free Plan** (100 emails/day)
3. Verify your account via email

### 2. Create API Key

1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: `forge-invites-production`
4. Permissions: **Full Access** (or minimum: **Mail Send**)
5. Copy the API key (starts with `SG.`) - you won't see it again!
6. Add to `backend/.env` as `SENDGRID_API_KEY`

---

## Preventing Emails from Going to Spam

**Critical:** Without proper configuration, invitation emails WILL go to spam. Follow all steps below.

### Step 1: Domain Authentication (REQUIRED)

**Why:** Proves you own the domain and aren't a spammer. Without this, 90% of emails go to spam.

**Setup:**

1. Go to **Settings** → **Sender Authentication** → **Authenticate Your Domain**
2. Select your DNS provider (e.g., Cloudflare, GoDaddy, Namecheap)
3. SendGrid will generate DNS records:
   - **CNAME** records for DKIM (DomainKeys Identified Mail)
   - **SPF** record via TXT entry
   - **DMARC** record (recommended)

4. Add these DNS records to your domain:

```
# Example DNS records (yours will be different)
Type: CNAME
Host: s1._domainkey.yourdomain.com
Value: s1.domainkey.u12345678.wl123.sendgrid.net

Type: CNAME
Host: s2._domainkey.yourdomain.com
Value: s2.domainkey.u12345678.wl123.sendgrid.net

Type: TXT
Host: yourdomain.com
Value: v=spf1 include:sendgrid.net ~all

Type: TXT
Host: _dmarc.yourdomain.com
Value: v=DMARC1; p=none; pct=100; rua=mailto:dmarc@yourdomain.com
```

5. Wait 24-48 hours for DNS propagation
6. Verify in SendGrid dashboard (should show ✓ Verified)

**Important:** Use your own domain (e.g., `@forge.app`), NOT generic providers like Gmail/Outlook

---

### Step 2: Single Sender Verification (For Testing)

**Use case:** Quick testing without domain setup (emails still may go to spam)

1. Go to **Settings** → **Sender Authentication** → **Single Sender Verification**
2. Add email: `noreply@yourdomain.com` (or your personal email for testing)
3. Verify via email link
4. Add to `backend/.env` as `SENDGRID_FROM_EMAIL`

**Note:** This works for testing but is NOT recommended for production. Always use Domain Authentication.

---

### Step 3: Email Content Best Practices

The template already follows best practices, but here's what matters:

✅ **Clear subject line** (no "Click here!", "Urgent!", "Free!")
✅ **Plain text + HTML versions** (both provided)
✅ **Visible unsubscribe mechanism** (invitation emails exempt but good practice)
✅ **No URL shorteners** (we use full URLs)
✅ **Proper HTML structure** (provided in template)
✅ **No ALL CAPS or excessive exclamation marks**
✅ **Valid sender email** (matches domain)

---

### Step 4: Warm Up Your Domain (For High Volume)

**If sending 100+ emails per day:**

1. Start with 10-20 emails/day
2. Gradually increase by 20% daily
3. Monitor bounce/spam complaint rates in SendGrid dashboard
4. Full volume after 2-3 weeks

**For invitations (low volume):** Not necessary

---

### Step 5: Monitor Deliverability

SendGrid provides real-time analytics:

1. **Dashboard** → **Email Activity** → View delivery status
2. Key metrics:
   - **Delivered**: Email reached inbox
   - **Bounced**: Email rejected (hard bounce = invalid email)
   - **Spam Reports**: User marked as spam (investigate immediately)
   - **Opened**: User opened email (requires tracking)
   - **Clicked**: User clicked link

3. Set up alerts for spam complaints:
   - Go to **Settings** → **Mail Settings** → **Event Webhook**
   - Send events to your backend for monitoring

---

## Testing Email Delivery

### Local Testing (Development)

```bash
# 1. Set environment variables
export SENDGRID_API_KEY="SG.your-key-here"
export SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
export APP_URL="http://localhost:3001"
export JWT_INVITE_SECRET="dev-secret-123"

# 2. Start backend
cd backend
pnpm run start:dev

# 3. Test invite endpoint
curl -X POST http://localhost:3000/teams/{teamId}/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{"email": "your-test-email@gmail.com", "role": "developer"}'

# 4. Check your email inbox (including spam folder)
```

### Spam Testing Tools

1. **Mail-Tester** (https://www.mail-tester.com)
   - Send test email to provided address
   - Get spam score (aim for 8+/10)
   - See specific issues (missing SPF, DKIM, etc.)

2. **GlockApps** (https://glockapps.com)
   - Test inbox placement across providers
   - See if Gmail, Outlook, Yahoo deliver to inbox vs spam

3. **SendGrid Sandbox Mode** (for CI/CD testing)
   - Enable in Mail Settings
   - Simulates sending without actually delivering
   - Use for automated tests

---

## Troubleshooting

### Emails going to spam

**Check:**
- ✅ Domain authentication verified in SendGrid
- ✅ DNS records propagated (use `dig` or `nslookup`)
- ✅ FROM email matches authenticated domain
- ✅ No SPF/DKIM failures in email headers
- ✅ No spam trigger words in subject/body

**Test:** Send to mail-tester.com and fix reported issues

### Emails not sending

**Check:**
- ✅ `SENDGRID_API_KEY` set and valid
- ✅ Backend logs for errors
- ✅ SendGrid Activity dashboard for bounce reasons
- ✅ Recipient email valid
- ✅ Not exceeding free tier limit (100 emails/day)

### Bounced emails

**Hard bounce** (permanent): Invalid email, domain doesn't exist
- Remove from your database

**Soft bounce** (temporary): Mailbox full, server down
- Retry after 24 hours

---

## Production Checklist

Before launching:

- [ ] Domain authentication completed and verified
- [ ] SPF, DKIM, DMARC records added to DNS
- [ ] Test email deliverability to Gmail, Outlook, Yahoo
- [ ] Spam score 8+/10 on mail-tester.com
- [ ] Monitoring/alerting set up for bounces and spam complaints
- [ ] Rate limiting in place (respect SendGrid limits)
- [ ] Error handling tested (API key invalid, SendGrid down)
- [ ] Environment variables secured (not in git)

---

## Security Notes

- **Never commit** `SENDGRID_API_KEY` to git
- Use different API keys for dev/staging/production
- Rotate API keys every 90 days
- Use **scoped permissions** (Mail Send only) if possible
- Monitor API key usage in SendGrid dashboard
- Revoke compromised keys immediately

---

## Cost Management

**Free Tier:** 100 emails/day (3,000/month)

**If you exceed:**
- Essentials: $19.95/mo (50,000 emails/mo)
- Pro: $89.95/mo (100,000 emails/mo)

**Cost optimization:**
- Only send emails when necessary
- Batch invitations (daily digest for teams)
- Use notification preferences (opt-out mechanism)

---

## References

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Email Authentication Guide](https://sendgrid.com/docs/ui/account-and-settings/how-to-set-up-domain-authentication/)
- [Improving Deliverability](https://sendgrid.com/docs/ui/sending-email/deliverability/)
- [SPF/DKIM/DMARC Explained](https://www.cloudflare.com/learning/email-security/dmarc-dkim-spf/)

---

**Last Updated:** 2026-02-17 (Story 3.4 Implementation)
