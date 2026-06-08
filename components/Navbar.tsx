"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, ChefHat, LayoutDashboard, BookOpen, UtensilsCrossed } from "lucide-react";
import { useAuth } from "./AuthProvider";

export function Navbar() {
  const { isAdmin, username, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    router.push("/");
    router.refresh();
    window.location.reload();
  };

  const navLinks = [
    { href: "/", label: "Ricette", icon: BookOpen },
    { href: "/menu", label: "Menù", icon: UtensilsCrossed },
    ...(isAdmin ? [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] : []),
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* ── Header ── */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-white/85 backdrop-blur-xl shadow-md shadow-sky-900/15 border-b border-white/40"
            : "bg-white/55 backdrop-blur-md border-b border-white/20"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">

          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="relative shrink-0">
              <Image
                src="/an10.webp" alt="AN10" width={34} height={34}
                className="rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
              />
              <div className="absolute inset-0 rounded-xl bg-sky-300/30 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300 -z-10" />
            </div>
            <span className="text-lg font-bold tracking-tight text-sky-950 transition-colors duration-200 group-hover:text-sky-600">
              Ricettario
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1 p-1 rounded-2xl bg-white/30 border border-white/40 backdrop-blur-sm">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                  isActive(href)
                    ? "bg-white/80 text-sky-950 shadow-sm"
                    : "text-sky-700 hover:bg-white/50 hover:text-sky-950"
                }`}
              >
                <Icon size={13} />
                {label}
                {isActive(href) && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-orange-500 transition-all" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {!loading && (
              isAdmin ? (
                <div className="hidden sm:flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full border border-white/40 bg-white/40 px-3 py-1.5 text-xs font-semibold text-sky-800">
                    <ChefHat size={12} className="text-orange-500" />
                    {username}
                  </span>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/40 px-3 py-1.5 text-sm text-sky-900 hover:bg-red-50/70 hover:text-red-600 hover:border-red-200/60 transition-all duration-200"
                  >
                    <LogOut size={13} />
                    Esci
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:flex items-center rounded-xl border border-white/30 bg-white/40 px-3 py-1.5 text-sm text-sky-900 hover:bg-white/70 transition-all duration-200"
                >
                  Admin
                </Link>
              )
            )}

            {/* Hamburger animato */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Chiudi menu" : "Apri menu"}
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 sm:hidden ${
                menuOpen
                  ? "border-white/30 bg-white/20 text-white"
                  : "border-white/30 bg-white/40 text-sky-800 hover:bg-white/60"
              }`}
            >
              <span className={`absolute transition-all duration-300 ${menuOpen ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-180"}`}>
                <X size={18} />
              </span>
              <span className={`absolute transition-all duration-300 ${menuOpen ? "opacity-0 scale-50 -rotate-180" : "opacity-100 scale-100 rotate-0"}`}>
                <Menu size={18} />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile overlay menu ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-30 sm:hidden transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      >
        <div className="absolute inset-0 bg-sky-950/60 backdrop-blur-xl" />
      </div>

      {/* Panel scorrevole dall'alto */}
      <div
        className={`fixed top-0 left-0 right-0 z-35 sm:hidden transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          menuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ zIndex: 39 }}
      >
        <div className="bg-linear-to-b from-sky-950/95 to-sky-900/90 backdrop-blur-2xl border-b border-white/15 shadow-2xl pt-20 pb-8 px-6">

          {/* Nav links */}
          <nav className="space-y-1.5">
            {navLinks.map(({ href, label, icon: Icon }, i) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 text-base font-semibold transition-all duration-200 ${
                  isActive(href)
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
                style={{
                  transitionDelay: menuOpen ? `${80 + i * 50}ms` : "0ms",
                  transform: menuOpen ? "translateX(0)" : "translateX(-16px)",
                  opacity: menuOpen ? 1 : 0,
                }}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isActive(href) ? "bg-orange-500 text-white" : "bg-white/10 text-white/70"
                }`}>
                  <Icon size={19} />
                </span>
                <span className="flex-1">{label}</span>
                {isActive(href) && (
                  <span className="h-2 w-2 rounded-full bg-orange-400 shrink-0" />
                )}
              </Link>
            ))}
          </nav>

          {/* Divider */}
          <div className="my-6 h-px bg-white/10" />

          {/* Auth */}
          {!loading && (
            isAdmin ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/30">
                    <ChefHat size={19} className="text-orange-300" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider">Connesso come</p>
                    <p className="text-white font-bold truncate">{username}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-300/80 hover:bg-red-500/20 hover:text-red-200 transition-colors"
                >
                  <LogOut size={16} className="shrink-0" />
                  Esci dall&apos;account
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
              >
                Accedi come Admin
              </Link>
            )
          )}
        </div>
      </div>
    </>
  );
}
