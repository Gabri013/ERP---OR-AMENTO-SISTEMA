# 🛠️ GUIA PRÁTICO - IMPLEMENTAÇÕES IMEDIATAS

**Objetivo:** Levar o ERP de 8.6/10 para 9.5/10 em 3 sprints  
**Tempo Estimado:** 3-4 semanas  
**Prioridade:** ALTA

---

## 1️⃣ REFATORAR ROTAS GRANDES (3 dias)

### Problema Atual
```
os.ts: 657 linhas (muito grande)
orcamentos.ts: 435 linhas
vendas.ts: 406 linhas

Resultado: Difícil manter, difícil ler, difícil testar
```

### Solução: Dividir em Arquivos

**Estrutura Nova:**
```
routes/
├── os/
│   ├── index.ts         (importa e agrupa)
│   ├── list.ts          (GET /)
│   ├── get.ts           (GET /:id)
│   ├── create.ts        (POST /)
│   ├── update.ts        (PATCH /:id)
│   ├── delete.ts        (DELETE /:id)
│   ├── transitions.ts    (POST /:id/avancar-etapa, etc)
│   ├── attachments.ts    (anexos)
│   └── checklists.ts     (checklists)
├── orcamentos/
│   ├── index.ts
│   ├── list.ts
│   ├── create.ts
│   ├── update.ts
│   └── conversions.ts    (converter para venda)
└── vendas/
    ├── index.ts
    ├── list.ts
    ├── create.ts
    └── generate-os.ts
```

### Implementação Passo a Passo

**Step 1: Criar novo arquivo routes/os/list.ts**

```typescript
import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { auditLog } from "../../middleware/audit";
import { getPagination, buildMeta } from "../../utils/pagination";

export const listRouter = Router();

listRouter.get(
  "/",
  requireAuth,
  checkPermission('os', 'visualizar'),
  auditLog({ action: "list", module: "os", table: "OrdemServico" }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const { offset } = getPagination(Number(page), Number(limit));

      const [data, total] = await Promise.all([
        db.ordemServico.findMany({
          skip: offset,
          take: Number(limit),
          include: { cliente: true, venda: true },
          orderBy: { createdAt: 'desc' }
        }),
        db.ordemServico.count()
      ]);

      res.json({
        data,
        meta: buildMeta(Number(page), Number(limit), total)
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao listar O.S." });
    }
  }
);
```

**Step 2: Criar routes/os/create.ts**

```typescript
import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { validateBody } from "../../middleware/validateZod";
import { CreateOSSchema } from "../../schemas";

export const createRouter = Router();

createRouter.post(
  "/",
  requireAuth,
  checkPermission('os', 'criar'),
  validateBody(CreateOSSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { vendaId, clienteId, dataInicio, ...rest } = req.body;

      const os = await db.ordemServico.create({
        data: {
          numero: `OS-${Date.now()}`,
          vendaId,
          clienteId,
          dataInicio: new Date(dataInicio),
          status: "pendente",
          etapaAtual: "autorizacao",
          ...rest
        },
        include: { cliente: true, venda: true }
      });

      res.status(201).json(os);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao criar O.S." });
    }
  }
);
```

**Step 3: Criar routes/os/transitions.ts**

```typescript
import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { canTransitionEtapa } from "../../lib/stateMachine";

export const transitionsRouter = Router();

transitionsRouter.post(
  "/:id/avancar-etapa",
  requireAuth,
  checkPermission('os', 'avancar_etapa'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const os = await db.ordemServico.findUnique({
        where: { id: Number(id) }
      });

      if (!os) {
        res.status(404).json({ error: "O.S. não encontrada" });
        return;
      }

      const podeAvancar = await canTransitionEtapa(
        os.etapaAtual,
        os.status
      );

      if (!podeAvancar) {
        res.status(400).json({ error: "Não pode avançar de etapa" });
        return;
      }

      const novaEtapa = await getProximaEtapa(os.etapaAtual);
      
      const updated = await db.ordemServico.update({
        where: { id: Number(id) },
        data: { etapaAtual: novaEtapa }
      });

      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao avançar etapa" });
    }
  }
);

async function getProximaEtapa(etapa: string): Promise<string> {
  const ordem = [
    "autorizacao", "corte", "dobra", "solda", 
    "refrigeracao", "acabamento", "finalizacao", "montagem", "concluida"
  ];
  
  const indiceAtual = ordem.indexOf(etapa);
  return ordem[indiceAtual + 1] || "concluida";
}
```

