"use client";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ds/Button";
import { useLogout } from "@/components/shell/AppNav";

/** «Esci» del blocco «Tu» dell'hub `/admin` (la dashboard è un server component) */
export function LogoutButton() {
  const logout = useLogout();
  return (
    <Button variant="danger" icon={<LogOut />} onClick={logout}>
      Esci
    </Button>
  );
}
