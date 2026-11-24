import type { ReactNode } from "react";
import { getSession } from "@/lib/session";
import { getAdminOverview } from "@/lib/admin-overview";
import { AdminFrame } from "@/components/admin/AdminNav";

/**
 * Per l'admin le impostazioni stanno «dietro le quinte» (D9), nel blocco «Tu» di Gestione:
 * stessa cornice di `app/admin/layout.tsx` (sotto-navigazione da 900px, «‹ Gestione» sotto).
 * Il visitatore vede la pagina da sola.
 */
export default async function ImpostazioniLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) return <>{children}</>;
  const overview = await getAdminOverview();
  return (
    <AdminFrame overview={overview} isSuperAdmin={session.role === "SUPERADMIN"}>
      {children}
    </AdminFrame>
  );
}
