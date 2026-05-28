-- Create OSChecklist table
CREATE TABLE IF NOT EXISTS "OSChecklist" (
  "id" SERIAL PRIMARY KEY,
  "osId" INTEGER NOT NULL,
  "etapa" TEXT NOT NULL,
  "item" TEXT NOT NULL,
  "concluido" BOOLEAN NOT NULL DEFAULT false,
  "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
  "usuarioId" INTEGER,
  "concluidoEm" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OSChecklist_osId_fkey" FOREIGN KEY ("osId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE,
  CONSTRAINT "OSChecklist_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
);
CREATE INDEX IF NOT EXISTS "OSChecklist_osId_idx" ON "OSChecklist"("osId");
CREATE INDEX IF NOT EXISTS "OSChecklist_osId_etapa_idx" ON "OSChecklist"("osId", "etapa");

-- Create OSAnexo table
CREATE TABLE IF NOT EXISTS "OSAnexo" (
  "id" SERIAL PRIMARY KEY,
  "osId" INTEGER NOT NULL,
  "nome" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "tipo" TEXT NOT NULL DEFAULT 'outro',
  "descricao" TEXT,
  "usuarioId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OSAnexo_osId_fkey" FOREIGN KEY ("osId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE,
  CONSTRAINT "OSAnexo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
);
CREATE INDEX IF NOT EXISTS "OSAnexo_osId_idx" ON "OSAnexo"("osId");
