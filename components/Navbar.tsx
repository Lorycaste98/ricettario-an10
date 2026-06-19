"use client";
import { Fraunces } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Menu, X, LogOut, ChefHat, LayoutDashboard, BookOpen, UtensilsCrossed, Users, Heart, LogIn } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useFavorites } from "@/lib/favorites";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "700",
  style: "italic",
  variable: "--font-fraunces",
  display: "swap",
});

export function Navbar() {
  const { isAdmin, username, role, loading } = useAuth();
  const { favorites, hydrated: favHydrated } = useFavorites();
  const favCount = favHydrated ? favorites.size : 0;
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // chiudi menu al cambio pagina
  useEffect(() => {
    const id = setTimeout(() => setMenuOpen(false), 0);
    return () => clearTimeout(id);
  }, [pathname]);

  // blocca scroll body quando menu aperto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const logout = async () => {
    setMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
    window.location.reload();
  };

  const navLinks: { href: string; label: string; icon: typeof BookOpen; badge?: number }[] = [
    ...(isAdmin ? [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      ...(role === "SUPERADMIN" ? [{ href: "/admin/utenti", label: "Utenti", icon: Users }] : []),
    ] : []),
    { href: "/ricette", label: "Ricette", icon: BookOpen },
    { href: "/menu", label: "Menù", icon: UtensilsCrossed },
    { href: "/preferiti", label: "Preferiti", icon: Heart, badge: favCount },
  ];

  const isActive = (href: string) =>
      pathname === href || pathname.startsWith(href + "/");

  return (
      <>
        {/* ── Header ── */}
        <header
            className="sticky top-0 z-40 bg-sky-950 border-b-[1.5px] border-sky-800"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">

            {/* Logo */}
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="relative shrink-0">
                <Image
                    src="/an10.webp" alt="AN10" width={34} height={34}
                    className="rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                />
                <div className="absolute inset-0 rounded-xl ring-2 ring-orange-500/0 group-hover:ring-orange-500/40 transition-all duration-300 -z-10" />
              </div>
              <span className={`${fraunces.className} text-[19px] text-sky-100 transition-colors duration-200 group-hover:text-orange-400`}>
                Ricettario
              </span>
            </Link>

            {/* Nav — hidden on mobile (<sm), icons-only on sm→lg, full on lg+ */}
            <nav className="hidden sm:flex items-center gap-0.5 p-1 rounded-xl bg-sky-900 border-[1.5px] border-sky-700">
              {navLinks.map(({ href, label, icon: Icon, badge }) => (
                  <Link
                      key={href}
                      href={href}
                      title={label}
                      className={`relative flex items-center justify-center rounded-lg sm:size-9 sm:p-0 lg:size-auto lg:px-4 lg:py-1.5 text-sm font-medium transition-colors duration-150 ${
                          isActive(href) ? "text-sky-50" : "text-sky-400 hover:text-sky-100"
                      }`}
                  >
                    {isActive(href) && (
                        <motion.span
                            layoutId="nav-pill"
                            className="absolute inset-0 rounded-lg bg-sky-800 border border-sky-600"
                            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                        />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {/* Icon — always visible, badge lives here */}
                      <span className="relative">
                        <Icon size={13} />
                        {badge !== undefined && badge > 0 && (
                            <span className="absolute -top-2 -right-2.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white shadow ring-1 ring-sky-950">
                              {badge > 99 ? "99+" : badge}
                            </span>
                        )}
                      </span>
                      {/* Label — hidden on sm→lg, visible on lg+ */}
                      <span className="hidden lg:inline-flex">{label}</span>
                    </span>
                    {isActive(href) && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-orange-500 z-10" />
                    )}
                  </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {!loading && (
                  isAdmin ? (
                      <div className="hidden sm:flex items-center gap-2">
                        {/* Profile — icon+name on lg+, icon-only on sm→lg */}
                        <Link
                            href="/admin/profilo"
                            title={username || "Profilo"}
                            className="flex items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-sky-700 bg-sky-900 sm:size-9 sm:p-0 lg:size-auto lg:px-3 lg:py-1.5 text-sm font-medium text-sky-300 hover:border-orange-500/50 hover:text-orange-300 transition-all duration-150"
                        >
                          <ChefHat size={13} className="text-orange-400 shrink-0" />
                          <span className="hidden lg:inline">{username}</span>
                        </Link>
                        {/* Logout — icon+label on lg+, icon-only on sm→lg */}
                        <button
                            onClick={logout}
                            title="Esci"
                            className="flex items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-sky-700 bg-transparent sm:size-9 sm:p-0 lg:size-auto lg:px-3 lg:py-1.5 text-sm text-sky-300 hover:bg-red-950 hover:text-red-300 hover:border-red-800 transition-all duration-150"
                        >
                          <LogOut size={13} className="shrink-0" />
                          <span className="hidden lg:inline">Esci</span>
                        </button>
                      </div>
                  ) : (
                      <Link
                          href="/login"
                          title="Accedi"
                          className="hidden sm:flex items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-sky-700 bg-sky-900 sm:size-9 sm:p-0 lg:size-auto lg:px-3 lg:py-1.5 text-sm text-sky-300 hover:bg-sky-800 hover:text-sky-100 transition-all duration-150"
                      >
                        <LogIn size={13} className="opacity-50 shrink-0" />
                        <span className="hidden lg:inline">Accedi</span>
                      </Link>
                  )
              )}

              {/* Hamburger — mobile only (<sm) */}
              <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label={menuOpen ? "Chiudi menu" : "Apri menu"}
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg border-[1.5px] border-sky-700 bg-sky-900 text-sky-300 hover:bg-sky-800 hover:text-sky-100 transition-all duration-150 sm:hidden"
              >
                <span className={`absolute transition-all duration-300 ${menuOpen ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-180"}`}>
                  <X size={17} />
                </span>
                <span className={`absolute transition-all duration-300 ${menuOpen ? "opacity-0 scale-50 -rotate-180" : "opacity-100 scale-100 rotate-0"}`}>
                  <Menu size={17} />
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Mobile overlay ── */}
        {/* Backdrop */}
        <div
            className={`fixed inset-0 z-30 sm:hidden transition-opacity duration-300 ${
                menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-sky-950/70 backdrop-blur-sm" />
        </div>

        {/* Panel scorrevole dall'alto */}
        <div
            className={`fixed top-0 left-0 right-0 sm:hidden transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                menuOpen ? "translate-y-0" : "-translate-y-full"
            }`}
            style={{ zIndex: 39 }}
        >
          <div
              className="bg-sky-900 border-b-[1.5px] border-sky-700 pt-20 pb-7 px-4"
              style={{ paddingTop: "calc(5rem + env(safe-area-inset-top, 0px))" }}
          >

            {/* Nav links */}
            <p className="text-[10px] text-sky-500 font-medium uppercase tracking-widest mb-2 px-1">
              Navigazione
            </p>
            <nav className="space-y-1">
              {navLinks.map(({ href, label, icon: Icon, badge }, i) => (
                  <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 border ${
                          isActive(href)
                              ? "bg-sky-800 text-sky-50 border-sky-600"
                              : "text-sky-400 border-transparent hover:bg-sky-800/50 hover:text-sky-100"
                      }`}
                      style={{
                        transitionDelay: menuOpen ? `${60 + i * 40}ms` : "0ms",
                        transform: menuOpen ? "translateX(0)" : "translateX(-12px)",
                        opacity: menuOpen ? 1 : 0,
                      }}
                  >
                    <span className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 ${
                        isActive(href)
                            ? "bg-orange-500 border-orange-400 text-white"
                            : "bg-sky-800 border-sky-600 text-sky-400"
                    }`}>
                      <Icon size={17} />
                      {badge !== undefined && badge > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-sky-900">
                            {badge > 99 ? "99+" : badge}
                          </span>
                      )}
                    </span>
                    <span className="flex-1">{label}</span>
                    {isActive(href) && (
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
                    )}
                  </Link>
              ))}
            </nav>

            {/* Divider */}
            <div className="my-5 h-px bg-sky-700/60" />

            {/* Auth */}
            <p className="text-[10px] text-sky-500 font-medium uppercase tracking-widest mb-2 px-1">
              Account
            </p>
            {!loading && (
                isAdmin ? (
                    <div className="space-y-2">
                      <Link href="/admin/profilo" className="flex items-center gap-3 rounded-xl bg-sky-800 border border-sky-600 px-3 py-2.5 hover:border-orange-500/50 transition-all duration-150">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/20 border border-orange-500/40">
                          <ChefHat size={17} className="text-orange-400" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] text-sky-400 font-medium uppercase tracking-wider">Connesso come</p>
                          <p className="text-sky-50 font-medium truncate text-sm">{username}</p>
                        </div>
                      </Link>
                      <button
                          onClick={logout}
                          className="flex w-full items-center gap-3 rounded-xl border border-sky-700 px-3 py-2.5 text-sm font-medium text-sky-400 hover:bg-red-950 hover:text-red-300 hover:border-red-800 transition-all duration-150"
                      >
                        <LogOut size={15} className="shrink-0" />
                        Esci dall&apos;account
                      </button>
                    </div>
                ) : (
                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-sky-700 bg-sky-800 px-4 py-2.5 text-sm font-medium text-sky-200 hover:bg-sky-700 hover:text-white transition-all duration-150"
                    >
                      <LogIn size={13} className="opacity-50"/>
                      Accedi
                    </Link>
                )
            )}
          </div>
        </div>
      </>
  );
}
