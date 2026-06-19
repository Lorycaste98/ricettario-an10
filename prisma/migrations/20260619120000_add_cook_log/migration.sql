-- CreateTable
CREATE TABLE "CookLog" (
    "id" SERIAL NOT NULL,
    "cookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipeId" INTEGER NOT NULL,

    CONSTRAINT "CookLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CookLog_cookedAt_idx" ON "CookLog"("cookedAt");

-- CreateIndex
CREATE INDEX "CookLog_recipeId_idx" ON "CookLog"("recipeId");

-- AddForeignKey
ALTER TABLE "CookLog" ADD CONSTRAINT "CookLog_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
