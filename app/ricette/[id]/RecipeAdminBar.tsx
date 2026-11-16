"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmModal } from "@/components/ui/Modal";
import { VisibilityToggle } from "@/components/ds/Controls";
import { IconButton } from "@/components/ds/Button";
import { FavoriteButton } from "@/components/recipe/FavoriteButton";
import { RecipePdfButton, type RecipePdfData } from "@/components/recipe/RecipePdfButton";

/**
 * Azioni della testata del dettaglio ricetta (tavola 9.5).
 * - Tutti: PDF e preferito (bottoni tondi 3.10/3.11).
 * - Admin: pronta/non pronta con l'occhio (4.8, PATCH immediato + refresh), Modifica (3.4),
 *   Elimina (3.10 rosa + conferma 10.1).
 * Gemello di `app/menu/[id]/MenuAdminBar.tsx` (stessa logica di pubblicazione).
 */
export function RecipeAdminBar({
  recipeId,
  published,
  pdf,
}: {
  recipeId: number;
  published: boolean;
  pdf: RecipePdfData;
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

  return (
    <>
      {isAdmin && (
        <>
          <VisibilityToggle published={isPublished} onToggle={() => void togglePublished()} disabled={toggling} />
          <Link
            href={`/admin/ricette/${recipeId}`}
            aria-label="Modifica ricetta"
            className="inline-flex h-(--h-btn) items-center gap-[0.45em] rounded-ctl border border-blu-200 bg-white px-[1.05em] font-semibold text-blu-950 hover:bg-blu-100 [&_svg]:size-[1.15em]"
          >
            <Pencil aria-hidden />
            <span className="hidden @min-[620px]:inline">Modifica</span>
          </Link>
        </>
      )}
      <RecipePdfButton recipe={pdf} icon />
      <FavoriteButton recipeId={recipeId} variant="icon" />
      {isAdmin && (
        <IconButton label="Elimina ricetta" tone="danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 />
        </IconButton>
      )}

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Eliminare la ricetta?"
        message="L'operazione è irreversibile e cancellerà anche ingredienti, passi e recensioni."
        loading={deleting}
      />
    </>
  );
}
