"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Heart, Shield, ShieldCheck, User, UserPlus } from "lucide-react";
import { Button, IconButton } from "@/components/ds/Button";
import { Field, TextArea, TextInput } from "@/components/ds/Field";
import { Segmented } from "@/components/ds/Controls";
import { PageHeader } from "@/components/ds/PageHeader";
import { Tag } from "@/components/ds/Tag";
import { Skeleton } from "@/components/ds/Progress";
import { Modal } from "@/components/ui/Modal";
import { AdminEmptyRow, AdminRow, AdminTable } from "@/components/admin/AdminTable";

/** Utenti (12.6, solo superadmin): elenco account, nuovo account e dedica del primo accesso in finestra */
interface AdminUser {
  id: number;
  username: string;
  role: string;
  firstLogin: boolean;
  dedication: string | null;
}

type Role = "ADMIN" | "SUPERADMIN";
const EMPTY = { username: "", password: "", role: "ADMIN" as Role, dedication: "" };

export default function UtentiPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [dedicationOf, setDedicationOf] = useState<AdminUser | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/utenti")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: AdminUser[]) => setUsers(data))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const saveDedication = async () => {
    if (!dedicationOf) return;
    setSaving(true);
    const res = await fetch(`/api/admin/utenti/${dedicationOf.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dedication: draft.trim() || null }),
    }).catch(() => null);
    if (res?.ok) {
      const updated = (await res.json()) as AdminUser;
      setUsers((prev) => prev.map((u) => (u.id === dedicationOf.id ? { ...u, dedication: updated.dedication } : u)));
      setDedicationOf(null);
    }
    setSaving(false);
  };

  const createUser = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!form.username.trim() || !form.password) return setCreateError("Nome utente e password sono obbligatori.");
    setCreating(true);
    const res = await fetch("/api/admin/utenti", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.username.trim(),
        password: form.password,
        role: form.role,
        dedication: form.dedication.trim() || undefined,
      }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as (AdminUser & { error?: string }) | null;
    setCreating(false);
    if (!res?.ok || !data) return setCreateError(data?.error ?? "Non è stato possibile creare l'account.");
    setUsers((prev) => [...prev, data]);
    setForm(EMPTY);
    setCreateOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Utenti"
        meta={loading ? "…" : `${users.length} account`}
        actions={
          <Button
            icon={<UserPlus />}
            onClick={() => {
              setCreateError(null);
              setCreateOpen(true);
            }}
          >
            Nuovo utente
          </Button>
        }
      />

      <AdminTable>
        {loading &&
          Array.from({ length: 2 }).map((_, i) => (
            <AdminRow key={i}>
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </AdminRow>
          ))}
        {loadError && <AdminEmptyRow>Non è stato possibile caricare gli utenti.</AdminEmptyRow>}
        {users.map((user) => (
          <AdminRow key={user.id} className="py-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-adm-100 text-adm-900">
              <User className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-bold">
                {user.username}
                <Tag tone={user.role === "SUPERADMIN" ? "role" : "roleLight"} icon={user.role === "SUPERADMIN" ? <ShieldCheck /> : <Shield />}>
                  {user.role === "SUPERADMIN" ? "Superadmin" : "Admin"}
                </Tag>
              </p>
              <p className="text-(length:--fs-meta) text-grigio">{user.firstLogin ? "Non ha ancora fatto il primo accesso" : "Accesso fatto"}</p>
              {user.dedication && (
                <p className="mt-0.5 flex items-center gap-1 text-[0.875rem]">
                  <Heart className="size-3.5 shrink-0 text-rosa" fill="currentColor" aria-hidden />
                  <span className="truncate">{user.dedication}</span>
                </p>
              )}
            </div>
            <IconButton
              label={user.dedication ? `Modifica la dedica per ${user.username}` : `Scrivi una dedica per ${user.username}`}
              size="row"
              onClick={() => {
                setDraft(user.dedication ?? "");
                setDedicationOf(user);
              }}
            >
              <Heart />
            </IconButton>
          </AdminRow>
        ))}
      </AdminTable>

      {/* Dedica */}
      <Modal open={!!dedicationOf} onClose={() => setDedicationOf(null)} title={dedicationOf ? `Dedica per ${dedicationOf.username}` : ""}>
        <div className="flex flex-col gap-4">
          <Field label="La vede al primo accesso" hint="Lascia vuoto per non mostrare nulla.">
            {(p) => <TextArea {...p} rows={5} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Scrivi qui la dedica…" />}
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDedicationOf(null)}>
              Annulla
            </Button>
            <Button loading={saving} onClick={() => void saveDedication()}>
              Salva
            </Button>
          </div>
        </div>
      </Modal>

      {/* Nuovo utente */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuovo account">
        <form onSubmit={createUser} className="@container flex flex-col gap-4">
          <div className="grid gap-3 @min-[420px]:grid-cols-2">
            <Field label="Nome utente">
              {(p) => <TextInput {...p} autoComplete="off" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />}
            </Field>
            <Field label="Password" hint="Almeno 6 caratteri">
              {(p) => (
                <div className="relative">
                  <TextInput
                    {...p}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                    className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-[0.5rem] text-grigio hover:bg-blu-100"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              )}
            </Field>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.8125rem] font-semibold text-grigio">Ruolo</span>
            <Segmented<Role>
              label="Ruolo"
              value={form.role}
              onChange={(role) => setForm({ ...form, role })}
              options={[
                { value: "ADMIN", label: "Admin", icon: <Shield aria-hidden /> },
                { value: "SUPERADMIN", label: "Superadmin", icon: <ShieldCheck aria-hidden /> },
              ]}
            />
          </div>
          <Field label="Dedica (facoltativa)" hint="La vede al primo accesso." error={createError ?? undefined}>
            {(p) => <TextArea {...p} rows={3} value={form.dedication} onChange={(e) => setForm({ ...form, dedication: e.target.value })} />}
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" icon={<UserPlus />} loading={creating}>
              Crea account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
