# ✅ PHASE 1 CHECKLIST - SEGURANÇA E CORREÇÕES

**Timeline:** Semana 1-2 (10 dias úteis)  
**Status:** Em Progresso  
**Prioridade:** 🔴 CRÍTICA

---

## 🔴 TAREFA 1.1: Remover .env do Git

**Estimativa:** 1 dia (2-3 horas de execução)  
**Responsável:** Lead Dev  
**Impacto:** CRÍTICO

### Subtarefas

- [ ] **1.1.1** Fazer backup do arquivo .env
  - [ ] Copiar para local seguro
  - [ ] Guardar nome: `api-server/.env.backup`
  - [ ] Verificar que tem DATABASE_URL, JWT_SECRET, REDIS credentials

- [ ] **1.1.2** Remover do histórico Git
  - [ ] Executar: `git filter-branch --tree-filter 'rm -f api-server/.env api-server/.env.txt' HEAD`
  - [ ] Ou usar BFG: `bfg --delete-files api-server/.env`
  - [ ] Aguardar conclusão
  - [ ] Verificar output

- [ ] **1.1.3** Force push do repositório
  - [ ] Executar: `git push origin main --force`
  - [ ] Avisar time sobre force push
  - [ ] Todos devem fazer pull/clone novamente

- [ ] **1.1.4** Criar .env.example
  - [ ] Copiar template do SOLUTIONS_GUIDE.md
  - [ ] Remover valores sensíveis
  - [ ] Adicionar comentários explicativos
  - [ ] Commit: `git add api-server/.env.example && git commit -m "docs: add .env.example"`

- [ ] **1.1.5** Atualizar .gitignore
  - [ ] Adicionar entradas para .env
  - [ ] Adicionar entradas para logs
  - [ ] Adicionar entradas para node_modules
  - [ ] Adicionar entradas para IDE
  - [ ] Commit: `git add .gitignore && git commit -m "chore: improve .gitignore"`

- [ ] **1.1.6** Rotacionar secrets em produção
  - [ ] **Render Dashboard:**
    - [ ] Ir para projeto API
    - [ ] Environment → JWT_SECRET: Gerar novo valor
    - [ ] Fazer deploy
    
  - [ ] **Neon DB:**
    - [ ] Ir para database settings
    - [ ] Alterar PASSWORD ou criar nova role
    - [ ] Atualizar DATABASE_URL
    - [ ] Testar conexão
    
  - [ ] **Upstash Redis:**
    - [ ] Ir para console
    - [ ] Regenerate API Token
    - [ ] Atualizar UPSTASH_REDIS_REST_TOKEN

- [ ] **1.1.7** Comunicar ao time
  - [ ] Email: Avisar sobre .env removido do git
  - [ ] Slack: Postar checklist de ações necessárias
  - [ ] Docs: Atualizar README com instruções de setup

- [ ] **1.1.8** Verificação final
  - [ ] `git log --all --full-history -- 'api-server/.env'` (deve estar vazio)
  - [ ] Verificar que .env não aparece em `git ls-files`
  - [ ] Testar clone em nova pasta: verificar se .env não baixa
  - [ ] Testar build: `npm install && npm run build`

**Saída esperada:**
- ✅ .env removido do histórico Git
- ✅ .env.example criado e documentado
- ✅ .gitignore atualizado
- ✅ Secrets rotacionados
- ✅ Todo o time atualizado

---

## 🟠 TAREFA 1.2: Implementar Rate Limiting

**Estimativa:** 2 dias  
**Responsável:** Backend Dev  
**Impacto:** ALTO (segurança contra DDoS)

### Subtarefas

- [ ] **1.2.1** Instalar dependências
  - [ ] `npm install express-rate-limit rate-limit-redis`
  - [ ] Verificar package.json

- [ ] **1.2.2** Criar `api-server/src/middleware/rateLimiter.ts`
  - [ ] Copiar código do SOLUTIONS_GUIDE.md
  - [ ] Implementar 5 limiters: general, login, api, upload, search
  - [ ] Usar Redis como store (já configurado)
  - [ ] Adicionar comentários explicativos
  - [ ] Verificar tipos TypeScript

- [ ] **1.2.3** Aplicar rate limiting em app.ts
  - [ ] Importar generalLimiter
  - [ ] Aplicar: `app.use(generalLimiter)`
  - [ ] Testar se está funcionando

- [ ] **1.2.4** Aplicar em rotas específicas
  - [ ] POST `/api/auth/login` → loginLimiter (5 req/15min)
  - [ ] POST `/api/anexos/upload` → uploadLimiter (5 uploads/10min)
  - [ ] GET `/api/clientes` com search → searchLimiter (20 req/1min)
  - [ ] Verificar rotas em `/routes/*.ts`

