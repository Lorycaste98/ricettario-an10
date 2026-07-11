-- AlterTable: contatore recensioni anonime per menù (alimenta "Ospite N")
ALTER TABLE "Menu" ADD COLUMN     "anonymousReviewCount" INTEGER NOT NULL DEFAULT 0;
