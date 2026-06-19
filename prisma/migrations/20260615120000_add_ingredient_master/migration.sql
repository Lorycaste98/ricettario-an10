-- CreateTable
CREATE TABLE "IngredientMaster" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "excludedFromStats" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "IngredientMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IngredientMaster_name_key" ON "IngredientMaster"("name");

-- Populate from existing distinct ingredient names.
-- Ingredients that were previously hardcoded as excluded are marked accordingly.
INSERT INTO "IngredientMaster" ("name", "excludedFromStats")
SELECT DISTINCT "name",
  CASE WHEN LOWER("name") IN (
    'sale', 'acqua', 'olio', 'olio d''oliva', 'olio di oliva',
    'olio extravergine d''oliva', 'pepe', 'pepe nero'
  ) THEN true ELSE false END
FROM "Ingredient"
ON CONFLICT ("name") DO NOTHING;
