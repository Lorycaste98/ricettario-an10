export default function MenuCookModeLoading() {
  // Rispecchia il layout della pagina cucina: back pill + header + timeline + card ricette
  return (
    <div className="mx-auto max-w-5xl space-y-6 sm:space-y-5 animate-pulse">
      {/* Back link — stessa forma/altezza del BackLink reale (pill h-[34px]) */}
      <div className="h-[34px] w-44 rounded-full bg-white/20" />

      {/* Header: badge ChefHat + titolo/sottotitolo */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-orange-400/30" />
        <div className="space-y-1.5">
          <div className="h-5 w-40 rounded-lg bg-white/25" />
          <div className="h-3 w-56 rounded bg-white/15" />
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl bg-white/25 p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-4 w-20 rounded bg-white/30" />
          <div className="ml-auto flex gap-1">
            <div className="h-7 w-7 rounded-lg bg-white/30" />
            <div className="h-7 w-7 rounded-lg bg-white/30" />
          </div>
        </div>
        <div className="h-3 w-3/4 rounded bg-white/20" />
        <div className="h-36 rounded-xl bg-white/20" />
      </div>

      {/* Card ricette dello stepper */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/25 p-4 sm:p-5 space-y-3">
            {/* Header card: thumb + nome + passo */}
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-white/30" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-2/3 rounded bg-white/30" />
                <div className="h-3 w-24 rounded bg-white/20" />
              </div>
            </div>
            {/* Barra di progresso */}
            <div className="h-1.5 w-full rounded-full bg-white/30" />
            {/* Step corrente */}
            <div className="h-20 rounded-xl bg-white/20" />
            {/* Navigazione */}
            <div className="flex gap-2">
              <div className="h-8 flex-1 rounded-lg bg-white/25" />
              <div className="h-8 flex-1 rounded-lg bg-orange-400/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
