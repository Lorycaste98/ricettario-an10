-- CreateTable: organizzazione del PDF «Per gli ospiti» di un menù (portate, voci a mano,
-- ricette nascoste, formato: lib/menu-guest-card.ts). Una riga per menù.
CREATE TABLE "MenuGuestCard" (
    "menuId" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuGuestCard_pkey" PRIMARY KEY ("menuId")
);

-- AddForeignKey
ALTER TABLE "MenuGuestCard" ADD CONSTRAINT "MenuGuestCard_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
