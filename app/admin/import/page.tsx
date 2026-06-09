import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ImportJsonClient from "./ImportJsonClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Importa JSON — Ricettario" };

export default async function ImportPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importa ricettario da JSON</h1>
        <p className="mt-1 text-sm text-gray-400">
          Carica un file <code className="font-mono text-orange-600">ricettario.json</code> per
          sostituire tutti i dati del ricettario.
        </p>
      </div>
      <ImportJsonClient />
    </div>
  );
}

