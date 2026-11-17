import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/components/AuthProvider";
import { DialogProvider } from "@/components/ui/ConfirmDialog";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="h-full antialiased">
      <body className="ds min-h-screen">
        <AuthProvider>
          <DialogProvider>
            <AppShell>{children}</AppShell>
            {/* Visore foto a schermo intero: montato una volta, si apre via evento (ViewerImage) */}
            <PhotoViewer />
            {/* «Sto cucinando»: pannello + scheduler dei timer (fila e mini-barra stanno in AppShell) */}
            <CookingDock />
            {/* Ricerca globale: overlay montato una volta, si apre con openSearch() / ⌘K */}
            <SearchOverlay />
          </DialogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
