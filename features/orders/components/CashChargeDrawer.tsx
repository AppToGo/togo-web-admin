"use client";
/**
 * Confirmación de pago de un pedido (docs/caja-pedidos.md).
 *
 * - Método de pago editable al cobrar (el cliente pidió efectivo y paga con
 *   datáfono): transferencia/datáfono solo confirman, no mueven caja.
 * - Efectivo: paga-con/vueltas + destino del dinero:
 *   - entra a un turno abierto (`cash.sessionId`), o
 *   - queda por liquidar (el servidor resuelve el portador).
 * Las vueltas y el esperado los calcula el servidor; acá solo se muestran.
 * Entrar a un turno exige ver la caja y operarla (`cash.view` +
 * `cash.operate`): sin ellos solo se ofrece dejarlo por liquidar.
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CurrencyInput } from "@/features/cash/components/CurrencyInput";
import { formatCOP, isCashPaymentMethod } from "@/features/cash/utils/cash.utils";
import { useOpenSessions } from "@/features/cash/hooks/useCash";
import { useUpdateOrderPaymentStatus } from "../hooks/useOrders";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { useEffectiveBranches } from "@/features/branches/hooks";
import { useBranchStore } from "@/stores/branch.store";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";

export interface ChargeableOrder {
  id: string;
  total: number;
  paymentMethod?: string;
  branchId?: string;
  /** Texto del encabezado: número de pedido, mesa, etc. */
  label?: string;
}

interface CashChargeDrawerProps {
  order: ChargeableOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Desde Caja el dinero entra a ese turno: el destino queda fijo y no se
   * ofrece "queda por liquidar".
   */
  fixedSession?: { id: string; registerName: string };
}

type Method = "CASH" | "TRANSFER" | "DATAPHONE";
const METHODS: Method[] = ["CASH", "TRANSFER", "DATAPHONE"];

function toMethod(method: string | undefined): Method {
  if (isCashPaymentMethod(method)) return "CASH";
  return method?.toUpperCase() === "TRANSFER" ? "TRANSFER" : "DATAPHONE";
}

/** Montos rápidos: exacto + los siguientes billetes redondos por encima. */
function quickAmounts(total: number): number[] {
  const candidates = [10000, 20000, 50000, 100000]
    .map((step) => Math.ceil(total / step) * step)
    .filter((value) => value > total);
  return [total, ...[...new Set(candidates)].sort((a, b) => a - b).slice(0, 3)];
}

