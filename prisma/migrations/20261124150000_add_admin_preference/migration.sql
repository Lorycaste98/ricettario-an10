-- CreateTable: preferenze della pagina Impostazioni per account admin (una riga per account).
-- I visitatori restano su localStorage (lib/preferences.ts).
CREATE TABLE "AdminPreference" (
    "adminId" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPreference_pkey" PRIMARY KEY ("adminId")
);

-- AddForeignKey
ALTER TABLE "AdminPreference" ADD CONSTRAINT "AdminPreference_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
