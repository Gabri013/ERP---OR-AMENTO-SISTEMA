# 🛠️ GUIA DE SOLUÇÕES PRÁTICAS - ERP Cozinca

**Este documento contém código pronto para copiar/colar para implementar as soluções da Fase 1**

---

## 1️⃣ SEGURANÇA: Remover .env do Git

### ⚠️ CRÍTICO: Remover do Histórico

```bash
# Passo 1: Fazer backup das credenciais
cp api-server/.env api-server/.env.backup

# Passo 2: Remover .env do histórico Git
git filter-branch --tree-filter 'rm -f api-server/.env api-server/.env.txt' HEAD

# Alternativa com BFG repo-cleaner (mais rápido):
bfg --delete-files api-server/.env --delete-files api-server/.env.txt

# Passo 3: Force push (cuidado!)
git push origin main --force

# Passo 4: Limpar refs antigos
git reflog expire --expire=now --all
git gc --prune=now
```

### Atualizar .gitignore

Adicionar ao arquivo `.`.gitignore``:

```gitignore
# Environment
.env
.env.txt
.env.local
.env.*.local
.env.production.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*.iml
*.sublime-workspace

# OS
.DS_Store
Thumbs.db
.DS_Store?
._*
.Spotlight-V100
.Trashes

# Build
dist/
build/
node_modules/
.next/
out/

# Testing
coverage/
.nyc_output/

# Misc
*.pem
*.key
```

### Criar .env.example

**Arquivo:** `api-server/.env.example`

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cozinca?sslmode=require"
DIRECT_URL="postgresql://user:password@localhost:5432/cozinca?sslmode=require"

# Application
NODE_ENV="development"
PORT=3001
LOG_LEVEL="debug"

# JWT & Auth
JWT_SECRET="seu-secret-aqui-minimo-32-caracteres-aleatorio"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Frontend
FRONTEND_URL="http://localhost:5173"
CORS_ORIGIN="http://localhost:5173"

# Redis
REDIS_URL="redis://localhost:6379"
UPSTASH_REDIS_REST_URL="https://...upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxxxx"

# Email (opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="seu-app-password"
SMTP_FROM="noreply@cozinca.com"

# External Services (opcional)
SENTRY_DSN=""
DATADOG_API_KEY=""

# Features
ENABLE_PDF_GENERATION="true"
ENABLE_EMAIL_SENDING="false"
ENABLE_ANALYTICS="false"
```

---

## 2️⃣ RATE LIMITING: Implementar Globalmente

### Arquivo: `api-server/src/middleware/rateLimiter.ts`

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../lib/redis';

// ============================================================================
// RATE LIMITERS COM REDIS COMO STORE
// ============================================================================

// Geral: 100 requisições por 15 minutos (por IP)
export const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redis as any,
    prefix: 'rl:general:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: 'Muitas requisições desta IP. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Não aplicar em health checks
    return req.path === '/api/health' || req.path === '/healthz';
  },
  keyGenerator: (req) => {
    // Usar user ID se autenticado, senão usar IP
    return req.user?.id?.toString() || req.ip || req.socket.remoteAddress || 'unknown';
  },
});

// Login: 5 tentativas por 15 minutos
export const loginLimiter = rateLimit({
  store: new RedisStore({
    client: redis as any,
    prefix: 'rl:login:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  skipSuccessfulRequests: true, // Não contar tentativas bem-sucedidas
  skipFailedRequests: false,
  keyGenerator: (req) => req.body.email || req.ip || 'unknown',
});

// API: 30 requisições por minuto
export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis as any,
    prefix: 'rl:api:',
  }),
  windowMs: 60 * 1000, // 1 minuto
  max: 30,
  message: 'Limite de requisições atingido. Tente novamente.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload: 5 uploads por 10 minutos
export const uploadLimiter = rateLimit({
  store: new RedisStore({
    client: redis as any,
    prefix: 'rl:upload:',
  }),
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Limite de uploads atingido. Máximo 5 uploads por 10 minutos.',
  keyGenerator: (req) => req.user?.id?.toString() || req.ip || 'unknown',
});

// Search: 20 buscas por minuto
export const searchLimiter = rateLimit({
  store: new RedisStore({
    client: redis as any,
    prefix: 'rl:search:',
  }),
  windowMs: 60 * 1000,
  max: 20,
  message: 'Limite de buscas atingido.',
});

// Export todos os limiters
export const rateLimiters = {
  general: generalLimiter,
  login: loginLimiter,
  api: apiLimiter,
  upload: uploadLimiter,
  search: searchLimiter,
};
```

