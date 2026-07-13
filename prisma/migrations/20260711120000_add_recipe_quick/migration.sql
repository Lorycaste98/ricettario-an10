-- AlterTable: ricetta "veloce" (solo nome, senza scheda) selezionabile nei menù ma esclusa da libreria/ricerca
ALTER TABLE "Recipe" ADD COLUMN     "quick" BOOLEAN NOT NULL DEFAULT false;
