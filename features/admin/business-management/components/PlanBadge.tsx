"use client";

/**
 * Plan Badge Component
 * Displays subscription plan with appropriate styling
 */

import { cn } from "@/lib/utils";
import { PLAN_OPTIONS, getPlanLabel } from "../constants/payment-status";

interface PlanBadgeProps {
  plan: number | null | undefined;
  className?: string;
}

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  // Handle null/undefined plan (no subscription)
  if (plan == null) {
    return (
      <div
        className={cn(
          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-500 border-gray-200",
          className
        )}
      >
        <PlanIcon plan={0} className="w-3.5 h-3.5 mr-1.5" />
        Sin plan
      </div>
    );
  }

  const getPlanColor = (planValue: number): string => {
    switch (planValue) {
      case 1: // Free
        return "bg-slate-100 text-slate-700 border-slate-200";
      case 2: // Basic
        return "bg-blue-100 text-blue-700 border-blue-200";
      case 3: // Pro
        return "bg-purple-100 text-purple-700 border-purple-200";
      case 4: // Enterprise
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const label = getPlanLabel(plan);
  const colorClass = getPlanColor(plan);

  return (
    <div
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
        colorClass,
        className
      )}
    >
      <PlanIcon plan={plan} className="w-3.5 h-3.5 mr-1.5" />
      {label}
    </div>
  );
}

interface PlanIconProps {
  plan: number;
  className?: string;
}

function PlanIcon({ plan, className }: PlanIconProps) {
  // Different icons based on plan level
  switch (plan) {
    case 0: // No plan
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      );
    case 1: // Free
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 12H4"
          />
        </svg>
      );
    case 2: // Basic
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      );
    case 3: // Pro
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      );
    case 4: // Enterprise
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5"
          />
        </svg>
      );
    default:
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      );
  }
}
