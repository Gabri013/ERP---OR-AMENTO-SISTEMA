# ERP Cozinca Enterprise

Sistema ERP completo para gestão de orçamentos, ordens de serviço e financeiro.

## 📝 Changelog - 27/05/2026

### Correções Completas e Testes 100%

**Correções de Testes Unitários:**
- ✅ Todos os 45 testes unitários passando (100%)
- ✅ Corrigidos erros de TypeScript em múltiplos arquivos
- ✅ Removido arquivo de exemplo com erros (orcamentos-example.ts)
- ✅ Corrigidos imports em arquivos de teste
- ✅ Corrigido middleware de permissões (checkPermission)
- ✅ Corrigido rateLimiter middleware (keyGenerator)
- ✅ Corrigido validateZod middleware
- ✅ Instalado @types/jest para testes
- ✅ Adicionado jest ao tsconfig types

**Correções de Mocks e Setup:**
- ✅ Configurados mocks de Redis (safeWithCache, safeCacheDel)
- ✅ Configurados mocks de Prisma para todos os modelos
- ✅ Configurados mocks de bcrypt para múltiplos usuários
- ✅ Configurados mocks de JWT para diferentes tokens
- ✅ Adicionado usuário financeiro aos mocks para testar permissões

**Correções de Rotas:**
- ✅ Substituídas chamadas de Redis por funções no-op seguras
- ✅ Corrigidas rotas de produtos (cache)
- ✅ Corrigidas rotas de clientes (cache)
- ✅ Corrigido checkPermission para usar req.currentUser

**Refatoração:**
- ✅ Criado arquivo compartilhado utils/cache.ts (removido código duplicado)
- ✅ Validado schema do Prisma (sem erros)

**Deploy:**
- ✅ Movido swagger-ui-express e swagger-jsdoc para dependencies
- ✅ Corrigido erro de build no Render

**Testes Específicos:**
- ✅ Health endpoints (2/2 passando)
- ✅ Auth endpoints (16/16 passando)
- ✅ Produtos endpoints (13/13 passando)
- ✅ Clientes endpoints (13/13 passando)
- ✅ RateLimiter middleware (1/1 passando)

---

## Stack

| Camada | Serviço |
|--------|---------|
| Frontend | Vercel (React + Vite + Tailwind) |
| Backend | Render (Node.js + Express) |
| Banco | Neon DB (PostgreSQL serverless) |
| Cache | Upstash Redis |
| ORM | Prisma |
| WebSocket | Socket.IO |

---

## Features

- ✅ Gestão completa de clientes, produtos, orçamentos, vendas e ordens de serviço
- ✅ 11 tipos de usuários com permissões granulares
- ✅ 15+ etapas de produção com Kanban
- ✅ Controle financeiro (contas a receber/pagar)
- ✅ Geração de PDF para orçamentos e ordens de serviço
- ✅ Envio de emails automáticos
- ✅ Cache Redis para performance
- ✅ Rate limiting com Redis
- ✅ Health checks para monitoramento
- ✅ Documentação Swagger/OpenAPI
- ✅ Testes com Jest e Supertest
- ✅ Backup automático do banco de dados

---

## Setup local rápido

### Pré-requisitos

- Node.js 18+
- PostgreSQL (ou conta Neon DB)
- Redis (ou conta Upstash)
- Git

### 1. Clonar e instalar

```bash
git clone https://github.com/Gabri013/ERP---OR-AMENTO-SISTEMA.git
cd ERP---OR-AMENTO-SISTEMA
```

### 2. Backend

