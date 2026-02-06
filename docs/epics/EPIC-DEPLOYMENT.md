# Epic: Production Deployment

## Architecture

```
Browser → Vercel (*.vercel.app)       → Next.js SSR frontend
       → Render (*.onrender.com/api)  → NestJS backend
       → Firebase                     → Auth + Firestore + Storage
```

| Component | Platform | Free Tier |
|-----------|----------|-----------|
| Frontend | Vercel | 100GB bandwidth, serverless, auto-HTTPS |
| Backend | Render | 750 hrs/month, auto-HTTPS, Docker |
| Database | Firebase Firestore | 1GB storage, 50K reads/day |
| Auth | Firebase Auth | 10K verifications/month |
| Storage | Firebase Storage | 5GB, 1GB/day download |
| CI/CD | GitHub Actions | 2,000 min/month |

> Render free tier: service sleeps after 15min inactivity (~30s cold start). Upgrade to $7/mo Starter for always-on.

---

## Environment Variables

### Vercel (Frontend)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Render backend URL (e.g. `https://forge-api.onrender.com/api`) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

### Render (Backend)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` (set in render.yaml) |
| `PORT` | `10000` (Render default, set in render.yaml) |
| `LLM_PROVIDER` | `anthropic` (set in render.yaml) |
| `FRONTEND_URL` | Vercel frontend URL |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `ANTHROPIC_API_KEY` | Anthropic API key for LLM |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |
| `GITHUB_TOKEN` | GitHub personal access token |
| `GITHUB_OAUTH_REDIRECT_URI` | OAuth callback URL |
| `GITHUB_ENCRYPTION_KEY` | Encryption key for stored tokens |
| `SESSION_SECRET` | Express session secret (generate strong random value) |

---

## Manual Setup Steps

### 1. Vercel

1. Go to [vercel.com](https://vercel.com) → Import GitHub repo
2. Set root directory to `client/`
3. Framework: Next.js (auto-detected)
4. If monorepo detection fails, set build command:
   ```
   cd .. && pnpm install && pnpm run build --filter=@repo/client
   ```
5. Add all `NEXT_PUBLIC_*` environment variables
6. Set `NEXT_PUBLIC_API_URL` to your Render backend URL

### 2. Render

1. Go to [render.com](https://render.com) → New → Blueprint
2. Connect GitHub repo — `render.yaml` is auto-detected
3. Fill in all secrets marked `sync: false` in the dashboard
4. Set `FRONTEND_URL` to your Vercel domain (e.g. `https://forge.vercel.app`)

### 3. Firebase Console

1. Authentication → Settings → Authorized domains
   - Add `*.vercel.app` domain
   - Add `*.onrender.com` domain
2. Project Settings → Service Accounts → Generate new private key
   - Use values for `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`

### 4. GitHub OAuth App

1. GitHub → Settings → Developer settings → OAuth Apps
2. Update **Authorization callback URL**:
   ```
   https://<render-service>.onrender.com/api/github/oauth/callback
   ```
3. Update **Homepage URL**:
   ```
   https://<vercel-app>.vercel.app
   ```

---

## How Deploys Work

- **Frontend (Vercel):** Auto-deploys on every push to `main` via GitHub integration. Preview deploys on PRs.
- **Backend (Render):** Auto-deploys on every push to `main` via GitHub integration. Uses `backend/Dockerfile`.
- **Firebase Rules:** Deployed via GitHub Actions workflow on push to `main` (`.github/workflows/deploy-staging.yml`).

---

## Troubleshooting

### Cold Starts (Render Free Tier)
- First request after 15min inactivity takes ~30s
- The health check endpoint (`/api/docs`) can be pinged periodically to keep alive
- Upgrade to Starter plan ($7/mo) for always-on

### CORS Issues
- Verify `FRONTEND_URL` env var on Render matches your Vercel domain exactly
- Backend CORS is configured in `backend/src/main.ts` using `FRONTEND_URL`

### Cookie/Session Issues
- Cross-origin OAuth requires `SameSite=None` + `Secure=true`
- This is handled automatically when `NODE_ENV=production`
- Verify both domains use HTTPS

### Auth Not Working
- Check Firebase Console → Authorized domains includes both Vercel and Render domains
- Check GitHub OAuth app callback URL matches Render backend URL
- Verify `NEXT_PUBLIC_API_URL` points to correct Render URL with `/api` suffix

### Docker Build Fails
- Build from repo root: `docker build -f backend/Dockerfile .`
- The `dockerContext: .` in render.yaml ensures monorepo packages are available
- `git` is installed in runtime image (required by `simple-git` for repo analysis)
