"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CookCounter } from "@/components/recipe/CookCounter";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";

export function RecipeActions({ recipeId, cookCount }: { recipeId: number; cookCount: number }) {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/recipes/${recipeId}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  };

  if (!isAdmin) return null;

  return (
    <>
      <div className="space-y-3">
        <CookCounter recipeId={recipeId} initialCount={cookCount} />
        <div className="flex gap-2">
          <Link
            href={`/admin/ricette/${recipeId}`}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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