export function CashChargeDrawer({
  order,
  open,
  onOpenChange,
  fixedSession,
}: CashChargeDrawerProps) {
  const t = useTranslations("cash");
  const tOrders = useTranslations("orders");
  const businessId = useEffectiveBusinessId();
  const { defaultBranchId } = useEffectiveBranches();
  const selectedBranchIds = useBranchStore((state) => state.selectedBranchIds);

  const branchId =
    order?.branchId ??
    (selectedBranchIds?.length === 1 ? selectedBranchIds[0] : null) ??
    defaultBranchId;

  const { hasPermission } = useMyPermissions();
  const canSettle = hasPermission("cash.view") && hasPermission("cash.operate");

  const [pickedMethod, setMethod] = useState<Method | null>(null);
  const method = pickedMethod ?? toMethod(order?.paymentMethod);
  const isCash = method === "CASH";

  const [pickedDestination, setDestination] = useState<"settle" | "pending">("settle");
  const [pickedSessionId, setSessionId] = useState<string | null>(null);
  // `null` = aún no escribió: se asume pago exacto.
  const [typed, setTyped] = useState<number | null>(null);
  const updatePaymentStatus = useUpdateOrderPaymentStatus();

  const needsSessions = open && isCash && canSettle && !fixedSession;
  const { data: openSessions = [] } = useOpenSessions(
    needsSessions ? businessId : null,
    needsSessions ? branchId : null
  );

  const canEnterRegister = !!fixedSession || (canSettle && openSessions.length > 0);
  const destination: "settle" | "pending" = fixedSession
    ? "settle"
    : canEnterRegister
      ? pickedDestination
      : "pending";
  const sessionId =
    fixedSession?.id ??
    (pickedSessionId && openSessions.some((session) => session.id === pickedSessionId)
      ? pickedSessionId
      : (openSessions[0]?.id ?? null));
  const registerName =
    fixedSession?.registerName ??
    openSessions.find((session) => session.id === sessionId)?.register.name ??
    "";

  const total = order?.total ?? 0;
  const received = typed ?? total;
  const difference = received - total;
  const toRegister = isCash && destination === "settle" && !!sessionId;
  const canSubmit = !!order && (!isCash || difference >= 0);

  const reset = () => {
    setMethod(null);
    setDestination("settle");
    setSessionId(null);
    setTyped(null);
  };

  const submit = () => {
    if (!order || !canSubmit) return;
    updatePaymentStatus.mutate(
      {
        orderId: order.id,
        data: {
          paymentStatus: "PAID",
          // Misma nota de historial que la confirmación en 1 clic.
          changeNotes: tOrders("paymentNotes.confirmedFromAdmin"),
          ...(method !== toMethod(order.paymentMethod) || !order.paymentMethod
            ? { paymentMethod: method }
            : {}),
          ...(toRegister && sessionId
            ? { cash: { sessionId, receivedAmount: received } }
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

  const destinations: Array<{
    value: "settle" | "pending";
    title: string;
    hint: string;
    show: boolean;
  }> = [
    {
      value: "settle",
      title: t("charge.toRegister", { register: registerName }),
      hint: t("charge.toRegisterHint"),
      show: canEnterRegister,
    },
    {
      value: "pending",
      title: t("charge.pending"),
      hint: t("charge.pendingHint"),
      show: !fixedSession,
    },
  ];

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      isLoading={updatePaymentStatus.isPending}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("charge.title")}</DrawerTitle>
          {order?.label && <DrawerDescription>{order.label}</DrawerDescription>}
        </DrawerHeader>
        <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-6 py-4">
          <div className="flex items-baseline justify-between rounded-card bg-slate-50 p-4">
            <span className="text-sm font-medium text-slate-600">{t("charge.total")}</span>
            <span className="text-2xl font-bold tabular-nums">{formatCOP(total)}</span>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t("charge.method")}</p>
            <div role="group" aria-label={t("charge.method")} className="flex flex-wrap gap-2">
              {METHODS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={method === option}
                  onClick={() => setMethod(option)}
                  className={cn(
                    "rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors",
                    method === option
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  )}
                >
                  {tOrders(`paymentMethods.${option}`)}
                </button>
              ))}
            </div>
          </div>

          {!isCash && (
            <p className="rounded-card bg-slate-50 p-4 text-sm text-slate-600">
              {t("charge.nonCash", {
                method: tOrders(`paymentMethods.${method}`).toLowerCase(),
              })}
            </p>
          )}

          {isCash && (
            <>
              <div className="space-y-2">
                <label htmlFor="cash-charge-received" className="text-sm font-medium">
                  {t("charge.payWith")}
                </label>
                <CurrencyInput
                  id="cash-charge-received"
                  size="lg"
                  value={received}
                  onChange={setTyped}
                  placeholder="0"
                />
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts(total).map((value, index) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={received === value}
                      onClick={() => setTyped(value)}
                      className={cn(
                        "h-10 rounded-lg border text-xs font-semibold tabular-nums transition-colors",
                        received === value
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      )}
                    >
                      {index === 0 ? t("charge.exact") : formatCOP(value)}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={cn(
                  "flex items-baseline justify-between rounded-card p-4",
                  difference < 0
                    ? "bg-red-100 text-red-800"
                    : "bg-emerald-100 text-emerald-800"
                )}
              >
                <span className="text-sm font-semibold">
                  {difference < 0 ? t("charge.missing") : t("charge.change")}
                </span>
                <span className="text-2xl font-bold tabular-nums">
                  {formatCOP(Math.abs(difference))}
                </span>
              </div>

              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium">{t("charge.where")}</legend>
                {destinations
                  .filter((option) => option.show)
                  .map((option) => {
                    const active = destination === option.value;
                    const id = `cash-charge-${option.value}`;
                    return (
                      <label
                        key={option.value}
                        htmlFor={id}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-card border px-4 py-3 transition-colors",
                          active
                            ? "border-indigo-300 bg-indigo-50"
                            : "border-slate-200 bg-white"
                        )}
                      >
                        <input
                          id={id}
                          type="radio"
                          name="cash-charge-destination"
                          checked={active}
                          onChange={() => setDestination(option.value)}
                          className="mt-1 h-4 w-4 accent-indigo-600"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{option.title}</span>
                          <span className="block text-xs text-slate-600">{option.hint}</span>
                        </span>
                      </label>
                    );
                  })}
                {!fixedSession && destination === "settle" && openSessions.length > 1 && (
                  <Select value={sessionId ?? undefined} onValueChange={setSessionId}>
                    <SelectTrigger aria-label={t("charge.chooseRegister")}>
                      <SelectValue placeholder={t("charge.chooseRegister")} />
                    </SelectTrigger>
                    <SelectContent>
                      {openSessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.register.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </fieldset>
            </>
          )}
        </div>
        <DrawerFooter className="gap-2 sm:space-x-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("actions.cancel")}
          </Button>
          <Button onClick={submit} disabled={!canSubmit || updatePaymentStatus.isPending}>
            {toRegister ? t("charge.confirmToRegister") : t("charge.confirm")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
