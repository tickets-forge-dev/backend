# SendGrid Domain Authentication Setup Guide

## Prerequisites
- A domain you own (e.g., yourdomain.com, forge.app, etc.)
- Access to your domain's DNS settings (Cloudflare, GoDaddy, Namecheap, etc.)

## Part 1: Create Domain Authentication in SendGrid

### Step 1: Access Domain Authentication
1. Go to SendGrid Dashboard: https://app.sendgrid.com
2. Navigate to **Settings** > **Sender Authentication**
3. Click **Authenticate Your Domain** (blue button)

### Step 2: Configure Domain Settings
4. **Select DNS Host**: Choose your DNS provider
   - Cloudflare
   - GoDaddy
   - Namecheap
   - Route53 (AWS)
   - Other

5. **Enter Your Domain**:
   - If you own `yourdomain.com`, enter `yourdomain.com`
   - Or use subdomain: `mail.yourdomain.com` (recommended)

6. **Advanced Settings** (click to expand):
   - ✅ Check "Use automated security"
   - ✅ Check "Use same domain for sending"
   - Brand link: Leave default or customize

7. Click **Next**

### Step 3: Get DNS Records
SendGrid will generate 3 DNS records:

**Example records (yours will be different):**

```
CNAME: s1._domainkey.yourdomain.com
Value: s1.domainkey.u12345678.wl123.sendgrid.net

CNAME: s2._domainkey.yourdomain.com
Value: s2.domainkey.u12345678.wl123.sendgrid.net

CNAME: em123.yourdomain.com
Value: u12345678.wl123.sendgrid.net
```

**Keep this page open** - you'll need these values for Part 2.

---

## Part 2: Add DNS Records to Your Domain

Choose your DNS provider:

### Option A: Cloudflare

1. Log into Cloudflare: https://dash.cloudflare.com
2. Select your domain
3. Go to **DNS** > **Records**
4. Click **Add record** (3 times, one for each record)

For each SendGrid CNAME record:
- **Type**: CNAME
- **Name**: Copy from SendGrid (e.g., `s1._domainkey`)
- **Target**: Copy from SendGrid (e.g., `s1.domainkey.u12345678...`)
- **Proxy status**: DNS only (⚠️ Important: Turn OFF the orange cloud)
- **TTL**: Auto
- Click **Save**

### Option B: GoDaddy

1. Log into GoDaddy: https://dcc.godaddy.com
2. Go to **My Products** > **DNS**
3. Click **Add** button (3 times)

For each SendGrid CNAME record:
- **Type**: CNAME
- **Host**: Copy from SendGrid (e.g., `s1._domainkey`)
- **Points to**: Copy from SendGrid
- **TTL**: 1 Hour
- Click **Save**

### Option C: Namecheap

1. Log into Namecheap: https://ap.www.namecheap.com
2. Go to **Domain List** > **Manage** > **Advanced DNS**
3. Click **Add New Record** (3 times)

For each SendGrid CNAME record:
- **Type**: CNAME Record
- **Host**: Copy from SendGrid (e.g., `s1._domainkey`)
- **Value**: Copy from SendGrid
- **TTL**: Automatic
- Click **Save All Changes**

### Option D: AWS Route53

1. Log into AWS Console: https://console.aws.amazon.com/route53
2. Go to **Hosted Zones** > Select your domain
3. Click **Create Record** (3 times)

For each SendGrid CNAME record:
- **Record name**: Copy from SendGrid (e.g., `s1._domainkey`)
- **Record type**: CNAME
- **Value**: Copy from SendGrid
- **TTL**: 300
- Click **Create records**

---

## Part 3: Verify in SendGrid

1. **Wait 5-10 minutes** for DNS propagation
2. Go back to SendGrid > **Sender Authentication**
3. Find your domain, click **Verify**
4. If successful: ✅ Green checkmark appears
5. If failed: Wait longer (DNS can take up to 48 hours, usually 10-30 mins)

**DNS Propagation Check:**
```bash
# Check if DNS records are live
dig s1._domainkey.yourdomain.com CNAME
dig s2._domainkey.yourdomain.com CNAME
```

---

## Part 4: Update Your Code

After verification succeeds, update your `.env`:

```env
# OLD (Gmail - goes to spam)
SENDGRID_FROM_EMAIL=ticketsforge@gmail.com

# NEW (Your authenticated domain - inbox delivery)
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
# or
SENDGRID_FROM_EMAIL=invites@yourdomain.com
```

Restart your backend:
```bash
cd backend
pnpm run start:dev
```

---

## Part 5: Test Email Delivery

Send another test invite:
```bash
curl -X POST http://localhost:3000/api/teams/{TEAM_ID}/members \
  -H "Content-Type: application/json" \
  -d '{"email": "bar.idan@gmail.com", "role": "developer"}'
```

**Expected result:** Email goes to **Inbox** instead of Spam ✅

---

## Troubleshooting

### DNS not verifying?
- **Wait longer** (10-30 minutes typical, max 48 hours)
- Check DNS records are exact match (copy-paste from SendGrid)
- Cloudflare users: Ensure "Proxy status" is **DNS only** (gray cloud, not orange)
- Check for typos in CNAME values

### Still going to spam after verification?
- Warm up your domain (start with low volume: 10-50 emails/day for 1-2 weeks)
- Check spam score: https://www.mail-tester.com
- Ensure email content isn't spammy (avoid ALL CAPS, excessive links)

### Which domain should I use?
- **Production**: Use your company domain (e.g., `invites@forge.app`)
- **Development**: Use subdomain (e.g., `dev.yourdomain.com`) or keep Gmail

---

## Benefits After Domain Authentication

✅ **Inbox delivery** instead of spam
✅ **Domain reputation** builds over time
✅ **Professional appearance** (noreply@yourcompany.com)
✅ **DKIM signatures** prove email authenticity
✅ **SPF records** prevent spoofing
✅ **Higher deliverability rates** (90%+ vs 50-70%)

---

## Quick Start Commands

```bash
# After DNS setup, test a single domain record
dig s1._domainkey.yourdomain.com CNAME

# Check all records at once
dig s1._domainkey.yourdomain.com CNAME && \
dig s2._domainkey.yourdomain.com CNAME && \
dig em123.yourdomain.com CNAME
```
