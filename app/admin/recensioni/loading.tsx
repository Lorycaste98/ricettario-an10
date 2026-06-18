export default function RecensioniLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="h-4 w-24 rounded-lg bg-gray-200 animate-pulse" />
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-gray-200 animate-pulse" />
        <div className="space-y-2">
          <div className="h-7 w-40 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-4 w-32 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      </div>
      {Array.from({ length: 2 }).map((_, g) => (
        <div key={g} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 h-5 w-48 rounded-lg bg-gray-200 animate-pulse" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
