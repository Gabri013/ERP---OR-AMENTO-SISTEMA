# Guia de Deploy Completo — ERP Cozinca Enterprise

## PASSO 1 — Configurar Neon DB

1. Acesse https://neon.tech
2. Crie um banco chamado `dbcozinca` (ou use o existente)
3. Vá em **Connection Details** e copie dois tipos de URL:
   - **Pooled connection** (para `DATABASE_URL`): inclui `?pgbouncer=true&sslmode=require`
   - **Direct connection** (para `DIRECT_URL`): inclui `?sslmode=require` sem pgbouncer

---

## PASSO 2 — Rodar migrations no Neon

No PowerShell, dentro da pasta `api-server`:

```powershell
cd api-server

# Defina a URL DIRETA do Neon
$env:DATABASE_URL = "postgresql://USER:PASS@HOST/dbcozinca?sslmode=require"
$env:DIRECT_URL   = "postgresql://USER:PASS@HOST/dbcozinca?sslmode=require"

npm install
npm run db:generate
npm run db:migrate:deploy
```

> Isso cria a tabela `RefreshToken` e quaisquer outras migrations pendentes.

---

## PASSO 3 — Configurar variáveis no Render

No painel do seu serviço no Render → **Environment**:

| Chave | Valor |
|-------|-------|
| `DATABASE_URL` | URL pooled do Neon (`?pgbouncer=true&sslmode=require`) |
| `DIRECT_URL` | URL direta do Neon (`?sslmode=require`) |
| `JWT_SECRET` | Gere com: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `FRONTEND_URL` | `https://seu-projeto.vercel.app` |
| `CORS_ORIGIN` | `https://seu-projeto.vercel.app` |

Build Command:
```
cd api-server && npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

Start Command:
```
cd api-server && npm start
```

---

## PASSO 4 — Configurar variáveis no Vercel

No painel do projeto no Vercel → **Settings → Environment Variables**:

| Chave | Valor |
|-------|-------|
| `VITE_API_URL` | `https://seu-backend.onrender.com` |
| `VITE_WS_URL` | `wss://seu-backend.onrender.com` |

Configurações do projeto:
- **Framework Preset:** Vite
- **Root Directory:** `sistema-os`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

---

## PASSO 5 — Enviar código com Git

```bash
git add .
git commit -m "feat: ERP enterprise completo - JWT refresh, socket.io, RBAC, Neon, Render, Vercel"
git push origin main
```

Após o push:
- **Render** detecta a mudança e faz build + deploy automático
- **Vercel** detecta a mudança e faz build + deploy automático

---

## PASSO 6 — Criar usuário master

Após o deploy do backend, via Render Shell ou localmente:

```bash
cd api-server
npm run db:generate
node create-test-user.ts
```

Ou direto via SQL no Neon console:

```sql
INSERT INTO "Usuario" (nome, email, senha, tipo, status, "createdAt", "updatedAt")
VALUES (
  'Administrador',
  'admin@cozinca.com',
  '$2b$10$HASH_GERADO_COM_BCRYPT',
  'master',
  'ativo',
  NOW(),
  NOW()
);
```

> Para gerar o hash: `node -e "require('bcryptjs').hash('sua-senha', 10).then(console.log)"`

---

## Verificar se está funcionando

### Backend
```
GET https://seu-backend.onrender.com/api/healthz
```
Deve retornar: `{ "status": "ok" }`

### Frontend
Acesse `https://seu-projeto.vercel.app`  
Deve aparecer a tela de login.

### Login
```json
POST https://seu-backend.onrender.com/api/auth/login
{
  "email": "admin@cozinca.com",
  "senha": "sua-senha"
}
```

---

## Solução de problemas comuns

### Cold start do Render
O Render free tier hiberna após 15min. A primeira requisição pode demorar ~30s.
O frontend já tem timeout de 30s configurado.

### CORS bloqueando
Certifique que `FRONTEND_URL` e `CORS_ORIGIN` no Render contêm exatamente a URL do Vercel.

### Migration falhou
Use a `DIRECT_URL` (sem pgbouncer) para rodar migrations. O `DATABASE_URL` pooled não funciona para migrations.

### WebSocket não conecta
O socket.io usa tanto `websocket` quanto `polling` como transporte — o Render free tier suporta polling mesmo se websocket for bloqueado.
