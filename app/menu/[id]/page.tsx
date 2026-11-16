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
import { AlarmClock, ChevronRight, Clock, Users } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { ViewerImage } from "@/components/ui/ViewerImage";
import { PageHeader } from "@/components/ds/PageHeader";
import { GuestRatingTag, QuickRecipeTag, Tag } from "@/components/ds/Tag";
import { An10Logo } from "@/components/brand/An10Logo";
import { ClocheIcon, PotIcon } from "@/components/icons";
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
        weekday: "short",
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

  const recipes = menu.recipes as {
    order: number;
    servings: number | null;
    recipe: ReturnType<typeof flattenRecipe>;
  }[];
  const pdf = {
    name: menu.name,
    description: menu.description,
    date: menu.date,
    servingTime: menu.servingTime,
    photo: menu.photo,
    recipeIds: recipes
      .filter((mr) => !mr.recipe.quick)
      .map((mr) => mr.recipe.id),
  };
  const meta = [
    formattedDate,
    menu.servingTime ? `servizio alle ${menu.servingTime}` : null,
    menu.people != null ? `${menu.people} persone` : null,
    `${menu._count.recipes} ${menu._count.recipes === 1 ? "ricetta" : "ricette"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="flex flex-col gap-4">
      <PageHeader
        back={<BackLink href="/menu" label="Tutti i menù" />}
        thumb={
          menu.photo ? (
            <div className="relative size-full">
              <ViewerImage
                photos={[menu.photo]}
                src={menu.photo}
                alt={menu.name}
                className="object-cover"
                sizes="64px"
                priority
              />
            </div>
          ) : (
            <div className="flex size-full items-center justify-center bg-area-menu-50 text-area-menu [&>svg]:size-3/5">
              <ClocheIcon />
            </div>
          )
        }
        title={menu.name}
        meta={meta}
        actions={
          <MenuAdminBar menuId={menu.id} published={menu.published} pdf={pdf} />
        }
      />

      {/* Azioni di lavoro (solo admin): una sola arancio per zona */}
      {session && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/menu/${menu.id}/cucina`}
            className="inline-flex h-(--h-btn) items-center gap-[0.45em] rounded-ctl bg-arancio px-[1.05em] font-semibold text-white hover:bg-arancio-scuro [&_svg]:size-[1.15em]"
          >
            <PotIcon aria-hidden /> Modalità cucina
          </Link>
          {reviewUrl && reviewQr && (
            <ShareReviewLink
              url={reviewUrl}
              qrDataUrl={reviewQr}
              menuName={menu.name}
            />
          )}
        </div>
      )}

      {session && menu.notes && (
        <MenuNoteQuickLink note={menu.notes} targetId="note-menu" />
      )}

      {/* Corpo: ricette + spesa · da 1000px colonna laterale con foto, costi e note */}
      <div
        className={
          session || menu.photo
            ? "grid items-start gap-(--gap) @min-[1000px]:grid-cols-[1fr_clamp(18rem,32cqi,25rem)]"
            : "grid gap-(--gap) @min-[1000px]:max-w-[52rem]"
        }
      >
        <div className="flex min-w-0 flex-col gap-(--gap)">
          {menu.description && (
            <p className="text-[0.9375rem] leading-relaxed text-pretty whitespace-pre-line">
              {menu.description}
            </p>
          )}

          <section
            className="flex flex-col gap-2"
            aria-labelledby="ricette-menu"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2
                id="ricette-menu"
                className="text-(length:--fs-sec) font-bold"
              >
                Le ricette
              </h2>
              {menu.avgRating !== null && (
                <GuestRatingTag
                  value={menu.avgRating}
                  count={menu._count.reviews}
                />
              )}
            </div>
            <ol className="flex flex-col overflow-hidden rounded-card border border-blu-150 bg-white">
              {recipes.map(({ order, servings, recipe }) => {
                const totalTime = (recipe.prep ?? 0) + (recipe.cook ?? 0);
                const effectiveServings = servings ?? recipe.servings;
                const startInfo = serve
                  ? computeStart(recipe, serve.serveAt)
                  : null;
                const content = (
                  <>
                    <span className="tabular flex size-7 shrink-0 items-center justify-center rounded-full bg-blu-120 text-[0.8125rem] font-bold text-blu-800">
                      {order + 1}
                    </span>
                    <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-ctl bg-blu-100 text-blu-600">
                      {recipe.photo ? (
                        <Image
                          src={recipe.photo}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <An10Logo
                          variant="simbolo"
                          title=""
                          className="w-1/2"
                        />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-blu-950 group-hover:text-blu-700">
                          {recipe.name}
                        </span>
                        {recipe.quick && <QuickRecipeTag />}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-(length:--fs-meta) text-grigio">
                        {recipe.categories[0] && (
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ background: recipe.categories[0].color }}
                            title={recipe.categories[0].name}
                          />
                        )}
                        {totalTime > 0 && (
                          <span className="tabular flex items-center gap-1">
                            <Clock className="size-3.5" aria-hidden />{" "}
                            {formatMinutes(totalTime)}
                          </span>
                        )}
                        {effectiveServings && (
                          <span
                            className={
                              servings != null
                                ? "flex items-center gap-1 font-semibold text-arancio-scuro"
                                : "flex items-center gap-1"
                            }
                            title={
                              servings != null
                                ? "Porzioni impostate per questo menù"
                                : undefined
                            }
                          >
                            <Users className="size-3.5" aria-hidden />
                            {formatServings(
                              effectiveServings,
                              recipe.servingsUnit,
                            )}
                          </span>
                        )}
                        {recipe.avgRating !== null && (
                          <GuestRatingTag value={recipe.avgRating} />
                        )}
                        {startInfo && serve && (
                          <Tag tone="wait" icon={<AlarmClock />}>
                            {startLabel(startInfo, serve.hasTime)}
                          </Tag>
                        )}
                      </span>
                    </span>
                    {!recipe.quick && (
                      <ChevronRight
                        className="size-4 shrink-0 text-blu-250"
                        aria-hidden
                      />
                    )}
                  </>
                );
                const cls = "flex items-center gap-3 px-3 py-2.5";
                return (
                  <li
                    key={recipe.id}
                    className="border-b border-blu-150 last:border-b-0"
                  >
                    {recipe.quick ? (
                      <div className={cls}>{content}</div>
                    ) : (
                      <Link
                        href={`/ricette/${recipe.id}`}
                        className={`group ${cls} hover:bg-blu-50`}
                      >
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          {session && (
            <MenuShoppingList
              menuId={menu.id}
              items={menu.shoppingList ?? []}
              extraItems={menu.extraItems}
              groceryCost={menu.groceryCost}
            />
          )}
        </div>

        {(session || menu.photo) && (
          <aside className="flex min-w-0 flex-col gap-(--gap)">
            {menu.photo && (
              <div className="relative hidden aspect-4/3 overflow-hidden rounded-card bg-blu-100 @min-[1000px]:block">
                <ViewerImage
                  photos={[menu.photo]}
                  src={menu.photo}
                  alt={menu.name}
                  className="object-cover"
                  sizes="25rem"
                />
              </div>
            )}
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
            {session && (
              <div id="note-menu" className="scroll-mt-24">
                <MenuNotesCard menuId={menu.id} initial={menu.notes} />
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Recensioni ricevute tramite il link di recensione (solo admin) */}
      {session && (
        <MenuReceivedReviews
          initialReviews={menu.recipeReviews}
          avgRating={menu.avgRating}
        />
      )}
    </article>
  );
}
