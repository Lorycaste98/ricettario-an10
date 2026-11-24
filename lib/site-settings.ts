import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { CARD_CONFIG_KEY, DEFAULT_CARD_CONFIG, SITE_SETTINGS_TAG, normalizeCardConfig, type CardConfig } from "@/lib/card-config";

/**
 * Informazioni delle card decise dall'admin per tutti (`SiteSetting` «card-info»). Cachata a tag
 * `site-settings` (la PUT la scade subito). Se la tabella non c'è ancora o la lettura fallisce
 * valgono le scelte di partenza: le card non devono mai rompersi per questo.
 */
export const getCardConfig = unstable_cache(
  async (): Promise<CardConfig> => {
    try {
      const row = await db.siteSetting.findUnique({ where: { key: CARD_CONFIG_KEY }, select: { value: true } });
      return normalizeCardConfig(row?.value);
    } catch {
      return DEFAULT_CARD_CONFIG;
    }
  },
  ["card-config"],
  { tags: [SITE_SETTINGS_TAG] }
);
