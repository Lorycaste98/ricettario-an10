"use client";
import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_CARD_CONFIG, type CardConfig } from "@/lib/card-config";

/**
 * Informazioni da mostrare sulle card (`lib/card-config.ts`). Il layout passa quelle salvate;
 * l'anteprima della pagina Impostazioni ne monta un altro attorno alle card d'esempio con la bozza.
 */
const CardConfigContext = createContext<CardConfig>(DEFAULT_CARD_CONFIG);

export function CardConfigProvider({ value, children }: { value: CardConfig; children: ReactNode }) {
  return <CardConfigContext.Provider value={value}>{children}</CardConfigContext.Provider>;
}

export function useCardConfig() {
  return useContext(CardConfigContext);
}
