"use client";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Heart, KeyRound, ChefHat, UserRound } from "lucide-react";

export default function ProfiloPage() {
  const { username, dedication, refresh } = useAuth();

  // ── Cambio username ──
  const [newUsername, setNewUsername] = useState("");
  const [unPassword, setUnPassword] = useState("");
  const [unLoading, setUnLoading] = useState(false);
  const [unError, setUnError] = useState("");
  const [unSuccess, setUnSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const changeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnError("");
    setUnSuccess(false);

    const trimmed = newUsername.trim();
    if (trimmed.length < 3) {
      setUnError("Lo username deve avere almeno 3 caratteri.");
      return;
    }
    if (trimmed === username) {
      setUnError("Il nuovo username coincide con quello attuale.");
      return;
    }

    setUnLoading(true);
    try {
      const res = await fetch("/api/auth/username", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: unPassword, newUsername: trimmed }),
      });
      if (res.ok) {
        setUnSuccess(true);
        setNewUsername("");
        setUnPassword("");
        await refresh();
      } else {
        const d = await res.json();
        setUnError(d.error ?? "Errore durante il cambio username.");
      }
    } finally {
      setUnLoading(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (newPassword !== confirmPassword) {
      setPwError("Le nuove password non coincidono.");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("La nuova password deve avere almeno 8 caratteri.");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setPwSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const d = await res.json();
        setPwError(d.error ?? "Errore durante il cambio password.");
      }
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
          <ChefHat size={20} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-sky-950">Il tuo profilo</h1>
          <p className="text-sm text-sky-600">{username}</p>
        </div>
      </div>

      {/* Dedica */}
      {dedication && (
        <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={16} className="text-orange-400" fill="currentColor" />
            <span className="text-xs font-semibold uppercase tracking-widest text-orange-400">
              La tua dedica
            </span>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {dedication}
          </p>
        </div>
      )}

      {/* Cambio username */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <UserRound size={16} className="text-sky-500" />
          <h2 className="text-sm font-semibold text-sky-950">Cambia username</h2>
        </div>
        <form onSubmit={changeUsername} className="space-y-4">
          <Input
            label="Nuovo username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder={username ?? ""}
            autoComplete="username"
          />
          <Input
            label="Password attuale"
            type="password"
            value={unPassword}
            onChange={(e) => setUnPassword(e.target.value)}
            autoComplete="current-password"
          />
          {unError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {unError}
            </p>
          )}
          {unSuccess && (
            <p className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
              Username aggiornato con successo.
            </p>
          )}
          <Button type="submit" loading={unLoading} className="w-full">
            Aggiorna username
          </Button>
        </form>
      </div>

      {/* Cambio password */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound size={16} className="text-sky-500" />
          <h2 className="text-sm font-semibold text-sky-950">Cambia password</h2>
        </div>
        <form onSubmit={changePassword} className="space-y-4">
          <Input
            label="Password attuale"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Input
            label="Nuova password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Input
            label="Conferma nuova password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          {pwError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {pwError}
            </p>
          )}
          {pwSuccess && (
            <p className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
              Password aggiornata con successo.
            </p>
          )}
          <Button type="submit" loading={pwLoading} className="w-full">
            Aggiorna password
          </Button>
        </form>
      </div>
    </div>
  );
}