**Step 4: Criar routes/os/index.ts**

```typescript
import { Router, type IRouter } from "express";
import { listRouter } from "./list";
import { getRouter } from "./get";
import { createRouter } from "./create";
import { updateRouter } from "./update";
import { deleteRouter } from "./delete";
import { transitionsRouter } from "./transitions";
import { attachmentsRouter } from "./attachments";
import { checklistsRouter } from "./checklists";

const router: IRouter = Router();

// Mount all sub-routers
router.use(listRouter);
router.use(getRouter);
router.use(createRouter);
router.use(updateRouter);
router.use(deleteRouter);
router.use(transitionsRouter);
router.use(attachmentsRouter);
router.use(checklistsRouter);

export default router;
```

**Step 5: Atualizar routes/index.ts**

```typescript
import osRoutes from "./os/index";
import orcamentoRoutes from "./orcamentos/index";
import vendaRoutes from "./vendas/index";
// ... outras rotas

router.use("/os", osRoutes);
router.use("/orcamentos", orcamentoRoutes);
router.use("/vendas", vendaRoutes);
// ...
```

### Benefícios
```
✅ Cada arquivo ~100-150 linhas
✅ Mais fácil para encontrar código
✅ Mais fácil para testar
✅ Mais fácil para manter
✅ Mais fácil para colaborar no time
```

---

## 2️⃣ IMPLEMENTAR MESSAGE QUEUE (3 dias)

### Problema
```
Atual: Emails, PDFs, relatórios são síncronos
  - Bloqueia request do usuário
  - Se falhar, usuário vê erro
  - Não pode fazer retry automático

Resultado: UX ruim, pode dar timeout
```

### Solução: Bull Queue + Redis

**Step 1: Instalar dependências**

```bash
cd api-server
npm install bull @types/bull
npm install redis @upstash/redis
```

**Step 2: Criar lib/queue.ts**

```typescript
import Queue, { Queue as BullQueue } from 'bull';
import { logger } from './logger';

// Fila para envio de emails
export const emailQueue: BullQueue = new Queue('email', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    attempts: 3, // Tentar 3 vezes
    backoff: {
      type: 'exponential',
      delay: 2000, // Delay exponencial
    },
  },
});

// Fila para geração de PDFs
export const pdfQueue: BullQueue = new Queue('pdf', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
});

// Fila para relatórios
export const reportQueue: BullQueue = new Queue('report', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
});

// Event listeners
emailQueue.on('completed', (job) => {
  logger.info(`Email job ${job.id} completed`);
});

emailQueue.on('failed', (job, err) => {
  logger.error(`Email job ${job.id} failed:`, err);
});

pdfQueue.on('completed', (job) => {
  logger.info(`PDF job ${job.id} completed`);
});

pdfQueue.on('failed', (job, err) => {
  logger.error(`PDF job ${job.id} failed:`, err);
});

export default {
  emailQueue,
  pdfQueue,
  reportQueue,
};
```

**Step 3: Criar services/queue-processors.ts**

