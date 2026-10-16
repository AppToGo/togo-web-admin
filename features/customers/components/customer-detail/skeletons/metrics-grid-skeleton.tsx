import { Skeleton } from "@/components/ui/skeleton";

export function MetricsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-card-xl bg-white/60" />
      ))}
    </div>
  );
}
