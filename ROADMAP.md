# 🗓️ ROADMAP PRIORIZADO - ERP Cozinca (Próximos 3 Meses)

**Última atualização:** 26 de Maio de 2026  
**Status:** Em Desenvolvimento Avançado  
**Team Size Recomendado:** 2-3 desenvolvedores

---

## 📊 VISÃO GERAL

```
Semana 1-2 (Mai 26 - Jun 08)   : SEGURANÇA E CORREÇÕES CRÍTICAS
Semana 3-4 (Jun 09 - Jun 22)   : TESTES E DOCUMENTAÇÃO
Semana 5-6 (Jun 23 - Jul 06)   : FUNCIONALIDADES DE NEGÓCIO
Semana 7-8 (Jul 07 - Jul 20)   : MELHORIAS DE PERFORMANCE
Semana 9-10 (Jul 21 - Aug 03)  : POLIMENTO E PREPARAÇÃO PARA PRODUÇÃO
Semana 11-12 (Aug 04 - Aug 17) : MONITORAMENTO E OTIMIZAÇÃO
```

---

## 🔴 FASE 1: SEGURANÇA E CORREÇÕES (2 semanas)

**Prioridade:** CRÍTICA  
**Responsável:** Todos (revisor security + dev)  
**Estimativa:** 10 dias úteis

### Tarefas:

#### 1.1 Remover .env do Git ⚠️ **URGENTE**
```
Status: TODO
Estimativa: 1 dia
Responsável: Lead Dev

Checklist:
- [ ] Fazer backup do .env com credenciais
- [ ] Executar git filter-branch
- [ ] Rotacionar JWT_SECRET no Render
- [ ] Rotacionar DATABASE_URL no Neon
- [ ] Rotacionar REDIS credenciais
- [ ] Fazer força reset do repositório
- [ ] Comunicar ao time sobre mudança
- [ ] Atualizar documentação
```

#### 1.2 Implementar Rate Limiting Global
```
Status: TODO
Estimativa: 2 dias
Responsável: Backend Dev

Tarefas:
- [ ] Criar middleware/rateLimiter.ts
- [ ] Implementar 5 níveis de rate limit
  - [ ] Geral: 100 req/15min
  - [ ] Login: 5 tentativas/15min
  - [ ] API: 30 req/1min
  - [ ] Upload: 5 arquivos/10min
  - [ ] Search: 20 req/1min
- [ ] Testes com JMeter/Artillery
- [ ] Documentar limites no Swagger
```

#### 1.3 Hardening de Segurança
```
Status: TODO
Estimativa: 3 dias
Responsável: Backend Dev

Tarefas:
- [ ] Adicionar HSTS header (helmet update)
- [ ] Implementar CORS com whitelist
- [ ] Validar HTTPS em produção
- [ ] Adicionar CSP headers
- [ ] Remover headers sensíveis (X-Powered-By)
- [ ] Implementar CSRF protection
- [ ] Testar com OWASP ZAP
```

#### 1.4 Validações Zod em Todas as Rotas
```
Status: TODO
Estimativa: 3 dias
Responsável: Backend Dev

Rotas a validar:
- [ ] POST /api/clientes
- [ ] PATCH /api/clientes/:id
- [ ] POST /api/orcamentos
- [ ] PATCH /api/orcamentos/:id
- [ ] POST /api/vendas
- [ ] PATCH /api/vendas/:id
- [ ] POST /api/os/:id/observacoes
- [ ] POST /api/anexos
- [ ] POST /api/financeiro/*

Validações específicas:
- [ ] Email válido
- [ ] CNPJ/CPF com regex
- [ ] Datas (não podem ser passadas)
- [ ] Valores (>0)
- [ ] Tamanho de strings
- [ ] Tipo de enum
```

#### 1.5 Limpar Código e Duplicatas
```
Status: TODO
Estimativa: 1 dia
Responsável: Code Review

Tarefas:
- [ ] Verificar middleware vs middlewares
- [ ] Remover console.log
- [ ] Consolidar imports duplicados
- [ ] Remover código morto
- [ ] Verificar imports não usados
```

### Saída esperada:
- ✅ Repositório seguro (sem credentials)
- ✅ Rate limiting ativo
- ✅ Todas as rotas validadas
- ✅ Headers de segurança configurados
- ✅ Código limpo

---

## 🟡 FASE 2: TESTES E DOCUMENTAÇÃO (2 semanas)

**Prioridade:** ALTA  
**Responsável:** QA/Dev  
**Estimativa:** 10 dias úteis

### 2.1 Setup de Testes com Jest
```
Status: TODO
Estimativa: 2 dias
Responsável: Lead Dev

Tarefas:
- [ ] npm install jest @types/jest ts-jest supertest
- [ ] Criar jest.config.js
- [ ] Criar test environment (.env.test)
- [ ] Criar helpers para setup de DB de teste
- [ ] Configurar CI para rodar testes
```

