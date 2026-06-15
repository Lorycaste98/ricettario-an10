export default function RecipeDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-pulse">
      <div className="h-5 w-36 rounded-lg bg-white/20" />
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="space-y-4">
          <div className="h-10 w-3/4 rounded-xl bg-white/20" />
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-white/15" />
            <div className="h-6 w-16 rounded-full bg-white/15" />
          </div>
          <div className="flex gap-4">
            <div className="h-5 w-20 rounded-lg bg-white/15" />
            <div className="h-5 w-16 rounded-lg bg-white/15" />
          </div>
        </div>
        <div className="aspect-4/3 rounded-2xl bg-zinc-800" />
      </div>
      <div className="space-y-3">
        <div className="h-6 w-32 rounded-xl bg-white/20" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 w-full rounded-lg bg-white/10" />
        ))}
      </div>
    </div>
  );
}