- [ ] **1.2.5** Testes manuais
  - [ ] Abrir Postman
  - [ ] POST /api/auth/login 6x
  - [ ] Verificar que 6ª requisição retorna 429
  - [ ] Testar com diferentes IPs (usar proxy)
  - [ ] Verificar headers: X-RateLimit-Limit, X-RateLimit-Remaining

- [ ] **1.2.6** Documentar em comentários
  - [ ] Rate limits: 100/15min geral
  - [ ] Rate limits: 5/15min login
  - [ ] Rate limits: 30/1min API
  - [ ] Rate limits: 5/10min upload
  - [ ] Rate limits: 20/1min search

- [ ] **1.2.7** Verificar integrações
  - [ ] Redis está rodando
  - [ ] Conexão Redis ativa
  - [ ] Cache de rate limiting em Redis

**Saída esperada:**
- ✅ Rate limiting ativo globalmente
- ✅ 5 níveis de proteção
- ✅ Redis armazenando dados de rate limiting
- ✅ Testes manuais passando

---

## 🟠 TAREFA 1.3: Validações Zod Completas

**Estimativa:** 3 dias  
**Responsável:** Backend Dev  
**Impacto:** ALTO (segurança de dados)

### Subtarefas

- [ ] **1.3.1** Criar `api-server/src/validation/schemas.ts`
  - [ ] Copiar código do SOLUTIONS_GUIDE.md
  - [ ] Implementar schemas: Cliente, Orçamento, Venda, ContaReceber, ContaPagar, etc
  - [ ] Adicionar validações customizadas (email, CNPJ, CPF, datas)
  - [ ] Testar tipos TypeScript

- [ ] **1.3.2** Criar `api-server/src/middleware/validateZod.ts`
  - [ ] Copiar middleware do SOLUTIONS_GUIDE.md
  - [ ] Implementar: validateBody, validateQuery, validateParams
  - [ ] Retornar 400 com detalhes de erro
  - [ ] Testar

