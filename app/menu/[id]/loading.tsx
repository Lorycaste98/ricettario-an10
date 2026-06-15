export default function MenuDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-pulse">
      <div className="h-5 w-28 rounded-lg bg-white/20" />
      <div className="h-10 w-2/3 rounded-xl bg-white/20" />
      <div className="aspect-4/3 w-full rounded-2xl bg-zinc-800 lg:aspect-video" />
      <div className="space-y-3">
        <div className="h-6 w-40 rounded-xl bg-white/20" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-4/3 rounded-2xl bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
