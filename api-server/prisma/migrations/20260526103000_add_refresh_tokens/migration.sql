CREATE TABLE IF NOT EXISTS "RefreshToken" (
  "id" SERIAL PRIMARY KEY,
  "token" TEXT NOT NULL UNIQUE,
  "usuarioId" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RefreshToken_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RefreshToken_usuarioId_idx" ON "RefreshToken"("usuarioId");
CREATE INDEX IF NOT EXISTS "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");
