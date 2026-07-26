"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmModal } from "@/components/ui/Modal";

/**
 * Barra azioni admin in cima al dettaglio menù (solo admin): gemella di
 * `RecipeAdminBar` (dettaglio ricetta) per allineare le due interfacce.
 * - Badge stato pronto/non pronto (`Menu.published`): occupa tutto lo spazio,
 *   l'intero badge fa il toggle (PATCH ottimistico + refresh). Colorato per stato.
 * - Esporta (PDF), Modifica ed Elimina: bottoni identici a seguire (`pdfSlot`
 *   è il `MenuPdfButton` variante "bar", passato dal server component).
 * Su mobile le etichette dei bottoni e la descrizione dello stato si nascondono
 * se non c'è spazio; restano icone e stato.
 */
export function MenuAdminBar({
  menuId,
  published,
  pdfSlot,
}: {
  menuId: number;
  published: boolean;
  pdfSlot?: ReactNode;
}) {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(published);
  const [toggling, setToggling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const togglePublished = async () => {
    setToggling(true);
    const next = !isPublished;
    const res = await fetch(`/api/menus/${menuId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: next }),
    });
    setToggling(false);
    if (!res.ok) return;
    setIsPublished(next);
    router.refresh();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/menus/${menuId}`, { method: "DELETE" });
    router.push("/menu");
    router.refresh();
  };

  if (!isAdmin) return null;

  const actionBtn =
    "flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/50 bg-white/70 px-3 text-sm font-medium backdrop-blur-sm transition-colors";

  return (
    <>
      <div className="flex items-stretch gap-2">
        {/* Stato pronto/non pronto — occupa tutto lo spazio disponibile */}
        <button
          type="button"
          role="switch"
          aria-checked={isPublished}
          disabled={toggling}
          onClick={() => void togglePublished()}
          title={
            isPublished
              ? "Pronto — tocca per nasconderlo ai visitatori"
              : "Non pronto — tocca per pubblicarlo"
          }
          className={clsx(
            "flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:opacity-60",
            isPublished
              ? "border-emerald-200/70 bg-emerald-50/80 hover:bg-emerald-100/80"
              : "border-amber-300/80 bg-amber-50/90 shadow-sm shadow-amber-500/10 hover:bg-amber-100/80"
          )}
        >
          <span
            className={clsx(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              isPublished ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            )}
          >
            {isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={clsx(
                "block text-sm font-semibold leading-tight",
                isPublished ? "text-emerald-800" : "text-amber-900"
              )}
            >
              {isPublished ? "Pronto" : "Non pronto"}
            </span>
            <span
              className={clsx(
                "mt-0.5 hidden truncate text-xs leading-tight sm:block",
                isPublished ? "text-emerald-700/80" : "text-amber-700"
              )}
            >
              {isPublished
                ? "Visibile a tutti i visitatori"
                : "Nascosto ai visitatori — lo vedi solo tu"}
            </span>
          </span>
          {/* Switch visivo */}
          <span
            className={clsx(
              "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
              isPublished ? "bg-emerald-500" : "bg-gray-300"
            )}
          >
            <span
              className={clsx(
                "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                isPublished ? "translate-x-4" : "translate-x-0.5"
              )}
            />
          </span>
        </button>

        {/* Esporta PDF (variante "bar" del MenuPdfButton, dal server component) */}
        {pdfSlot}

        {/* Modifica */}
        <Link
          href={`/admin/menu/${menuId}/modifica`}
          title="Modifica menù"
          className={clsx(actionBtn, "text-sky-900 hover:bg-white/90")}
        >
          <Pencil size={16} className="shrink-0" /> <span className="hidden sm:inline">Modifica</span>
        </Link>

        {/* Elimina */}
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          title="Elimina menù"
          className={clsx(actionBtn, "text-rose-600 hover:bg-rose-50")}
        >
          <Trash2 size={16} className="shrink-0" /> <span className="hidden sm:inline">Elimina</span>
        </button>
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Elimina menù"
        message="Sei sicuro? L'operazione è irreversibile e cancellerà il menù (le ricette restano)."
        loading={deleting}
      />
    </>
  );
}
