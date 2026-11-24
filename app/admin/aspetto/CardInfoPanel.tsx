"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IdCard } from "lucide-react";
import { Panel } from "@/components/ds/Panel";
import { Button } from "@/components/ds/Button";
import { Segmented, Switch } from "@/components/ds/Controls";
import { CardConfigProvider, useCardConfig } from "@/components/CardConfigProvider";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { RecipeRow } from "@/components/recipe/RecipeRow";
import { MenuCard } from "@/components/menu/MenuCard";
import { MenuRow } from "@/components/menu/MenuRow";
import { MENU_FIELDS, RECIPE_FIELDS, type CardConfig } from "@/lib/card-config";
import type { MenuSummary, RecipeSummary } from "@/lib/types";
import { SettingRow } from "@/app/impostazioni/SettingsClient";

export type CardSamples = { recipe: RecipeSummary | null; menu: MenuSummary | null };

// ── Informazioni sulle card (admin, per tutti) ───────────────────────────────

/**
 * Cosa mostrano card e righe delle liste, per tutti (`lib/card-config.ts`). Bozza locale con
 * l'anteprima su una ricetta e un menù veri, a due larghezze (card stretta come sul telefono e
 * larga) e in riga; «Salva per tutti» la scrive nel database e ricarica la pagina.
 */
export function CardInfoPanel({ samples, className }: { samples: CardSamples; className?: string }) {
  const saved = useCardConfig();
  const router = useRouter();
  const [kind, setKind] = useState<"recipe" | "menu">("recipe");
  const [draft, setDraft] = useState<CardConfig>(saved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = JSON.stringify(draft) !== JSON.stringify(saved);

  const fields = kind === "recipe" ? RECIPE_FIELDS : MENU_FIELDS;
  const values = draft[kind] as Record<string, boolean>;
  const toggle = (field: string, on: boolean) => setDraft({ ...draft, [kind]: { ...draft[kind], [field]: on } });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/site-settings/card-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("Non sono riuscito a salvare. Riprova tra poco.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel
      title="Informazioni sulle card"
      icon={<IdCard />}
      meta="Le scegli tu per tutti: le vedono anche gli ospiti e chi non è entrato"
      className={className}
      actions={
        <Segmented<"recipe" | "menu">
          label="Card da impostare"
          value={kind}
          onChange={setKind}
          options={[
            { value: "recipe", label: "Ricette" },
            { value: "menu", label: "Menù" },
          ]}
        />
      }
    >
      <div className="grid gap-[1.25em] @min-[760px]:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div>
          {fields.map((f) => (
            <SettingRow key={f.value} label={f.label} hint={f.hint}>
              <Switch checked={values[f.value]} onChange={(on) => toggle(f.value, on)} label={f.label} hideLabel />
            </SettingRow>
          ))}
        </div>

        {/* anteprima con la bozza: card vere, non cliccabili */}
        <div className="flex flex-col gap-2 rounded-ctl bg-blu-50 p-[0.75em]">
          <p className="text-xs font-bold tracking-[0.08em] text-grigio uppercase">Anteprima</p>
          <CardConfigProvider value={draft}>
            <div inert className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start gap-3">
                <figure className="flex w-[10.5rem] flex-col gap-1">
                  {kind === "recipe" ? samples.recipe && <RecipeCard recipe={samples.recipe} /> : samples.menu && <MenuCard menu={samples.menu} />}
                  <figcaption className="text-center text-[0.6875rem] text-grigio">stretta (telefono)</figcaption>
                </figure>
                <figure className="flex w-[15rem] max-w-full flex-col gap-1">
                  {kind === "recipe" ? samples.recipe && <RecipeCard recipe={samples.recipe} /> : samples.menu && <MenuCard menu={samples.menu} />}
                  <figcaption className="text-center text-[0.6875rem] text-grigio">larga (iPad, PC)</figcaption>
                </figure>
              </div>
              <div>
                {kind === "recipe" ? samples.recipe && <RecipeRow recipe={samples.recipe} /> : samples.menu && <MenuRow menu={samples.menu} />}
                <p className="text-center text-[0.6875rem] text-grigio">vista a lista</p>
              </div>
            </div>
          </CardConfigProvider>
        </div>
      </div>

      {error && <p className="text-[0.8125rem] text-rosa">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={() => setDraft(saved)} disabled={!changed || saving}>
          Annulla modifiche
        </Button>
        <Button onClick={save} disabled={!changed} loading={saving}>
          Salva per tutti
        </Button>
      </div>
    </Panel>
  );
}
