"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmModal } from "@/components/ui/Modal";
import { VisibilityToggle } from "@/components/ds/Controls";
import { IconButton } from "@/components/ds/Button";
import { MenuPdfButton, type MenuPdfProps } from "@/components/menu/MenuPdfButton";

/**
 * Azioni della testata del dettaglio menù (tavola 9.5), gemelle di `RecipeAdminBar`:
 * - tutti: PDF (bottone tondo 3.10);
 * - admin: pronto/non pronto con l'occhio (4.8, PATCH + refresh), Modifica (3.4),
 *   Elimina (3.10 rosa + conferma 10.1).
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

  return (
    <>
      {isAdmin && (
        <>
          <VisibilityToggle
            published={isPublished}
            onToggle={() => void togglePublished()}
            disabled={toggling}
            labels={{ on: "Pronto", off: "Non pronto" }}
          />
          <Link
            href={`/admin/menu/${menuId}/modifica`}
            aria-label="Modifica menù"
            className="inline-flex h-(--h-btn) items-center gap-[0.45em] rounded-ctl border border-blu-200 bg-white px-[1.05em] font-semibold text-blu-950 hover:bg-blu-100 [&_svg]:size-[1.15em]"
          >
            <Pencil aria-hidden />
            <span className="hidden @min-[620px]:inline">Modifica</span>
          </Link>
        </>
      )}
      <MenuPdfButton menu={pdf} />
      {isAdmin && (
        <IconButton label="Elimina menù" tone="danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 />
        </IconButton>
      )}

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
