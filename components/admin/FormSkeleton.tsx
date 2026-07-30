// Skeleton condiviso delle pagine form admin (nuova/modifica ricetta e menù).
// Rispecchia il layout compatto del form: top bar sticky + card sezione
// (`p-4 sm:p-6`, `space-y-3 sm:space-y-4`) e campi con etichetta piccola su mobile.

function Field({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-0.5 sm:space-y-1 ${className}`}>
      <div className="h-3 w-20 rounded bg-white/40" />
      <div className="h-[34px] rounded-lg bg-white/40 sm:h-10" />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-2.5 rounded-2xl border border-white/50 bg-white/60 p-3 shadow-sm backdrop-blur-sm sm:space-y-4 sm:p-6">
      {children}
    </div>
  );
}

function CardTitle() {
  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      <div className="h-8 w-8 rounded-xl bg-white/50 sm:h-9 sm:w-9" />
      <div className="h-4 w-32 rounded bg-white/50" />
    </div>
  );
}

export function FormSkeleton({ variant }: { variant: "recipe" | "menu" }) {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-4 sm:space-y-6">
      {/* Top bar sticky (titolo + pubblica + annulla + salva) */}
      <div className="flex items-center justify-between gap-2 rounded-b-2xl border border-white/50 bg-white/70 px-3 py-2 shadow-lg backdrop-blur-xl sm:gap-3 sm:px-5 sm:py-3">
        <div className="h-5 w-32 rounded bg-white/60" />
        <div className="flex shrink-0 items-center gap-2">
          <div className="h-7 w-16 rounded-full bg-white/60" />
          <div className="h-8 w-16 rounded-lg bg-white/50" />
          <div className="h-8 w-28 rounded-lg bg-orange-400/40" />
        </div>
      </div>

      {/* Informazioni */}
      <Card>
        <CardTitle />
        <Field />
        {variant === "recipe" ? (
          <>
            <Field />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Field key={i} />
              ))}
            </div>
            <div className="h-16 rounded-lg bg-white/40" />
            <Field />
          </>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="sm:col-span-2 h-14 rounded-lg bg-white/40" />
            <Field />
            <Field />
            <Field className="sm:col-span-2" />
          </div>
        )}
      </Card>

      {variant === "recipe" ? (
        <>
          {/* Foto */}
          <Card>
            <CardTitle />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-white/40" />
              ))}
            </div>
          </Card>

          {/* Categorie + Tag (affiancate da sm) */}
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardTitle />
                <div className="h-9 rounded-lg bg-white/40 sm:h-10" />
              </Card>
            ))}
          </div>

          {/* Ingredienti — righe compatte */}
          <Card>
            <CardTitle />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[86px] rounded-xl bg-white/30 sm:h-[104px]" />
            ))}
          </Card>

          {/* Procedura */}
          <Card>
            <CardTitle />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-2 sm:gap-3">
                <div className="h-6 w-6 shrink-0 rounded-full bg-orange-400/40 sm:h-7 sm:w-7" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-14 rounded-lg bg-white/40" />
                  <div className="h-7 w-40 rounded-lg bg-white/30" />
                </div>
              </div>
            ))}
          </Card>
        </>
      ) : (
        /* Ricette nel menù */
        <Card>
          <CardTitle />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-white/40" />
          ))}
          <div className="h-9 rounded-xl bg-white/30 sm:h-10" />
          <div className="h-40 rounded-xl bg-white/25" />
        </Card>
      )}
    </div>
  );
}
