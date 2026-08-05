import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { flattenRecipe } from "@/lib/api";
import { getMenuDetail } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { getSiteUrl } from "@/lib/site-url";
import { formatMinutes, formatServings } from "@/lib/types";
import { resolveServeAt, computeStart, startLabel } from "@/lib/cook-schedule";
import type { Metadata } from "next";
import { CalendarDays, UtensilsCrossed, Star, Clock, Users, AlarmClock, ChefHat } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { QuickTag } from "@/components/ui/QuickTag";
import { MenuPdfButton } from "@/components/menu/MenuPdfButton";
import { MenuShoppingList } from "@/components/menu/MenuShoppingList";
import { MenuCosts } from "@/components/menu/MenuCosts";
import { MenuNotesCard } from "@/components/menu/MenuNotesCard";
import { MenuNoteQuickLink } from "@/components/menu/MenuNoteQuickLink";
import { ShareReviewLink } from "@/components/menu/ShareReviewLink";
import { MenuReceivedReviews } from "@/components/menu/MenuReceivedReviews";
import { MenuAdminBar } from "./MenuAdminBar";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const menu = await db.menu.findUnique({
    where: { id: Number(id) },
    select: { name: true },
  });
  return { title: menu ? `${menu.name} — Ricettario` : "Menù — Ricettario" };
}

