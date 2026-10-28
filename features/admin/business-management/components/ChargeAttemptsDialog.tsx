"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";
import { useFormatDate } from "@/hooks/useFormatDate";
import { useChargeAttempts } from "../hooks/useAdminBusinesses";
import type { ChargeAttempt } from "../types/business-subscription.types";

interface ChargeAttemptsDialogProps {
  businessId: string | null;
  businessName: string;
  onClose: () => void;
}

const STATUS_STYLES: Record<ChargeAttempt["status"], string> = {
  APPROVED: "bg-emerald-50 text-emerald-700",
  DECLINED: "bg-red-50 text-red-700",
  ERROR: "bg-orange-50 text-orange-700",
  PENDING: "bg-slate-100 text-slate-600",
  VOIDED: "bg-purple-50 text-purple-700",
};

/**
 * Historial de cobros que ToGo inició en Wompi para un negocio
 * (docs/cobro-suscripciones.md §7 en api-togo): renovación y reintentos,
 * pagos del dueño y subidas de plan, con el motivo del banco.
 */
export function ChargeAttemptsDialog({
  businessId,
  businessName,
  onClose,
}: ChargeAttemptsDialogProps) {
  const t = useTranslations("admin-businesses.chargeAttempts");
  const { data: attempts, isLoading } = useChargeAttempts(businessId);

  return (
    <Dialog open={!!businessId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("title", { businessName })}</DialogTitle>
          <p className="text-sm text-slate-500">{t("description")}</p>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 flex justify-center">
            <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : !attempts?.length ? (
          <p className="py-8 text-center text-sm text-slate-500">{t("empty")}</p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("kind")}</TableHead>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("reason")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((attempt) => (
                  <AttemptRow key={attempt.id} attempt={attempt} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AttemptRow({ attempt }: { attempt: ChargeAttempt }) {
  const t = useTranslations("admin-businesses.chargeAttempts");
  const createdAt = useFormatDate(attempt.createdAt, { preset: "short" });

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap text-xs">{createdAt}</TableCell>
      <TableCell className="text-xs">
        {t(`kinds.${attempt.kind}`)}
        {attempt.kind === "RENEWAL" && (
          <span className="text-slate-400"> · {t("attempt", { n: attempt.attemptNumber })}</span>
        )}
        <span className="block text-slate-400">{attempt.planName}</span>
      </TableCell>
      <TableCell className="whitespace-nowrap text-xs">
        {formatCurrency(attempt.amountInCents / 100, attempt.currency)}
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
            STATUS_STYLES[attempt.status]
          )}
        >
          {t(`statuses.${attempt.status}`)}
        </span>
      </TableCell>
      <TableCell className="text-xs text-slate-600 max-w-[220px]">
        {attempt.statusMessage ?? "—"}
      </TableCell>
    </TableRow>
  );
}
