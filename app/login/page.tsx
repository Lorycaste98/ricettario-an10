import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Accedi — Ricettario" };

export default async function LoginPage() {
  // Se già loggato, niente pagina di login: dritto in dashboard
  const session = await getSession();
  if (session) redirect("/admin");

  return (
    <div className="flex min-h-[70dvh] items-center justify-center">
      <LoginForm />
    </div>
  );
}
