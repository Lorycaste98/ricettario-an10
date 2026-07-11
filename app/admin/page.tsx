import { redirect } from "next/navigation";
import Link from "next/link";
import type React from "react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Metadata } from "next";
import {
  BookOpen,
  UtensilsCrossed,
  Tag,
  Plus,
  Flame,
  FileJson,
  BookMarked,
  Carrot,
  Users,
  ChevronRight,
  User,
  MessageSquareHeart,
  Sparkles,
} from "lucide-react";
import ChartsSection from "@/components/admin/ChartsSection";
import { RecentReviews } from "@/components/admin/RecentReviews";
import type { ReviewItem } from "@/components/admin/ReviewCard";

export const metadata: Metadata = { title: "Admin — Ricettario" };

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isSuperAdmin = session.role === "SUPERADMIN";

  // Nomi esclusi dalla dashboard (gestibili dalla pagina admin/ingredienti)
  const excludedNames = await db.ingredientMaster
    .findMany({ where: { excludedFromStats: true }, select: { name: true } })
    .then((rows) => rows.map((r) => r.name));

  const [recipeCount, categoryCount, tagCount, menuCount, topCookedRaw, recentRecipeReviews, topIngredientsRaw, ingredientCount, categoriesRaw, tagsRaw] = await Promise.all([
    db.recipe.count(),
    db.category.count(),
    db.tag.count(),
    db.menu.count(),
    db.recipe.findMany({
      where: { cookCount: { gt: 0 } },
      orderBy: { cookCount: "desc" },
      take: 15,
      select: { id: true, name: true, cookCount: true },
    }),
    db.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, nickname: true, rating: true, comment: true, createdAt: true,
        recipe: { select: { id: true, name: true } },
        menu: { select: { id: true, name: true } },
      },
    }),
    db.ingredient.groupBy({
      by: ["name"],
      where: { name: { notIn: excludedNames } },
      _count: { name: true },
      orderBy: { _count: { name: "desc" } },
      take: 15,
    }),
    db.ingredient.count(),
    db.category.findMany({
      select: { name: true, color: true, _count: { select: { recipes: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.tag.findMany({
      select: { name: true, _count: { select: { recipes: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalCooks = await db.recipe.aggregate({ _sum: { cookCount: true } });

  // Ultime 5 recensioni ricetta (da menù o note personali admin)
  const recentReviews: ReviewItem[] = recentRecipeReviews.map((r) => ({
    id: r.id, nickname: r.nickname, rating: r.rating, comment: r.comment, createdAt: r.createdAt.toISOString(),
    recipe: r.recipe,
    menu: r.menu,
  }));

  const topCooked = topCookedRaw.map((r) => ({ name: r.name, value: r.cookCount }));
  const topIngredients = topIngredientsRaw.map((i) => ({ name: i.name, value: i._count.name }));
  const topCategories = categoriesRaw
    .map((c) => ({ name: c.name, value: c._count.recipes, color: c.color }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);
  const topTags = tagsRaw
    .map((t) => ({ name: t.name, value: t._count.recipes }))
    .filter((t) => t.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* ── Header ── */}
      <div className="fade-up flex flex-wrap items-end justify-between gap-3" style={{ animationDelay: "0ms" }}>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Ciao, <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">{session.username}</span>
          </h1>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-gray-500">
            <Sparkles size={15} className="text-orange-400" />
            Ecco cosa succede nel tuo ricettario
          </p>
        </div>
        {isSuperAdmin && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-indigo-500/30">
            <Users size={13} /> Superadmin
          </span>
        )}
      </div>

      {/* ── Crea (azioni primarie) ── */}
      <section className="fade-up space-y-4" style={{ animationDelay: "60ms" }}>
        <SectionTitle accent="from-orange-400 to-rose-500">Crea</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CreateCard
            href="/admin/ricette/nuova"
            icon={<BookOpen size={26} />}
            title="Nuova ricetta"
            subtitle="Aggiungi una ricetta al ricettario"
            tone="orange"
          />
          <CreateCard
            href="/admin/menu/nuovo"
            icon={<UtensilsCrossed size={26} />}
            title="Nuovo menù"
            subtitle="Componi un menù con le tue ricette"
            tone="sky"
          />
          <CreateCard
            href="/admin/import"
            icon={<FileJson size={26} />}
            title="Importa da JSON"
            subtitle="Carica più ricette in blocco"
            tone="violet"
          />
        </div>
      </section>

      {/* ── Gestione (azioni secondarie) ── */}
      <section className="fade-up space-y-4" style={{ animationDelay: "180ms" }}>
        <SectionTitle accent="from-gray-300 to-gray-400">Gestione</SectionTitle>
        <div className="flex flex-wrap gap-2.5 *:flex-1">
          <ManageLink href="/admin/ricette" icon={<BookOpen size={15} />} label="Ricette" color="orange" />
          <ManageLink href="/admin/menu" icon={<UtensilsCrossed size={15} />} label="Menù" color="sky" />
          <ManageLink href="/admin/vocabolario" icon={<BookMarked size={15} />} label="Categorie & Tag" color="violet" />
          <ManageLink href="/admin/ingredienti" icon={<Carrot size={15} />} label="Ingredienti" color="emerald" />
          <ManageLink href="/admin/import" icon={<FileJson size={15} />} label="Importa JSON" color="amber" />
          <ManageLink href="/admin/profilo" icon={<User size={15} />} label="Profilo" color="gray" />
          {isSuperAdmin && (
              <ManageLink href="/admin/utenti" icon={<Users size={15} />} label="Utenti" color="indigo" />
          )}
        </div>
      </section>

      {/* ── Panoramica (informazioni per entità) ── */}
      <section className="fade-up space-y-4" style={{ animationDelay: "120ms" }}>
        <SectionTitle accent="from-sky-400 to-cyan-500">Panoramica</SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <EntityCard
            color="orange"
            icon={<BookOpen size={18} />}
            title="Ricette"
            href="/ricette"
            manageLabel="Vedi tutte"
            stats={[
              { label: "Totali", value: recipeCount },
              { label: "Cucinate", value: totalCooks._sum.cookCount ?? 0, icon: <Flame size={13} /> },
            ]}
          />
          <EntityCard
            color="sky"
            icon={<UtensilsCrossed size={18} />}
            title="Menù"
            href="/admin/menu"
            manageLabel="Gestisci menù"
            stats={[{ label: "Totali", value: menuCount }]}
          />
          <EntityCard
            color="violet"
            icon={<BookMarked size={18} />}
            title="Vocabolario"
            href="/admin/vocabolario"
            manageLabel="Categorie & Tag"
            stats={[
              { label: "Categorie", value: categoryCount, icon: <Tag size={13} /> },
              { label: "Tag", value: tagCount },
            ]}
          />
          <EntityCard
            color="emerald"
            icon={<Carrot size={18} />}
            title="Ingredienti"
            href="/admin/ingredienti"
            manageLabel="Gestisci ingredienti"
            stats={[{ label: "Totali", value: ingredientCount }]}
          />
        </div>
      </section>

      {/* ── Ultime recensioni ── */}
      <section className="fade-up rounded-2xl border border-gray-100 bg-white p-5 shadow-sm" style={{ animationDelay: "240ms" }}>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-sm shadow-rose-500/30">
            <MessageSquareHeart size={16} />
          </span>
          Ultime recensioni
        </h2>
        <RecentReviews reviews={recentReviews} />
      </section>

      {/* ── Grafici ── */}
      <div className="fade-up" style={{ animationDelay: "300ms" }}>
        <ChartsSection topCategories={topCategories} topTags={topTags} topCooked={topCooked} topIngredients={topIngredients} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sotto-componenti
// ---------------------------------------------------------------------------

function SectionTitle({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <h2 className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-gray-700 shadow-sm backdrop-blur">
      <span className={`h-3.5 w-1 rounded-full bg-gradient-to-b ${accent}`} />
      {children}
    </h2>
  );
}

const CREATE_TONES = {
  orange: "from-orange-400 to-orange-600 shadow-orange-500/40",
  sky: "from-sky-400 to-sky-600 shadow-sky-500/40",
  violet: "from-violet-500 to-indigo-600 shadow-indigo-500/40",
} as const;

function CreateCard({
  href,
  icon,
  title,
  subtitle,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tone: keyof typeof CREATE_TONES;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] ${CREATE_TONES[tone]}`}
    >
      {/* bagliore decorativo */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15 blur-xl transition-transform duration-500 group-hover:scale-150" />
      <div className="relative flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[15px] font-bold leading-tight">
            <Plus size={15} className="shrink-0" /> {title}
          </p>
          <p className="mt-1 text-xs text-white/80">{subtitle}</p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-white/80 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

const ENTITY_COLORS = {
  orange: { bar: "from-orange-400 to-orange-500", tile: "from-orange-400 to-orange-500 shadow-orange-500/30", link: "text-orange-600", glow: "hover:shadow-orange-500/20" },
  sky: { bar: "from-sky-400 to-cyan-500", tile: "from-sky-400 to-cyan-500 shadow-sky-500/30", link: "text-sky-600", glow: "hover:shadow-sky-500/20" },
  violet: { bar: "from-violet-400 to-indigo-500", tile: "from-violet-400 to-indigo-500 shadow-indigo-500/30", link: "text-violet-600", glow: "hover:shadow-violet-500/20" },
  emerald: { bar: "from-emerald-400 to-teal-500", tile: "from-emerald-400 to-teal-500 shadow-emerald-500/30", link: "text-emerald-600", glow: "hover:shadow-emerald-500/20" },
} as const;

function EntityCard({
  color,
  icon,
  title,
  href,
  manageLabel,
  stats,
}: {
  color: keyof typeof ENTITY_COLORS;
  icon: React.ReactNode;
  title: string;
  href: string;
  manageLabel: string;
  stats: { label: string; value: number; icon?: React.ReactNode }[];
}) {
  const c = ENTITY_COLORS[color];
  return (
    <Link
      href={href}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl active:scale-[0.99] ${c.glow}`}
    >
      {/* barra colorata superiore — identità dell'entità */}
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.bar}`} />

      <div className="mb-3 flex items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${c.tile}`}>
          {icon}
        </span>
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      </div>

      <div className="flex flex-1 flex-wrap gap-x-5 gap-y-2">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {s.icon} {s.label}
            </p>
            <p className="text-2xl font-extrabold tabular-nums leading-tight text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <span className={`mt-3 inline-flex items-center gap-1 self-start text-xs font-semibold ${c.link}`}>
        {manageLabel}
        <ChevronRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

const MANAGE_COLORS = {
  orange: "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-300 hover:shadow-orange-500/15",
  sky: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 hover:shadow-sky-500/15",
  violet: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:border-violet-300 hover:shadow-violet-500/15",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-emerald-500/15",
  amber: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 hover:shadow-amber-500/15",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 hover:shadow-indigo-500/15",
  gray: "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300 hover:shadow-gray-500/15",
} as const;

function ManageLink({ href, icon, label, color }: { href: string; icon: React.ReactNode; label: string; color: keyof typeof MANAGE_COLORS }) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${MANAGE_COLORS[color]}`}
    >
      <span className="opacity-70 transition-transform duration-200 group-hover:scale-110 group-hover:opacity-100">{icon}</span>
      {label}
    </Link>
  );
}
