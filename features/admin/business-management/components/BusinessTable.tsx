"use client";

/**
 * Business Table Component
 * Main table for displaying business data
 */

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DueDateBadge } from "./DueDateBadge";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { PlanBadge } from "./PlanBadge";
import type { BusinessWithSubscription } from "../types/business-subscription.types";
import { getPlanMaxBranches, UNLIMITED_PLAN_LIMIT } from "../constants/payment-status";

interface BusinessTableProps {
  businesses: BusinessWithSubscription[];
  onRecordPayment: (business: BusinessWithSubscription) => void;
  onEditBranches: (business: BusinessWithSubscription) => void;
  onSendNotification: (business: BusinessWithSubscription) => void;
  onToggleStatus: (business: BusinessWithSubscription) => void;
  isLoading?: boolean;
}

export function BusinessTable({
  businesses,
  onRecordPayment,
  onEditBranches,
  onSendNotification,
  onToggleStatus,
  isLoading,
}: BusinessTableProps) {
  const t = useTranslations("admin-businesses");

  if (isLoading) {
    return <BusinessTableSkeleton />;
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <BuildingIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">{t("table.noBusinesses")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.business")}</TableHead>
            <TableHead>{t("table.plan")}</TableHead>
            <TableHead>{t("table.paymentStatus")}</TableHead>
            <TableHead>{t("table.dueDate")}</TableHead>
            <TableHead>{t("table.branches")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead className="text-right">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {businesses.map((business) => (
            <TableRow key={business.id}>
              {/* Business Info */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-indigo-purple flex items-center justify-center shrink-0">
                    <span className="text-white font-medium text-sm">
                      {business.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{business.name}</p>
                    <p className="text-xs text-slate-500">{business.slug}</p>
                  </div>
                </div>
              </TableCell>

              {/* Plan */}
              <TableCell>
                <PlanBadge plan={business.subscription?.plan} />
              </TableCell>

              {/* Payment Status */}
              <TableCell>
                {business.subscription ? (
                  <PaymentStatusBadge status={business.subscription.paymentStatus} />
                ) : (
                  <span className="text-slate-400 text-sm">-</span>
                )}
              </TableCell>

              {/* Due Date */}
              <TableCell>
                <DueDateBadge
                  daysUntilDue={business.daysUntilDue}
                  nextPaymentDue={business.subscription?.nextPaymentDue || null}
                />
              </TableCell>

              {/* Branches */}
              <TableCell>
                <BranchesCount
                  count={business.branchesCount}
                  plan={business.subscription?.plan ?? null}
                  override={business.subscription?.maxBranchesOverride}
                />
              </TableCell>

              {/* Status */}
              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                    business.isActive
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  )}
                >
                  {business.isActive ? t("status.active") : t("status.inactive")}
                </span>
              </TableCell>

              {/* Actions */}
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  {/* Record Payment */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRecordPayment(business)}
                    title={t("actions.recordPayment")}
                  >
                    <DollarIcon className="w-4 h-4" />
                  </Button>

                  {/* Edit Branches */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditBranches(business)}
                    title={t("actions.editBranches")}
                  >
                    <BuildingIcon className="w-4 h-4" />
                  </Button>

                  {/* Send Notification */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSendNotification(business)}
                    title={t("actions.sendNotification")}
                  >
                    <BellIcon className="w-4 h-4" />
                  </Button>

                  {/* Toggle Status */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleStatus(business)}
                    title={
                      business.isActive
                        ? t("actions.deactivate")
                        : t("actions.activate")
                    }
                  >
                    {business.isActive ? (
                      <PauseIcon className="w-4 h-4" />
                    ) : (
                      <PlayIcon className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface BranchesCountProps {
  count: number;
  plan: number | null;
  override: number | null | undefined;
}

function BranchesCount({ count, plan, override }: BranchesCountProps) {
  // If no plan and no override, show simple count
  if (plan === null && override === null) {
    return (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-700">
          {count}
        </span>
      </div>
    );
  }
  
  const maxBranches = override ?? getPlanMaxBranches(plan ?? 1);
  const isUnlimited = maxBranches >= UNLIMITED_PLAN_LIMIT;
  const isNearLimit = !isUnlimited && count >= maxBranches * 0.8;
  const isOverLimit = !isUnlimited && count > maxBranches;

  return (
    <div className="flex flex-col">
      <span
        className={cn(
          "text-sm font-medium",
          isOverLimit ? "text-red-600" : isNearLimit ? "text-amber-600" : "text-slate-700"
        )}
      >
        {count} / {isUnlimited ? "∞" : maxBranches}
      </span>
      {override && (
        <span className="text-xs text-purple-600">Personalizado</span>
      )}
    </div>
  );
}

function BusinessTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-16 bg-slate-100 rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
}

// Icons
function BuildingIcon({ className }: { className?: string }) {
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
}

function DollarIcon({ className }: { className?: string }) {
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
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
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
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
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
        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
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
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
