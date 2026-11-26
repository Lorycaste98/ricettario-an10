"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileDown, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmModal } from "@/components/ui/Modal";
import { VisibilityToggle } from "@/components/ds/Controls";
import { ActionMenu } from "@/components/ds/ActionMenu";
import { headerIconCls } from "@/components/ds/button-classes";
import { MenuPdfButton, type MenuPdfProps } from "@/components/menu/MenuPdfButton";
import type { PdfButtonHandle } from "@/components/recipe/RecipePdfButton";

/** Le azioni secondarie compaiono come bottoni solo da questo contenitore in su; sotto vanno nel «⋯». */
const WIDE = "@max-[620px]:hidden";

/**
 * Azioni della testata del dettaglio menù (9.5), gemelle di `RecipeAdminBar`:
 * - admin: l'occhio pronto/non pronto (4.8) sempre in vista; Modifica, PDF ed Elimina come bottoni
 *   quadrati da 620px di contenitore, sotto nel menù «⋯» (3.14);
 * - visitatore: PDF.
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

  if (!isAdmin) return <MenuPdfButton menu={pdf} />;

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
      <div className="@min-[620px]:hidden">
        <ActionMenu
          items={[
            { label: "Modifica", icon: <Pencil />, onSelect: () => router.push(`/admin/menu/${menuId}/modifica`) },
            { label: "Esporta in PDF", icon: <FileDown />, onSelect: () => pdfRef.current?.start(), disabled: pdf.recipes.length === 0 },
            { label: "Elimina menù", icon: <Trash2 />, tone: "danger", onSelect: () => setConfirmDelete(true) },
          ]}
        />
      </div>

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
