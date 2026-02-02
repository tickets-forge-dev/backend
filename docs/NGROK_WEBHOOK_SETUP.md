# GitHub Webhook Setup with ngrok - How-To Guide

**Purpose:** Expose your local backend to GitHub for webhook events during development  
**Story:** 4.1 - GitHub App Integration  
**Date:** 2026-02-02

---

## Why ngrok?

GitHub webhooks need a publicly accessible URL to send events to. During local development, your backend (`http://localhost:3001`) is not accessible from the internet. ngrok creates a secure tunnel to make your local server publicly accessible.

---

## Step-by-Step Setup

### Step 1: Install ngrok ⏱️ 5 minutes

**Option A: Download from website**
```bash
# Go to https://ngrok.com/download
# Download for your OS (macOS, Windows, Linux)
# Extract and move to /usr/local/bin (optional)
```

**Option B: Install via package manager (macOS)**
```bash
# Using Homebrew
brew install ngrok/ngrok/ngrok
```

**Option C: Install via package manager (Linux)**
```bash
# Using apt (Debian/Ubuntu)
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
  sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
  echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
  sudo tee /etc/apt/sources.list.d/ngrok.list && \
  sudo apt update && sudo apt install ngrok
```

**Verify installation:**
```bash
ngrok version
# Should output: ngrok version 3.x.x
```

---

### Step 2: Create ngrok Account ⏱️ 2 minutes

1. Go to: https://dashboard.ngrok.com/signup
2. Sign up (free account is sufficient)
3. After signup, go to: https://dashboard.ngrok.com/get-started/your-authtoken
4. Copy your authtoken

**Add authtoken to ngrok:**
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

This saves your token to `~/.ngrok2/ngrok.yml`

---

### Step 3: Start Your Backend Server ⏱️ 1 minute

Make sure your backend is running on port 3001:

```bash
cd /Users/Idana/Documents/GitHub/forge/backend
npm run start:dev

# Backend should be running on http://localhost:3001
```

---

### Step 4: Start ngrok Tunnel ⏱️ 1 minute

Open a **new terminal window** and run:

```bash
ngrok http 3001
```

You'll see output like this:

```
ngrok                                                                    
                                                                          
Session Status                online                                    
Account                       your-email@example.com (Plan: Free)       
Version                       3.5.0                                      
Region                        United States (us)                         
Latency                       -                                          
Web Interface                 http://127.0.0.1:4040                      
Forwarding                    https://abc123def456.ngrok.io -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Important:** Copy the `Forwarding` URL:
```
https://abc123def456.ngrok.io
```

This is your public webhook URL! ✅

**Note:** The free tier URL changes every time you restart ngrok. For a static URL, upgrade to a paid plan or use ngrok's free static domain feature.

---

### Step 5: Update GitHub App Webhook URL ⏱️ 2 minutes

1. Go to: https://github.com/settings/apps
2. Click on your "Executable Tickets (Dev)" app
3. Scroll to "Webhook" section
4. Update **Webhook URL** to:
   ```
   https://abc123def456.ngrok.io/api/webhooks/github
   ```
   (Replace `abc123def456.ngrok.io` with your actual ngrok URL)

5. Make sure **Webhook secret** is set (should already be configured)
6. Check "Active" checkbox
7. Click **Save changes**

---

### Step 6: Test Webhook Reception ⏱️ 5 minutes

**Option 1: Via ngrok Web Interface**

Open in browser: `http://127.0.0.1:4040`

This shows:
- All HTTP requests received
- Request/response details
- Replay functionality

**Option 2: Via GitHub App Settings**

1. Go to your GitHub App settings
2. Scroll to "Recent Deliveries" section
3. Click "Redeliver" on any webhook event
4. Check your backend logs for webhook reception

**Option 3: Trigger Real Event**

Push to a repository that has your GitHub App installed:

```bash
# In any repo with the app installed
git commit --allow-empty -m "Test webhook"
git push
```

Check backend logs:
```bash
# You should see:
Push event received: {
  repository: 'owner/repo',
  ref: 'refs/heads/main',
  commits: 1
}
```

---

### Step 7: Update Environment Variables ⏱️ 1 minute

**backend/.env:**
```bash
# GitHub App OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_APP_ID=your_app_id
GITHUB_WEBHOOK_SECRET=your_webhook_secret  # Must match GitHub App settings
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Optional: For token encryption
GITHUB_TOKEN_ENCRYPTION_KEY=your_32_char_encryption_key
```

**Note:** No need to add ngrok URL to `.env` - it's only used in GitHub App settings.

---

## Keeping ngrok Running

### Option A: Keep Terminal Open

Just leave the terminal with `ngrok http 3001` running. Don't close it!

### Option B: Run in Background (Linux/macOS)

```bash
# Start ngrok in background
nohup ngrok http 3001 > ngrok.log 2>&1 &

# Check if running
ps aux | grep ngrok

# View logs
tail -f ngrok.log

# Stop ngrok
pkill ngrok
```

### Option C: Use tmux/screen (Recommended)

```bash
# Start tmux session
tmux new -s ngrok

# Run ngrok
ngrok http 3001

# Detach from session: Ctrl+B, then D
# Reattach later: tmux attach -t ngrok
```

---

## ngrok Advanced Configuration (Optional)

### Custom Subdomain (Paid Feature)

If you have a paid plan:

```bash
ngrok http 3001 --subdomain=yourapp-dev
# URL will be: https://yourapp-dev.ngrok.io
```

### Custom Domain (Paid Feature)

If you have a custom domain:

```bash
ngrok http 3001 --hostname=webhooks.yourdomain.com
```

### Configuration File

Create `~/.ngrok2/ngrok.yml`:

