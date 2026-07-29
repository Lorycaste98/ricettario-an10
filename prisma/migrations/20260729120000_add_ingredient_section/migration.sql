-- AlterTable: sezione/preparazione di appartenenza dell'ingrediente (es. "Per l'impasto"); NULL = nessuna sezione
ALTER TABLE "Ingredient" ADD COLUMN     "section" TEXT;
