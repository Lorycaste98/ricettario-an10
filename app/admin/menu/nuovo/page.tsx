import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { MenuForm } from "@/components/menu/MenuForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nuovo Menù — Admin" };

export default async function NuovoMenuPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-sky-50">Nuovo menù</h1>
        <p className="text-sm text-sky-300/60 mt-0.5">Crea una raccolta di ricette per un&apos;occasione speciale</p>
      </div>
      <MenuForm />
    </div>
  );
}

