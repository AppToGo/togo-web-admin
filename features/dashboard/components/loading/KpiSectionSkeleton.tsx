import { CardSkeleton } from "./CardSkeleton";

export function KpiSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} className="h-36" />
      ))}
    </div>
  );
}