### 2.2 Testes de Autenticação
```
Status: TODO
Estimativa: 2 dias
Responsável: QA Dev

Testes necessários:
- [ ] POST /api/auth/login - credenciais válidas
- [ ] POST /api/auth/login - credenciais inválidas
- [ ] POST /api/auth/login - email não existe
- [ ] POST /api/auth/logout - com token válido
- [ ] GET /api/auth/me - com token válido
- [ ] GET /api/auth/me - sem token
- [ ] GET /api/auth/me - com token expirado
- [ ] POST /api/auth/refresh - com refresh token válido
- [ ] POST /api/auth/refresh - com token expirado

Meta: 100% coverage (12 testes)
```

### 2.3 Testes de Rotas Críticas
```
Status: TODO
Estimativa: 3 dias
Responsável: QA Dev

Rotas:
- [ ] GET /api/clientes (listagem com filtro)
- [ ] POST /api/clientes (criar)
- [ ] PATCH /api/clientes/:id (editar)
- [ ] DELETE /api/clientes/:id (deletar)
- [ ] POST /api/orcamentos (criar)
- [ ] POST /api/orcamentos/:id/converter (converter para venda)
- [ ] POST /api/vendas/:id/gerar-os (gerar O.S.)
- [ ] PATCH /api/os/:id (atualizar status)

Meta: 60+ testes no total
Coverage: >60%
```

### 2.4 Documentação com Swagger
```
Status: TODO
Estimativa: 2 dias
Responsável: Dev + Doc

Tarefas:
- [ ] npm install swagger-jsdoc swagger-ui-express
- [ ] Criar swagger.ts
- [ ] Documentar todas as rotas
- [ ] Adicionar exemplos de request/response
- [ ] Documentar status codes
- [ ] Documentar campos de erro
- [ ] Teste manual da documentação

Endpoints a documentar: 40+
```

### 2.5 README Melhorado
```
Status: TODO
Estimativa: 1 dia
Responsável: Doc

Adicionar ao README:
- [ ] Como rodar localmente (passo a passo)
- [ ] Estrutura de pastas explicada
- [ ] Como criar arquivo .env
- [ ] Como rodar migrations
- [ ] Como rodar testes
- [ ] Como acessar Swagger
- [ ] Troubleshooting comum
- [ ] Contribuição guidelines
```

### Saída esperada:
- ✅ 60+ testes com >60% coverage
- ✅ Swagger documentado (acessível em /api-docs)
- ✅ README completo
- ✅ Testes rodando no CI

---

## 🟢 FASE 3: FUNCIONALIDADES DE NEGÓCIO (2 semanas)

**Prioridade:** ALTA  
**Responsável:** Dev  
**Estimativa:** 10 dias úteis

### 3.1 Geração de PDF
```
Status: TODO
Estimativa: 3 dias

Templates:
- [ ] Orçamento
- [ ] Ordem de Serviço
- [ ] Relatório de Vendas

Rotas:
- [ ] GET /api/orcamentos/:id/pdf
- [ ] GET /api/os/:id/pdf
- [ ] GET /api/vendas/relatorio/pdf

Implementar com: pdfkit ou puppeteer
```

### 3.2 Integração de Email
```
Status: TODO
Estimativa: 2 dias

Templates de Email:
- [ ] Confirmação de Orçamento
- [ ] Orçamento Aprovado
- [ ] O.S. Criada
- [ ] O.S. Concluída
- [ ] Pagamento Recebido
- [ ] Conta a Pagar Vencida

Implementar com: nodemailer + template engine
```

### 3.3 Backup Automático
```
Status: TODO
Estimativa: 1 dia

Tarefas:
- [ ] Criar script backup.ts
- [ ] Testar backup manual
- [ ] Configurar cron job
- [ ] Retenção de 7 últimos backups
- [ ] Testar restore de backup
```

### 3.4 Melhorias Frontend - Busca Global
```
Status: TODO
Estimativa: 2 dias

Implementar busca em:
- [ ] Clientes
- [ ] Orçamentos
- [ ] Ordens de Serviço
- [ ] Produtos
```

### 3.5 Exportação para Excel
```
Status: TODO
Estimativa: 1 dia

Exportar:
- [ ] Listagem de clientes
- [ ] Listagem de orçamentos
- [ ] Listagem de O.S.
- [ ] Listagem de vendas
- [ ] Relatório financeiro
```

### Saída esperada:
- ✅ PDFs funcionando
- ✅ Emails sendo enviados
- ✅ Backup automático configurado
- ✅ Busca global funcionando
- ✅ Exportação para Excel

---

## 🟠 FASE 4: PERFORMANCE E OTIMIZAÇÕES (2 semanas)

**Prioridade:** MÉDIA  
**Responsável:** Dev  
**Estimativa:** 10 dias úteis

### 4.1 Cache Redis
```
Status: TODO
Estimativa: 2 dias

Cache em:
- [ ] GET /api/clientes (5 min)
- [ ] GET /api/produtos (10 min)
- [ ] GET /api/dashboard/stats (2 min)
- [ ] GET /api/os (com filtros)
```

