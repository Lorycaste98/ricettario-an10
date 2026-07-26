-- AlterTable: campi Costi + nota admin del menù
ALTER TABLE "Menu" ADD COLUMN "notes" TEXT;
ALTER TABLE "Menu" ADD COLUMN "groceryCost" DOUBLE PRECISION;
ALTER TABLE "Menu" ADD COLUMN "laborHours" DOUBLE PRECISION;
ALTER TABLE "Menu" ADD COLUMN "laborRate" DOUBLE PRECISION;
ALTER TABLE "Menu" ADD COLUMN "markupPercent" DOUBLE PRECISION;

-- CreateTable: voci di costo generiche ("altri costi") di un menù
CREATE TABLE "MenuCost" (
    "id" SERIAL NOT NULL,
    "menuId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "MenuCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuCost_menuId_idx" ON "MenuCost"("menuId");

-- CreateTable: ingredienti "extra" della lista spesa di un menù
CREATE TABLE "MenuExtraItem" (
    "id" SERIAL NOT NULL,
    "menuId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "qty" DOUBLE PRECISION,
    "unit" TEXT,

    CONSTRAINT "MenuExtraItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuExtraItem_menuId_idx" ON "MenuExtraItem"("menuId");

-- AddForeignKey
ALTER TABLE "MenuCost" ADD CONSTRAINT "MenuCost_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuExtraItem" ADD CONSTRAINT "MenuExtraItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
