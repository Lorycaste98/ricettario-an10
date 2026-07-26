import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  // Se già loggato, niente pagina di login: dritto in dashboard
  const session = await getSession();
  if (session) redirect("/admin");

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-white/30 bg-white/75 backdrop-blur-md p-8 shadow-xl">
        <LoginForm />
      </div>
    </div>
  );
}
