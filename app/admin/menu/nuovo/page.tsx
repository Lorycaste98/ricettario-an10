import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { MenuForm } from "@/components/menu/MenuForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nuovo Menù — Admin" };

export default async function NuovoMenuPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <MenuForm />
    </div>
  );
}

