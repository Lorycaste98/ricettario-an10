import { getSession } from "@/lib/session";

export default async function MenuDetailLoading() {
  // Solo lettura cookie (nessun DB): distingue lo skeleton admin da quello visitatore
  const isAdmin = !!(await getSession());

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-5 animate-pulse">
      {/* Back link — stessa forma/altezza del bottone reale (pill h-[34px]) */}
      <div className="h-[34px] w-36 rounded-full bg-white/20" />

      {isAdmin && (
        <>
          {/* Barra azioni admin: Pronto (flex-1) + Esporta + Modifica + Elimina */}
          <div className="flex items-stretch gap-2">
            <div className="h-[52px] flex-1 rounded-xl bg-white/20" />
            <div className="h-[52px] w-11 rounded-xl bg-white/15 sm:w-24" />
            <div className="h-[52px] w-11 rounded-xl bg-white/15 sm:w-24" />
            <div className="h-[52px] w-11 rounded-xl bg-white/15 sm:w-24" />
          </div>
          {/* Azioni secondarie: Modalità cucina + Recensioni ospiti */}
          <div className="flex flex-wrap gap-2">
            <div className="h-11 min-w-40 flex-1 rounded-xl bg-white/15" />
            <div className="h-11 min-w-40 flex-1 rounded-xl bg-white/15" />
          </div>
        </>
      )}

      {/* Hero */}
      <div className="aspect-3/1 min-h-45 w-full rounded-2xl bg-zinc-800 sm:aspect-4/1" />

      {/* Ricette */}
      <div className="space-y-4">
        <div className="h-7 w-52 rounded-xl bg-white/20" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/25" />
          ))}
        </div>
      </div>
    </div>
  );
}