### Usar em `app.ts`

Adicionar após a criação da app:

```typescript
import { generalLimiter, loginLimiter } from "./middleware/rateLimiter";

// Aplicar rate limiting geral
app.use(generalLimiter);

// Será aplicado específico em cada rota (veja abaixo)
```

### Usar em rotas específicas

**Exemplo em `routes/auth.ts`:**

```typescript
import { loginLimiter } from '../middleware/rateLimiter';

// Login com rate limiting
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  // seu código
});

// Logout
router.post('/logout', authenticateToken, (req: Request, res: Response) => {
  // seu código
});
```

**Exemplo em `routes/anexos.ts`:**

```typescript
import { uploadLimiter } from '../middleware/rateLimiter';

router.post('/upload', authenticateToken, uploadLimiter, upload.single('file'), async (req, res) => {
  // seu código
});
```

---

## 3️⃣ VALIDAÇÕES: Setup com Zod

### Arquivo: `api-server/src/validation/schemas.ts`

```typescript
import { z } from 'zod';

// ============================================================================
// PADRÕES DE VALIDAÇÃO REUTILIZÁVEIS
// ============================================================================

const emailSchema = z.string().email('Email inválido');

const cpfSchema = z.string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (use formato: 000.000.000-00)')
  .optional();

const cnpjSchema = z.string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido (use formato: 00.000.000/0000-00)')
  .optional();

const telefoneSchema = z.string()
  .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone inválido (use formato: (00) 99999-9999)')
  .optional();

const dataFuturaSchema = z.coerce.date()
  .refine(date => date > new Date(), 'Data deve ser futura');

const dataSchema = z.coerce.date();

const valorPositivoSchema = z.number()
  .positive('Valor deve ser positivo');

// ============================================================================
// SCHEMAS DE NEGÓCIO
// ============================================================================

export const ClienteSchema = z.object({
  razaoSocial: z.string()
    .min(3, 'Razão social deve ter pelo menos 3 caracteres')
    .max(150, 'Razão social muito longa'),
  nomeFantasia: z.string().max(150).optional(),
  cnpjCpf: cnpjSchema.or(cpfSchema),
  email: emailSchema.optional(),
  telefone: telefoneSchema,
  endereco: z.string().max(250).optional(),
  cidade: z.string().max(100).optional(),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres (ex: SP)').optional(),
  observacoes: z.string().max(1000).optional(),
});

export const OrcamentoItemSchema = z.object({
  produtoId: z.number().int().positive().optional(),
  descricaoManual: z.string().max(500).optional(),
  quantidade: z.number().positive('Quantidade deve ser maior que 0'),
  valorUnitario: valorPositivoSchema,
  valorTotal: valorPositivoSchema,
});

export const OrcamentoSchema = z.object({
  clienteId: z.number().int().positive('Cliente obrigatório'),
  dataOrcamento: dataSchema,
  validade: dataFuturaSchema.optional(),
  itens: z.array(OrcamentoItemSchema).min(1, 'Mínimo 1 item no orçamento'),
  desconto: z.number()
    .min(0, 'Desconto não pode ser negativo')
    .max(100, 'Desconto não pode ser maior que 100%')
    .optional()
    .default(0),
  observacoes: z.string().max(1000).optional(),
});

export const VendaSchema = z.object({
  orcamentoId: z.number().int().positive(),
  statusPagamento: z.enum(['pendente', 'parcial', 'pago']).optional(),
  dataVenda: dataSchema,
  observacoes: z.string().max(1000).optional(),
});

export const ContaReceberSchema = z.object({
  vendaId: z.number().int().positive(),
  parcelaNumero: z.number().int().positive('Número da parcela inválido'),
  totalParcelas: z.number().int().positive('Total de parcelas inválido'),
  dataVencimento: dataFuturaSchema,
  formaPagamento: z.enum(['dinheiro', 'cartao', 'boleto', 'transferencia']).optional(),
  observacoes: z.string().max(500).optional(),
});

export const ContaPagarSchema = z.object({
  descricao: z.string().min(3, 'Descrição obrigatória').max(500),
  fornecedor: z.string().max(150).optional(),
  valor: valorPositivoSchema,
  dataVencimento: dataSchema,
  formaPagamento: z.enum(['dinheiro', 'cartao', 'boleto', 'transferencia']).optional(),
  status: z.enum(['pendente', 'pago', 'cancelada']).optional(),
});

export const OrdemServicoSchema = z.object({
  vendaId: z.number().int().positive(),
  dataInicio: dataSchema.optional(),
  statusProducao: z.string().optional(),
  observacoes: z.string().max(1000).optional(),
});

export const UsuarioSchema = z.object({
  nome: z.string().min(3, 'Nome obrigatório').max(100),
  email: emailSchema,
  telefone: telefoneSchema,
  tipo: z.enum(['admin', 'gerente', 'vendedor', 'producao', 'consultor']),
});

export const ChangePasswordSchema = z.object({
  senhaAtual: z.string().min(6, 'Senha atual obrigatória'),
  senhaNova: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  senhaConfirm: z.string(),
}).refine((data) => data.senhaNova === data.senhaConfirm, {
  message: "Senhas não coincidem",
  path: ["senhaConfirm"],
});

// ============================================================================
// EXPORT
// ============================================================================

export const schemas = {
  ClienteSchema,
  OrcamentoSchema,
  OrcamentoItemSchema,
  VendaSchema,
  ContaReceberSchema,
  ContaPagarSchema,
  OrdemServicoSchema,
  UsuarioSchema,
  ChangePasswordSchema,
};
```

