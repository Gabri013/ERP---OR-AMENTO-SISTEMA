# Deploy ERP Cozinca Enterprise

## Infra oficial
- Frontend: Vercel
- Backend: Render
- Banco: Neon PostgreSQL
- ORM: Prisma

## 1. Variáveis no Render (`api-server`)

Configure no serviço do Render:

- `DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require&pgbouncer=true`
- `DIRECT_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require`
- `JWT_SECRET=<string forte com pelo menos 32 caracteres>`
- `JWT_EXPIRES_IN=15m`
- `REFRESH_TOKEN_EXPIRES_IN=7d`
- `NODE_ENV=production`
- `PORT=3001`
- `FRONTEND_URL=https://seu-frontend.vercel.app`
- `CORS_ORIGIN=https://seu-frontend.vercel.app`
- `REDIS_URL=<opcional>`

## 2. Build/start no Render

Use o `render.yaml` da raiz ou configure manualmente:

- Build Command:
  - `cd api-server && npm install && npx prisma generate && npm run build`
- Start Command:
  - `cd api-server && npm start`

## 3. Prisma + Neon

### Desenvolvimento local
No PowerShell:

```powershell
cd api-server
$env:DATABASE_URL=$env:DIRECT_URL
npm run db:migrate
```

### Produção
Para aplicar migrations no ambiente do Render:

```powershell
cd api-server
$env:DATABASE_URL=$env:DIRECT_URL
npm run db:generate
npm run db:migrate:deploy
```

## 4. Variáveis no Vercel (`sistema-os`)

Configure no painel do projeto frontend:

- `VITE_API_URL=https://seu-backend.onrender.com`
- `VITE_WS_URL=wss://seu-backend.onrender.com`

## 5. Build do Vercel

O frontend usa:

- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

## 6. Observações importantes

- O backend monta as rotas em `/api`
- O Render free tier pode ter cold start
- O Neon deve usar `DIRECT_URL` para migrations e `DATABASE_URL` pooled para queries normais
- Não use sintaxe MySQL em migrations manuais

## 7. Checklist de atualização

### Backend
```powershell
cd api-server
npm install
npm run db:generate
npm run build
```

### Backend com migration em produção
```powershell
cd api-server
$env:DATABASE_URL=$env:DIRECT_URL
npm run db:generate
npm run db:migrate:deploy
```

### Frontend
```powershell
cd sistema-os
npm install
npm run build
```

### Git
```powershell
git add .
git commit -m "chore: preparar deploy render + vercel + neon"
git push origin main
```

## 8. Fluxo recomendado de atualização

1. Ajuste variáveis no Neon, Render e Vercel
2. Backend local:
   - `cd api-server`
   - `npm install`
   - `npm run db:generate`
   - `npm run build`
3. Frontend local:
   - `cd sistema-os`
   - `npm install`
   - `npm run build`
4. Commit e push na `main`
5. Render faz deploy do backend
6. Vercel faz deploy do frontend
