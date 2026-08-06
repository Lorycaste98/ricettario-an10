-- CreateTable: ingredienti necessari a un singolo passo della procedura (Step <-> Ingredient).
-- Nessuna data migration: le ricette esistenti restano senza legami finche' non li si aggiunge in modifica.
CREATE TABLE "StepIngredient" (
    "stepId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,

    CONSTRAINT "StepIngredient_pkey" PRIMARY KEY ("stepId","ingredientId")
);

-- CreateIndex
CREATE INDEX "StepIngredient_ingredientId_idx" ON "StepIngredient"("ingredientId");

-- AddForeignKey
ALTER TABLE "StepIngredient" ADD CONSTRAINT "StepIngredient_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StepIngredient" ADD CONSTRAINT "StepIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
