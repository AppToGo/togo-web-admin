import { CardSkeleton } from "./CardSkeleton";

export function MetricsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <CardSkeleton className="h-96 lg:col-span-2" />
      <CardSkeleton className="h-96" />
    </div>
  );
}
