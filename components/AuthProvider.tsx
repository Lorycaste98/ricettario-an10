"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Timer } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ds/Button";
import { buttonClasses } from "@/components/ds/button-classes";

const INACTIVITY_MS = 10 * 60 * 1000; // 10 minuti
// Logout automatico per inattività: disattivato su richiesta (la sessione ora è stabile,
// vedi lib/session.ts). Rimettere a true per riattivarlo: tutta la logica sotto resta intatta.
const INACTIVITY_LOGOUT_ENABLED = false;

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
    if (!INACTIVITY_LOGOUT_ENABLED || !isAdminRef.current) return;
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
    if (!INACTIVITY_LOGOUT_ENABLED) return;
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

      {/* ── Dedica (primo accesso) · finestra 10.1 ── */}
      <Modal open={showDedication && !!dedication} onClose={closeDedication} title="Un messaggio per te" size="md">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-blu-100 text-blu-800">
            <Heart className="size-7" fill="currentColor" aria-hidden />
          </span>
          <p className="leading-relaxed whitespace-pre-wrap">{dedication}</p>
          <p className="text-(length:--fs-meta) text-grigio">Troverai sempre questa dedica nella pagina del profilo.</p>
          <Button size="lg" className="w-full" onClick={closeDedication}>
            Inizia a cucinare
          </Button>
        </div>
      </Modal>

      {/* ── Logout per inattività (oggi disattivato, vedi INACTIVITY_LOGOUT_ENABLED) ── */}
      <Modal open={autoLoggedOut} onClose={dismissAutoLogout} title="Sessione scaduta" size="sm">
        <div className="flex flex-col gap-4">
          <p className="flex items-start gap-3">
            <Timer className="mt-0.5 size-5 shrink-0 text-blu-700" aria-hidden />
            Sei stato disconnesso automaticamente dopo 10 minuti di inattività.
          </p>
          <a href="/login" className={buttonClasses("primary", "md", "w-full")}>
            Accedi di nuovo
          </a>
        </div>
      </Modal>
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
