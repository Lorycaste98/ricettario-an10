export default function RecensisciLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto h-8 w-64 rounded-xl bg-white/20 animate-pulse" />
        <div className="mx-auto h-4 w-72 rounded-lg bg-white/10 animate-pulse" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-white/15 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