```bash
cd api-server
cp .env.example .env
# Editar .env com suas credenciais
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

#### Variáveis de ambiente obrigatórias (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/db?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:port/db?sslmode=require"

# JWT
JWT_SECRET="sua-chave-secreta-com-mais-de-32-caracteres"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Redis (Upstash)
REDIS_URL="https://your-redis-url.upstash.io"
REDIS_TOKEN="your-redis-token"

# Email (SMTP - opcional)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-password"
SMTP_FROM="noreply@example.com"

# Server
NODE_ENV="development"
PORT="3001"
FRONTEND_URL="http://localhost:5173"
CORS_ORIGIN="http://localhost:5173"
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
| `REDIS_URL` | URL do Upstash Redis |
| `REDIS_TOKEN` | Token do Upstash Redis |
| `SMTP_HOST` | Host SMTP (opcional) |
| `SMTP_PORT` | Porta SMTP (opcional) |
| `SMTP_USER` | Usuário SMTP (opcional) |
| `SMTP_PASS` | Senha SMTP (opcional) |
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

## Backup automático

O sistema inclui um script de backup automático configurado para rodar diariamente:

```bash
# Executar backup manualmente
cd api-server
npm run db:backup
```

Os backups são salvos em `api-server/backups/` com retenção dos últimos 7 dias.

---

## Testes

```bash
cd api-server
npm test
```

**Status atual: 45/45 testes passando (100%)**

Os testes cobrem:
- ✅ Autenticação (login, logout, refresh, me) - 16 testes
- ✅ Rotas de clientes (CRUD completo) - 13 testes
- ✅ Rotas de produtos (CRUD completo) - 13 testes
- ✅ Health checks - 2 testes
- ✅ Rate Limiter - 1 teste
- ✅ Validação de dados
- ✅ Autorização e permissões (testado com role financeiro)

---

## Git — enviar atualização

```bash
git add .
git commit -m "feat: sua mensagem"
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

### Autenticação
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh
```

### Clientes
```
GET    /api/clientes
POST   /api/clientes
GET    /api/clientes/:id
PATCH  /api/clientes/:id
DELETE /api/clientes/:id
```

### Orçamentos
```
GET    /api/orcamentos
POST   /api/orcamentos
GET    /api/orcamentos/:id
PATCH  /api/orcamentos/:id
DELETE /api/orcamentos/:id
POST   /api/orcamentos/:id/converter
GET    /api/orcamentos/:id/pdf
```

### Vendas
```
GET    /api/vendas
POST   /api/vendas
GET    /api/vendas/:id
PATCH  /api/vendas/:id
POST   /api/vendas/:id/gerar-os
```

### Ordens de Serviço
```
GET    /api/os
GET    /api/os/:id
PATCH  /api/os/:id
POST   /api/os/:id/avancar
POST   /api/os/:id/observacoes
GET    /api/os/:id/pdf
```

### Financeiro
```
GET    /api/financeiro/contas-receber
POST   /api/financeiro/contas-receber/:id/pagar
GET    /api/financeiro/contas-pagar
POST   /api/financeiro/contas-pagar
POST   /api/financeiro/contas-pagar/:id/pagar
```

### Dashboard
```
GET    /api/dashboard/stats
GET    /api/dashboard/os-por-status
GET    /api/dashboard/vendas-recentes
GET    /api/dashboard/os-atrasadas
```

### Produtos
```
GET    /api/produtos
POST   /api/produtos
PATCH  /api/produtos/:id
DELETE /api/produtos/:id
```

### Usuários
```
GET    /api/usuarios
POST   /api/usuarios
PATCH  /api/usuarios/:id
DELETE /api/usuarios/:id
```

### Health
```
GET    /api/healthz
GET    /api/health
```

### Documentação
```
GET    /api-docs
```

---

## Segurança

- ✅ Validação Zod em todas as rotas
- ✅ Rate limiting com Redis (5 níveis)
- ✅ Headers de segurança (HSTS, CSP, etc.)
- ✅ JWT com refresh tokens
- ✅ Criptografia de senhas com bcrypt
- ✅ CORS configurado
- ✅ Audit logs para ações críticas

---

## Performance

- ✅ Cache Redis para endpoints frequentes
- ✅ Gzip compression
- ✅ Cache-Control headers
- ✅ Índices de banco de dados otimizados
- ✅ Paginação em listas

---

## Suporte

Para issues ou dúvidas, abra uma issue no repositório.