```typescript
import { emailQueue, pdfQueue, reportQueue } from '../lib/queue';
import { sendEmail } from '../lib/email';
import { generateOSPDF, generateOrcamentoPDF } from '../lib/pdf';
import { logger } from '../lib/logger';
import { db } from '../lib/prisma';

// Processar jobs de email
emailQueue.process(async (job) => {
  logger.info(`Processing email job ${job.id}`, job.data);

  const { to, subject, template, data } = job.data;

  try {
    const html = await renderEmailTemplate(template, data);
    await sendEmail(to, subject, html);
    logger.info(`Email sent to ${to}`);
  } catch (error) {
    logger.error(`Failed to send email:`, error);
    throw error; // Bull vai tentar novamente
  }
});

// Processar jobs de PDF
pdfQueue.process(async (job) => {
  logger.info(`Processing PDF job ${job.id}`, job.data);

  const { type, id, userId } = job.data;

  try {
    let pdf;
    
    if (type === 'orcamento') {
      const orcamento = await db.orcamento.findUnique({
        where: { id },
        include: { cliente: true, itens: true }
      });
      pdf = await generateOrcamentoPDF(orcamento);
    } else if (type === 'os') {
      const os = await db.ordemServico.findUnique({
        where: { id },
        include: { cliente: true, venda: true }
      });
      pdf = await generateOSPDF(os);
    }

    // Salvar em storage
    const filename = `${type}-${id}-${Date.now()}.pdf`;
    // await uploadToS3(pdf, filename);

    return { filename, type, id };
  } catch (error) {
    logger.error(`Failed to generate PDF:`, error);
    throw error;
  }
});

// Processar jobs de relatórios
reportQueue.process(async (job) => {
  logger.info(`Processing report job ${job.id}`, job.data);

  const { type, filters, userId } = job.data;

  try {
    let reportData;

    if (type === 'vendas') {
      reportData = await generateSalesReport(filters);
    } else if (type === 'financeiro') {
      reportData = await generateFinancialReport(filters);
    } else if (type === 'producao') {
      reportData = await generateProductionReport(filters);
    }

    // Enviar por email
    await emailQueue.add({
      to: (await db.usuario.findUnique({ where: { id: userId } }))?.email,
      subject: `Relatório ${type} - ${new Date().toLocaleDateString()}`,
      template: 'report',
      data: reportData
    });

    return { type, generated: true };
  } catch (error) {
    logger.error(`Failed to generate report:`, error);
    throw error;
  }
});

async function renderEmailTemplate(template: string, data: any): Promise<string> {
  // Implementar templates de email
  switch (template) {
    case 'os_criada':
      return `<h1>Ordem de Serviço Criada</h1><p>O.S. #${data.numero}</p>`;
    case 'pagamento_recebido':
      return `<h1>Pagamento Recebido</h1><p>Valor: R$ ${data.valor}</p>`;
    case 'report':
      return `<h1>Relatório</h1><pre>${JSON.stringify(data, null, 2)}</pre>`;
    default:
      return data.html || '';
  }
}

async function generateSalesReport(filters: any) {
  // Implementar geração de relatório
  return await db.venda.findMany({
    where: filters,
    include: { usuario: true, cliente: true }
  });
}

async function generateFinancialReport(filters: any) {
  // Implementar
  return {};
}

async function generateProductionReport(filters: any) {
  // Implementar
  return {};
}

export default {
  emailQueue,
  pdfQueue,
  reportQueue
};
```

**Step 4: Usar Queues nas Rotas**

```typescript
// ANTES (síncrono, bloqueia):
router.post('/os/:id/gerar-pdf', async (req, res) => {
  const pdf = await generateOSPDF(os); // Espera terminar
  res.json({ success: true });
});

// DEPOIS (assíncrono com queue):
import { pdfQueue } from '../lib/queue';

router.post('/os/:id/gerar-pdf', async (req, res) => {
  const job = await pdfQueue.add({
    type: 'os',
    id: Number(req.params.id),
    userId: req.currentUser.id
  });

  res.json({ 
    jobId: job.id,
    status: 'processing'
  });
});

