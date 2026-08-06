-- Quantità dell'ingrediente usata in un singolo passo (ripartizione di Ingredient.qty).
-- Colonna nullable e nessun backfill: i legami esistenti restano NULL ("quanto serve")
-- e continuano a mostrare la quantità piena dell'ingrediente, come prima.
ALTER TABLE "StepIngredient" ADD COLUMN "qty" DOUBLE PRECISION;
