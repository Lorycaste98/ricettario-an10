export default function RecipeDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-36 rounded-lg bg-white/20" />

      {/* Header grid — foto sinistra, info destra */}
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Foto */}
        <div className="aspect-video sm:aspect-4/3 rounded-2xl bg-white/20" />

        {/* Info */}
        <div className="flex flex-col gap-4">
          {/* Badges categoria */}
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full bg-white/20" />
            <div className="h-5 w-20 rounded-full bg-white/20" />
          </div>
          {/* Titolo */}
          <div className="h-8 w-3/4 rounded-xl bg-white/25" />
          {/* Tile meta (prep / cottura / attesa / totale / porzioni) —
              il 4° (Totale) è la card piena/accentata */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`h-20 rounded-xl ${i === 3 ? "bg-orange-400/30" : "bg-white/20"}`}
              />
            ))}
          </div>
          {/* Note */}
          <div className="h-14 rounded-xl bg-white/15" />
          {/* Data aggiunta */}
          <div className="h-3 w-40 rounded bg-white/15" />
          {/* Pulsante preferiti */}
          <div className="h-9 w-48 rounded-lg bg-white/20" />
        </div>
      </div>

      {/* Card ingredienti */}
      <div className="rounded-2xl bg-white/20 p-5 sm:p-6 space-y-4">
        <div className="h-6 w-32 rounded-xl bg-white/25" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 rounded-lg bg-white/15" />
          ))}
        </div>
      </div>

      {/* Card procedura */}
      <div className="rounded-2xl bg-white/20 p-5 sm:p-6 space-y-3">
        <div className="h-6 w-28 rounded-xl bg-white/25" />
        <div className="h-2 w-full rounded-full bg-white/15" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-white/10" />
        ))}
      </div>
    </div>
  );
}
