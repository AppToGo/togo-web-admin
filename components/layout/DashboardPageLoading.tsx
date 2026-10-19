"use client";

import { DashboardLayout } from "./DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic loading state for dashboard/admin routes, used by the `loading.tsx`
 * files under app/[locale]/dashboard and app/[locale]/admin.
 *
 * Without a loading boundary, the App Router keeps showing the previous page
 * until the next one arrives from the server, so a click on a link looks like
 * it did nothing. With it, navigation swaps to this skeleton (inside the same
 * layout, so the sidebar stays in place) immediately.
 *
 * A boundary only kicks in when the route segment right below its folder
 * changes, which is why every route folder with sub-routes has its own
 * `loading.tsx`.
 */
export default function DashboardPageLoading() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 flex-1 min-h-0" aria-busy="true">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-10 w-full sm:w-64" />
        </div>

        {/* Content */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
