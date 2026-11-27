import { COMPACT_BOOT_SCRIPT } from "@/lib/preference-keys";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/components/AuthProvider";
import { CardConfigProvider } from "@/components/CardConfigProvider";
import { getCardConfig } from "@/lib/site-settings";
import { PhotoViewer } from "@/components/ui/PhotoViewer";
import { CookingDock } from "@/components/cooking/CookingDock";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

const TITLE = "Ricettario AN10";
const DESCRIPTION = "Il mio personale ricettario: ricette, menù e tempi di preparazione.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: TITLE,
  openGraph: {
    type: "website",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    locale: "it_IT",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  // App installata su iPhone/iPad (fase 7): schermo intero, barra di stato trasparente sopra la
  // fascia blu di AppShell (che copre `safe-area-inset-top`), nome breve sotto l'icona.
  appleWebApp: {
    capable: true,
    title: "AN10",
    statusBarStyle: "black-translucent",
  },
  // iOS trasforma in link telefonici i numeri lunghi (quantità, orari): no
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#074f67", // blu-800 della cornice, come `theme_color` in app/manifest.ts
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // informazioni delle card decise dall'admin per tutti (Impostazioni), cachate a tag
  const cardConfig = await getCardConfig();
  return (
    // suppressHydrationWarning: lo script qui sotto può aggiungere `data-compact` prima di React
    <html lang="it" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* vista compatta dei dettagli già al primo disegno, niente scatto (lib/preferences.ts) */}
        <script dangerouslySetInnerHTML={{ __html: COMPACT_BOOT_SCRIPT }} />
      </head>
      <body className="ds min-h-screen">
        <AuthProvider>
          <CardConfigProvider value={cardConfig}>
            <AppShell>{children}</AppShell>
          </CardConfigProvider>
          {/* Visore foto a schermo intero: montato una volta, si apre via evento (ViewerImage) */}
          <PhotoViewer />
          {/* «Sto cucinando»: pannello + scheduler dei timer (fila e mini-barra stanno in AppShell) */}
          <CookingDock />
          {/* Ricerca globale: overlay montato una volta, si apre con openSearch() / ⌘K */}
          <SearchOverlay />
        </AuthProvider>
      </body>
    </html>
  );
}
