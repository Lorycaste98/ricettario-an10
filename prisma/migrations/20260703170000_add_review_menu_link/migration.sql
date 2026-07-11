-- AlterTable: la recensione ricetta può arrivare da un menù (nullo = nota personale admin)
ALTER TABLE "Review" ADD COLUMN     "menuId" INTEGER;

-- AlterTable: token segreto per il link pubblico di recensione del menù
ALTER TABLE "Menu" ADD COLUMN     "reviewToken" TEXT;

-- Backfill: genera un token per i menù già esistenti
UPDATE "Menu" SET "reviewToken" = gen_random_uuid()::text WHERE "reviewToken" IS NULL;

-- Da qui in poi il token è sempre obbligatorio e univoco
ALTER TABLE "Menu" ALTER COLUMN "reviewToken" SET NOT NULL;
CREATE UNIQUE INDEX "Menu_reviewToken_key" ON "Menu"("reviewToken");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE SET NULL ON UPDATE CASCADE;
