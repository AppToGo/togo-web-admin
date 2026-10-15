import { Skeleton } from "@/components/ui/skeleton";

export function ChartsSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-80 rounded-card-xl" />
      <Skeleton className="h-80 rounded-card-xl" />
    </div>
  );
}
