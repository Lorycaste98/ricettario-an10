"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/AuthProvider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      router.push(searchParams.get("next") ?? "/admin");
    } else {
      const d = await res.json();
      setError(d.error ?? "Credenziali non valide");
    }
    setLoading(false);
  };

  return (
    <>
      <div className="mb-8 text-center">
        <span className="text-5xl">🍳</span>
        <h1 className="mt-3 text-2xl font-bold text-sky-950">Accesso Admin</h1>
        <p className="mt-1 text-sm text-sky-700">Inserisci le tue credenziali</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        {error && (
          <p className="rounded-lg bg-red-50/70 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
          Accedi
        </Button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-white/30 bg-white/75 backdrop-blur-md p-8 shadow-xl">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
