# 🏭 ERP Cozinca Enterprise

<div align="center">

![Tests](https://img.shields.io/badge/tests-45%2F45%20passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Node](https://img.shields.io/badge/Node-18%2B-green)
![License](https://img.shields.io/badge/license-MIT-blue)

**Sistema ERP completo para gestão de orçamentos, ordens de serviço e financeiro**

[Instalação](#-instalação) • [Testes](#-testes) • [Deploy](#-deploy) • [API](#-api-documentation) • [Contribuição](#-contribuição)

</div>

---

## 📋 Índice

- [Sobre](#-sobre)
- [Features](#-features)
- [Arquitetura](#-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [Instalação](#-instalação)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Testes](#-testes)
- [Deploy](#-deploy)
- [API](#-api-documentation)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

---

## 📝 Changelog

### [29/05/2026] - v1.0.0 - Correções e documentação finalizadas

- ✅ Ajustes de tipagem no frontend React Query
- ✅ Correções de rotas API e hooks de cliente
- ✅ Atualizado `README.md` para refletir o estado atual do projeto
- ✅ Commit e push feitos para `main`

---

## 💡 Sobre

O **ERP Cozinca Enterprise** é um sistema de gestão integrado para empresas que precisam controlar orçamentos, vendas, ordens de serviço e financeiro em uma única plataforma.

O projeto é composto por dois módulos principais:

- `api-server`: backend em Node.js + Express + TypeScript
- `sistema-os`: frontend em React + Vite + TypeScript

---

## ✨ Features

- ✅ Cadastro e gestão de clientes
- ✅ Catálogo de produtos com controle de estoque
- ✅ Criação e conversão de orçamentos em vendas
- ✅ Gestão de ordens de serviço com etapas de produção
- ✅ Contas a pagar e receber
- ✅ Permissões por função de usuário
- ✅ Autenticação JWT com refresh token
- ✅ Integração frontend/backend com React Query

---

## 🏗️ Arquitetura

### Estrutura do projeto

```
ERP---OR-AMENTO-SISTEMA/
├── api-server/          # Backend API
│   ├── src/
│   │   ├── routes/     # Rotas da API
│   │   ├── middleware/ # Middlewares (auth, permissions, validação)
│   │   ├── lib/        # Bibliotecas auxiliares
│   │   ├── utils/      # Utilitários compartilhados
│   │   └── __tests__/  # Testes unitários
│   ├── prisma/         # Schema e migrations do banco
│   └── package.json
└── sistema-os/         # Frontend React
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── lib/
    └── package.json
```

### Tecnologias principais

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Banco de dados: PostgreSQL (Neon)
- ORM: Prisma
- Cache: Redis / Upstash

---

## 🛠️ Setup local rápido

### Requisitos

- Node.js 18+
- PostgreSQL / Neon
- Redis / Upstash
- Git

### 1. Clonar o repositório

```bash
git clone https://github.com/Gabri013/ERP---OR-AMENTO-SISTEMA.git
cd ERP---OR-AMENTO-SISTEMA
```

### 2. Backend

```bash
cd api-server
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

### 3. Frontend

```bash
cd sistema-os
cp .env.example .env.local
npm install
npm run dev
```

---

## Variáveis de Ambiente

### Backend (`api-server/.env`)

```env
DATABASE_URL="postgresql://user:password@host:port/db?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:port/db?sslmode=require"
JWT_SECRET="sua-chave-secreta-com-mais-de-32-caracteres"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
REDIS_URL="https://your-redis-url.upstash.io"
REDIS_TOKEN="your-redis-token"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-password"
SMTP_FROM="noreply@example.com"
NODE_ENV="development"
PORT="3001"
FRONTEND_URL="http://localhost:5173"
CORS_ORIGIN="http://localhost:5173"
```

### Frontend (`sistema-os/.env.local`)

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

---

## Deploy — Render (backend)

### Variáveis obrigatórias

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL do Neon com pool |
| `DIRECT_URL` | URL direta do Neon |
| `JWT_SECRET` | Segredo JWT |
| `JWT_EXPIRES_IN` | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` |
| `REDIS_URL` | Upstash Redis URL |
| `REDIS_TOKEN` | Upstash token |
| `FRONTEND_URL` | URL do frontend Vercel |
| `CORS_ORIGIN` | Mesma URL do frontend |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |

### Comandos

- Build: `cd api-server && npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- Start: `cd api-server && npm start`

---

## Deploy — Vercel (frontend)

### Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL do backend Render |
| `VITE_WS_URL` | URL do WebSocket (`wss://...`) |

### Configuração

- Root Directory: `sistema-os`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

---

## 🧪 Testes

### Executar testes

```bash
cd api-server
npm test
npm run test:watch
npm run test:coverage
```

### Status atual

- ✅ 45 testes passando
- ✅ Cobertura de rotas de auth, produtos, clientes e health
- ✅ Frontend build e typecheck validados

---

## 📚 API

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Perfil do usuário |
| POST | `/api/auth/refresh` | Refresh token |

### Clientes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/clientes` | Listar clientes |
| POST | `/api/clientes` | Criar cliente |
| GET | `/api/clientes/:id` | Buscar cliente |
| PATCH | `/api/clientes/:id` | Atualizar cliente |
| DELETE | `/api/clientes/:id` | Excluir cliente |

### Produtos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/produtos` | Listar produtos |
| POST | `/api/produtos` | Criar produto |
| GET | `/api/produtos/:id` | Buscar produto |
| PATCH | `/api/produtos/:id` | Atualizar produto |
| DELETE | `/api/produtos/:id` | Excluir produto |

### Orçamentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/orcamentos` | Listar orçamentos |
| POST | `/api/orcamentos` | Criar orçamento |
| GET | `/api/orcamentos/:id` | Buscar orçamento |
| PATCH | `/api/orcamentos/:id` | Atualizar orçamento |
| DELETE | `/api/orcamentos/:id` | Excluir orçamento |
| POST | `/api/orcamentos/:id/converter` | Converter em venda |

### Vendas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/vendas` | Listar vendas |
| POST | `/api/vendas` | Criar venda |
| GET | `/api/vendas/:id` | Buscar venda |
| POST | `/api/vendas/:id/gerar-os` | Gerar ordem de serviço |

### Ordens de Serviço

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/os` | Listar OS |
| GET | `/api/os/:id` | Buscar OS |
| PATCH | `/api/os/:id` | Atualizar OS |
| POST | `/api/os/:id/avancar` | Avançar etapa |
| POST | `/api/os/:id/observacoes` | Adicionar observação |
| GET | `/api/os/:id/pdf` | Gerar PDF |

### Financeiro

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/financeiro/contas-receber` | Listar contas a receber |
| POST | `/api/financeiro/contas-receber/:id/pagar` | Baixar conta a receber |
| GET | `/api/financeiro/contas-pagar` | Listar contas a pagar |
| POST | `/api/financeiro/contas-pagar` | Criar conta a pagar |
| POST | `/api/financeiro/contas-pagar/:id/pagar` | Baixar conta a pagar |

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nome`)
3. Commit com mensagem clara
4. Abra um Pull Request

**Padrões de commit**
- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` documentação
- `style:` formatação
- `refactor:` refatoração
- `test:` testes
- `chore:` tarefas de manutenção

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja `LICENSE` para detalhes.

---

<div align="center">

**Feito com 💪 e ☕ por [Gabri013](https://github.com/Gabri013)**

[⬆ Voltar ao topo](#-erp-cozinca-enterprise)

</div>