- [ ] **1.3.3** Validar rotas críticas
  - [ ] [ ] POST /api/clientes (criar)
  - [ ] [ ] PATCH /api/clientes/:id (editar)
  - [ ] [ ] POST /api/orcamentos (criar)
  - [ ] [ ] PATCH /api/orcamentos/:id (editar)
  - [ ] [ ] POST /api/vendas (criar)
  - [ ] [ ] PATCH /api/vendas/:id (editar)
  - [ ] [ ] POST /api/os/:id/observacoes (adicionar obs)
  - [ ] [ ] POST /api/anexos (upload)
  - [ ] [ ] POST /api/financeiro/* (contas)

- [ ] **1.3.4** Testes manuais de validação
  - [ ] Email inválido → retorna 400
  - [ ] Quantidade negativa → retorna 400
  - [ ] Data passada → retorna 400
  - [ ] CNPJ inválido → retorna 400
  - [ ] String muito longa → retorna 400
  - [ ] Dados válidos → sucesso 200/201

- [ ] **1.3.5** Verificar cobertura
  - [ ] Todas as rotas POST têm validação ✓
  - [ ] Todas as rotas PATCH têm validação ✓
  - [ ] Mensagens de erro são claras ✓
  - [ ] Tipos TypeScript corretos ✓

**Saída esperada:**
- ✅ Validation schemas robustos
- ✅ Middleware de validação ativo
- ✅ 100% das rotas críticas validadas
- ✅ Mensagens de erro claras

---

## 🟠 TAREFA 1.4: Hardening de Segurança

**Estimativa:** 3 dias  
**Responsável:** Backend Dev  
**Impacto:** ALTO (proteção web standard)

### Subtarefas

- [ ] **1.4.1** Atualizar Helmet (security headers)
  - [ ] Verificar versão instalada: `npm list helmet`
  - [ ] Atualizar middleware/security.ts com Helmet config
  - [ ] Implementar HSTS (1 ano)
  - [ ] Implementar CSP (Content Security Policy)
  - [ ] Implementar X-Frame-Options: DENY
  - [ ] Implementar X-Content-Type-Options: nosniff

- [ ] **1.4.2** Configurar CORS restritivamente
  - [ ] Whitelist apenas origins conhecidos
  - [ ] Localhost e frontend
  - [ ] Remover origins muito genéricas
  - [ ] Testar em Postman com invalid origin → deve ser 401

- [ ] **1.4.3** Validar HTTPS em produção
  - [ ] Adicionar middleware que redireciona HTTP → HTTPS
  - [ ] Testar com curl -I http://api.cozinca.com
  - [ ] Deve retornar 301 redirect para HTTPS

- [ ] **1.4.4** Remover headers sensíveis
  - [ ] X-Powered-By (Node.js)
  - [ ] Server (Express version)
  - [ ] Adicionar middleware que remove esses headers
  - [ ] Testar com curl -I

- [ ] **1.4.5** Implementar CSRF protection (se necessário)
  - [ ] Avaliar se precisa (SPA com JWT geralmente não precisa)
  - [ ] Se sim: instalar `csurf` ou similar
  - [ ] Implementar middleware

- [ ] **1.4.6** Testes de segurança
  - [ ] curl -I para verificar headers
  - [ ] Verificar HSTS header presente
  - [ ] Verificar CSP header presente
  - [ ] Verificar X-Frame-Options: DENY
  - [ ] Testar CORS com origin inválida

- [ ] **1.4.7** Testar com ferramentas
  - [ ] SSL Labs (https://www.ssllabs.com/ssltest/)
  - [ ] OWASP ZAP (ferramental local)
  - [ ] Mozilla Observatory (verificar headers)
  - [ ] Documentar score

**Saída esperada:**
- ✅ HSTS header implementado
- ✅ CSP header implementado
- ✅ CORS restritivo
- ✅ HTTPS em produção
- ✅ Headers sensíveis removidos
- ✅ SSL Labs Grade A

---

## 🟡 TAREFA 1.5: Limpeza de Código

**Estimativa:** 1 dia  
**Responsável:** Code Review  
**Impacto:** MÉDIO (manutenibilidade)

### Subtarefas

- [ ] **1.5.1** Remover console.logs
  - [ ] Usar script: `npm run clean:logs`
  - [ ] Verificar que código não quebrou
  - [ ] Manter logger.info() e logger.error()
  - [ ] Commit: `git add . && git commit -m "chore: remove console.logs"`

- [ ] **1.5.2** Consolidar imports duplicados
  - [ ] Procurar por: `import ... from 'express'` múltiplas vezes no mesmo arquivo
  - [ ] Consolidar em uma linha
  - [ ] Verificar que não quebrou tipos

- [ ] **1.5.3** Verificar middleware vs middlewares
  - [ ] Existe `/middleware` e `/middlewares`?
  - [ ] Se sim, consolidar em `/middleware`
  - [ ] Atualizar todos os imports
  - [ ] Remover diretório vazio

- [ ] **1.5.4** Remover código morto
  - [ ] Procurar por funções não utilizadas
  - [ ] Procurar por variáveis não utilizadas
  - [ ] Usar ESLint: `npm run lint`
  - [ ] Remover código marcado com TODO antigos

- [ ] **1.5.5** ESLint cleanup
  - [ ] `npm run lint` deve passar sem warnings
  - [ ] `npm run lint -- --fix` para auto-fix
  - [ ] Verificar que não quebrou código

- [ ] **1.5.6** Verificar imports não usados
  - [ ] Procurar por imports sem uso
  - [ ] Remover
  - [ ] Testar que build ainda passa

**Saída esperada:**
- ✅ Sem console.logs desnecessários
- ✅ Sem imports duplicados
- ✅ Sem código morto
- ✅ ESLint limpo
- ✅ Código profissional

---

## 🔵 TAREFAS ADICIONAIS

### 1.6 Testes manuais de segurança

- [ ] Testar com curl:
  ```bash
  curl -I https://api.cozinca.com
  ```
  - Verificar HSTS header
  - Verificar CSP header
  - Verificar X-Frame-Options

- [ ] Testar rate limiting:
  ```bash
  for i in {1..10}; do curl https://api.cozinca.com/api/auth/login; done
  ```
  - 5º request deve retornar 429

- [ ] Testar CORS:
  ```bash
  curl -H "Origin: http://malicious.com" https://api.cozinca.com/api/clientes
  ```
  - Deve retornar CORS error

### 1.7 Documentação

- [ ] Atualizar README com:
  - [ ] Como fazer setup (.env.example)
  - [ ] Como rodar localmente
  - [ ] Comandos importantes
  - [ ] Troubleshooting

- [ ] Criar SECURITY.md com:
  - [ ] Reporting vulnerabilities
  - [ ] Security best practices
  - [ ] Headers implementados

---

## 📊 MÉTRICAS DE CONCLUSÃO

```
Segurança antes:  5/10
Segurança depois: 8/10

Vulnerabilidades críticas: 1 → 0
.env exposto: SIM → NÃO
Rate limiting: NÃO → SIM (5 níveis)
Validação: Parcial → 100%
Security headers: Básico → Avançado

Código limpo: SIM
Production ready: 60% → 70%
```

---

## 🎯 PRÓXIMOS PASSOS

Após completar Fase 1:
1. ✅ FASE 2: Testes e Documentação (2 semanas)
2. ⏳ FASE 3: Funcionalidades (2 semanas)
3. ⏳ FASE 4: Performance (2 semanas)
4. ⏳ FASE 5: Polimento (2 semanas)
5. ⏳ FASE 6: Produção (2 semanas)

---

**Status:** ___/50 subtarefas completas  
**Última atualização:** 26 de Maio de 2026  
**Próxima revisão:** 02 de Junho de 2026
