import { Skeleton } from "@/components/ui/skeleton";

export function MetricsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton className="h-96 rounded-card-xl lg:col-span-2" />
      <Skeleton className="h-96 rounded-card-xl" />
    </div>
  );
}
