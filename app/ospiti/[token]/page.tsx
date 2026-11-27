import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { guestMenuByToken } from "@/lib/guest-menu";
import { GuestMenuSheet } from "@/components/menu/GuestMenuSheet";
import { THEME } from "@/components/menu/guest-themes";

/**
 * Pagina pubblica del menù «per gli ospiti» (Esporta → Link): il menù da mandare ad amici e parenti,
 * sempre aggiornato con le portate salvate. Nessun login, protetta dal token del menù (lo stesso del
 * link delle recensioni: stesso pubblico). Fuori dalla cornice dell'app (`BARE_ROUTE` in AppShell):
 * deve sembrare un menù, non il ricettario. Dopo il servizio propone di votare i piatti.
 */

type Params = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params;
  const data = await guestMenuByToken(token);
  return { title: data ? `${data.menu.name} — Menù` : "Menù", robots: { index: false, follow: false } };
}

export default async function GuestMenuPage({ params }: Params) {
  const { token } = await params;
  const data = await guestMenuByToken(token);
  if (!data) notFound();
  const { menu, sheet, reviewToken } = data;
  const t = THEME[sheet.theme];
  // il voto ha senso dal giorno del servizio in poi (senza data: sempre)
  // eslint-disable-next-line react-hooks/purity -- server component: l'ora della richiesta
  const served = !menu.date || new Date(menu.date).getTime() <= Date.now() + 12 * 3600_000;

  return (
    <div className="flex min-h-dvh justify-center sm:py-8" style={{ background: `color-mix(in oklch, ${t.bg} 70%, ${t.band})` }}>
      <GuestMenuSheet
        menu={menu}
        sheet={sheet}
        style={{ width: "100%", maxWidth: 440, boxShadow: "0 18px 50px rgb(0 0 0 / 0.18)" }}
        footer={
          served ? (
            <Link
              href={`/recensisci/${reviewToken}`}
              className="mt-4 inline-flex min-h-11 items-center rounded-full px-5 font-sans text-[0.9375rem] font-bold text-white"
              style={{ background: t.band }}
            >
              Hai assaggiato? Vota i piatti
            </Link>
          ) : undefined
        }
      />
    </div>
  );
}
