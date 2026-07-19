"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import { EyeOff, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { PublishSwitch } from "@/components/ui/PublishSwitch";
import { ConfirmModal } from "@/components/ui/Modal";

/**
 * Barra azioni admin in cima al dettaglio ricetta (solo admin): un'unica riga
 * con le tre azioni sulla ricetta — toggle pronta/non pronta, Modifica, Elimina.
 * Lo sfondo riflette lo stato (verde = pronta, ambra = non pronta) e in stato
 * "non pronta" compare una riga extra "nascosta ai visitatori". Su mobile i
 * bottoni sono solo-icona per non svilupparsi in verticale.
 */
export function RecipeAdminBar({ recipeId, published }: { recipeId: number; published: boolean }) {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(published);
  const [toggling, setToggling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const togglePublished = async () => {
    setToggling(true);
    const next = !isPublished;
    const res = await fetch(`/api/recipes/${recipeId}`, {
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
    await fetch(`/api/recipes/${recipeId}`, { method: "DELETE" });
    router.push("/ricette");
    router.refresh();
  };

  if (!isAdmin) return null;

  return (
    <>
      <div
        className={clsx(
          "rounded-2xl border px-3 py-2.5 backdrop-blur-sm transition-colors sm:px-4",
          isPublished
            ? "border-emerald-200/70 bg-emerald-50/70"
            : "border-amber-300/80 bg-amber-50/80 shadow-sm shadow-amber-500/10"
        )}
      >
        <div className="flex items-center gap-2">
          <PublishSwitch published={isPublished} onToggle={() => void togglePublished()} disabled={toggling} />
          <div className="ml-auto flex items-center gap-2">
            <Link
              href={`/admin/ricette/${recipeId}`}
              title="Modifica ricetta"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/50 bg-white/70 px-2.5 py-1.5 text-sm font-medium text-sky-900 backdrop-blur-sm transition-colors hover:bg-white/90"
            >
              <Pencil size={15} /> <span className="hidden sm:inline">Modifica</span>
            </Link>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              title="Elimina ricetta"
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200/70 bg-rose-50/80 px-2.5 py-1.5 text-sm font-medium text-rose-600 backdrop-blur-sm transition-colors hover:bg-rose-100/80"
            >
              <Trash2 size={15} /> <span className="hidden sm:inline">Elimina</span>
            </button>
          </div>
        </div>
        {!isPublished && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <EyeOff size={13} className="shrink-0" /> Questa ricetta è nascosta ai visitatori — la vedi solo tu
          </p>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Elimina ricetta"
        message="Sei sicuro? L'operazione è irreversibile e cancellerà anche ingredienti, passi e recensioni."
        loading={deleting}
      />
    </>
  );
}
