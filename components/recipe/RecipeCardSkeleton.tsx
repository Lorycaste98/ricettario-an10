interface Props { index?: number }

export function RecipeCardSkeleton({ index = 0 }: Props) {
  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl bg-zinc-900/50 shadow-lg"
      style={{ animation: `skeleton-reveal 0.4s ease-out ${index * 80}ms both` }}
    >
      <div className="relative aspect-4/3 animate-pulse bg-white/12">
        {/* Badge in alto */}
        <div className="absolute top-2.5 left-2.5 h-4 w-16 rounded-full bg-white/20" />
        <div className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-white/15" />
        {/* Pannello info frosted in basso */}
        <div className="absolute inset-x-0 bottom-0 space-y-2 border-t border-white/10 bg-black/20 px-2.5 py-2 backdrop-blur-sm sm:px-3">
          <div className="flex items-start justify-between gap-2">
            <div className="h-3.5 w-3/4 rounded-lg bg-white/20" />
            <div className="h-5 w-12 shrink-0 rounded-md bg-amber-300/25" />
          </div>
          <div className="h-2.5 w-1/2 rounded-lg bg-white/15" />
        </div>
      </div>
    </div>
  );
}
