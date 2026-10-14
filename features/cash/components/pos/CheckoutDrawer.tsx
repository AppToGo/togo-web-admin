"use client";
/**
 * Cobrar la venta de Caja · Vender (docs/caja-pos.md): método, paga con,
 * vueltas y, ya cobrada, el comprobante (Imprimir · WhatsApp) y "Nueva
 * venta".
 *
 * El pedido se crea al confirmar (`onCharge`): Mostrador cobra y entrega;
 * los demás tipos nacen pagados (`payNow`). En efectivo el dinero entra al
 * turno abierto de la caja; las vueltas las calcula el servidor.
 *
 * WhatsApp solo con la ventana de 24 h abierta (el cliente escribió hace
 * menos de 24 h): fuera de ella el botón queda deshabilitado con el motivo.
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, MessageCircle, Printer } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  CreateOrderResponse,
  ManualOrderPaymentMethod,
} from "@/features/orders/types";
import { CurrencyInput } from "../CurrencyInput";
import { formatCOP, quickCashAmounts } from "../../utils/cash.utils";
import { useReceiptWhatsappWindow } from "../../hooks/useCash";
import { useSendReceiptWhatsapp } from "../../hooks/useCashMutations";
import { printReceipt, type ReceiptData } from "./receipt-print";

/** Lo que el recibo necesita de la venta (se congela al cobrar). */
export type SaleSnapshot = Pick<
  ReceiptData,
  "typeLabel" | "lines" | "subtotal" | "deliveryFee" | "total"
>;

interface CheckoutDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string | null;
  businessName: string;
  /** Texto del encabezado: tipo de pedido, mesa, cantidad de productos. */
  label: string;
  sale: SaleSnapshot;
  paymentMethods: ManualOrderPaymentMethod[];
  /** Turno donde entra el efectivo; sin él no se cobra en efectivo. */
  session: { id: string; registerName: string } | null;
  /** `cash.operate`: sin él no se recibe efectivo. */
  canUseCash: boolean;
  /** Crea el pedido cobrado. `null` si falló (el toast ya lo dijo). */
  onCharge: (
    method: ManualOrderPaymentMethod,
    receivedAmount: number
  ) => Promise<CreateOrderResponse | null>;
  /** "Nueva venta": limpia el carrito. */
  onDone: () => void;
  formatDate: (date: Date) => string;
}

interface Charged {
  order: CreateOrderResponse;
  method: ManualOrderPaymentMethod;
  received: number | null;
  sale: SaleSnapshot;
  chargedAt: Date;
}

