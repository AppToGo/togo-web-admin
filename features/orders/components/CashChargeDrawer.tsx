"use client";
/**
 * Cobro en efectivo de un pedido (docs/caja-pedidos.md).
 *
 * - Transferencia/datáfono: solo confirmación (no mueven caja).
 * - Efectivo: paga-con/vueltas + destino del dinero:
 *   - liquidar de una vez en un turno abierto (`cash.sessionId`), o
 *   - dejar por liquidar (el servidor crea la colección PENDING con el
 *     portador resuelto en el servidor: domiciliario asignado → operador).
 * Las vueltas y el esperado los calcula el servidor; acá solo se muestran.
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Banknote } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/features/cash/components/CurrencyInput";
import { formatCOP } from "@/features/cash/utils/cash.utils";
import { useOpenSessions } from "@/features/cash/hooks/useCash";
import { useUpdateOrderPaymentStatus } from "../hooks/useOrders";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { useEffectiveBranches } from "@/features/branches/hooks";
import { useBranchStore } from "@/stores/branch.store";

export interface ChargeableOrder {
  id: string;
  total: number;
  paymentMethod?: string;
  branchId?: string;
}

interface CashChargeDrawerProps {
  order: ChargeableOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CashChargeDrawer({ order, open, onOpenChange }: CashChargeDrawerProps) {
  const t = useTranslations("cash");
  const businessId = useEffectiveBusinessId();
  const { defaultBranchId } = useEffectiveBranches();
  const selectedBranchIds = useBranchStore((state) => state.selectedBranchIds);

  const branchId =
    order?.branchId ??
    (selectedBranchIds?.length === 1 ? selectedBranchIds[0] : null) ??
    defaultBranchId;

  const [destination, setDestination] = useState<"settle" | "pending">("settle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [received, setReceived] = useState(0);
  const updatePaymentStatus = useUpdateOrderPaymentStatus();

  const { data: openSessions = [] } = useOpenSessions(
    open && destination === "settle" ? businessId : null,
    open && destination === "settle" ? branchId : null
  );

  const total = order?.total ?? 0;
  const change = Math.max(0, received - total);
  const canSubmit =
    !!order &&
    (destination === "pending" || (!!sessionId && (received <= 0 || received >= total)));

  const reset = () => {
    setDestination("settle");
    setSessionId(null);
    setReceived(0);
  };

  const submit = () => {
    if (!order || !canSubmit) return;
    updatePaymentStatus.mutate(
      {
        orderId: order.id,
        data: {
          paymentStatus: "PAID",
          ...(destination === "settle" && sessionId
            ? {
                cash: {
                  sessionId,
                  ...(received > 0 ? { receivedAmount: received } : {}),
                },
              }
            : {}),
        },
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            {t("orders.charge")} · {formatCOP(total)}
          </DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 px-4">
          <RadioGroup
            value={destination}
            onValueChange={(value) => setDestination(value as "settle" | "pending")}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="settle" id="cash-charge-settle" />
              <Label htmlFor="cash-charge-settle">{t("orders.settleNow")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="pending" id="cash-charge-pending" />
              <Label htmlFor="cash-charge-pending">{t("orders.leavePending")}</Label>
            </div>
          </RadioGroup>

          {destination === "settle" && (
            <>
              {openSessions.length === 0 ? (
                <p className="text-sm text-amber-700">{t("orders.noOpenSession")}</p>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="cash-charge-session">{t("orders.destination")}</Label>
                  <Select value={sessionId ?? undefined} onValueChange={setSessionId}>
                    <SelectTrigger id="cash-charge-session">
                      <SelectValue placeholder={t("orders.destination")} />
                    </SelectTrigger>
                    <SelectContent>
                      {openSessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.register.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="cash-charge-received">{t("orders.tendered")}</Label>
                <CurrencyInput
                  id="cash-charge-received"
                  value={received}
                  onChange={setReceived}
                  min={0}
                />
                {received > 0 && (
                  <p className="text-xs text-slate-500">
                    {t("orders.change")}: {formatCOP(change)}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
        <DrawerFooter>
          <Button
            onClick={submit}
            disabled={!canSubmit || updatePaymentStatus.isPending}
          >
            {t("orders.charge")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
