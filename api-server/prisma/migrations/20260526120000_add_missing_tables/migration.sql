-- CreateTable AuditLog (was missing from DB - schema had it but never migrated)
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id"          SERIAL PRIMARY KEY,
  "usuarioId"   INTEGER,
  "acao"        TEXT NOT NULL,
  "modulo"      TEXT NOT NULL,
  "registroId"  TEXT,
  "tabela"      TEXT,
  "valorAntigo" TEXT,
  "valorNovo"   TEXT,
  "ip"          TEXT,
  "userAgent"   TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AuditLog_usuarioId_idx"  ON "AuditLog"("usuarioId");
CREATE INDEX IF NOT EXISTS "AuditLog_modulo_idx"     ON "AuditLog"("modulo");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx"  ON "AuditLog"("createdAt");

-- CreateTable Notificacao (was missing from DB)
CREATE TABLE IF NOT EXISTS "Notificacao" (
  "id"        SERIAL PRIMARY KEY,
  "usuarioId" INTEGER NOT NULL,
  "titulo"    TEXT NOT NULL,
  "mensagem"  TEXT NOT NULL,
  "tipo"      TEXT NOT NULL,
  "lida"      BOOLEAN NOT NULL DEFAULT false,
  "link"      TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt"    TIMESTAMP(3),
  CONSTRAINT "Notificacao_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Notificacao_usuarioId_idx" ON "Notificacao"("usuarioId");
CREATE INDEX IF NOT EXISTS "Notificacao_lida_idx"      ON "Notificacao"("lida");

-- CreateTable Permissao (was missing from DB)
CREATE TABLE IF NOT EXISTS "Permissao" (
  "id"        SERIAL PRIMARY KEY,
  "nome"      TEXT NOT NULL UNIQUE,
  "descricao" TEXT,
  "modulo"    TEXT NOT NULL,
  "acoes"     TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateEnum TipoUsuario (idempotent - may already exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoUsuario') THEN
    CREATE TYPE "TipoUsuario" AS ENUM (
      'master','gerente','vendedor','producao','financeiro','engenharia','visualizador'
    );
  END IF;
END $$;

-- CreateTable RolePermissao (was missing from DB)
CREATE TABLE IF NOT EXISTS "RolePermissao" (
  "id"           SERIAL PRIMARY KEY,
  "tipoUsuario"  "TipoUsuario" NOT NULL,
  "permissaoId"  INTEGER NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RolePermissao_permissaoId_fkey"
    FOREIGN KEY ("permissaoId") REFERENCES "Permissao"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "RolePermissao_tipoUsuario_permissaoId_key"
  ON "RolePermissao"("tipoUsuario", "permissaoId");
