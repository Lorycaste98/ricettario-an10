"use client";

import { useState, type ReactNode } from "react";
import { BookOpen, Check, Clock, FileDown, Heart, Pencil, Plus, Timer, Trash2, Users } from "lucide-react";
import { An10Logo } from "@/components/brand/An10Logo";
import { An10SearchMark } from "@/components/brand/An10SearchMark";
import { Button, IconButton, Stepper } from "@/components/ds/Button";
import { Field, ReadonlyValue, SearchField, Select, TextArea, TextInput } from "@/components/ds/Field";
import { Checkbox, Chip, RatingInput, Segmented, Switch, VisibilityToggle } from "@/components/ds/Controls";
import { Counter, GuestRatingTag, HiddenTag, MyRatingTag, QuickRecipeTag, StepKindTag, Tag } from "@/components/ds/Tag";
import { ProgressBar, Skeleton, StepNumber, StepProgress, TimerRing } from "@/components/ds/Progress";
import { Banner, EmptyState, TimerAlert, Toast } from "@/components/ds/Feedback";
import {
  ClocheIcon,
  CutleryIcon,
  CuttingBoardIcon,
  GroceryBagIcon,
  LadleIcon,
  PlateIcon,
  PotIcon,
  RisingDoughIcon,
  StoveIcon,
} from "@/components/icons";

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-[1.25rem] border border-blu-150 bg-blu-50 p-(--pad)">
      <h2 className="mb-3.5 flex items-center gap-2.5 text-(length:--fs-sec) font-bold">
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-blu-800 text-sm text-white">{n}</span>
        {title}
      </h2>
      <div className="flex flex-wrap items-start gap-x-5 gap-y-4">{children}</div>
    </section>
  );
}

function Item({ code, label, children, wide }: { code: string; label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "flex w-full min-w-0 flex-col gap-2" : "flex max-w-full min-w-0 flex-col items-start gap-2"}>
      <div className="flex items-center gap-1.5">
        <span className="rounded-md bg-arancio-pieno px-1.5 py-1 font-mono text-[11px] leading-none font-bold text-white">{code}</span>
        <span className="text-xs text-grigio">{label}</span>
      </div>
      {children}
    </div>
  );
}

const CUSTOM_ICONS = [
  ["5.19", "Sto cucinando", PotIcon],
  ["5.20", "Preparazione", CuttingBoardIcon],
  ["5.21", "Cottura", StoveIcon],
  ["5.22", "Attesa", RisingDoughIcon],
  ["5.23", "Menù", ClocheIcon],
  ["5.24", "Lista spesa", GroceryBagIcon],
  ["5.25", "Dosi", PlateIcon],
  ["5.26", "Posate", CutleryIcon],
  ["5.27", "Veloce", LadleIcon],
] as const;

