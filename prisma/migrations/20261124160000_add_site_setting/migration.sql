-- CreateTable: impostazioni del sito decise dall'admin per tutti (oggi solo «card-info»,
-- le informazioni mostrate sulle card delle liste: lib/card-config.ts).
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);
