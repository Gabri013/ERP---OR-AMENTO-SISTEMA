<#
PowerShell deploy helper (Windows)

USAGE (after rotating secrets):
  $env:NEON_POOLED_URL = "postgresql://user:pass@host/db?sslmode=require&pgbouncer=true"
  $env:NEON_DIRECT_URL = "postgresql://user:pass@host/db?sslmode=require"
  $env:JWT_SECRET = "a-very-strong-secret"
  $env:VERCEL_TOKEN = "<your-vercel-token>"
  $env:RENDER_TOKEN = "<your-render-token>"

  .\scripts\deploy_prod.ps1

This script performs:
  - local Prisma migrations using DIRECT_URL
  - backend build (`api-server`)
  - pushes repo to trigger Render auto-deploy
  - triggers Vercel deploy via CLI

Security: Do NOT commit tokens. Set them in your shell/session only.
#>

function AbortIfMissing([string[]] $vars) {
  foreach ($v in $vars) {
    if (-not [string]::IsNullOrEmpty($env:$v) -and $env:$v -ne $null) { continue }
    Write-Error "Missing environment variable: $v"
    exit 1
  }
}

# Required env vars
AbortIfMissing @("NEON_POOLED_URL", "NEON_DIRECT_URL", "JWT_SECRET", "VERCEL_TOKEN")

Write-Host "Starting deployment preparation..." -ForegroundColor Cyan

Write-Host "1) Running Prisma migrations on production database (using DIRECT_URL)" -ForegroundColor Yellow
Push-Location api-server

# Ensure dependencies
Write-Host "Installing production dependencies..." -ForegroundColor Green
npm ci --silent --no-audit --progress=false

Write-Host "Generating Prisma client..." -ForegroundColor Green
$env:DATABASE_URL = $env:NEON_DIRECT_URL
npx prisma generate

Write-Host "Applying migrations..." -ForegroundColor Green
npx prisma migrate deploy

Write-Host "Building backend..." -ForegroundColor Green
npm run build

Pop-Location

Write-Host "2) Pushing repository to trigger Render auto-deploy (if configured)" -ForegroundColor Yellow
git add -A
try { git commit -m "chore: deploy prep $(Get-Date -Format o)" } catch { Write-Host "No changes to commit." }
git push origin main

Write-Host "3) Triggering Vercel production deploy via CLI" -ForegroundColor Yellow
if (Get-Command npx -ErrorAction SilentlyContinue) {
  npx vercel --prod --confirm --token $env:VERCEL_TOKEN
} else {
  Write-Warning "npx not found in PATH. Install Node.js and run the command below manually: npx vercel --prod --token <TOKEN>"
}

Write-Host "Deploy script finished. Verify Render and Vercel dashboards for build logs." -ForegroundColor Cyan
