-- Adiciona valores ausentes ao enum TipoUsuario no PostgreSQL
-- Necessário porque usuários foram inseridos com tipos como 'montagem', 'corte', etc.
-- antes desses valores existirem no enum do banco

DO $$ BEGIN
  -- TipoUsuario
  BEGIN ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'projetista'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'dashboard_producao'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'corte'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'dobra'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'solda'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'refrigeracao'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'acabamento'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'finalizacao'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'montagem'; EXCEPTION WHEN duplicate_object THEN null; END;
EXCEPTION
  -- Se o tipo não existir no banco (coluna é TEXT), ignora silenciosamente
  WHEN undefined_object THEN null;
END $$;

-- Adiciona valores ausentes ao enum StatusConta (preventivo)
DO $$ BEGIN
  BEGIN ALTER TYPE "StatusConta" ADD VALUE IF NOT EXISTS 'ATRASADO'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "StatusConta" ADD VALUE IF NOT EXISTS 'CANCELADO'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "StatusConta" ADD VALUE IF NOT EXISTS 'PARCIALMENTE_PAGO'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "StatusConta" ADD VALUE IF NOT EXISTS 'RENEGOCIADO'; EXCEPTION WHEN duplicate_object THEN null; END;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;
