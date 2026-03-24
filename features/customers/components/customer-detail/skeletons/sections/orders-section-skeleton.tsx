"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function OrdersSectionSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <Skeleton className="h-6 w-32" />
      
      {/* Table rows */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 p-4 grid grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
