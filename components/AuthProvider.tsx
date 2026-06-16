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
    <AuthCtx.Provider value={{ isAdmin, username, loading, refresh }}>
      {children}

      {/* ── Modal logout per inattività ── */}
      {autoLoggedOut && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
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
                  onClick={() => setAutoLoggedOut(false)}
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
