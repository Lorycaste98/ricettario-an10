"use client";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, TextInput } from "@/components/ds/Field";
import { Button } from "@/components/ds/Button";
import { FormError } from "@/components/admin/FormParts";
import { An10LogoAnimated } from "@/components/brand/An10LogoAnimated";
import { useAuth } from "@/components/AuthProvider";

/** 13.8 · accesso: logo animato, Utente, Password, «Entra» (unica azione arancio). Logica invariata. */
function LoginFormInner() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      await refresh();
      router.push("/admin");
    } else {
      const d = await res.json();
      setError(d.error ?? "Credenziali non valide");
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-[21rem] flex-col gap-3 rounded-dlg border border-blu-150 bg-white p-5 @min-[480px]:p-6"
    >
      <div className="mb-1 flex flex-col items-center gap-2.5 text-center">
        {/* 13.8 + logo animato: si disegna una volta all'apertura (DESIGN: mai in loop) */}
        <An10LogoAnimated className="my-1 h-14 w-auto text-blu-600" />
        <h1 className="text-[1.25rem] font-bold text-blu-950">Accesso al ricettario</h1>
      </div>
      <Field label="Utente">
        {(p) => (
          <TextInput
            {...p}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            required
          />
        )}
      </Field>
      <Field label="Password">
        {(p) => (
          <TextInput
            {...p}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        )}
      </Field>
      {error && <FormError>{error}</FormError>}
      <Button type="submit" loading={loading} size="lg" className="mt-1 w-full">
        Entra
      </Button>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense>
      <LoginFormInner />
    </Suspense>
  );
}
