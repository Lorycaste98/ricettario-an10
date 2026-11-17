import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ImportJsonClient from "./ImportJsonClient";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ds/PageHeader";

export const metadata: Metadata = { title: "Importa ricette — Ricettario" };

export default async function ImportPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Importa ricette" meta="Da un file ricettario.json: sostituisce tutto il ricettario" />
      <ImportJsonClient />
    </div>
  );
}
