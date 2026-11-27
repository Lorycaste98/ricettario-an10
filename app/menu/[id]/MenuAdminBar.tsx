"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileDown, Minimize2, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmModal } from "@/components/ui/Modal";
import { VisibilityToggle } from "@/components/ds/Controls";
import { ActionMenu } from "@/components/ds/ActionMenu";
import { headerIconCls } from "@/components/ds/button-classes";
import { MenuPdfButton, type MenuPdfProps } from "@/components/menu/MenuPdfButton";
import type { PdfButtonHandle } from "@/components/recipe/RecipePdfButton";
import { useCompactDetail } from "@/lib/preferences";

/** Le azioni secondarie compaiono come bottoni solo da questo contenitore in su; sotto vanno nel «⋯». */
const WIDE = "@max-[620px]:hidden";

/**
 * Azioni della testata del dettaglio menù (9.5), gemelle di `RecipeAdminBar`:
 * - admin: l'occhio pronto/non pronto (4.8) sempre in vista; Modifica, PDF ed Elimina come bottoni
 *   quadrati da 620px di contenitore, sotto nel menù «⋯» (3.14);
 * - visitatore: PDF;
 * - il «⋯» c'è sempre, con «Vista compatta» (`useCompactDetail`).
 * La visibilità cambia subito (l'occhio si anima al tocco) e torna indietro se la PATCH fallisce.
 */
export function MenuAdminBar({
  menuId,
  published,
  pdf,
}: {
  menuId: number;
  published: boolean;
  pdf: MenuPdfProps["menu"];
}) {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const pdfRef = useRef<PdfButtonHandle>(null);
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
    const res = await fetch(`/api/menus/${menuId}`, {
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
    await fetch(`/api/menus/${menuId}`, { method: "DELETE" });
    router.push("/menu");
    router.refresh();
  };

  if (!isAdmin)
    return (
      <>
        <MenuPdfButton menu={pdf} />
        <ActionMenu items={[compactItem]} />
      </>
    );

  return (
    <>
      <VisibilityToggle
        published={isPublished}
        onToggle={() => void togglePublished()}
        disabled={toggling}
        iconOnlyNarrow
        labels={{ on: "Pronto", off: "Non pronto" }}
      />
      <Link href={`/admin/menu/${menuId}/modifica`} aria-label="Modifica menù" title="Modifica menù" className={`${headerIconCls} ${WIDE}`}>
        <Pencil aria-hidden />
      </Link>
      <MenuPdfButton ref={pdfRef} menu={pdf} className={WIDE} />
      <button
        type="button"
        aria-label="Elimina menù"
        title="Elimina menù"
        onClick={() => setConfirmDelete(true)}
        className={`${headerIconCls} ${WIDE} text-rosa!`}
      >
        <Trash2 aria-hidden />
      </button>
      <ActionMenu
        items={[
          { label: "Modifica", icon: <Pencil />, narrowOnly: true, onSelect: () => router.push(`/admin/menu/${menuId}/modifica`) },
          { label: "Esporta in PDF", icon: <FileDown />, narrowOnly: true, onSelect: () => pdfRef.current?.start(), disabled: pdf.recipes.length === 0 },
          compactItem,
          { label: "Elimina menù", icon: <Trash2 />, tone: "danger", narrowOnly: true, onSelect: () => setConfirmDelete(true) },
        ]}
      />

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Eliminare il menù?"
        message="L'operazione è irreversibile. Le ricette restano nel ricettario."
        loading={deleting}
      />
    </>
  );
}
