import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/components/AuthProvider";
import { DialogProvider } from "@/components/ui/ConfirmDialog";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Ricettario",
  description: "Il mio ricettario personale",
  icons: {
    icon: "/logo.ico",
    shortcut: "/logo.ico",
    apple: "/apple-icon.png",
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
