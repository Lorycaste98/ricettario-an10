import type { ReactNode } from "react";
import { getSession } from "@/lib/session";
import { getAdminOverview } from "@/lib/admin-overview";
import { AdminFrame } from "@/components/admin/AdminNav";

/** Cornice di Gestione: sotto-navigazione con i conteggi (vedi `components/admin/AdminNav.tsx`). */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  // Senza sessione il proxy ha già rimandato a /login; qui solo per sicurezza
  if (!session) return <>{children}</>;
  const overview = await getAdminOverview();
  return (
    <AdminFrame overview={overview} isSuperAdmin={session.role === "SUPERADMIN"}>
      {children}
    </AdminFrame>
  );
}
