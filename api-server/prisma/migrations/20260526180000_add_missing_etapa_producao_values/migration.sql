-- Add missing EtapaProducao enum values that were omitted from previous migrations
-- All ADD VALUE calls use IF NOT EXISTS to be safe against partial runs.

DO $$
BEGIN
  BEGIN ALTER TYPE "EtapaProducao" ADD VALUE IF NOT EXISTS 'embalagem';   EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "EtapaProducao" ADD VALUE IF NOT EXISTS 'autorizacao';  EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "EtapaProducao" ADD VALUE IF NOT EXISTS 'acabamento';   EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "EtapaProducao" ADD VALUE IF NOT EXISTS 'finalizacao';  EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "EtapaProducao" ADD VALUE IF NOT EXISTS 'concluida';    EXCEPTION WHEN duplicate_object THEN null; END;
END
$$;