// Verificar status:
router.get('/jobs/:jobId/status', async (req, res) => {
  const job = await pdfQueue.getJob(req.params.jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const progress = await job.progress();
  const state = await job.getState();

  res.json({
    jobId: job.id,
    state,
    progress,
    result: job.returnvalue
  });
});
```

**Step 5: Usar em app.ts**

```typescript
import app from './app';
import './services/queue-processors'; // Iniciar processadores

const server = http.createServer(app);
// ... resto do código
```

### Benefícios

```
✅ Requests mais rápidos (não precisa esperar)
✅ Retry automático se falhar
✅ Escalável (processar em workers separados)
✅ Melhor UX (feedback imediato)
✅ Histórico de jobs
✅ Dashboard de jobs com Bull Board
```

### Bonus: Adicionar Bull Board (Dashboard)

```bash
npm install @bull-board/express @bull-board/ui
```

```typescript
import { createBullBoard } from '@bull-board/express';
import { BullAdapter } from '@bull-board/api/bullAdapter';

const { router: bullRouter } = createBullBoard({
  queues: [
    new BullAdapter(emailQueue),
    new BullAdapter(pdfQueue),
    new BullAdapter(reportQueue),
  ],
  options: {
    uiConfig: {
      defaultLanguage: 'pt-BR',
    },
  },
});

app.use('/admin/queues', bullRouter);
```

Agora pode acessar em: `http://localhost:3001/admin/queues`

---

## 3️⃣ AUMENTAR COBERTURA DE TESTES (4 dias)

### Atual
```
Total: 45 testes
Coverage: ~60%

Faltando:
- Orcamentos (0 testes)
- Vendas (0 testes)
- O.S. (0 testes)
- Financeiro (0 testes)
```

### Meta
```
Total: 100+ testes
Coverage: 80%
```

### Implementação

**Step 1: Criar test/orcamentos.test.ts**

```typescript
import request from 'supertest';
import app from '../../app';
import { db } from '../../lib/prisma';

describe('Orcamentos Routes', () => {
  let token: string;
  let userId: number;
  let clienteId: number;

  beforeAll(async () => {
    // Setup: criar usuário de teste
    userId = 1; // Mock
    clienteId = 1;
    token = 'valid-token'; // Mock JWT
  });

  describe('GET /api/orcamentos', () => {
    it('Deve listar orçamentos', async () => {
      const res = await request(app)
        .get('/api/orcamentos')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('Deve respeitar paginação', async () => {
      const res = await request(app)
        .get('/api/orcamentos?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(10);
    });
  });

  describe('POST /api/orcamentos', () => {
    it('Deve criar orçamento válido', async () => {
      const res = await request(app)
        .post('/api/orcamentos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clienteId,
          itens: [
            {
              descricaoManual: 'Produto teste',
              quantidade: 5,
              valorUnitario: 100,
              valorTotal: 500
            }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.numero).toMatch(/ORC-\d+/);
      expect(res.body.valorTotal).toBe(500);
    });

    it('Deve rejeitar sem cliente', async () => {
      const res = await request(app)
        .post('/api/orcamentos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          itens: []
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('Deve rejeitar com itens vazios', async () => {
      const res = await request(app)
        .post('/api/orcamentos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clienteId,
          itens: []
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/orcamentos/:id', () => {
    it('Deve atualizar orçamento', async () => {
      const orcamento = { id: 1 }; // Mock

      const res = await request(app)
        .patch(`/api/orcamentos/${orcamento.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          observacoes: 'Atualizado'
        });

      expect(res.status).toBe(200);
      expect(res.body.observacoes).toBe('Atualizado');
    });
  });

  describe('POST /api/orcamentos/:id/converter', () => {
    it('Deve converter em venda', async () => {
      const orcamento = { id: 1 };

      const res = await request(app)
        .post(`/api/orcamentos/${orcamento.id}/converter`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.venda.numero).toMatch(/VND-\d+/);
    });

    it('Deve rejeitar conversão dupla', async () => {
      const orcamento = { id: 2, status: 'convertido' };

      const res = await request(app)
        .post(`/api/orcamentos/${orcamento.id}/converter`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/orcamentos/:id', () => {
    it('Deve deletar orçamento', async () => {
      const orcamento = { id: 3 };

      const res = await request(app)
        .delete(`/api/orcamentos/${orcamento.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('Deve rejeitar se não existir', async () => {
      const res = await request(app)
        .delete('/api/orcamentos/9999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
```

**Step 2: Criar test/vendas.test.ts**

```typescript
// Similar ao acima, mas para vendas
describe('Vendas Routes', () => {
  describe('POST /api/vendas', () => {
    it('Deve criar venda de orçamento', async () => {
      // teste
    });

    it('Deve gerar O.S. automática', async () => {
      // teste
    });
  });

  describe('POST /api/vendas/:id/gerar-os', () => {
    it('Deve criar O.S. com etapas', async () => {
      // teste
    });
  });
});
```

**Step 3: Script para rodar testes**

```bash
# Rodar tudo
npm test

# Com coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Checklist de Testes
```
□ Orcamentos (10+ testes)
□ Vendas (10+ testes)
□ O.S. (15+ testes)
□ Financeiro (10+ testes)
□ Permissões (10+ testes)
□ Email (5 testes)
□ PDF (5 testes)
□ Utils (10+ testes)

Meta: 100+ testes, 80%+ coverage
```

---

## 4️⃣ IMPLEMENTAR 2FA (2-3 dias)

### Problema
```
Atual: Login com apenas email + senha
Risco: Senhas podem ser comprometidas (phishing, etc)

Solução: Two-Factor Authentication (2FA)
```

### Implementação com TOTP

**Step 1: Instalar dependências**

```bash
npm install speakeasy qrcode
```

**Step 2: Estender schema do Prisma**

```prisma
model Usuario {
  // ... campos existentes
  
  // 2FA fields
  twoFactorEnabled    Boolean   @default(false)
  twoFactorSecret     String?   @db.Text // Armazenar encriptado
  backupCodes         String[]  @default([])
}
```

**Step 3: Criar lib/2fa.ts**

```typescript
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
  backupCodes: string[];
}

/**
 * Gerar novo 2FA secret
 */
export async function generateTwoFactorSecret(email: string): Promise<TwoFactorSetup> {
  const secret = speakeasy.generateSecret({
    name: `ERP Cozinca (${email})`,
    issuer: 'ERP Cozinca',
    length: 32
  });

  // Gerar QR Code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  // Gerar backup codes (10 códigos de 8 dígitos)
  const backupCodes = Array(10)
    .fill(0)
    .map(() => Math.random().toString(36).substring(2, 10).toUpperCase());

  return {
    secret: secret.base32,
    qrCode,
    manualEntryKey: secret.base32,
    backupCodes
  };
}

/**
 * Verificar token TOTP
 */
export function verifyToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Permitir 2 janelas de 30s (antes e depois)
  });
}

/**
 * Verificar backup code
 */
export function verifyBackupCode(backup: string[], code: string): { valid: boolean; index?: number } {
  const index = backup.indexOf(code.toUpperCase());
  if (index === -1) return { valid: false };
  return { valid: true, index };
}
```

**Step 4: Criar rotas de 2FA**

```typescript
// routes/auth/2fa.ts
import { Router } from 'express';
import { generateTwoFactorSecret, verifyToken, verifyBackupCode } from '../../lib/2fa';
import { db } from '../../lib/prisma';
import { requireAuth } from '../../middleware/auth';

const router = Router();

/**
 * POST /api/auth/2fa/setup
 * Gerar secret 2FA
 */
router.post('/setup', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).currentUser.id;
    const user = await db.usuario.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const twoFactorSetup = await generateTwoFactorSecret(user.email);

    // Salvar secret temporário (não ativar ainda)
    // Enviar QR code para frontend

    res.json({
      qrCode: twoFactorSetup.qrCode,
      manualEntryKey: twoFactorSetup.manualEntryKey,
      backupCodes: twoFactorSetup.backupCodes,
      secret: twoFactorSetup.secret // Enviar para confirmar depois
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao setup 2FA' });
  }
});

/**
 * POST /api/auth/2fa/verify
 * Verificar e ativar 2FA
 */
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).currentUser.id;
    const { token, secret, backupCodes } = req.body;

    // Verificar token
    const isValid = verifyToken(secret, token);
    if (!isValid) {
      return res.status(400).json({ error: 'Token inválido' });
    }

    // Ativar 2FA no usuário
    await db.usuario.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret, // Encriptar em produção!
        backupCodes
      }
    });

    res.json({ message: '2FA ativado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao ativar 2FA' });
  }
});