```yaml
version: "2"
authtoken: YOUR_AUTH_TOKEN
tunnels:
  backend:
    proto: http
    addr: 3001
    subdomain: yourapp-dev  # Paid feature
    inspect: true
```

Then run:
```bash
ngrok start backend
```

---

## Troubleshooting

### Issue 1: "ngrok: command not found"

**Solution:**
```bash
# Check if ngrok is in PATH
which ngrok

# If not found, add to PATH (macOS/Linux)
export PATH="$PATH:/path/to/ngrok"

# Or move to /usr/local/bin
sudo mv ngrok /usr/local/bin/
```

### Issue 2: Webhook Returns 401 Unauthorized

**Possible causes:**
- Webhook signature verification failed
- Webhook secret mismatch

**Solution:**
1. Check `GITHUB_WEBHOOK_SECRET` in `.env` matches GitHub App settings
2. Check webhook handler signature verification code
3. View webhook delivery details in GitHub App settings → Recent Deliveries

### Issue 3: Webhook Not Received

**Possible causes:**
- ngrok tunnel closed
- Backend server not running
- Webhook URL incorrect

**Solution:**
```bash
# Check ngrok is running
curl http://127.0.0.1:4040/api/tunnels

# Check backend is running
curl http://localhost:3001/health

# Check webhook URL in GitHub App settings
# Should be: https://your-ngrok-url.ngrok.io/api/webhooks/github
```

### Issue 4: "ERR_NGROK_108" - Too Many Connections

**Solution:**
- Free tier has connection limits
- Restart ngrok: `pkill ngrok && ngrok http 3001`
- Upgrade to paid plan for more connections

### Issue 5: ngrok URL Changes Every Restart

**Solution:**
- Free tier generates random URL each time
- Use static domain feature (free) or subdomain (paid)
- Or just update GitHub App webhook URL each time

---

## ngrok Web Interface

Access at: `http://127.0.0.1:4040`

Features:
- **Inspect:** See all HTTP requests/responses in real-time
- **Replay:** Resend previous requests (great for testing!)
- **Status:** Connection status and metrics
- **Requests:** Full request/response details with headers

**Useful for debugging webhooks!**

---

## Security Considerations

### ⚠️ Important Security Notes:

1. **Webhook Signature Verification** - Always verify webhook signatures
   ```typescript
   // In GitHubWebhookHandler.ts
   private verifySignature(payload: any, signature: string): boolean {
     const hmac = createHmac('sha256', this.webhookSecret);
     const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
     return digest === signature;
   }
   ```

2. **Never commit ngrok URLs** - They're temporary and public

3. **Use HTTPS** - ngrok provides HTTPS by default (free tier)

4. **Webhook Secret** - Keep secret, don't commit to git

5. **Rate Limiting** - Implement rate limiting on webhook endpoint

---

## Production Webhook Setup

For production, **don't use ngrok**. Instead:

### Option 1: Deploy Backend to Cloud
- Heroku, Railway, Render, Fly.io, etc.
- Use real domain: `https://api.yourapp.com/api/webhooks/github`

### Option 2: Use Serverless Function
- Vercel, Netlify, AWS Lambda, etc.
- Webhook URL: `https://yourapp.vercel.app/api/webhooks/github`

### Option 3: VPS with Domain
- DigitalOcean, Linode, AWS EC2, etc.
- Real domain with SSL: `https://webhooks.yourapp.com/github`

---

## Quick Reference

### Start Development Environment

```bash
# Terminal 1: Start backend
cd backend
npm run start:dev

# Terminal 2: Start ngrok
ngrok http 3001

# Terminal 3: Start frontend (if needed)
cd client
npm run dev
```

### Stop Development Environment

```bash
# Stop ngrok: Ctrl+C in ngrok terminal
# Stop backend: Ctrl+C in backend terminal
# Stop frontend: Ctrl+C in frontend terminal
```

---

## Testing Webhooks

### Test Push Event

```bash
# In a repo with your GitHub App installed
git commit --allow-empty -m "Test webhook"
git push
```

**Expected backend logs:**
```
Push event received: {
  repository: 'owner/repo',
  ref: 'refs/heads/main',
  commits: 1
}
```

### Test Pull Request Event

1. Create a new branch
2. Make changes and push
3. Create pull request on GitHub

**Expected backend logs:**
```
Pull request event received: {
  repository: 'owner/repo',
  action: 'opened',
  number: 1
}
```

### Manual Webhook Test via GitHub

1. Go to: https://github.com/settings/apps/your-app
2. Scroll to "Recent Deliveries"
3. Click any delivery
4. Click "Redeliver"
5. Check backend logs

---

## Summary Checklist

- [ ] ngrok installed and authenticated
- [ ] Backend server running on port 3001
- [ ] ngrok tunnel started: `ngrok http 3001`
- [ ] ngrok URL copied (e.g., `https://abc123.ngrok.io`)
- [ ] GitHub App webhook URL updated to `https://abc123.ngrok.io/api/webhooks/github`
- [ ] Webhook secret matches `.env` file
- [ ] Webhook tested via push event
- [ ] Backend logs showing webhook reception
- [ ] ngrok web interface checked at `http://127.0.0.1:4040`

---

## Help & Resources

- **ngrok Documentation:** https://ngrok.com/docs
- **ngrok Dashboard:** https://dashboard.ngrok.com
- **GitHub Webhooks Guide:** https://docs.github.com/en/webhooks
- **Webhook Events:** https://docs.github.com/en/webhooks/webhook-events-and-payloads

---

**Ready to receive webhooks!** 🎉

Your local backend can now receive GitHub webhook events during development.

For Story 4.1 implementation, webhook events will log to console. Story 4.2 (Code Indexing) will use these events to trigger re-indexing.
