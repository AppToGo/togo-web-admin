export function MetricsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="h-64 bg-slate-100 animate-pulse rounded-lg" />
      <div className="h-64 bg-slate-100 animate-pulse rounded-lg" />
    </div>
  );
}