### Middleware de validação: `api-server/src/middleware/validateZod.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validação falhou',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      res.status(500).json({ error: 'Erro ao validar dados' });
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validação falhou',
          details: error.errors,
        });
      }
      res.status(500).json({ error: 'Erro ao validar query' });
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validação falhou',
          details: error.errors,
        });
      }
      res.status(500).json({ error: 'Erro ao validar parâmetros' });
    }
  };
};
```

### Usar nas rotas

**Exemplo em `routes/clientes.ts`:**

```typescript
import { validateBody } from '../middleware/validateZod';
import { ClienteSchema } from '../validation/schemas';

// POST - Criar cliente
router.post('/', validateBody(ClienteSchema), async (req: Request, res: Response) => {
  try {
    const { razaoSocial, email, telefone, cnpjCpf } = req.body;
    
    const cliente = await prisma.cliente.create({
      data: {
        razaoSocial,
        email,
        telefone,
        cnpjCpf,
      },
    });

    res.status(201).json(cliente);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// PATCH - Atualizar cliente
router.patch('/:id', validateBody(ClienteSchema.partial()), async (req, res) => {
  try {
    const { id } = req.params;
    
    const cliente = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: req.body,
    });

    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});
```

---

## 4️⃣ SEGURANÇA: Headers e CORS

### Atualizar `api-server/src/middleware/security.ts`

```typescript
import helmet from 'helmet';
import cors from 'cors';
import { Express } from 'express';

export const applySecurityMiddlewares = (app: Express) => {
  // ========================================================================
  // HELMET - Configurar headers de segurança
  // ========================================================================
  
  app.use(helmet({
    // HSTS - Force HTTPS
    hsts: {
      maxAge: 31536000, // 1 ano em segundos
      includeSubDomains: true,
      preload: true, // Permite HSTS preload list
    },

    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },

    // Remover header X-Powered-By
    hidePoweredBy: true,

    // Remover header X-Frame-Options padrão, usar nostrictframe
    frameguard: {
      action: 'deny',
    },

    // Proteger contra MIME type sniffing
    noSniff: true,

    // Proteção contra XSS
    xssFilter: true,

    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },

    // Permissions Policy (antes Feature Policy)
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
    },
  }));

  // ========================================================================
  // CORS - Configurar origins permitidos
  // ========================================================================
  
  const allowedOrigins = [
    ...(process.env.CORS_ORIGIN || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || /\.vercel\.app$/i.test(origin)) {
          return callback(null, true);
        }
        return callback(new Error('CORS origin not allowed'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
      maxAge: 3600, // Cache preflight por 1 hora
    }),
  );

  // ========================================================================
  // HTTPS Redirect em Produção
  // ========================================================================
  
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
  }

  // ========================================================================
  // Remover headers sensíveis
  // ========================================================================
  
  app.use((req, res, next) => {
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
};

export default applySecurityMiddlewares;
```

---

## 5️⃣ LIMPEZA: Remover Console.logs

### Criar script `scripts/remove-console-logs.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '../src');

