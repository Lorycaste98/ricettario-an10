"use client";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Heart, KeyRound, ChefHat } from "lucide-react";

export default function ProfiloPage() {
  const { username, dedication } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

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
