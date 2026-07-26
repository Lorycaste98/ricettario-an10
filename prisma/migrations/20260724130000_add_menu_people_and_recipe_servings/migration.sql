-- AlterTable: numero di persone previste per il menù (uso futuro)
ALTER TABLE "Menu" ADD COLUMN     "people" INTEGER;

-- AlterTable: porzioni della ricetta specifiche del menù (override del default della ricetta,
-- usate per scalare le quantità degli ingredienti nella lista della spesa)
ALTER TABLE "MenuRecipe" ADD COLUMN     "servings" INTEGER;
