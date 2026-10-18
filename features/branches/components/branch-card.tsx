"use client";

import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin, MessageCircle, MoreHorizontal, Star, Trash2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Branch } from "../types";
import { useBranchMetrics } from "../hooks/useBranches";
import { getBranchStatus } from "../utils/branch-status";
import type { BranchStatus } from "../utils/branch-status";
import type {
  WhatsAppAccount,
  WhatsAppRouting,
} from "@/features/whatsapp/types";

interface BranchCardProps {
  branch: Branch;
  onEdit?: (branch: Branch) => void;
  onDelete?: (branch: Branch) => void;
  onMakeMain?: (branch: Branch) => void;
  onConnectWhatsApp?: (branch: Branch) => void;
  whatsappAccount?: WhatsAppAccount | null;
  whatsappRouting?: WhatsAppRouting | null;
  isLoading?: boolean;
}

const STATUS_TONE: Record<BranchStatus["kind"], { dot: string; text: string }> = {
  open: { dot: "bg-emerald-500", text: "text-emerald-700" },
  always: { dot: "bg-emerald-500", text: "text-emerald-700" },
  closed: { dot: "bg-red-500", text: "text-red-700" },
  closedManually: { dot: "bg-red-500", text: "text-red-700" },
  off: { dot: "bg-slate-400", text: "text-slate-600" },
};

/**
 * Un solo estado legible para la sede: si recibe pedidos ahora y hasta
 * cuándo. Lo calcula el backend (cierre manual + horario); acá se pinta.
 */
export function BranchStatusLine({
  status,
  className,
}: {
  status: BranchStatus;
  className?: string;
}) {
  const t = useTranslations("branches.card.status");
  const tone = STATUS_TONE[status.kind];
  const detail =
    status.kind === "off"
      ? t("offDetail")
      : status.kind === "always"
        ? t("alwaysDetail")
        : status.time
          ? t(status.timeKind === "opensAt" ? "opensAt" : "until", { time: status.time })
          : null;

  return (
    <p className={cn("flex min-w-0 items-center gap-2 text-sm", className)}>
      <span aria-hidden className={cn("h-2.5 w-2.5 shrink-0 rounded-full", tone.dot)} />
      <span className={cn("font-semibold", tone.text)}>{t(status.kind)}</span>
      {detail && <span className="truncate text-slate-500">{detail}</span>}
    </p>
  );
}

export function MainBranchBadge() {
  const t = useTranslations("branches");
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
      <Star aria-hidden className="h-3 w-3 fill-amber-600 text-amber-600" />
      {t("card.mainBranch")}
    </span>
  );
}

/**
 * Sede en el listado: nombre y estado arriba, la dirección en una línea,
 * lo de hoy en una banda y el WhatsApp. Las acciones poco frecuentes
 * (hacer principal, eliminar) viven en el menú ⋯.
 */
export const BranchCard = memo(function BranchCard({
  branch,
  onEdit,
  onDelete,
  onMakeMain,
  onConnectWhatsApp,
  whatsappAccount,
  whatsappRouting,
  isLoading = false,
}: BranchCardProps) {
  const t = useTranslations("branches");
  const tCommon = useTranslations("common");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { data: metrics } = useBranchMetrics(branch.isActive ? branch.id : null);

  const status = getBranchStatus(branch);
  const isWhatsAppConnected = !!whatsappRouting?.isActive && !!whatsappAccount;
  const whatsappLabel = whatsappAccount?.displayName
    ? `${whatsappAccount.phoneNumber} · ${whatsappAccount.displayName}`
    : whatsappAccount?.phoneNumber;

  return (
    <li
      className={cn(
        "flex min-w-0 flex-col gap-3.5 rounded-3xl border border-white/90 bg-white/65 p-5",
        branch.isMainBranch && "ring-2 ring-amber-300/60",
        !branch.isActive && "opacity-80"
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-semibold text-slate-900">
            {branch.name}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-mono">{branch.code}</span>
            {branch.isMainBranch && <MainBranchBadge />}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl text-slate-500"
              aria-label={t("card.moreActions", { name: branch.name })}
              disabled={isLoading}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {!branch.isMainBranch && (
              <DropdownMenuItem onClick={() => onMakeMain?.(branch)} className="cursor-pointer">
                <Star className="mr-2 h-4 w-4" />
                {t("card.makeMainLong")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onConnectWhatsApp?.(branch)} className="cursor-pointer">
              <MessageCircle className="mr-2 h-4 w-4" />
              {isWhatsAppConnected ? t("card.editWhatsApp") : t("card.connectWhatsApp")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowDeleteConfirm(true)}
              disabled={branch.isMainBranch}
              title={branch.isMainBranch ? t("card.cannotDeleteMain") : undefined}
              className="cursor-pointer text-red-600 focus:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {tCommon("buttons.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <BranchStatusLine status={status} />

      {branch.address && (
        <p className="flex min-w-0 items-center gap-2 text-[13px] text-slate-600">
          <MapPin aria-hidden className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate" title={branch.address}>
            {branch.address}
          </span>
        </p>
      )}

      <dl className="grid grid-cols-3 gap-2 rounded-2xl bg-white/80 px-3.5 py-3">
        <div className="min-w-0">
          <dt className="text-xs text-slate-500">{t("metrics.ordersToday")}</dt>
          <dd className="text-lg font-bold tabular-nums text-slate-900">
            {metrics ? metrics.ordersToday : "—"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-slate-500">{t("metrics.pending")}</dt>
          <dd className="text-lg font-bold tabular-nums text-amber-700">
            {metrics ? metrics.pendingOrders : "—"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-slate-500">{t("metrics.revenueToday")}</dt>
          <dd className="truncate text-lg font-bold tabular-nums text-emerald-700">
            {metrics ? formatCurrency(metrics.revenueToday, branch.currency) : "—"}
          </dd>
        </div>
      </dl>

      <div className="flex min-h-6 items-center gap-2 text-[13px]">
        <MessageCircle
          aria-hidden
          className={cn("h-4 w-4 shrink-0", isWhatsAppConnected ? "text-green-600" : "text-slate-400")}
        />
        {isWhatsAppConnected ? (
          <span className="truncate text-slate-700">{whatsappLabel}</span>
        ) : (
          <>
            <span className="text-slate-500">{t("card.noWhatsApp")}</span>
            <button
              type="button"
              onClick={() => onConnectWhatsApp?.(branch)}
              disabled={isLoading}
              className="ml-auto font-semibold text-indigo-600 hover:text-indigo-700"
            >
              {t("card.connect")}
            </button>
          </>
        )}
      </div>

      <div className="border-t border-slate-200/80 pt-3.5">
        <Button
          variant="slate-outline"
          className="h-11 w-full rounded-[14px] font-semibold text-slate-700"
          onClick={() => onEdit?.(branch)}
          disabled={isLoading}
        >
          {t("card.view")}
        </Button>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("delete.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={() => {
                setShowDeleteConfirm(false);
                onDelete?.(branch);
              }}
            >
              {tCommon("buttons.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
});