/**
 * POST /api/auth/2fa/disable
 * Desativar 2FA
 */
router.post('/disable', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).currentUser.id;
    const { password } = req.body;

    // Verificar senha antes de desativar
    // ...

    await db.usuario.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: []
      }
    });

    res.json({ message: '2FA desativado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao desativar 2FA' });
  }
});

export default router;
```

**Step 5: Modificar login para suportar 2FA**

```typescript
// routes/auth/login.ts (modificado)
router.post('/login', async (req, res) => {
  try {
    const { email, password, totpToken, backupCode } = req.body;

    // ... validar email/password normalmente

    const user = await db.usuario.findUnique({ where: { email } });

    // Se 2FA está ativado
    if (user.twoFactorEnabled) {
      // Verificar TOTP token
      if (totpToken) {
        const isValid = verifyToken(user.twoFactorSecret, totpToken);
        if (!isValid) {
          return res.status(401).json({ error: 'Token 2FA inválido' });
        }
      }
      // Ou verificar backup code
      else if (backupCode) {
        const { valid, index } = verifyBackupCode(user.backupCodes, backupCode);
        if (!valid || index === undefined) {
          return res.status(401).json({ error: 'Backup code inválido' });
        }

        // Remover o backup code usado
        user.backupCodes.splice(index, 1);
        await db.usuario.update({
          where: { id: user.id },
          data: { backupCodes: user.backupCodes }
        });
      } else {
        return res.status(401).json({ error: '2FA token required' });
      }
    }

    // Gerar tokens de login
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      accessToken,
      refreshToken,
      usuario: { id: user.id, nome: user.nome, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro no login' });
  }
});
```

### Frontend Integration

```typescript
// Após login bem-sucedido
if (responseNeedsOTP) {
  // Mostrar tela de verificação 2FA
  showOTPScreen();
}

// Usuário entra token
const response = await api.post('/auth/login', {
  email,
  password,
  totpToken: '123456'
});
```

---

## 🎯 CHECKLIST IMPLEMENTAÇÃO

```
Semana 1:
□ Refatorar rotas grandes (os, orcamentos, vendas)
□ Criar testes para rotas refatoradas
□ Merge e deploy em staging

Semana 2:
□ Implementar Bull Queue
□ Migrar emails para queue
□ Migrar PDFs para queue
□ Migrar relatórios para queue
□ Testes de queue
□ Merge e deploy

Semana 3:
□ Completar cobertura de testes (100+ testes)
□ Implementar 2FA
□ Testes de 2FA
□ Merge e deploy

Semana 4 (Sprint bonus):
□ GraphQL (opcional)
□ Search avançado (opcional)
```

---

## 📊 ANTES vs DEPOIS

| Métrica | Antes | Depois |
|---------|-------|--------|
| Score Geral | 8.6/10 | 9.5/10 |
| Cobertura Testes | 60% | 80%+ |
| Tamanho maior arquivo | 657 linhas | <150 linhas |
| 2FA | ❌ | ✅ |
| Message Queue | ❌ | ✅ |
| Response time | ~500ms | ~100ms* |

*Para operações que usam queue

---

**Tempo Total Estimado: 3-4 semanas de desenvolvimento**

**Resultado: Sistema production-ready 9.5/10** ✅