function removeConsoleLogs(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Remove console.log
  content = content.replace(/^\s*console\.log\([^)]*\);\s*\n/gm, '');
  
  // Remove console.warn
  content = content.replace(/^\s*console\.warn\([^)]*\);\s*\n/gm, '');
  
  // Remove console.error (mantém os importantes)
  content = content.replace(/console\.error\('DEBUG: /gm, 'logger.error(');
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Cleaned: ${filePath}`);
}

function walkDir(dir: string) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.spec.ts')) {
      removeConsoleLogs(filePath);
    }
  });
}

console.log('🧹 Removendo console.logs...');
walkDir(SRC_DIR);
console.log('✅ Pronto!');
```

### Adicionar a `package.json`:

```json
{
  "scripts": {
    "clean:logs": "ts-node scripts/remove-console-logs.ts"
  }
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO - FASE 1

```
SEMANA 1-2: SEGURANÇA E CORREÇÕES

[ ] 1.1 Remover .env do Git
    [ ] Fazer backup do .env
    [ ] git filter-branch
    [ ] Force push
    [ ] Criar .env.example
    [ ] Atualizar .gitignore
    [ ] Rotacionar secrets (Render, Neon, Upstash)
    
[ ] 1.2 Implementar Rate Limiting
    [ ] Instalar express-rate-limit e rate-limit-redis
    [ ] Criar middleware/rateLimiter.ts
    [ ] Aplicar em app.ts
    [ ] Aplicar em rotas específicas (/login, /upload, etc)
    [ ] Testar com Postman/Artillery
    
[ ] 1.3 Validações Zod Completas
    [ ] Criar validation/schemas.ts
    [ ] Criar middleware/validateZod.ts
    [ ] Aplicar em POST /api/clientes
    [ ] Aplicar em PATCH /api/clientes/:id
    [ ] Aplicar em POST /api/orcamentos
    [ ] Aplicar em POST /api/vendas
    [ ] Aplicar em POST /api/anexos
    [ ] Aplicar em POST /api/financeiro/*
    
[ ] 1.4 Hardening de Segurança
    [ ] Atualizar middleware/security.ts com Helmet
    [ ] Implementar HSTS headers
    [ ] Implementar CSP headers
    [ ] Configurar CORS whitelist
    [ ] Remover headers sensíveis
    [ ] Validar HTTPS em produção
    
[ ] 1.5 Limpeza de Código
    [ ] Remover todos console.logs
    [ ] Remover imports duplicados
    [ ] Verificar middleware vs middlewares
    [ ] Remover código morto
    [ ] ESLint cleanup
    
[ ] 1.6 Testes de Segurança
    [ ] Testar com curl/Postman
    [ ] Verificar headers com curl -i
    [ ] Testar rate limiting
    [ ] Testar validações Zod
    
Status: ___/11 completo
```

---

## 📊 MÉTRICAS ESPERADAS APÓS FASE 1

```
✅ 0 vulnerabilidades críticas
✅ Sem credentials em git
✅ Rate limiting ativo em 5 níveis
✅ 100% de validação Zod em rotas críticas
✅ Headers de segurança implementados
✅ Código limpo (sem console.logs)
✅ .gitignore robusto

Segurança: 7/10 (melhoria de 5 → 7)
Pronto para: Fase 2 (Testes)
```

---

**Próximo documento:** PHASE_1_CHECKLIST.md com checklist detalhado

**Última atualização:** 26 de Maio de 2026
