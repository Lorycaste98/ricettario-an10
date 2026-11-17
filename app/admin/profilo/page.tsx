"use client";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Heart, KeyRound, UserRound } from "lucide-react";
import { Button } from "@/components/ds/Button";
import { Field, TextInput } from "@/components/ds/Field";
import { PageHeader } from "@/components/ds/PageHeader";
import { Panel } from "@/components/ds/Panel";

/** Esito di un modulo: errore rosa o conferma verde (colori con un solo significato) */
function Outcome({ error, success }: { error: string; success: string | false }) {
  if (error) return <p role="alert" className="rounded-[0.625rem] border border-rosa-200 bg-rosa-50 px-3 py-2 text-rosa">{error}</p>;
  if (success) return <p role="status" className="rounded-[0.625rem] border border-verde-200 bg-verde-50 px-3 py-2 text-verde">{success}</p>;
  return null;
}

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
      setUnError("Il nome utente deve avere almeno 3 caratteri.");
      return;
    }
    if (trimmed === username) {
      setUnError("È già il tuo nome utente.");
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
    <div className="flex flex-col gap-4">
      <PageHeader title="Profilo" meta={username ? `Connesso come ${username}` : undefined} />

      {dedication && (
        <Panel title="La tua dedica" icon={<Heart />} tone="note">
          <p className="leading-relaxed whitespace-pre-wrap">{dedication}</p>
        </Panel>
      )}

      <div className="grid items-start gap-(--gap) @min-[760px]:grid-cols-2">
        <Panel title="Nome utente" icon={<UserRound />}>
          <form onSubmit={changeUsername} className="flex flex-col gap-3">
            <Field label="Nuovo nome utente">
              {(p) => <TextInput {...p} value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder={username ?? ""} autoComplete="username" />}
            </Field>
            <Field label="Password attuale" hint="Serve a confermare che sei tu.">
              {(p) => <TextInput {...p} type="password" value={unPassword} onChange={(e) => setUnPassword(e.target.value)} autoComplete="current-password" />}
            </Field>
            <Outcome error={unError} success={unSuccess && "Nome utente aggiornato."} />
            <Button type="submit" loading={unLoading} className="self-end">
              Aggiorna nome
            </Button>
          </form>
        </Panel>

        <Panel title="Password" icon={<KeyRound />}>
          <form onSubmit={changePassword} className="flex flex-col gap-3">
            <Field label="Password attuale">
              {(p) => <TextInput {...p} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />}
            </Field>
            <Field label="Nuova password" hint="Almeno 8 caratteri.">
              {(p) => <TextInput {...p} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />}
            </Field>
            <Field label="Ripeti la nuova password">
              {(p) => <TextInput {...p} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />}
            </Field>
            <Outcome error={pwError} success={pwSuccess && "Password aggiornata."} />
            <Button type="submit" loading={pwLoading} className="self-end">
              Aggiorna password
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
