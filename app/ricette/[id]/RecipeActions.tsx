"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { CookCounter } from "@/components/recipe/CookCounter";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";

export function RecipeActions({ recipeId, cookCount, published }: { recipeId: number; cookCount: number; published: boolean }) {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isPublished, setIsPublished] = useState(published);
  const [togglingPublish, setTogglingPublish] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/recipes/${recipeId}`, { method: "DELETE" });
    router.push("/ricette");
    router.refresh();
  };

  const togglePublished = async () => {
    setTogglingPublish(true);
    const next = !isPublished;
    const res = await fetch(`/api/recipes/${recipeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: next }),
    });
    setTogglingPublish(false);
    if (!res.ok) return;
    setIsPublished(next);
    router.refresh();
  };

  if (!isAdmin) return null;

  return (
    <>
      <div className="space-y-3">
        <CookCounter recipeId={recipeId} initialCount={cookCount} />
        <button
          onClick={() => void togglePublished()}
          disabled={togglingPublish}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            isPublished
              ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
              : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          }`}
        >
          {isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
          {isPublished ? "Marca come non pronta" : "Marca come pronta"}
        </button>
        {!isPublished && (
          <p className="text-center text-xs font-medium text-amber-700 [text-shadow:0_1px_2px_rgba(255,255,255,0.6)]">
            Questa ricetta è nascosta ai visitatori
          </p>
        )}
        <div className="flex gap-2">
          <Link
            href={`/admin/ricette/${recipeId}`}
            className="flex-1 rounded-lg border border-white/40 bg-white/60 backdrop-blur-sm px-4 py-2 text-center text-sm font-medium text-sky-900 hover:bg-white/80 transition-colors"
          >
            ✏️ Modifica ricetta
          </Link>
          <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
            🗑️ Elimina
          </Button>
        </div>
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

