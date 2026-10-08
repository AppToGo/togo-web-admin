"use client";
/**
 * Cierre de turno: conteo por denominación COP. El total contado se
 * deriva en el cliente solo para mostrar; el servidor recalcula y manda
 * (`countedAmount` del request es referencia, el cierre es autoritativo).
 * Los "Por liquidar" de la sede no bloquean el cierre: son plata que
 * todavía no entró a ninguna caja (puede ser de otro turno o de un
 * domiciliario que no ha vuelto) y el servidor tampoco lo exige. Solo se
 * avisa, para que el cajero no los olvide.
 */
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  expectedAmount,
  pendingCount,
  open,
  onOpenChange,
  onClosed,
}: CloseSessionDrawerProps) {
  const t = useTranslations("cash");
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

  const bump = (denomination: number, delta: number) => {
    setCounts((prev) => {
      const next = (prev[denomination] ?? 0) + delta;
      if (next <= 0) {
        const { [denomination]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [denomination]: next };
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
      <p className="text-sm font-medium">{title}</p>
      <ul className="space-y-1">
        {values.map((denomination) => (
          <li key={denomination} className="flex items-center justify-between gap-2">
            <span className="text-sm">{formatCOP(denomination)}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => bump(denomination, -1)}
                aria-label={`-1 × ${denomination}`}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center text-sm font-medium">
                {counts[denomination] ?? 0}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => bump(denomination, 1)}
                aria-label={`+1 × ${denomination}`}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("close.title")}</DrawerTitle>
          <DrawerDescription>
            {t("close.expected")}: {formatCOP(expected)} · {t("close.totalCounted")}:{" "}
            {formatCOP(counted)}
          </DrawerDescription>
        </DrawerHeader>
        <div className="max-h-[50vh] space-y-5 overflow-y-auto px-4">
          {pendingCount > 0 && (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              {t("close.pendingWarning", { count: pendingCount })}
            </p>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            {renderGroup(t("close.bills"), bills)}
            {renderGroup(t("close.coins"), coins)}
          </div>
          {difference === 0 ? (
            <p className="text-sm text-emerald-600">{t("close.countedEqualsExpected")}</p>
          ) : (
            <p className="text-sm font-medium text-amber-700">
              {t("close.difference")}: {formatCOP(difference)}
            </p>
          )}
          <div className="space-y-2">
            <label htmlFor="cash-close-notes" className="text-sm font-medium">
              {t("close.notes")}
              {needsReason && <span className="text-red-600"> *</span>}
            </label>
            <Textarea
              id="cash-close-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={needsReason ? t("close.notesRequired") : undefined}
              rows={2}
            />
          </div>
        </div>
        <DrawerFooter>
          <Button
            onClick={submit}
            disabled={
              !sessionId ||
              (needsReason && !notes.trim()) ||
              closeSession.isPending
            }
          >
            {t("close.confirm")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
