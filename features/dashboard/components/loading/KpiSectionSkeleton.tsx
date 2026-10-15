import { Skeleton } from "@/components/ui/skeleton";

export function KpiSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-card-xl" />
      ))}
    </div>
  );
}
