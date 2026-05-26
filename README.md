# ERP Cozinca Enterprise

Sistema ERP completo para gestão de orçamentos, ordens de serviço e financeiro.

## Stack

| Camada | Serviço |
|--------|---------|
| Frontend | Vercel (React + Vite + Tailwind) |
| Backend | Render (Node.js + Express) |
| Banco | Neon DB (PostgreSQL serverless) |
| ORM | Prisma |
| WebSocket | Socket.IO |

---

## Setup local rápido

### 1. Clonar e instalar

```bash
git clone https://github.com/Gabri013/ERP---OR-AMENTO-SISTEMA.git
cd ERP---OR-AMENTO-SISTEMA
```

### 2. Backend

```bash
cd api-server
cp .env.example .env
# Editar .env com suas credenciais do Neon DB
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

### 3. Frontend

```bash
cd sistema-os
cp .env.example .env.local
# Editar .env.local com VITE_API_URL=http://localhost:3001
npm install
npm run dev
```

---

## Deploy — Render (backend)

### Variáveis obrigatórias no Render

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | URL pooled do Neon (`?sslmode=require&pgbouncer=true`) |
| `DIRECT_URL` | URL direta do Neon (`?sslmode=require`) |
| `JWT_SECRET` | String aleatória ≥ 32 chars |
| `JWT_EXPIRES_IN` | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `FRONTEND_URL` | URL do seu projeto no Vercel |
| `CORS_ORIGIN` | Mesma URL do FRONTEND_URL |

### Build e start

- **Build Command:** `cd api-server && npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- **Start Command:** `cd api-server && npm start`

---

## Deploy — Vercel (frontend)

### Variáveis no painel Vercel

| Variável | Valor |
|----------|-------|
| `VITE_API_URL` | URL do backend no Render |
| `VITE_WS_URL` | Mesma URL com `wss://` |

### Configurações

- **Framework:** Vite
- **Root Directory:** `sistema-os`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

---

## Migrations no Neon DB

```bash
# Desenvolvimento (PowerShell)
cd api-server
$env:DATABASE_URL = "sua-direct-url-do-neon"
npm run db:generate
npm run db:migrate

# Produção (via Render shell ou localmente)
cd api-server
$env:DATABASE_URL = "sua-direct-url-do-neon"
npm run db:generate
npm run db:migrate:deploy
```

---

## Git — enviar atualização

```bash
git add .
git commit -m "feat: deploy pronto render + vercel + neon"
git push origin main
```

Após o push:
- **Render** faz build e deploy automático do backend
- **Vercel** faz build e deploy automático do frontend

---

## Roles disponíveis

| Role | Acesso |
|------|--------|
| `master` | Tudo |
| `gerente` | Gestão completa exceto admin de usuários |
| `vendedor` | Orçamentos e vendas próprias |
| `producao` | Ordens de serviço |
| `engenharia` | Ordens de serviço |
| `financeiro` | Financeiro completo |
| `visualizador` | Somente leitura |
| `corte`, `dobra`, `solda`, etc. | Setores específicos de produção |

---

## Endpoints principais

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh

GET    /api/clientes
POST   /api/clientes
GET    /api/clientes/:id
PATCH  /api/clientes/:id
DELETE /api/clientes/:id

GET    /api/orcamentos
POST   /api/orcamentos
GET    /api/orcamentos/:id
PATCH  /api/orcamentos/:id
DELETE /api/orcamentos/:id
POST   /api/orcamentos/:id/converter

GET    /api/vendas
POST   /api/vendas
GET    /api/vendas/:id
PATCH  /api/vendas/:id
POST   /api/vendas/:id/gerar-os

GET    /api/os
GET    /api/os/:id
PATCH  /api/os/:id
POST   /api/os/:id/avancar
POST   /api/os/:id/observacoes

GET    /api/financeiro/contas-receber
POST   /api/financeiro/contas-receber/:id/pagar
GET    /api/financeiro/contas-pagar
POST   /api/financeiro/contas-pagar
POST   /api/financeiro/contas-pagar/:id/pagar

GET    /api/dashboard/stats
GET    /api/dashboard/os-por-status
GET    /api/dashboard/vendas-recentes
GET    /api/dashboard/os-atrasadas

GET    /api/notificacoes
POST   /api/notificacoes/:id/marcar-lida
POST   /api/notificacoes/marcar-todas-lidas
DELETE /api/notificacoes/:id

GET    /api/produtos
POST   /api/produtos
PATCH  /api/produtos/:id
DELETE /api/produtos/:id

GET    /api/usuarios
POST   /api/usuarios
PATCH  /api/usuarios/:id
DELETE /api/usuarios/:id

GET    /api/healthz
```
