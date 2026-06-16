"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export function AdminMenuDeleteButton({ menuId, menuName }: { menuId: number; menuName: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const ok = await confirm({
      title: `Eliminare il menù "${menuName}"?`,
      message: "L'azione è irreversibile.",
      confirmLabel: "Elimina",
      variant: "danger",
    });
    if (!ok) return;
    setLoading(true);
    await fetch(`/api/menus/${menuId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/30 bg-white/40 text-sky-600 hover:bg-red-50/60 hover:text-red-500 transition disabled:opacity-50"
      title="Elimina"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  );
}

