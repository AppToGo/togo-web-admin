import { CardSkeleton } from "./CardSkeleton";

export function ProductsSectionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CardSkeleton className="h-80 lg:col-span-2" />
        <CardSkeleton className="h-80" />
      </div>
      <CardSkeleton className="h-48" />
    </div>
  );
}
