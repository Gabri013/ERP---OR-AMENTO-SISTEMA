-- Add file content columns to OSAnexo (real file upload, no external URL required)
ALTER TABLE "OSAnexo" ADD COLUMN IF NOT EXISTS "conteudo" BYTEA;
ALTER TABLE "OSAnexo" ADD COLUMN IF NOT EXISTS "mimeType" TEXT;
ALTER TABLE "OSAnexo" ADD COLUMN IF NOT EXISTS "tamanho" INTEGER;

-- Make url optional (was NOT NULL, now nullable)
ALTER TABLE "OSAnexo" ALTER COLUMN "url" DROP NOT NULL;

-- Add product type to Produto
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "tipoProduto" TEXT NOT NULL DEFAULT 'padrao';
