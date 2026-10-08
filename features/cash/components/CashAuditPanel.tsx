"use client";
/**
 * Auditoría de caja: filtros (canal/turno/pedido/acción/operador/fecha) +
 * before/after expandible. Lecturas acotadas (rango máx. 90 días, plan).
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
];

export function CashAuditPanel({ businessId, branchId, sessionId, orderNumber }: CashAuditPanelProps) {
  const t = useTranslations("cash");
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("audit.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-4">
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger aria-label={t("audit.action")}>
              <SelectValue placeholder={t("audit.action")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">{t("audit.all")}</SelectItem>
              {ACTIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
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
          {!orderNumber && (
            <Input
              value={orderFilter}
              onChange={(event) => setOrderFilter(event.target.value)}
              placeholder={t("audit.orderNumber")}
              inputMode="numeric"
            />
          )}
        </div>
        {isLoading ? (
          <p className="py-4 text-center text-sm text-slate-500">…</p>
        ) : (data?.items.length ?? 0) === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">{t("audit.empty")}</p>
        ) : (
          <ul className="divide-y">
            {(data?.items ?? []).map((entry) => (
              <li key={entry.id} className="py-2">
                <button
                  type="button"
                  className="flex w-full flex-wrap items-center gap-2 text-left"
                  onClick={() => setExpanded((prev) => (prev === entry.id ? null : entry.id))}
                >
                  <Badge variant="outline">{entry.action}</Badge>
                  <Badge variant="secondary">{entry.channel}</Badge>
                  <span className="text-sm">{entry.actorName}</span>
                  {entry.orderNumber != null && (
                    <span className="text-xs text-slate-500">#{entry.orderNumber}</span>
                  )}
                  {entry.amount != null && (
                    <span className="text-xs font-medium">{entry.amount}</span>
                  )}
                  <span className="ml-auto text-xs text-slate-400">
                    {new Date(entry.createdAt).toLocaleString("es-CO")}
                  </span>
                </button>
                {expanded === entry.id && (
                  <div className="mt-2 grid gap-2 rounded-md bg-slate-50 p-2 text-xs sm:grid-cols-2">
                    <div>
                      <p className="font-medium">{t("audit.before")}</p>
                      <pre className="overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(entry.before ?? null, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="font-medium">{t("audit.after")}</p>
                      <pre className="overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(entry.after ?? null, null, 2)}
                      </pre>
                    </div>
                    {entry.reason && (
                      <p className="sm:col-span-2">
                        <span className="font-medium">{t("movements.reason")}: </span>
                        {entry.reason}
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