export function Showcase() {
  const [published, setPublished] = useState(true);
  const [checked, setChecked] = useState(true);
  const [tab, setTab] = useState<"ing" | "proc">("proc");
  const [cat, setCat] = useState("pane");
  const [rating, setRating] = useState<number | null>(8);
  const [awake, setAwake] = useState(true);
  const [servings, setServings] = useState(1);

  return (
    <div className="ds relative isolate">
      {/* fondo pieno sopra il gradiente delle pagine vecchie */}
      <div aria-hidden className="fixed inset-0 -z-10 bg-[oklch(92%_0.012_225)]" />
      <header className="mb-5 flex flex-wrap items-center gap-4">
        <An10Logo className="h-12 w-auto text-blu-600" />
        <div>
          <h1 className="text-(length:--fs-page) leading-tight font-bold">Prova elementi · restyle</h1>
          <p className="text-(length:--fs-meta) text-grigio">
            Componenti di <code>components/ds</code> con i codici della tavola. Visibile solo in locale e in anteprima.
          </p>
        </div>
      </header>

      <div className="grid items-start gap-(--gap) [grid-template-columns:repeat(auto-fit,minmax(min(100%,36rem),1fr))]">
        <Section n={1} title="Logo">
          <Item code="D8" label="orizzontale"><An10Logo className="h-14 w-auto text-blu-600" /></Item>
          <Item code="D8" label="impilato"><An10Logo variant="impilato" className="h-24 w-auto text-blu-950" /></Item>
          <Item code="D8" label="simbolo, su blu">
            <span className="rounded-[1.25rem] bg-blu-600 p-3 text-white"><An10Logo variant="simbolo" className="size-16" /></span>
          </Item>
          <Item code="9.6" label="lente «Cerca», visitatore">
            <span className="flex rounded-[1.25rem] bg-blu-100 p-3 text-blu-700"><An10SearchMark style={{ width: "4rem", height: "auto" }} /></span>
          </Item>
          <Item code="9.6" label="lente «Cerca», sei entrato (D9)">
            <span id="chefmark" className="flex rounded-[1.25rem] bg-blu-800 p-3 text-white"><An10SearchMark chef style={{ width: "4rem", height: "auto" }} /></span>
          </Item>
        </Section>

        <Section n={2} title="Testi">
          <Item code="2.1" label="titolo pagina" wide><p className="text-(length:--fs-page) font-bold">Focaccia barese</p></Item>
          <Item code="2.4" label="passo corrente" wide><p className="max-w-[24rem] text-(length:--fs-step) leading-snug">Lascia lievitare coperto finché non raddoppia.</p></Item>
          <Item code="2.6" label="dettagli"><p className="text-(length:--fs-meta) text-grigio">Pane · 2h 22min · 1 teglia</p></Item>
          <Item code="2.7" label="quantità"><p className="tabular font-bold text-arancio">500 g</p></Item>
          <Item code="2.8" label="timer"><p className="tabular text-(length:--fs-timer) font-bold text-ambra">1:03:00</p></Item>
        </Section>

        <Section n={3} title="Bottoni">
          <Item code="3.1" label="grande, in cucina"><Button size="lg" icon={<Check />}>Fatto</Button></Item>
          <Item code="3.2" label="primario"><Button icon={<PotIcon />}>Inizia a cucinare</Button></Item>
          <Item code="3.4" label="secondario"><Button variant="secondary" icon={<Pencil />}>Modifica</Button></Item>
          <Item code="3.5" label="tonale"><Button variant="tonal" icon={<FileDown />}>PDF</Button></Item>
          <Item code="3.6" label="testo"><Button variant="ghost">Vedi tutti</Button></Item>
          <Item code="3.7" label="elimina"><Button variant="danger" icon={<Trash2 />}>Elimina</Button></Item>
          <Item code="3.8" label="disattivo"><Button disabled>Salva</Button></Item>
          <Item code="3.9" label="piccolo"><Button size="sm" variant="secondary" icon={<Plus />}>Ingrediente</Button></Item>
          <Item code="3.10" label="icona">
            <div className="flex gap-2"><IconButton label="Preferito"><Heart /></IconButton><IconButton label="Sto cucinando"><PotIcon /></IconButton></div>
          </Item>
          <Item code="3.11" label="icona attiva"><IconButton label="Nei preferiti" active><Heart /></IconButton></Item>
          <Item code="3.12" label="icona di riga">
            <div className="flex gap-1.5"><IconButton size="row" label="Modifica"><Pencil /></IconButton><IconButton size="row" tone="danger" label="Elimina"><Trash2 /></IconButton></div>
          </Item>
          <Item code="3.13" label="dosi">
            <Stepper value={`${servings} ${servings === 1 ? "teglia" : "teglie"}`} onDecrement={() => setServings(Math.max(1, servings - 1))} onIncrement={() => setServings(servings + 1)} disableDecrement={servings <= 1} />
          </Item>
        </Section>

        <Section n={4} title="Campi e controlli">
          <Item code="4.1" label="campo"><Field label="Nome ricetta" className="w-60">{(p) => <TextInput {...p} defaultValue="Focaccia barese" />}</Field></Item>
          <Item code="4.3" label="errore"><Field label="Ora del servizio" error="Scrivi un'ora tra 00:00 e 23:59" className="w-60">{(p) => <TextInput {...p} defaultValue="25:00" />}</Field></Item>
          <Item code="4.4" label="tendina">
            <Field label="Categoria" className="w-60">{(p) => <Select {...p} defaultValue="pane"><option value="pane">Pane e focacce</option><option value="primi">Primi</option></Select>}</Field>
          </Item>
          <Item code="4.5" label="ricerca"><SearchField placeholder="Cerca ricette, ingredienti…" className="w-72" aria-label="Cerca" /></Item>
          <Item code="4.6" label="testo lungo"><Field label="Note" className="w-72">{(p) => <TextArea {...p} defaultValue="Impasta farina, acqua e sale per 10 minuti." />}</Field></Item>
          <Item code="4.7" label="calcolato"><ReadonlyValue className="w-40">27 min</ReadonlyValue></Item>
          <Item code="4.8" label="visibilità">
            <div className="flex items-center gap-2">
              <VisibilityToggle published={published} onToggle={() => setPublished(!published)} />
              <VisibilityToggle compact published={published} onToggle={() => setPublished(!published)} />
            </div>
          </Item>
          <Item code="4.9" label="spunta"><Checkbox checked={checked} onChange={setChecked} label="Farina 0" /></Item>
          <Item code="4.10" label="segmenti">
            <Segmented label="Sezione della ricetta" value={tab} onChange={setTab} className="w-72" options={[{ value: "ing", label: "Ingredienti" }, { value: "proc", label: "Procedura" }]} />
          </Item>
          <Item code="4.11" label="chip">
            <div className="flex flex-wrap gap-1.5">
              <Chip active={cat === "pane"} onClick={() => setCat("pane")} dot="oklch(70% .15 60)">Pane</Chip>
              <Chip active={cat === "primi"} onClick={() => setCat("primi")} dot="oklch(60% .13 25)">Primi</Chip>
              <Chip icon={<Clock />}>&lt; 30 min</Chip>
              <Chip onRemove={() => undefined}>#lievitati</Chip>
            </div>
          </Item>
          <Item code="4.12" label="voto 1-10"><RatingInput value={rating} onChange={setRating} /></Item>
          <Item code="4.13" label="interruttore"><Switch checked={awake} onChange={setAwake} label="Schermo sempre acceso" /></Item>
        </Section>

        <Section n={5} title="Icone del progetto">
          {CUSTOM_ICONS.map(([code, label, Icon]) => (
            <Item key={code} code={code} label={label}><Icon className="text-blu-800" size={28} /></Item>
          ))}
        </Section>

        <Section n={6} title="Etichette">
          <Item code="6.1" label="tipo di passo">
            <div className="flex flex-wrap gap-1.5"><StepKindTag kind="PREP" duration="10 min" /><StepKindTag kind="COOK" duration="25 min" /><StepKindTag kind="WAIT" duration="1h 30min" /></div>
          </Item>
          <Item code="6.2" label="voto ospiti"><GuestRatingTag value={9} count={4} /></Item>
          <Item code="6.3" label="il mio voto"><MyRatingTag value={8} /></Item>
          <Item code="6.4" label="non pronta"><HiddenTag /></Item>
          <Item code="6.5" label="opzionale"><Tag tone="optional">opzionale</Tag></Item>
          <Item code="6.6" label="veloce"><QuickRecipeTag /></Item>
          <Item code="6.7" label="contatore"><Counter value={2} label="2 timer finiti" /></Item>
          <Item code="6.8" label="dosi"><Tag tone="scale">dosi ×1,5</Tag></Item>
          <Item code="6.9" label="ruolo"><div className="flex gap-1.5"><Tag tone="role">Superadmin</Tag><Tag tone="roleLight">Admin</Tag></div></Item>
          <Item code="6.10" label="sforamento"><Tag tone="over">120 / 100 g</Tag></Item>
        </Section>

        <Section n={7} title="Avanzamento">
          <Item code="7.1" label="passi"><StepProgress total={6} done={2} className="w-72" /></Item>
          <Item code="7.2" label="numero passo"><div className="flex gap-2.5"><StepNumber n={2} state="done" /><StepNumber n={3} state="current" /><StepNumber n={4} state="todo" /></div></Item>
          <Item code="7.3" label="spesa"><ProgressBar value={21} max={26} label="21 di 26 comprati" className="w-72" /></Item>
          <Item code="7.4" label="timer ad anello"><TimerRing fraction={0.65}>63:00</TimerRing></Item>
          <Item code="7.5" label="caricamento"><div className="flex w-72 gap-3"><Skeleton className="size-13" /><div className="flex flex-1 flex-col gap-2 pt-1.5"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div></Item>
        </Section>

        <Section n={10} title="Messaggi">
          <Item code="10.2" label="avviso breve"><Toast action="Apri">Ricetta salvata</Toast></Item>
          <Item code="10.3" label="niente da mostrare">
            <EmptyState icon={<ClocheIcon />} title="Nessun menù in programma" action={<Button size="sm" icon={<Plus />}>Nuovo menù</Button>} className="w-72">
              Crea un menù per pianificare la prossima cena.
            </EmptyState>
          </Item>
          <Item code="10.4" label="avviso in pagina"><Banner className="w-96 max-w-full" action={<Button size="sm" variant="secondary">Ripristina</Button>}>Dosi ricalcolate ×1,5</Banner></Item>
          <Item code="10.5" label="timer finito">
            <div className="w-80 max-w-full"><TimerAlert title="Lievitazione finita" detail="Focaccia barese · passo 3" action={<Button size="sm" className="bg-blu-950! text-white!">OK</Button>} /></div>
          </Item>
        </Section>

        <Section n={8} title="Prova d'insieme · passo corrente (8.7)">
          <div className="w-full max-w-[28rem] rounded-card border-2 border-arancio bg-white p-3.5">
            <StepKindTag kind="WAIT" duration="1h 30min" />
            <div className="mt-2 flex gap-2.5">
              <StepNumber n={3} state="current" />
              <p className="text-(length:--fs-step) leading-snug">Lascia lievitare coperto finché non raddoppia di volume.</p>
            </div>
            <p className="mt-2 text-[0.8125rem] text-grigio">Ti servono: <b className="text-blu-950">l&apos;impasto</b> · <b className="text-blu-950">un canovaccio</b></p>
            <div className="mt-3 flex gap-2.5">
              <div className="tabular flex h-(--h-btn-lg) flex-1 items-center gap-2 rounded-ctl bg-giallo-100 px-3 text-xl font-bold text-giallo-ink"><Timer className="size-5" aria-hidden />1:03:00</div>
              <Button size="lg" icon={<Check />}>Fatto</Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-(length:--fs-meta) text-grigio"><Users className="size-4" aria-hidden />8 persone · <BookOpen className="size-4" aria-hidden />5 ricette</div>
        </Section>
      </div>
    </div>
  );
}
