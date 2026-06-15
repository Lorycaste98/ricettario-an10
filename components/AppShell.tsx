"use client";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
