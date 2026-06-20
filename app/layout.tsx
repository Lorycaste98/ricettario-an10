import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/components/AuthProvider";
import { DialogProvider } from "@/components/ui/ConfirmDialog";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

// URL base per OG/canonical: dominio di produzione Vercel (stabile) o override esplicito
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const TITLE = "Ricettario AN10";
const DESCRIPTION = "Il ricettario di famiglia: ricette, menù e tempi di preparazione.";

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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#082f49",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-screen font-sans page-bg">
        <AuthProvider>
          <DialogProvider>
            <AppShell>{children}</AppShell>
          </DialogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
