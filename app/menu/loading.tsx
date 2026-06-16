import { MenuCardSkeleton } from "@/components/menu/MenuCardSkeleton";

export default function MenuLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="text-center space-y-2">
        <div className="mx-auto h-6 w-24 rounded-full bg-white/20 animate-pulse" />
        <div className="mx-auto h-8 w-48 rounded-xl bg-white/20 animate-pulse" />
        <div className="mx-auto h-4 w-64 rounded-xl bg-white/10 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MenuCardSkeleton key={i} index={i} />
        ))}
      </div>
    </div>
  );
}
