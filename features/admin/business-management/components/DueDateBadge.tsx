"use client";

/**
 * Due Date Badge Component
 * Displays a badge with color gradient based on days until due date
 */

import { cn } from "@/lib/utils";
import {
  getDueDateColorClass,
  formatDaysUntilDue,
} from "../constants/payment-status";

interface DueDateBadgeProps {
  daysUntilDue: number | null;
  nextPaymentDue: string | null;
  className?: string;
}

export function DueDateBadge({
  daysUntilDue,
  nextPaymentDue,
  className,
}: DueDateBadgeProps) {
  const colorClass = getDueDateColorClass(daysUntilDue);
  const displayText = formatDaysUntilDue(daysUntilDue);

  // Format the date for tooltip
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Sin fecha definida";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
        colorClass,
        className
      )}
      title={`Vence: ${formatDate(nextPaymentDue)}`}
    >
      <ClockIcon className="w-3.5 h-3.5 mr-1.5" />
      {displayText}
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
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
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
