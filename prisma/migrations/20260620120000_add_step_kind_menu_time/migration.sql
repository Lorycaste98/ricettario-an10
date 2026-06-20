-- Step: tipo di tempo (PREP | COOK | WAIT)
ALTER TABLE "Step" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'PREP';

-- Menu: orario di servizio opzionale ("HH:mm")
ALTER TABLE "Menu" ADD COLUMN "servingTime" TEXT;
