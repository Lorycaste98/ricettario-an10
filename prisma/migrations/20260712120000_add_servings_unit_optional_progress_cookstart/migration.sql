-- AlterTable: unità delle porzioni personalizzabile (es. "teglie da 28cm")
ALTER TABLE "Recipe" ADD COLUMN     "servingsUnit" TEXT;

-- AlterTable: ingrediente facoltativo (etichetta "opzionale")
ALTER TABLE "Ingredient" ADD COLUMN     "optional" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: inizio pianificato della ricetta nella timeline della modalità cucina
ALTER TABLE "MenuRecipe" ADD COLUMN     "cookStartAt" TIMESTAMP(3);

-- CreateTable: avanzamento passi ricetta per admin
CREATE TABLE "RecipeProgress" (
    "adminId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "doneSteps" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "stepsCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeProgress_pkey" PRIMARY KEY ("adminId","recipeId")
);

-- AddForeignKey
ALTER TABLE "RecipeProgress" ADD CONSTRAINT "RecipeProgress_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeProgress" ADD CONSTRAINT "RecipeProgress_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
