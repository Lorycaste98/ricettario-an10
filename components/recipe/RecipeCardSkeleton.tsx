interface Props {
  index?: number;
}

/** Segnaposto della card ricetta (8.1): stessa forma, foto 4:3 + due righe sotto. */
export function RecipeCardSkeleton({ index = 0 }: Props) {
  return (
    <div
      aria-hidden
      className="flex flex-col overflow-hidden rounded-card border border-blu-150 bg-white"
      style={{ animation: `skeleton-reveal 0.4s ease-out ${index * 60}ms both` }}
    >
      <div className="aspect-4/3 animate-pulse bg-blu-150 motion-reduce:animate-none" />
      <div className="flex flex-col gap-2 px-[0.7em] pt-[0.6em] pb-[0.75em]">
        <div className="h-3.5 w-4/5 animate-pulse rounded bg-blu-150 motion-reduce:animate-none" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-blu-100 motion-reduce:animate-none" />
      </div>
    </div>
  );
}
