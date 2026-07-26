-- CreateTable: voto personale dell'admin su una ricetta (uno per account)
CREATE TABLE "RecipeRating" (
    "adminId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeRating_pkey" PRIMARY KEY ("adminId","recipeId")
);

-- CreateIndex
CREATE INDEX "RecipeRating_recipeId_idx" ON "RecipeRating"("recipeId");

-- AddForeignKey
ALTER TABLE "RecipeRating" ADD CONSTRAINT "RecipeRating_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecipeRating" ADD CONSTRAINT "RecipeRating_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: assorbe le note personali (Review con menuId NULL) nel voto per-admin.
-- Per ogni (admin, ricetta) prende la nota piu' recente il cui nickname == username dell'admin.
INSERT INTO "RecipeRating" ("adminId","recipeId","rating","note","createdAt","updatedAt")
SELECT DISTINCT ON (a.id, r."recipeId")
       a.id, r."recipeId", r.rating, r.comment, r."createdAt", NOW()
FROM "Review" r
JOIN "Admin" a ON a.username = r.nickname
WHERE r."menuId" IS NULL
ORDER BY a.id, r."recipeId", r."createdAt" DESC
ON CONFLICT ("adminId","recipeId") DO NOTHING;

-- Rimuove le vecchie note personali (ora assorbite nel voto per-admin, fuori dalla media pubblica)
DELETE FROM "Review" WHERE "menuId" IS NULL;