export default async function MenuDetailPage({ params }: Params) {
  const { id } = await params;
  const menuId = Number(id);
  if (isNaN(menuId)) notFound();

  const session = await getSession();
  // Visitatore: dettaglio servito dalla cache (filtrato sulle ricette pubblicate); admin: fresco
  const menu = await getMenuDetail(menuId, !!session);
  if (!menu) notFound();

  const formattedDate = menu.date
    ? new Date(menu.date).toLocaleDateString("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  // Istante di servizio (data + ora opzionale): base per il countdown "quando iniziare"
  const serve = resolveServeAt(menu.date, menu.servingTime);

  // Link + QR di recensione (solo admin): generati server-side, mai inviati ai visitatori
  let reviewUrl: string | null = null;
  let reviewQr: string | null = null;
  if (session) {
    reviewUrl = `${getSiteUrl()}/recensisci/${menu.reviewToken}`;
    reviewQr = await QRCode.toDataURL(reviewUrl, { margin: 1, width: 400 });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-5">
      {/* Back: bottone condiviso (BackLink), identico su ricetta/menù/modalità cucina */}
      <BackLink href="/menu" label="Tutti i menù" />

      {/* Azioni admin (solo admin): pronto/non pronto + esporta + modifica + elimina,
          in cima — allineata al dettaglio ricetta (RecipeAdminBar) */}
      {session && (
        <MenuAdminBar
          menuId={menu.id}
          published={menu.published}
          pdfSlot={
            <MenuPdfButton
              variant="bar"
              menu={{
                name: menu.name,
                description: menu.description,
                date: menu.date,
                servingTime: menu.servingTime,
                photo: menu.photo,
                recipeIds: (menu.recipes as { recipe: { id: number } }[]).map((mr) => mr.recipe.id),
              }}
            />
          }
        />
      )}

      {/* Azioni admin secondarie (solo admin): modalità cucina + recensioni ospiti,
          come estensione della barra sopra (subito sotto, prima dell'immagine).
          Affiancate (larghezze uguali) finché la scritta ci sta, poi si incolonnano. */}
      {session && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/menu/${menu.id}/cucina`}
            className="group relative flex flex-1 min-w-40 items-center justify-center gap-2 overflow-hidden rounded-xl border border-orange-400/40 bg-linear-to-br from-orange-500 to-amber-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/30 active:translate-y-0 active:shadow-sm"
          >
            {/* Shine sweep all'hover */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
            <ChefHat size={16} className="shrink-0 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
            Modalità cucina
          </Link>
          {reviewUrl && reviewQr && (
            <div className="flex min-w-40 flex-1">
              <ShareReviewLink url={reviewUrl} qrDataUrl={reviewQr} />
            </div>
          )}
        </div>
      )}

      {/* Accesso rapido alla nota (solo admin, solo se presente): scrolla alla sezione note */}
      {session && menu.notes && <MenuNoteQuickLink note={menu.notes} targetId="note-menu" />}

      {/* Hero header.
          Griglia a cella singola: lo spaziatore impone il rapporto d'aspetto minimo,
          il testo sta in flusso nella stessa cella e può farla crescere. Prima il
          blocco era in `absolute` dentro un box ad altezza fissa: su schermo stretto
          titolo/descrizione/meta traboccavano oltre il bordo alto e sparivano. */}
      <div className="relative grid overflow-hidden rounded-2xl">
        {/* Spaziatore: altezza minima dell'hero */}
        <div className="col-start-1 row-start-1 aspect-3/1 sm:aspect-4/1 min-h-45" />

        {/* Immagine + velatura */}
        <div className="relative col-start-1 row-start-1">
          {menu.photo ? (
            <Image
              src={menu.photo}
              alt={menu.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
          ) : (
            <div className="h-full w-full bg-linear-to-br from-sky-900 to-sky-950 flex items-center justify-center">
              <UtensilsCrossed size={64} className="text-sky-600/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-sky-950/90 via-sky-950/45 to-transparent" />
        </div>

        {/* Testo: in flusso, allineato in basso */}
        <div className="relative col-start-1 row-start-1 flex min-w-0 flex-col justify-end p-4 sm:p-5">
          <h1 className="text-xl sm:text-3xl font-bold text-white drop-shadow [overflow-wrap:anywhere]">
            {menu.name}
          </h1>
          {menu.description && (
            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-white/80 line-clamp-3 sm:line-clamp-none">
              {menu.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {formattedDate && (
              <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-white/75">
                <CalendarDays size={11} className="shrink-0" />
                {formattedDate}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-white/75">
              <UtensilsCrossed size={11} className="shrink-0" />
              {menu._count.recipes} ricette
            </span>
            {menu.people != null && (
              <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-white/75">
                <Users size={11} className="shrink-0" />
                {menu.people} persone
              </span>
            )}
            {menu.avgRating !== null && (
              <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-amber-300">
                <Star size={11} fill="currentColor" className="shrink-0" />
                <span className="font-semibold">{menu.avgRating.toFixed(1)}</span>
                <span className="text-white/70">({menu._count.reviews} rec.)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ricette */}
      <section className="space-y-4">
        <SectionHeader
          title="Le ricette del menù"
          icon={<UtensilsCrossed size={20} />}
          tone="orange"
          size="lg"
          titleClassName="text-sky-50"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {(menu.recipes as { order: number; servings: number | null; recipe: ReturnType<typeof flattenRecipe> }[]).map(({ order, servings, recipe }) => {
            const totalTime = (recipe.prep ?? 0) + (recipe.cook ?? 0);
            // Porzioni effettive nel menù: override del menù, altrimenti default della ricetta
            const effectiveServings = servings ?? recipe.servings;
            // "Quando iniziare": calcolato solo se il menù ha una data
            const startInfo = serve ? computeStart(recipe, serve.serveAt) : null;
            // Niente "group" per le voci veloci: nessun Link, quindi niente hover cues (title/thumb) che suggeriscano cliccabilità
            // Stesso "vetro chiaro" delle altre card della pagina (lista spesa, costi, note):
            // con bg-white/30 il testo scuro sparisce nella fascia bassa del gradiente
            const cardClassName = `flex items-start gap-3 rounded-2xl border border-white/60 bg-white/75 backdrop-blur-md p-3.5 shadow-sm transition-all duration-200 ${
              recipe.quick ? "" : "group hover:bg-white/90 hover:shadow-md"
            }`;
            const cardContent = (
              <>
                {/* Order number */}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/90 text-xs font-bold text-white shadow-sm">
                  {order + 1}
                </span>

                {/* Thumb */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sky-100">
                  {recipe.photo ? (
                    <Image
                      src={recipe.photo}
                      alt={recipe.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Image src="/an10.webp" alt="" width={28} height={28} className="opacity-40 rounded-lg" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-sky-950 group-hover:text-orange-600 transition-colors line-clamp-1">
                    {recipe.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-sky-700">
                    {totalTime > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {formatMinutes(totalTime)}
                      </span>
                    )}
                    {effectiveServings && (
                      <span
                        className="flex items-center gap-1"
                        title={servings != null ? "Porzioni impostate per questo menù" : undefined}
                      >
                        <Users size={10} className={servings != null ? "text-orange-500" : undefined} />
                        {recipe.servingsUnit
                          ? formatServings(effectiveServings, recipe.servingsUnit)
                          : `${effectiveServings}p`}
                      </span>
                    )}
                    {recipe.avgRating !== null && (
                      <span className="flex items-center gap-1 text-amber-500">
                        <Star size={10} fill="currentColor" />
                        {recipe.avgRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {/* Quando iniziare le preparazioni */}
                  {startInfo && serve && (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-2 py-1 text-[11px] font-medium text-orange-700">
                      <AlarmClock size={11} className="shrink-0" />
                      {startLabel(startInfo, serve.hasTime)}
                    </div>
                  )}
                  {/* Categories */}
                  {recipe.categories.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {recipe.categories.slice(0, 2).map((c: { id: number; name: string; color: string }) => (
                        <span
                          key={c.id}
                          className="rounded-full px-2 py-0.5 text-[9px] font-semibold text-white"
                          style={{ backgroundColor: c.color + "cc" }}
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Ricetta "veloce": nessuna scheda, quindi nessun link cliccabile */}
                  {recipe.quick && <QuickTag label="Ricetta veloce" className="mt-1" />}
                </div>
              </>
            );
            return recipe.quick ? (
              <div key={recipe.id} className={cardClassName}>{cardContent}</div>
            ) : (
              <Link key={recipe.id} href={`/ricette/${recipe.id}`} className={cardClassName}>{cardContent}</Link>
            );
          })}
        </div>
      </section>

      {/* Lista della spesa + extra + totale speso (solo admin) */}
      {session && (
        <MenuShoppingList
          menuId={menu.id}
          items={menu.shoppingList ?? []}
          extraItems={menu.extraItems}
          groceryCost={menu.groceryCost}
        />
      )}

      {/* Costi e prezzo di vendita (solo admin) */}
      {session && (
        <MenuCosts
          menuId={menu.id}
          people={menu.people}
          groceryCost={menu.groceryCost}
          laborHours={menu.laborHours}
          laborRate={menu.laborRate}
          markupPercent={menu.markupPercent}
          costs={menu.costs}
        />
      )}

      {/* Note del menù (solo admin) — ancora per lo scroll dall'accesso rapido in alto */}
      {session && (
        <div id="note-menu" className="scroll-mt-24">
          <MenuNotesCard menuId={menu.id} initial={menu.notes} />
        </div>
      )}

      {/* Recensioni ricevute tramite il link di recensione (solo admin) */}
      {session && <MenuReceivedReviews initialReviews={menu.recipeReviews} avgRating={menu.avgRating} />}
    </div>
  );
}



