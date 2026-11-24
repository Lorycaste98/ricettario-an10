interface Props {
  index?: number;
}

/** Segnaposto della card ricetta 8.1 «Piatto»: tovaglia azzurra, piatto tondo, due righe centrate. */
export function RecipeCardSkeleton({ index = 0 }: Props) {
  return (
    <div
      aria-hidden
      className="flex flex-col items-center overflow-hidden rounded-card bg-blu-100 px-[8%] pt-[9%] pb-[0.8em]"
      style={{ animation: `skeleton-reveal 0.4s ease-out ${index * 60}ms both` }}
    >
      <div className="aspect-square w-[76%] animate-pulse rounded-full bg-white motion-reduce:animate-none" />
      <div className="mt-[0.9em] flex w-full flex-col items-center gap-2">
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-blu-150 motion-reduce:animate-none" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-blu-120 motion-reduce:animate-none" />
      </div>
    </div>
  );
}