export function CheckoutDrawer({
  open,
  onOpenChange,
  businessId,
  businessName,
  label,
  sale,
  paymentMethods,
  session,
  canUseCash,
  onCharge,
  onDone,
  formatDate,
}: CheckoutDrawerProps) {
  const t = useTranslations("cash");
  const tOrders = useTranslations("orders");

  const cashAvailable = canUseCash && !!session;
  const methods = paymentMethods.filter(
    (method) => method !== "CASH" || cashAvailable
  );
  const [pickedMethod, setMethod] = useState<ManualOrderPaymentMethod | null>(
    null
  );
  const method =
    pickedMethod && methods.includes(pickedMethod)
      ? pickedMethod
      : (methods[0] ?? null);
  const isCash = method === "CASH";

  // `null` = aún no escribió: se asume pago exacto.
  const [typed, setTyped] = useState<number | null>(null);
  const [charging, setCharging] = useState(false);
  const [charged, setCharged] = useState<Charged | null>(null);

  const total = sale.total;
  const received = typed ?? total;
  const difference = received - total;
  const canSubmit = !!method && (!isCash || difference >= 0) && !charging;

  const { data: whatsappWindow, isLoading: loadingWindow } =
    useReceiptWhatsappWindow(businessId, charged?.order.orderId ?? null);
  const sendWhatsapp = useSendReceiptWhatsapp(businessId);

  const reset = () => {
    setMethod(null);
    setTyped(null);
    setCharged(null);
  };

  const close = () => {
    if (charging) return;
    const wasCharged = !!charged;
    reset();
    onOpenChange(false);
    if (wasCharged) onDone();
  };

  const submit = async () => {
    if (!canSubmit || !method) return;
    setCharging(true);
    try {
      const order = await onCharge(method, received);
      if (order) {
        setCharged({
          order,
          method,
          received: method === "CASH" ? received : null,
          sale,
          chargedAt: new Date(),
        });
      }
    } finally {
      setCharging(false);
    }
  };

  const print = () => {
    if (!charged) return;
    const methodLabel = tOrders(`paymentMethods.${charged.method}`);
    const ok = printReceipt({
      ...charged.sale,
      businessName,
      orderNumber: charged.order.orderNumber,
      dateLabel: formatDate(charged.chargedAt),
      methodLabel,
      received: charged.received,
      change: charged.method === "CASH" ? (charged.order.change ?? 0) : null,
      labels: {
        order: t("pos.receipt.order"),
        subtotal: tOrders("createOrder.subtotal"),
        deliveryFee: tOrders("createOrder.deliveryFee"),
        total: t("pos.cart.total"),
        paidWith: t("pos.receipt.paidWith"),
        received: t("pos.receipt.received"),
        change: t("charge.change"),
        thanks: t("pos.receipt.thanks"),
      },
    });
    if (!ok) toast.error(t("pos.receipt.popupBlocked"));
  };

  const whatsappHint = !whatsappWindow
    ? null
    : whatsappWindow.reason === "NO_PHONE"
      ? t("pos.receipt.noPhone")
      : whatsappWindow.reason === "WINDOW_CLOSED"
        ? t("pos.receipt.windowClosed")
        : null;

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      isLoading={charging}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {charged ? t("pos.checkout.doneTitle") : t("pos.checkout.title")}
          </DrawerTitle>
          <DrawerDescription>{label}</DrawerDescription>
        </DrawerHeader>

        {charged ? (
          <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-6 py-4">
            <div className="flex flex-col items-center gap-2 rounded-card bg-emerald-50 p-6 text-center text-emerald-800">
              <CheckCircle2 className="h-10 w-10" />
              <p className="text-sm font-semibold">
                {t("pos.checkout.charged", {
                  number: charged.order.orderNumber,
                })}
              </p>
              {charged.method === "CASH" ? (
                <>
                  <p className="text-sm">{t("charge.change")}</p>
                  <p
                    className="text-4xl font-bold tabular-nums"
                    data-testid="pos-change"
                  >
                    {formatCOP(charged.order.change ?? 0)}
                  </p>
                </>
              ) : (
                <p className="text-sm">
                  {t("pos.checkout.paidWith", {
                    method: tOrders(`paymentMethods.${charged.method}`),
                  })}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("pos.receipt.title")}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={print}>
                  <Printer className="mr-2 h-4 w-4" />
                  {t("pos.receipt.print")}
                </Button>
                <Button
                  variant="outline"
                  disabled={
                    loadingWindow ||
                    !whatsappWindow?.available ||
                    sendWhatsapp.isPending
                  }
                  onClick={() => sendWhatsapp.mutate(charged.order.orderId)}
                >
                  {sendWhatsapp.isPending || loadingWindow ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="mr-2 h-4 w-4" />
                  )}
                  {sendWhatsapp.isSuccess
                    ? t("pos.receipt.whatsappSent")
                    : t("pos.receipt.whatsapp")}
                </Button>
              </div>
              {whatsappHint && (
                <p className="text-xs text-slate-500">{whatsappHint}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-6 py-4">
            <div className="flex items-baseline justify-between rounded-card bg-slate-50 p-4">
              <span className="text-sm font-medium text-slate-600">
                {t("charge.total")}
              </span>
              <span className="text-2xl font-bold tabular-nums">
                {formatCOP(total)}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("charge.method")}</p>
              <div
                role="group"
                aria-label={t("charge.method")}
                className="flex flex-wrap gap-2"
              >
                {methods.map((option) => (
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
              {!cashAvailable && (
                <p className="text-xs text-amber-700">
                  {canUseCash
                    ? t("pos.checkout.noSession")
                    : t("pos.checkout.noCashPermission")}
                </p>
              )}
            </div>

            {method && !isCash && (
              <p className="rounded-card bg-slate-50 p-4 text-sm text-slate-600">
                {t("charge.nonCash", {
                  method: tOrders(`paymentMethods.${method}`).toLowerCase(),
                })}
              </p>
            )}

            {isCash && (
              <>
                <div className="space-y-2">
                  <label
                    htmlFor="pos-checkout-received"
                    className="text-sm font-medium"
                  >
                    {t("charge.payWith")}
                  </label>
                  <CurrencyInput
                    id="pos-checkout-received"
                    size="lg"
                    value={received}
                    onChange={setTyped}
                    placeholder="0"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {quickCashAmounts(total).map((value, index) => (
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

                {session && (
                  <p className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
                    {t("charge.toRegister", { register: session.registerName })}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <DrawerFooter className="gap-2 sm:space-x-0">
          {charged ? (
            <Button className="h-12 w-full text-base" onClick={close} autoFocus>
              {t("pos.checkout.newSale")}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={close} disabled={charging}>
                {t("actions.cancel")}
              </Button>
              <Button onClick={submit} disabled={!canSubmit}>
                {charging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("pos.checkout.confirm", { total: formatCOP(total) })}
              </Button>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