### 4.2 Code Splitting Frontend
```
Status: TODO
Estimativa: 2 dias

Lazy load componentes grandes
```

### 4.3 Database Optimization
```
Status: TODO
Estimativa: 2 dias

- [ ] Adicionar índices em colunas críticas
- [ ] Otimizar queries N+1
- [ ] Revisar migrations antigas
```

### 4.4 Bundle Size Optimization
```
Status: TODO
Estimativa: 1 dia

Meta: <500KB (gzip)
```

### 4.5 HTTP Caching
```
Status: TODO
Estimativa: 1 dia

- [ ] Cache-Control headers
- [ ] ETag para respostas
- [ ] Last-Modified headers
- [ ] Compressão gzip
```

### Saída esperada:
- ✅ Cache Redis funcionando
- ✅ Code splitting implementado
- ✅ Database otimizado
- ✅ Bundle size reduzido
- ✅ HTTP caching ativo

---

## 🔵 FASE 5: POLIMENTO (2 semanas)

**Prioridade:** MÉDIA  
**Estimativa:** 10 dias úteis

### 5.1 Tratamento de Erros Melhorado
- [ ] Sentry para rastreamento
- [ ] Error boundaries React
- [ ] Retry automático

### 5.2 Refinamento de UX
- [ ] Loading states
- [ ] Toast notifications
- [ ] Confirmação antes de deletar
- [ ] Acessibilidade (WCAG 2.1 AA)

### 5.3 Mobile Responsiveness
- [ ] iPhone/Android/Tablet
- [ ] Testes manuais

### 5.4 Testes e2e
- [ ] Fluxo completo orçamento → venda → O.S.
- [ ] Framework: Playwright ou Cypress

### 5.5 Documentação de Usuário
- [ ] Manual do usuário
- [ ] Vídeos tutoriais
- [ ] FAQs

### Saída esperada:
- ✅ Tratamento de erros robusto
- ✅ UX refinada
- ✅ Mobile responsivo
- ✅ Testes e2e passando
- ✅ Documentação completa

---

## 🟣 FASE 6: PRODUÇÃO (2 semanas)

**Prioridade:** CRÍTICA  
**Estimativa:** 10 dias úteis

### 6.1 Setup de Monitoramento
- [ ] Sentry para error tracking
- [ ] APM (New Relic/Datadog)
- [ ] Uptime monitoring
- [ ] Log agregação

### 6.2 Performance Testing
- [ ] Load testing (k6/Artillery)
- [ ] Teste com 100+ usuários simultâneos
- [ ] Stress testing

### 6.3 Database Migration
- [ ] Backup completo
- [ ] Script de rollback
- [ ] Testar em staging

### 6.4 SSL/TLS
- [ ] Certificado SSL válido
- [ ] HSTS pré-carregamento
- [ ] SSL Labs testing

### 6.5 Documentação Operacional
- [ ] Runbook deployment
- [ ] Runbook rollback
- [ ] Disaster recovery

### Saída esperada:
- ✅ Monitoramento ativo
- ✅ Performance comprovada
- ✅ Database pronto
- ✅ SSL configurado
- ✅ Operação pronta

---

## 📋 MÉTRICAS DE SUCESSO

| Fase | Métrica | Status |
|------|---------|--------|
| 1 | 0 vulnerabilidades críticas | ⏳ TODO |
| 1 | Sem credentials em git | ⏳ TODO |
| 1 | Rate limiting ativo | ⏳ TODO |
| 2 | >60% code coverage | ⏳ TODO |
| 2 | 60+ testes implementados | ⏳ TODO |
| 2 | Swagger documentado | ⏳ TODO |
| 3 | PDFs funcionando | ⏳ TODO |
| 3 | Emails enviados | ⏳ TODO |
| 3 | Backup automático | ⏳ TODO |
| 4 | Bundle size <500KB | ⏳ TODO |
| 5 | 95% mobile responsiveness | ⏳ TODO |
| 6 | 99.9% uptime | ⏳ TODO |

---

## 💰 ESTIMATIVA DE ESFORÇO

```
Fase 1 (Segurança)          : 10 dias
Fase 2 (Testes)             : 10 dias
Fase 3 (Funcionalidades)    : 10 dias
Fase 4 (Performance)        : 10 dias
Fase 5 (Polimento)          : 10 dias
Fase 6 (Produção)           : 10 dias
───────────────────────────────────
TOTAL                       : 60 dias úteis (3 meses)

Para 1 dev: 3 meses
Para 2 devs: 1,5 meses (paralelo)
Para 3 devs: 1 mês (com coordenação)
```

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Criar documento de roadmap (FEITO)
2. ⏳ Remover .env do git (URGENTE)
3. ⏳ Iniciar Phase 1 implementação
4. ⏳ Setup CI/CD para testes

---

**Última atualização:** 2026-05-26T00:00:00Z  
**Versão:** 1.0  
**Mantido por:** DevOps Team
