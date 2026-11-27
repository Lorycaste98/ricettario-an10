"use client";

import { useRef, useState, useEffect } from "react";
import { Cake, Sparkles, TreePine, Trash2, X } from "lucide-react";
import { IconButton } from "@/components/ds/Button";
import { Segmented } from "@/components/ds/Controls";
import { MiniChip, rowFieldCls } from "@/components/admin/FormParts";
import { ReorderList, ReorderRow } from "@/components/ui/ReorderList";
import {
  COURSE_PRESETS,
  GUEST_THEMES,
  unassignedRecipes,
  type GuestCard,
  type GuestItem,
  type GuestRecipe,
  type GuestTheme,
} from "@/lib/menu-guest-card";

const THEME_ICON = { natale: TreePine, compleanno: Cake, evento: Sparkles } as const;

/**
 * Finestra «Per gli ospiti» dell'esportazione del menù (solo admin): tema del cartoncino (decori e
 * colori) e piatti divisi
 * per portata. Ogni portata ha nome modificabile, si riordina col trascinamento e tiene le
 * ricette del menù e le voci scritte a mano (vini, bevande…). Una ricetta si sposta con la
 * tendina della sua riga: in un'altra portata, fra le «da sistemare» (stampate in cima senza
 * titolo) o fra le nascoste.
 *
 * Lo stato è un `GuestCard` (lib/menu-guest-card.ts) arricchito da `uid` client-side per le key
 * e il riordino; `toGuestCard` lo riporta alla forma salvata.
 */

type Row = GuestItem & { uid: string };
interface Course {
  uid: string;
  name: string;
  items: Row[];
}
export interface GuestEditorState {
  theme: GuestTheme;
  courses: Course[];
  hidden: number[];
}

const uid = () => crypto.randomUUID();

export function toEditorState(card: GuestCard): GuestEditorState {
  return {
    theme: card.theme,
    hidden: card.hidden,
    courses: card.courses.map((c) => ({ uid: uid(), name: c.name, items: c.items.map((i) => ({ ...i, uid: uid() })) })),
  };
}

export function toGuestCard(s: GuestEditorState): GuestCard {
  return {
    theme: s.theme,
    hidden: s.hidden,
    courses: s.courses.map((c) => ({
      name: c.name.trim(),
      items: c.items
        .filter((i) => i.type === "recipe" || i.text.trim())
        .map((i): GuestItem => (i.type === "recipe" ? { type: "recipe", recipeId: i.recipeId } : { type: "text", text: i.text.trim() })),
    })),
  };
}

const LOOSE = "__loose";
const HIDDEN = "__hidden";

