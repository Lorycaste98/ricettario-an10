export function MenuCardSkeleton() {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl bg-zinc-900 shadow-lg">
      <div className="relative aspect-4/3 animate-pulse bg-zinc-800">
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
          <div className="h-3.5 w-2/3 rounded-lg bg-zinc-700" />
          <div className="h-2.5 w-1/3 rounded-lg bg-zinc-700" />
        </div>
        <div className="absolute top-2.5 right-2.5 h-4 w-20 rounded-full bg-zinc-700" />
      </div>
    </div>
  );
}
