import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Ricettario",
  description: "Il mio ricettario personale",
  icons: { icon: "/logo.ico", shortcut: "/logo.ico", apple: "/logo.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-screen font-sans bg-transparent">
        <AuthProvider>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
