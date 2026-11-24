"use client";
import { useState } from "react";
import type { RecipeSummary } from "@/lib/types";
import { Segmented } from "@/components/ds/Controls";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { RecipeCardTicket } from "@/components/recipe/cards/RecipeCardTicket";
import { RecipeCardPlate } from "@/components/recipe/cards/RecipeCardPlate";
import { RecipeCardCover } from "@/components/recipe/cards/RecipeCardCover";
import { CartaStack, RecipeRowCarta } from "@/components/recipe/cards/RecipeRowCarta";
import { RecipeRow } from "@/components/recipe/RecipeRow";

const VARIANTS = [
  { key: "ticket", title: "1 · Comanda", note: "scontrino del pass: perforazione, voto come totale", Card: RecipeCardTicket },
  { key: "plate", title: "2 · Piatto", note: "piatto visto dall'alto sulla tovaglia, voto come medaglia", Card: RecipeCardPlate },
  { key: "cover", title: "3 · Copertina", note: "foto verticale piena, nome su etichetta bianca, voto in alto", Card: RecipeCardCover },
  { key: "now", title: "Oggi", note: "la card attuale, per confronto", Card: RecipeCard },
] as const;

type Width = "phone" | "wide";

export function CardShowcase({ recipes }: { recipes: RecipeSummary[] }) {
  const [width, setWidth] = useState<Width>("phone");
  const [cols, setCols] = useState("2");
  const colOptions = width === "phone" ? ["1", "2", "3"] : ["2", "3", "4", "6"];
  const n = Math.min(Number(cols), Number(colOptions[colOptions.length - 1]));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-(length:--fs-page) font-bold">Proposte di card</h1>
        <p className="text-grigio">
          Stesse ricette vere in tre proposte e nella card di oggi. Sul telefono tocca le card (pressione), sul PC passaci sopra col mouse.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented<Width>
            label="Larghezza"
            value={width}
            onChange={(w) => {
              setWidth(w);
              setCols(w === "phone" ? "2" : "4");
            }}
            options={[
              { value: "phone", label: "Telefono" },
              { value: "wide", label: "Largo" },
            ]}
          />
          <Segmented label="Per riga" value={String(n)} onChange={setCols} options={colOptions.map((c) => ({ value: c, label: c }))} />
        </div>
      </header>

      {VARIANTS.map(({ key, title, note, Card }) => (
        <section key={key} className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">
            {title} <span className="text-sm font-normal text-grigio">· {note}</span>
          </h2>
          <div className={width === "phone" ? "w-full max-w-[358px]" : "w-full"}>
            <div className="grid gap-(--gap)" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
              {recipes.slice(0, n === 1 ? 3 : n * 2).map((r) => (
                <Card key={r.id} recipe={r} />
              ))}
            </div>
          </div>
        </section>
      ))}

      <h1 className="mt-4 text-(length:--fs-page) font-bold">Proposte di lista</h1>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">
          Carta · schede separate <span className="text-sm font-normal text-grigio">· ogni ricetta nella sua scheda: piatto tondo, puntini e il voto al posto del prezzo</span>
        </h2>
        <div className={width === "phone" ? "w-full max-w-[358px]" : "w-full max-w-3xl"}>
          <CartaStack variant="card">
            {recipes.map((r) => (
              <RecipeRowCarta key={r.id} recipe={r} variant="card" />
            ))}
          </CartaStack>
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">
          Carta · senza scheda <span className="text-sm font-normal text-grigio">· le righe direttamente sul fondo, separate dallo spazio</span>
        </h2>
        <div className={width === "phone" ? "w-full max-w-[358px]" : "w-full max-w-3xl"}>
          <CartaStack variant="bare">
            {recipes.map((r) => (
              <RecipeRowCarta key={r.id} recipe={r} variant="bare" />
            ))}
          </CartaStack>
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">
          Lista di oggi <span className="text-sm font-normal text-grigio">· per confronto</span>
        </h2>
        <div className={width === "phone" ? "w-full max-w-[358px]" : "w-full max-w-3xl"}>
          <div className="flex flex-col divide-y divide-blu-150 overflow-hidden rounded-card border border-blu-150 bg-white">
            {recipes.map((r) => (
              <RecipeRow key={r.id} recipe={r} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
