-- CreateTable: ricette preferite per account admin.
-- I visitatori anonimi restano su localStorage (lib/favorites.ts); al login i
-- preferiti locali vengono ignorati e conta solo la lista dell'account.
CREATE TABLE "RecipeFavorite" (
    "adminId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeFavorite_pkey" PRIMARY KEY ("adminId","recipeId")
);

-- CreateIndex
CREATE INDEX "RecipeFavorite_recipeId_idx" ON "RecipeFavorite"("recipeId");

-- AddForeignKey
ALTER TABLE "RecipeFavorite" ADD CONSTRAINT "RecipeFavorite_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecipeFavorite" ADD CONSTRAINT "RecipeFavorite_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
