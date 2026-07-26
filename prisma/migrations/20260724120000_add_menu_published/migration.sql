-- AlterTable: visibilità del menù ("non pronto" nascosto ai visitatori, come Recipe.published)
ALTER TABLE "Menu" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT true;
