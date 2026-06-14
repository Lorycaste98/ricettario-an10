"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";

const INACTIVITY_MS = 10 * 60 * 1000; // 10 minuti

interface AuthState {
  isAdmin: boolean;
  username: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<AuthState>({
  isAdmin: false,
  username: null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoLoggedOut, setAutoLoggedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isAdminRef = useRef(false);

  const refresh = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setIsAdmin(data.isAdmin ?? false);
      setUsername(data.username ?? null);
      isAdminRef.current = data.isAdmin ?? false;
    } catch {
      setIsAdmin(false);
      setUsername(null);
      isAdminRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  // ── Auto-dismiss toast dopo 5s ──
  useEffect(() => {
    if (!autoLoggedOut) return;
    const id = setTimeout(() => setAutoLoggedOut(false), 5000);
    return () => clearTimeout(id);
  }, [autoLoggedOut]);

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
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  // ── Logout on window/tab close ──
  useEffect(() => {
    if (!isAdmin) return;
    const handleBeforeUnload = () => {
      navigator.sendBeacon("/api/auth/logout");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isAdmin]);

  return (
    <AuthCtx.Provider value={{ isAdmin, username, loading, refresh }}>
      {children}

      {/* ── Toast logout automatico ── */}
      {autoLoggedOut && (
        <div className="fixed bottom-5 right-5 z-[9999] w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-sky-700 bg-sky-950 shadow-2xl overflow-hidden">
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-800 text-sky-300 text-sm">
              ⏱
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sky-100">Disconnesso automaticamente</p>
              <p className="mt-0.5 text-xs text-sky-400">
                Sei stato disconnesso per inattività dopo 10 minuti.
              </p>
            </div>
            <button
              onClick={() => setAutoLoggedOut(false)}
              className="shrink-0 text-sky-500 hover:text-sky-300 transition-colors"
              aria-label="Chiudi"
            >
              <X size={16} />
            </button>
          </div>
          <div className="h-1 bg-sky-800">
            <div className="h-full bg-orange-500 animate-[shrink_5s_linear_forwards]" />
          </div>
        </div>
      )}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
