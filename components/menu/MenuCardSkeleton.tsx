interface Props { index?: number }

export function MenuCardSkeleton({ index = 0 }: Props) {
  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl bg-zinc-900/50 shadow-lg"
      style={{ animation: `skeleton-reveal 0.4s ease-out ${index * 80}ms both` }}
    >
      <div className="relative aspect-4/3 animate-pulse bg-white/12">
        {/* Pannello info frosted in basso */}
        <div className="absolute inset-x-0 bottom-0 space-y-1.5 border-t border-white/10 bg-black/20 px-2 py-1.5 backdrop-blur-sm sm:space-y-2 sm:px-3 sm:py-2">
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0 flex-1 space-y-1 sm:space-y-1.5">
              <div className="h-2.5 w-3/4 rounded bg-white/20 sm:h-3" />
              <div className="h-2.5 w-1/2 rounded bg-white/15 sm:h-3" />
            </div>
            <div className="h-4 w-10 shrink-0 rounded-md bg-amber-300/25 sm:h-5 sm:w-12" />
          </div>
          <div className="h-2 w-2/3 rounded-lg bg-white/15 sm:h-2.5" />
        </div>
      </div>
    </div>
  );
}
