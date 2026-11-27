-- Los tokens dejan de guardarse en claro. Las invitaciones pendientes
-- existentes se invalidan porque no es posible hashear su valor desde SQL
-- sin extensiones adicionales; se conservan como historial revocado.
ALTER TABLE "Invitation" RENAME COLUMN "token" TO "tokenHash";

ALTER INDEX "Invitation_token_key" RENAME TO "Invitation_tokenHash_key";

ALTER TABLE "Invitation" ADD COLUMN "pendingKey" TEXT;
ALTER TABLE "Invitation" ADD COLUMN "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Invitation"
SET "revokedAt" = CURRENT_TIMESTAMP, "pendingKey" = NULL
WHERE "acceptedAt" IS NULL AND "revokedAt" IS NULL;

-- Borra cualquier token en claro remanente de filas aceptadas o revocadas.
UPDATE "Invitation" SET "tokenHash" = 'invalidated:' || "id";

CREATE UNIQUE INDEX "Invitation_pendingKey_key" ON "Invitation"("pendingKey");

ALTER TYPE "AuditAction" ADD VALUE 'INVITATION_RESENT';
