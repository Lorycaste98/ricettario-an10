"use client";
import { useEffect, useState } from "react";
import { Users, Heart, Check, Pencil, X, UserPlus, Eye, EyeOff, ShieldCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AdminUser {
  id: number;
  username: string;
  role: string;
  firstLogin: boolean;
  dedication: string | null;
}

interface CreateForm {
  username: string;
  password: string;
  role: string;
  dedication: string;
}

export default function UtentiPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>({ username: "", password: "", role: "ADMIN", dedication: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/utenti")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false); });
  }, []);

  const startEdit = (user: AdminUser) => {
    setEditing(user.id);
    setDraft(user.dedication ?? "");
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft("");
  };

  const save = async (id: number) => {
    setSaving(true);
    const res = await fetch(`/api/admin/utenti/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dedication: draft.trim() || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, dedication: updated.dedication } : u)));
      setEditing(null);
    }
    setSaving(false);
  };

  const createUser = async () => {
    setCreateError(null);
    if (!form.username.trim() || !form.password) {
      setCreateError("Username e password sono obbligatori");
      return;
    }
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
    });
    const data = await res.json();
    if (!res.ok) {
      setCreateError(data.error ?? "Errore nella creazione");
    } else {
      setUsers((prev) => [...prev, data]);
      setForm({ username: "", password: "", role: "ADMIN", dedication: "" });
      setShowCreate(false);
    }
    setCreating(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <Users size={20} />
          </span>
          <h1 className="text-xl font-bold text-sky-950">Gestione utenti</h1>
        </div>
        <button
          onClick={() => { setShowCreate((v) => !v); setCreateError(null); }}
          className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition-colors"
        >
          <UserPlus size={14} />
          Nuovo utente
        </button>
      </div>

      {/* Form creazione */}
      {showCreate && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5 space-y-4">
          <p className="text-sm font-semibold text-sky-900">Crea nuovo account</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Username</label>
              <input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="nome utente"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:border-sky-400 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="min. 6 caratteri"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-9 text-sm text-gray-700 placeholder:text-gray-300 focus:border-sky-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Ruolo</label>
            <div className="flex gap-2">
              {(["ADMIN", "SUPERADMIN"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: r }))}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.role === r
                      ? r === "SUPERADMIN"
                        ? "border-orange-300 bg-orange-50 text-orange-700"
                        : "border-sky-300 bg-sky-100 text-sky-700"
                      : "border-gray-200 text-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {r === "SUPERADMIN" ? <ShieldCheck size={12} /> : <Shield size={12} />}
                  {r === "SUPERADMIN" ? "Superadmin" : "Admin"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <Heart size={11} className="text-orange-400" fill="currentColor" />
              Dedica (opzionale)
            </label>
            <textarea
              value={form.dedication}
              onChange={(e) => setForm((f) => ({ ...f, dedication: e.target.value }))}
              rows={3}
              placeholder="Lascia un messaggio che l'utente vedrà al primo accesso..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 focus:border-orange-400 focus:outline-none resize-none"
            />
          </div>

          {createError && (
            <p className="text-xs text-red-500">{createError}</p>
          )}

          <div className="flex gap-2">
            <Button size="sm" loading={creating} onClick={createUser} className="gap-1.5">
              <UserPlus size={13} />
              Crea account
            </Button>
            <button
              onClick={() => { setShowCreate(false); setCreateError(null); }}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <X size={12} />
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Lista utenti */}
      {loading ? (
        <p className="text-sm text-gray-400">Caricamento...</p>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 font-bold text-sm">
                    {user.username[0].toUpperCase()}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sky-950 text-sm">{user.username}</p>
                      <span className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        user.role === "SUPERADMIN"
                          ? "bg-orange-50 text-orange-500"
                          : "bg-sky-50 text-sky-500"
                      }`}>
                        {user.role === "SUPERADMIN" ? <ShieldCheck size={9} /> : <Shield size={9} />}
                        {user.role === "SUPERADMIN" ? "Superadmin" : "Admin"}
                      </span>
                    </div>
                    <span className={`text-xs ${user.firstLogin ? "text-amber-500" : "text-green-500"}`}>
                      {user.firstLogin ? "Non ha ancora effettuato il primo accesso" : "Accesso effettuato"}
                    </span>
                  </div>
                </div>
                {editing !== user.id && (
                  <button
                    onClick={() => startEdit(user)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <Pencil size={12} />
                    {user.dedication ? "Modifica dedica" : "Aggiungi dedica"}
                  </button>
                )}
              </div>

              {editing === user.id ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-orange-500">
                    <Heart size={12} fill="currentColor" />
                    Dedica personale
                  </div>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={4}
                    placeholder="Scrivi qui la tua dedica..."
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 focus:border-orange-400 focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" loading={saving} onClick={() => save(user.id)} className="gap-1.5">
                      <Check size={13} />
                      Salva
                    </Button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <X size={12} />
                      Annulla
                    </button>
                  </div>
                </div>
              ) : user.dedication ? (
                <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-orange-400 mb-1.5">
                    <Heart size={11} fill="currentColor" />
                    Dedica
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{user.dedication}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-300 italic">Nessuna dedica impostata.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
