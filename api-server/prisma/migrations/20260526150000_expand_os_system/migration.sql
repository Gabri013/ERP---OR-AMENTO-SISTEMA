-- Expand EtapaProducao enum with all production sectors
DO $$ BEGIN
  BEGIN ALTER TYPE "EtapaProducao" ADD VALUE IF NOT EXISTS 'programacao'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "EtapaProducao" ADD VALUE IF NOT EXISTS 'engenharia'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "EtapaProducao" ADD VALUE IF NOT EXISTS 'tubo'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "EtapaProducao" ADD VALUE IF NOT EXISTS 'coccao'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "EtapaProducao" ADD VALUE IF NOT EXISTS 'mobiliario'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "EtapaProducao" ADD VALUE IF NOT EXISTS 'revisao'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "EtapaProducao" ADD VALUE IF NOT EXISTS 'expedicao'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "EtapaProducao" ADD VALUE IF NOT EXISTS 'entregue'; EXCEPTION WHEN duplicate_object THEN null; END;
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Expand StatusOS enum with new statuses
DO $$ BEGIN
  BEGIN ALTER TYPE "StatusOS" ADD VALUE IF NOT EXISTS 'liberada'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "StatusOS" ADD VALUE IF NOT EXISTS 'pausado'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "StatusOS" ADD VALUE IF NOT EXISTS 'entregue'; EXCEPTION WHEN duplicate_object THEN null; END;
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Add new columns to OSEtapaProducao
ALTER TABLE "OSEtapaProducao" ADD COLUMN IF NOT EXISTS "responsavel" TEXT;
ALTER TABLE "OSEtapaProducao" ADD COLUMN IF NOT EXISTS "lider" TEXT;
ALTER TABLE "OSEtapaProducao" ADD COLUMN IF NOT EXISTS "tempoEstimado" INTEGER;
ALTER TABLE "OSEtapaProducao" ADD COLUMN IF NOT EXISTS "tempoReal" INTEGER;
ALTER TABLE "OSEtapaProducao" ADD COLUMN IF NOT EXISTS "observacao" TEXT;
