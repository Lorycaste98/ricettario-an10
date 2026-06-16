interface Props { index?: number }

export function RecipeCardSkeleton({ index = 0 }: Props) {
  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl bg-white/8 shadow-lg"
      style={{ animation: `skeleton-reveal 0.4s ease-out ${index * 80}ms both` }}
    >
      <div className="relative aspect-4/3 animate-pulse bg-white/12">
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
          <div className="h-3.5 w-3/4 rounded-lg bg-white/20" />
          <div className="h-2.5 w-1/2 rounded-lg bg-white/15" />
        </div>
        <div className="absolute top-2.5 left-2.5 h-4 w-16 rounded-full bg-white/20" />
      </div>
    </div>
  );
}
