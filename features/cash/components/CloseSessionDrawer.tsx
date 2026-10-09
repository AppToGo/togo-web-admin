"use client";
/**
 * Cierre de turno: conteo por denominación COP. El total contado se
 * deriva en el cliente solo para mostrar; el servidor recalcula y manda.
 * Los "Por liquidar" de la sede no bloquean el cierre: son plata que
 * todavía no entró a ninguna caja y el servidor tampoco lo exige. Solo se
 * avisa, para que el cajero no los olvide.
 */
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCloseSession } from "../hooks/useCashMutations";
import {
  COP_DENOMINATIONS,
  formatCOP,
  sumDenominations,
} from "../utils/cash.utils";

interface CloseSessionDrawerProps {
  businessId: string;
  branchId: string;
  sessionId: string | null;
  registerName: string;
  openedByName: string | null;
  openedAt: string | null;
  expectedAmount: string;
  pendingCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClosed?: () => void;
}

export function CloseSessionDrawer({
  businessId,
  branchId,
  sessionId,
  registerName,
  openedByName,
  openedAt,
  expectedAmount,
  pendingCount,
  open,
  onOpenChange,
  onClosed,
}: CloseSessionDrawerProps) {
  const t = useTranslations("cash");
  const locale = useLocale();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const closeSession = useCloseSession(businessId, branchId, sessionId ?? "");

  // El contado es la suma de denominaciones; el servidor lo deriva igual y
  // rechaza cualquier otro valor, así que no hay override manual.
  const counted = useMemo(() => sumDenominations(counts), [counts]);
  const expected = Number(expectedAmount);
  const difference = counted - expected;
  // El servidor exige motivo cuando hay diferencia.
  const needsReason = difference !== 0;

  const setCount = (denomination: number, raw: string) => {
    const qty = Number(raw.replace(/[^0-9]/g, ""));
    setCounts((prev) => {
      if (!qty) {
        const { [denomination]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [denomination]: qty };
    });
  };

  const submit = () => {
    if (!sessionId) return;
    if (needsReason && !notes.trim()) return;
    closeSession.mutate(
      {
        denominations: counts,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setCounts({});
          setNotes("");
          onOpenChange(false);
          onClosed?.();
        },
      }
    );
  };

  const bills = COP_DENOMINATIONS.filter((denomination) => denomination >= 2000);
  const coins = COP_DENOMINATIONS.filter((denomination) => denomination < 2000);

  const renderGroup = (title: string, values: number[]) => (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {title} ·{" "}
        <span className="tabular-nums text-slate-500">
          {formatCOP(values.reduce((acc, value) => acc + value * (counts[value] ?? 0), 0))}
        </span>
      </p>
      {values.map((denomination) => {
        const qty = counts[denomination] ?? 0;
        const id = `cash-close-${denomination}`;
        return (
          <div
            key={denomination}
            className="grid grid-cols-[5rem_4rem_minmax(0,1fr)] items-center gap-2"
          >
            <label htmlFor={id} className="text-sm font-medium tabular-nums">
              {formatCOP(denomination)}
            </label>
            <Input
              id={id}
              inputMode="numeric"
              value={qty ? String(qty) : ""}
              placeholder="0"
              aria-label={t("closeDrawer.quantity", {
                denomination: formatCOP(denomination),
              })}
              onChange={(event) => setCount(denomination, event.target.value)}
              className="text-center font-semibold"
            />
            <span className="text-right text-sm tabular-nums text-slate-600">
              {formatCOP(denomination * qty)}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} isLoading={closeSession.isPending}>
      <DrawerContent size="lg">
        <DrawerHeader>
          <DrawerTitle>{t("closeDrawer.title", { register: registerName })}</DrawerTitle>
          {openedAt && (
            <DrawerDescription>
              {t("closeDrawer.desc", {
                name: openedByName ?? "—",
                time: new Date(openedAt).toLocaleTimeString(locale, {
                  hour: "numeric",
                  minute: "2-digit",
                }),
              })}
            </DrawerDescription>
          )}
        </DrawerHeader>
        <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-6 py-4">
          <div className="grid gap-6 sm:grid-cols-2">
            {renderGroup(t("close.bills"), bills)}
            {renderGroup(t("close.coins"), coins)}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-card bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                {t("closeDrawer.expected")}
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums">{formatCOP(expected)}</p>
            </div>
            <div className="rounded-card bg-indigo-50 p-4">
              <p className="text-xs font-medium text-indigo-700">
                {t("closeDrawer.counted")}
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums">{formatCOP(counted)}</p>
            </div>
            <div
              className={cn(
                "rounded-card p-4",
                difference === 0
                  ? "bg-emerald-100 text-emerald-800"
                  : difference < 0
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
              )}
            >
              <p className="text-xs font-medium">
                {difference === 0
                  ? t("close.difference")
                  : difference < 0
                    ? t("sessions.shortage")
                    : t("sessions.surplus")}
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums">
                {difference === 0
                  ? formatCOP(0)
                  : `${difference < 0 ? "− " : "+ "}${formatCOP(Math.abs(difference))}`}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="cash-close-notes" className="text-sm font-medium">
              {needsReason ? t("closeDrawer.reason") : t("closeDrawer.note")}
            </label>
            <Textarea
              id="cash-close-notes"
              value={notes}
              maxLength={500}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={needsReason ? t("close.notesRequired") : undefined}
              rows={2}
            />
          </div>

          {pendingCount > 0 && (
            <p className="rounded-card bg-amber-50 p-4 text-sm text-amber-800">
              {t("close.pendingWarning", { count: pendingCount })}
            </p>
          )}
        </div>
        <DrawerFooter className="gap-2 sm:space-x-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("closeDrawer.keepCounting")}
          </Button>
          <Button
            variant="slate"
            onClick={submit}
            disabled={
              !sessionId ||
              (needsReason && !notes.trim()) ||
              closeSession.isPending
            }
          >
            {t("closeDrawer.confirm", { amount: formatCOP(counted) })}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
