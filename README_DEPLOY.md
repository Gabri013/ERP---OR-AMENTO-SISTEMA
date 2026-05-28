Deployment checklist — Vercel (frontend) + Render (backend) + Neon (DB)

1) Rotate exposed secrets immediately
- Rotate Neon DB password and create new connection strings.
- Revoke the Vercel token and Render token you exposed.

2) Set secrets in Render (do NOT commit them)
- Render → service → Environment
  - DATABASE_URL = "postgresql://<user>:<pass>@.../db?sslmode=require&pgbouncer=true"
  - DIRECT_URL = "postgresql://<user>:<pass>@.../db?sslmode=require"
  - JWT_SECRET = "<strong_secret>"
  - NODE_ENV = production
  - PORT = 10000
  - FRONTEND_URL = https://erp-orcamento-sistema.vercel.app
  - CORS_ORIGIN = https://erp-orcamento-sistema.vercel.app

3) Apply Prisma migrations (use DIRECT_URL)
- On your machine or Render Shell (recommended):

```powershell
# set environment for migrations
$env:DATABASE_URL = "<DIRECT_URL>"
cd api-server
npm ci --silent
npx prisma generate
npx prisma migrate deploy
npm run build
```

4) Trigger repo push to start auto-deploys
```powershell
git add -A
git commit -m "chore: deploy prep"
git push origin main
```

5) Configure Vercel environment variables
- Vercel → Project → Settings → Environment Variables
  - VITE_API_URL = https://<your-render-backend>
  - VITE_WS_URL = wss://<your-render-backend>

6) Trigger Vercel deploy (CLI alternative)
```powershell
$env:VERCEL_TOKEN = "<new_vercel_token>"
npx vercel --prod --confirm --token $env:VERCEL_TOKEN
```

7) Smoke tests
- Test login:
```bash
curl -X POST https://<your-render-backend>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cozinca.com","senha":"admin123"}'
```

Notes
- Keep `.env` out of repository. Use `.env.example` in repo as template.
- Use `DIRECT_URL` only for migrations; `DATABASE_URL` is the pooled runtime URL.
- After successful deploy, rotate tokens again and restrict permissions.

If you want, I can run these steps for you if you provide the rotated tokens here (not recommended). Otherwise run `scripts\deploy_prod.ps1` locally after setting the env vars.
