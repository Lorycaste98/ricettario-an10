"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, Heart } from "lucide-react";

const INACTIVITY_MS = 10 * 60 * 1000; // 10 minuti

interface AuthState {
  isAdmin: boolean;
  username: string | null;
  role: string | null;
  firstLogin: boolean;
  dedication: string | null;
  hasReviews: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<AuthState>({
  isAdmin: false,
  username: null,
  role: null,
  firstLogin: false,
  dedication: null,
  hasReviews: false,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [firstLogin, setFirstLogin] = useState(false);
  const [dedication, setDedication] = useState<string | null>(null);
  const [hasReviews, setHasReviews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoLoggedOut, setAutoLoggedOut] = useState(false);
  const [showDedication, setShowDedication] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isAdminRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();

  // Chiude il modal di logout; se sei su una pagina admin (ora non autorizzata) torna a "/"
  const dismissAutoLogout = () => {
    setAutoLoggedOut(false);
    if (pathname?.startsWith("/admin")) router.push("/");
  };

  const refresh = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setIsAdmin(data.isAdmin ?? false);
      setUsername(data.username ?? null);
      setRole(data.role ?? null);
      setFirstLogin(data.firstLogin ?? false);
      setDedication(data.dedication ?? null);
      setHasReviews(data.hasReviews ?? false);
      isAdminRef.current = data.isAdmin ?? false;
      if (data.isAdmin && data.firstLogin && data.dedication) {
        setShowDedication(true);
      }
    } catch {
      setIsAdmin(false);
      setUsername(null);
      setRole(null);
      setFirstLogin(false);
      setDedication(null);
      setHasReviews(false);
      isAdminRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const closeDedication = async () => {
    setShowDedication(false);
    setFirstLogin(false);
    await fetch("/api/auth/first-login", { method: "PUT" });
  };

  // ── Inactivity logout ──
  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    if (!isAdminRef.current) return;
    timerRef.current = setTimeout(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsAdmin(false);
      setUsername(null);
      isAdminRef.current = false;
      setAutoLoggedOut(true);
    }, INACTIVITY_MS);
  }, []);

  useEffect(() => {
    isAdminRef.current = isAdmin;
    if (isAdmin) {
      resetTimer();
    } else {
      clearTimeout(timerRef.current);
    }
  }, [isAdmin, resetTimer]);

  useEffect(() => {
    const events = ["keydown", "click", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  return (
    <AuthCtx.Provider value={{ isAdmin, username, role, firstLogin, dedication, hasReviews, loading, refresh }}>
      {children}

      {/* ── Modal dedica (primo accesso) ── */}
      {showDedication && dedication && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)]">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 px-8 pt-10 pb-6 text-center flex-shrink-0">
              <div className="flex justify-center mb-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                  <Heart size={32} fill="currentColor" />
                </span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-3">
                Un messaggio per te
              </p>
            </div>
            <div className="overflow-y-auto px-8 py-4 bg-gradient-to-br from-orange-50 to-amber-50">
              <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap text-center">
                {dedication}
              </p>
            </div>
            <div className="px-8 py-6 bg-white flex-shrink-0">
              <p className="text-xs text-gray-400 text-center mb-4">
                Troverai sempre questa dedica nella tua pagina profilo.
              </p>
              <button
                onClick={closeDedication}
                className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                Inizia a cucinare
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal logout per inattività ── */}
      {autoLoggedOut && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={dismissAutoLogout}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-500 text-lg">
                  ⏱
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Sessione scaduta</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Sei stato disconnesso automaticamente dopo 10 minuti di inattività.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <a
                  href="/login"
                  className="flex-1 rounded-xl bg-orange-500 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-600 transition-colors"
                >
                  Accedi nuovamente
                </a>
                <button
                  onClick={dismissAutoLogout}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
