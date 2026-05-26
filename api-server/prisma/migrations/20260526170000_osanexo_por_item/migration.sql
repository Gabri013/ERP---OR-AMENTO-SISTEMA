-- Add vendaItemId column to OSAnexo so each product in an OS has its own files
ALTER TABLE "OSAnexo" ADD COLUMN IF NOT EXISTS "vendaItemId" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'OSAnexo_vendaItemId_fkey'
  ) THEN
    ALTER TABLE "OSAnexo"
      ADD CONSTRAINT "OSAnexo_vendaItemId_fkey"
      FOREIGN KEY ("vendaItemId") REFERENCES "VendaItem"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "OSAnexo_vendaItemId_idx" ON "OSAnexo"("vendaItemId");
