"use client";
/**
 * Auditoría de caja: tabla con fecha y hora, responsable, acción, pedido,
 * monto y motivo; filtros por acción, canal y pedido; antes/después
 * expandible por fila. Lecturas acotadas (rango máx. 90 días, plan).
 */
import { Fragment, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatCOP } from "../utils/cash.utils";
import { useCashAudit } from "../hooks/useCash";

interface CashAuditPanelProps {
  businessId: string;
  branchId?: string;
  sessionId?: string;
  orderNumber?: string;
}

const ACTIONS = [
  "REGISTER_CREATED",
  "REGISTER_UPDATED",
  "SESSION_OPENED",
  "SESSION_CLOSED",
  "MOVEMENT_CREATED",
  "COLLECTION_CREATED",
  "COLLECTION_SETTLED",
  "COLLECTION_VOIDED",
  "ORDER_PAYMENT_CONFIRMED",
  "ORDER_PAYMENT_REFUNDED",
] as const;

const KNOWN_CHANNELS = ["ADMIN", "ADMIN_WEB", "WHATSAPP", "SYSTEM"];

/** Color del chip por tipo de acción: entra, sale, queda fuera, informativo. */
function actionTone(action: string): string {
  if (action === "ACTION_REJECTED") return "bg-red-700 text-white";
  if (action === "ORDER_PAYMENT_CONFIRMED" || action === "COLLECTION_SETTLED") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (action === "ORDER_PAYMENT_REFUNDED" || action === "COLLECTION_VOIDED") {
    return "bg-red-100 text-red-800";
  }
  if (action === "COLLECTION_CREATED") return "bg-amber-100 text-amber-800";
  return "bg-indigo-100 text-indigo-800";
}

const headClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

export function CashAuditPanel({ businessId, branchId, sessionId, orderNumber }: CashAuditPanelProps) {
  const t = useTranslations("cash");
  const locale = useLocale();
  const [action, setAction] = useState<string>("");
  const [channel, setChannel] = useState<string>("");
  const [orderFilter, setOrderFilter] = useState(orderNumber ?? "");
  const [expanded, setExpanded] = useState<string | null>(null);

  const normalized = (value: string): string | undefined =>
    value === "" || value === "__all" ? undefined : value;
  const { data, isLoading } = useCashAudit(businessId, {
    page: 1,
    limit: 50,
    branchId,
    cashSessionId: sessionId,
    action: normalized(action),
    channel: normalized(channel),
    orderNumber: orderFilter.trim() || undefined,
  });

  const actionLabel = (value: string) =>
    (ACTIONS as readonly string[]).includes(value) ||
    value === "ACTION_REJECTED" ||
    value === "MOVEMENT_REVERSED"
      ? t(`audit.actions.${value}`)
      : value;
  const channelLabel = (value: string) =>
    KNOWN_CHANNELS.includes(value) ? t(`audit.channels.${value}`) : value;

  return (
    <Card variant="glass">
      <CardContent className="space-y-4 p-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{t("audit.title")}</h2>
          <p className="text-xs text-slate-500">{t("audit.subtitle")}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {!orderNumber && (
            <Input
              value={orderFilter}
              onChange={(event) => setOrderFilter(event.target.value)}
              placeholder={t("audit.orderNumber")}
              aria-label={t("audit.orderNumber")}
              inputMode="numeric"
            />
          )}
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger aria-label={t("audit.action")}>
              <SelectValue placeholder={t("audit.action")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">{t("audit.all")}</SelectItem>
              {ACTIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`audit.actions.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger aria-label={t("audit.channel")}>
              <SelectValue placeholder={t("audit.channel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">{t("audit.all")}</SelectItem>
              <SelectItem value="ADMIN">{t("audit.channels.ADMIN")}</SelectItem>
              <SelectItem value="WHATSAPP">{t("audit.channels.WHATSAPP")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-slate-500">…</p>
        ) : (data?.items.length ?? 0) === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">{t("audit.empty")}</p>
        ) : (
          <Table className="min-w-[860px]">
            <TableHeader className="[&_tr]:border-slate-300/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className={headClass}>{t("audit.dateTime")}</TableHead>
                <TableHead className={headClass}>{t("audit.responsible")}</TableHead>
                <TableHead className={headClass}>{t("audit.action")}</TableHead>
                <TableHead className={headClass}>{t("audit.order")}</TableHead>
                <TableHead className={cn(headClass, "text-right")}>
                  {t("audit.amount")}
                </TableHead>
                <TableHead className={headClass}>{t("audit.detail")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items ?? []).map((entry) => {
                const isOpen = expanded === entry.id;
                const created = new Date(entry.createdAt);
                return (
                  <Fragment key={entry.id}>
                    <TableRow
                      className={cn(
                        "border-slate-300/50 hover:bg-white/40",
                        entry.action === "ACTION_REJECTED" && "bg-red-50/70"
                      )}
                    >
                      <TableCell className="whitespace-nowrap tabular-nums">
                        <p>
                          {created.toLocaleTimeString(locale, {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-slate-500">
                          {created.toLocaleDateString(locale, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-slate-900">{entry.actorName}</p>
                        <p className="text-xs text-slate-500">
                          {channelLabel(entry.channel)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
                            actionTone(entry.action)
                          )}
                        >
                          {actionLabel(entry.action)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.orderNumber != null ? `#${entry.orderNumber}` : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                        {entry.amount != null ? formatCOP(entry.amount) : "—"}
                      </TableCell>
                      <TableCell className="max-w-64 text-slate-600">
                        {entry.reason ?? "—"}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-label={`${t("audit.before")} / ${t("audit.after")}`}
                          onClick={() => setExpanded(isOpen ? null : entry.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/70 hover:text-slate-900"
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isOpen && "rotate-180"
                            )}
                          />
                        </button>
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow className="border-slate-300/50 hover:bg-transparent">
                        <TableCell colSpan={7}>
                          <div className="grid gap-3 rounded-card bg-white/50 p-3 text-xs sm:grid-cols-2">
                            <div>
                              <p className="font-semibold">{t("audit.before")}</p>
                              <pre className="overflow-x-auto whitespace-pre-wrap text-slate-600">
                                {JSON.stringify(entry.before ?? null, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <p className="font-semibold">{t("audit.after")}</p>
                              <pre className="overflow-x-auto whitespace-pre-wrap text-slate-600">
                                {JSON.stringify(entry.after ?? null, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
