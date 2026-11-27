"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileDown, Heart, Minimize2, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmModal } from "@/components/ui/Modal";
import { VisibilityToggle } from "@/components/ds/Controls";
import { ActionMenu } from "@/components/ds/ActionMenu";
import { headerIconCls } from "@/components/ds/button-classes";
import { FavoriteButton } from "@/components/recipe/FavoriteButton";
import { RecipePdfButton, type PdfButtonHandle, type RecipePdfData } from "@/components/recipe/RecipePdfButton";
import { useFavorites } from "@/lib/favorites";
import { useCompactDetail } from "@/lib/preferences";

/** Le azioni secondarie compaiono come bottoni solo da questo contenitore in su; sotto vanno nel «⋯». */
const WIDE = "@max-[620px]:hidden";

/**
 * Azioni della testata del dettaglio ricetta (9.5, a destra del «torna indietro»).
 * - Admin: l'occhio pronta/non pronta (4.8) è sempre in vista; Modifica, PDF, preferito ed Elimina
 *   sono bottoni quadrati da 620px di contenitore, sotto stanno nel menù «⋯» (3.14).
 * - Visitatore: PDF e preferito sempre in vista, nel «⋯» la vista compatta.
 * - Il «⋯» c'è sempre: «Vista compatta» (preferenza unica, `useCompactDetail`) e, su contenitore
 *   stretto, anche le azioni nascoste (`narrowOnly`).
 * La visibilità cambia subito (l'occhio si anima al tocco) e torna indietro se la PATCH fallisce.
 * Gemello di `app/menu/[id]/MenuAdminBar.tsx`.
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
  const pdfRef = useRef<PdfButtonHandle>(null);
  const { isFavorite, toggle, hydrated } = useFavorites();
  const fav = hydrated && isFavorite(recipeId);
  const [compact, setCompact] = useCompactDetail();
  const compactItem = { label: "Vista compatta", icon: <Minimize2 />, checked: compact, onSelect: () => setCompact(!compact) };
  const [isPublished, setIsPublished] = useState(published);
  const [toggling, setToggling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const togglePublished = async () => {
    const next = !isPublished;
    setIsPublished(next);
    setToggling(true);
    const res = await fetch(`/api/recipes/${recipeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: next }),
    }).catch(() => null);
    setToggling(false);
    if (!res?.ok) {
      setIsPublished(!next);
      return;
    }
    router.refresh();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/recipes/${recipeId}`, { method: "DELETE" });
    router.push("/ricette");
    router.refresh();
  };

  if (!isAdmin) {
    return (
      <>
        <RecipePdfButton recipe={pdf} />
        <FavoriteButton recipeId={recipeId} variant="icon" />
        <ActionMenu items={[compactItem]} />
      </>
    );
  }

  return (
    <>
      <VisibilityToggle published={isPublished} onToggle={() => void togglePublished()} disabled={toggling} iconOnlyNarrow />
      <Link href={`/admin/ricette/${recipeId}`} aria-label="Modifica ricetta" title="Modifica ricetta" className={`${headerIconCls} ${WIDE}`}>
        <Pencil aria-hidden />
      </Link>
      <RecipePdfButton ref={pdfRef} recipe={pdf} className={WIDE} />
      <FavoriteButton recipeId={recipeId} variant="icon" className={WIDE} />
      <button
        type="button"
        aria-label="Elimina ricetta"
        title="Elimina ricetta"
        onClick={() => setConfirmDelete(true)}
        className={`${headerIconCls} ${WIDE} text-rosa!`}
      >
        <Trash2 aria-hidden />
      </button>
      <ActionMenu
        items={[
          { label: "Modifica", icon: <Pencil />, narrowOnly: true, onSelect: () => router.push(`/admin/ricette/${recipeId}`) },
          { label: "Esporta in PDF", icon: <FileDown />, narrowOnly: true, onSelect: () => pdfRef.current?.start() },
          {
            label: fav ? "Togli dai preferiti" : "Aggiungi ai preferiti",
            icon: <Heart className={fav ? "fill-current" : undefined} />,
            active: fav,
            narrowOnly: true,
            onSelect: () => toggle(recipeId),
          },
          compactItem,
          { label: "Elimina ricetta", icon: <Trash2 />, tone: "danger", narrowOnly: true, onSelect: () => setConfirmDelete(true) },
        ]}
      />

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
