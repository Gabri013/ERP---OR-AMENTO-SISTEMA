# Prisma + Neon DB

Este projeto usa PostgreSQL no Neon.

## URLs esperadas

### Runtime
`DATABASE_URL`
- usar connection pooling (`pgbouncer=true`) em produção

### Migrations
`DIRECT_URL`
- usar conexão direta para `prisma migrate`

## Comandos npm

```bash
npm run db:generate
npm run db:migrate
npm run db:migrate:deploy
npm run db:push
```

## Exemplo

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
```

## Atenção
- Não use SQL MySQL em migrations manuais
- Validar sempre compatibilidade PostgreSQL/Neon