export function GuestMenuEditor({
  value,
  onChange,
  recipes,
}: {
  value: GuestEditorState;
  onChange: (next: GuestEditorState) => void;
  recipes: GuestRecipe[];
}) {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const loose = unassignedRecipes(toGuestCard(value), recipes);
  const hidden = value.hidden.map((id) => byId.get(id)).filter((r): r is GuestRecipe => !!r);
  const usedNames = new Set(value.courses.map((c) => c.name.trim().toLowerCase()));
  const presets = COURSE_PRESETS.filter((p) => !usedNames.has(p.toLowerCase()));

  // Campo da mettere a fuoco dopo un'aggiunta (nuova portata o voce a mano)
  const [focusUid, setFocusUid] = useState<string | null>(null);

  const setCourses = (courses: Course[]) => onChange({ ...value, courses });
  const patchCourse = (cuid: string, patch: Partial<Course>) =>
    setCourses(value.courses.map((c) => (c.uid === cuid ? { ...c, ...patch } : c)));

  /** Sposta una ricetta: in una portata (in fondo), fra le da sistemare o fra le nascoste */
  const moveRecipe = (recipeId: number, target: string) => {
    const courses = value.courses.map((c) => ({
      ...c,
      items: c.items.filter((i) => !(i.type === "recipe" && i.recipeId === recipeId)),
    }));
    const hiddenIds = value.hidden.filter((id) => id !== recipeId);
    if (target === HIDDEN) hiddenIds.push(recipeId);
    else if (target !== LOOSE) {
      const c = courses.find((x) => x.uid === target);
      if (c) c.items = [...c.items, { type: "recipe", recipeId, uid: uid() }];
    }
    onChange({ ...value, courses, hidden: hiddenIds });
  };

  const addCourse = (name: string) => {
    const c: Course = { uid: uid(), name, items: [] };
    setCourses([...value.courses, c]);
    if (!name) setFocusUid(c.uid);
  };

  const removeCourse = (cuid: string) => setCourses(value.courses.filter((c) => c.uid !== cuid));

  const addText = (cuid: string) => {
    const row: Row = { type: "text", text: "", uid: uid() };
    const c = value.courses.find((x) => x.uid === cuid);
    if (!c) return;
    patchCourse(cuid, { items: [...c.items, row] });
    setFocusUid(row.uid);
  };

  const courseOptions = (
    <>
      {value.courses.map((c, i) => (
        <option key={c.uid} value={c.uid}>
          {c.name.trim() || `Portata ${i + 1}`}
        </option>
      ))}
      <option value={LOOSE}>Nessuna portata</option>
      <option value={HIDDEN}>Nascondi</option>
    </>
  );

  const recipeSelect = (r: GuestRecipe, current: string) => (
    <select
      aria-label={`Portata di ${r.name}`}
      value={current}
      onChange={(e) => moveRecipe(r.id, e.target.value)}
      className={`${rowFieldCls} w-[6.75rem] shrink-0 text-[0.8125rem] @min-[520px]:w-[9rem]`}
    >
      {courseOptions}
    </select>
  );

  return (
    <div className="@container flex flex-col gap-5">
      {/* Tema: decori e colori del cartoncino */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[0.8125rem] font-semibold text-grigio">Tema</span>
        <Segmented
          label="Tema del cartoncino"
          value={value.theme}
          onChange={(theme) => onChange({ ...value, theme })}
          options={GUEST_THEMES.map((t) => {
            const Icon = THEME_ICON[t.value];
            return { value: t.value, label: t.label, icon: <Icon aria-hidden /> };
          })}
        />
        <p className="text-xs text-grigio">{GUEST_THEMES.find((t) => t.value === value.theme)?.hint}</p>
      </div>

      {/* Ricette senza portata: in cima al foglio, senza titolo */}
      {loose.length > 0 && (
        <section className="rounded-card border border-dashed border-blu-250 bg-blu-50 p-[0.75em]">
          <h3 className="font-bold">Senza portata</h3>
          <p className="mb-1.5 text-xs text-grigio">Compaiono in cima al foglio, senza titolo. Scegli una portata dalla tendina.</p>
          <ul>
            {loose.map((r) => (
              <li key={r.id} className="flex items-center gap-2 border-b border-blu-150 py-[0.375em] last:border-0">
                <span className="min-w-0 flex-1 leading-tight break-words">{r.name}</span>
                {recipeSelect(r, LOOSE)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Portate */}
      <ReorderList values={value.courses} onReorder={setCourses} className="flex flex-col gap-3">
        {value.courses.map((c, ci) => (
          <ReorderRow key={c.uid} value={c} handleSize="h-[1.875rem] w-6" className="rounded-card border border-blu-150 bg-white p-[0.75em]">
            {(handle) => (
              <>
                <div className="flex items-center gap-2">
                  {handle}
                  <AutoFocusInput
                    focus={focusUid === c.uid}
                    onFocused={() => setFocusUid(null)}
                    aria-label="Nome della portata"
                    placeholder={`Portata ${ci + 1}`}
                    value={c.name}
                    maxLength={60}
                    onChange={(e) => patchCourse(c.uid, { name: e.target.value })}
                    className={`${rowFieldCls} flex-1 font-bold`}
                  />
                  <IconButton size="row" tone="danger" label={`Togli la portata ${c.name || ci + 1}`} onClick={() => removeCourse(c.uid)}>
                    <Trash2 />
                  </IconButton>
                </div>

                {c.items.length > 0 && (
                  <ReorderList values={c.items} onReorder={(items) => patchCourse(c.uid, { items })} className="mt-1.5 pl-1">
                    {c.items.map((item) => (
                      <ReorderRow key={item.uid} value={item} handleSize="h-[1.875rem] w-6" className="border-b border-blu-150 bg-white py-[0.375em] last:border-0">
                        {(rowHandle) => (
                          <div className="flex items-center gap-2">
                            {rowHandle}
                            {item.type === "recipe" ? (
                              <>
                                <span className="min-w-0 flex-1 leading-tight break-words">{byId.get(item.recipeId)?.name}</span>
                                {byId.get(item.recipeId) && recipeSelect(byId.get(item.recipeId)!, c.uid)}
                              </>
                            ) : (
                              <>
                                <AutoFocusInput
                                  focus={focusUid === item.uid}
                                  onFocused={() => setFocusUid(null)}
                                  aria-label="Voce scritta a mano"
                                  placeholder="Es. Lambrusco di Sorbara"
                                  value={item.text}
                                  maxLength={120}
                                  onChange={(e) =>
                                    patchCourse(c.uid, {
                                      items: c.items.map((x) => (x.uid === item.uid ? { ...item, text: e.target.value } : x)),
                                    })
                                  }
                                  className={`${rowFieldCls} flex-1`}
                                />
                                <IconButton
                                  size="row"
                                  label="Togli la voce"
                                  onClick={() => patchCourse(c.uid, { items: c.items.filter((x) => x.uid !== item.uid) })}
                                >
                                  <X />
                                </IconButton>
                              </>
                            )}
                          </div>
                        )}
                      </ReorderRow>
                    ))}
                  </ReorderList>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <MiniChip onClick={() => addText(c.uid)}>+ Voce a mano</MiniChip>
                </div>
              </>
            )}
          </ReorderRow>
        ))}
      </ReorderList>

      {/* Aggiungi portata */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[0.8125rem] font-semibold text-grigio">Aggiungi una portata</span>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <MiniChip key={p} onClick={() => addCourse(p)}>
              + {p}
            </MiniChip>
          ))}
          <MiniChip onClick={() => addCourse("")}>+ Altra…</MiniChip>
        </div>
      </div>

      {/* Ricette che non compaiono */}
      {hidden.length > 0 && (
        <section>
          <h3 className="text-[0.8125rem] font-semibold text-grigio">Non mostrate agli ospiti</h3>
          <ul>
            {hidden.map((r) => (
              <li key={r.id} className="flex items-center gap-2 border-b border-blu-150 py-[0.375em] last:border-0">
                <span className="min-w-0 flex-1 leading-tight break-words text-grigio">{r.name}</span>
                {recipeSelect(r, HIDDEN)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Campo di riga che prende il fuoco appena aggiunto (nuova portata, nuova voce a mano) */
function AutoFocusInput({
  focus,
  onFocused,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { focus: boolean; onFocused: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (focus) {
      ref.current?.focus();
      onFocused();
    }
  }, [focus, onFocused]);
  return <input ref={ref} type="text" {...props} />;
}
