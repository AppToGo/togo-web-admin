"use client";

/**
 * Business Management Loading State
 * Skeleton loader for the business management page
 */

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BusinessManagementLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Table Skeleton */}
      <Card>
        <div className="p-4 space-y-4">
          {/* Table Header */}
          <div className="flex gap-4 pb-4 border-b">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-32 ml-auto" />
          </div>

          {/* Table Rows */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="flex items-center gap-3 w-48">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-20" />
              <div className="flex gap-1 ml-auto">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
