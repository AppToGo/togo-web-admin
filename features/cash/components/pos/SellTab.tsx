"use client";
/**
 * Caja · Vender (docs/caja-pos.md): productos a la izquierda, venta actual
 * a la derecha. Ocupa el alto de la ventana: productos y líneas hacen
 * scroll por dentro y el pie de la venta queda siempre visible.
 *
 * Sin turno abierto en la caja elegida no se vende (no se puede recibir
 * efectivo): en lugar de la venta se muestra el llamado a abrir caja.
 */
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateOrder } from "@/features/orders/hooks";
import type { OrderComposer } from "@/features/orders/hooks/useOrderComposer";
import type {
  CreateOrderResponse,
  ManualOrderDeliveryType,
  ManualOrderPaymentMethod,
} from "@/features/orders/types";
import { CASH_KEYS } from "../../hooks/query-keys";
import type { SessionSummary } from "../../types/cash.types";
import { ProductCatalog } from "./ProductCatalog";
import { SaleCart } from "./SaleCart";
import { ShiftKpiStrip } from "./ShiftKpiStrip";
import { CheckoutDrawer, type SaleSnapshot } from "./CheckoutDrawer";
import { useFillViewport } from "./useFillViewport";

interface SellTabProps {
  businessId: string;
  businessName: string;
  composer: OrderComposer;
  onTypeChange: (type: ManualOrderDeliveryType) => void;
  /** Turno abierto de la caja elegida. */
  session: { id: string; registerName: string } | null;
  summary: SessionSummary | undefined;
  pendingTotal: string;
  onOpenRegister: (() => void) | null;
  /** `cash.operate`: recibir efectivo. */
  canOperate: boolean;
  /** `order.change_payment_status`: cobrar al crear. */
  canChargeNow: boolean;
  formatDate: (date: Date) => string;
}

/**
 * 409 `COUNTER_SALE_PAYMENT_PENDING`: el pedido se creó pero el cobro
 * falló. No es un error para reintentar: el pedido ya existe.
 */
function isPaymentPending(err: unknown): boolean {
  const data = (err as { response?: { data?: { code?: unknown } } } | null)
    ?.response?.data;
  return data?.code === "COUNTER_SALE_PAYMENT_PENDING";
}

export function SellTab({
  businessId,
  businessName,
  composer,
  onTypeChange,
  session,
  summary,
  pendingTotal,
  onOpenRegister,
  canOperate,
  canChargeNow,
  formatDate,
}: SellTabProps) {
  const t = useTranslations("cash.pos");
  const tDelivery = useTranslations("orders.deliveryTypes");
  const tOrder = useTranslations("orders.createOrder");
  const queryClient = useQueryClient();
  const createOrder = useCreateOrder(businessId);
  const searchRef = useRef<HTMLInputElement>(null);

  const [submitted, setSubmitted] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const { deliveryType, isValid, activeTables, tableId, itemCount } = composer;
  const tableName = activeTables.find((table) => table.id === tableId)?.name;

  const refreshCash = () =>
    queryClient.invalidateQueries({ queryKey: CASH_KEYS.all });

  const newSale = () => {
    composer.clear();
    setSubmitted(false);
    searchRef.current?.focus();
  };

  const openCheckout = () => {
    setSubmitted(true);
    if (!isValid) return;
    setCheckoutOpen(true);
  };

  const charge = async (
    method: ManualOrderPaymentMethod,
    receivedAmount: number
  ): Promise<CreateOrderResponse | null> => {
    const cash =
      method === "CASH" && session
        ? { cash: { sessionId: session.id, receivedAmount } }
        : {};
    try {
      return await createOrder.mutateAsync(
        composer.buildRequest(method, {
          ...cash,
          // Mostrador siempre cobra al crear; los demás tipos lo piden.
          ...(deliveryType !== "COUNTER" && { payNow: true }),
        })
      );
    } catch (err) {
      // El toast de error lo muestra useCreateOrder.
      if (isPaymentPending(err)) {
        // El pedido SÍ quedó creado (el toast dice que se cobra desde Por
        // cobrar): se cierra el cobro y se limpia para no duplicarlo.
        setCheckoutOpen(false);
        newSale();
      }
      return null;
    } finally {
      refreshCash();
    }
  };

  /** Crea el pedido sin cobrar: queda pendiente de pago (Por cobrar). */
  const hold = async () => {
    setSubmitted(true);
    if (!isValid) return;
    try {
      // Se cobra al final: en efectivo aparece en Por cobrar, y al cobrar
      // se puede cambiar el método.
      await createOrder.mutateAsync(composer.buildRequest("CASH"));
      newSale();
    } catch {
      // El toast de error lo muestra useCreateOrder; la venta queda intacta.
    } finally {
      refreshCash();
    }
  };

  const typeLabel =
    deliveryType === "DINE_IN" && tableName
      ? t("checkout.tableLabel", { table: tableName })
      : tDelivery(deliveryType);
  const sale: SaleSnapshot = {
    typeLabel,
    lines: composer.cartLines.map((line) => ({
      name: line.name,
      quantity: line.quantity,
      total: line.unitPrice * line.quantity,
    })),
    subtotal: composer.subtotal,
    deliveryFee: composer.deliveryFee,
    total: composer.total,
  };

  // Padding inferior del <main> (sm:p-6).
  const fillRef = useFillViewport<HTMLDivElement>(24);

  return (
    <div className="flex flex-col gap-4">
      {/* Alto de la ventana desde donde empieza (medido): el pie de la
          venta queda siempre visible aunque el título de la página se
          envuelva. Los KPIs viven sobre los productos para no robarle alto
          a la venta actual. */}
      <div
        ref={fillRef}
        className="flex min-h-[560px] flex-col gap-4 lg:h-[var(--fill-height)] lg:flex-row"
      >
        <div className="flex min-h-[560px] min-w-0 flex-1 flex-col gap-3 rounded-card-lg border border-white/80 bg-white/40 p-4 backdrop-blur-xl lg:min-h-0">
          {summary && (
            <div className="shrink-0">
              <ShiftKpiStrip summary={summary} pendingTotal={pendingTotal} />
            </div>
          )}
          <ProductCatalog ref={searchRef} composer={composer} />
        </div>

        {session ? (
          <SaleCart
            composer={composer}
            onTypeChange={onTypeChange}
            onCharge={openCheckout}
            onHold={hold}
            canChargeNow={canChargeNow}
            isHolding={createOrder.isPending && !checkoutOpen}
            showErrors={submitted}
          />
        ) : (
          <aside className="flex flex-col items-center justify-center gap-3 rounded-card-lg border border-white/80 bg-white/60 p-8 text-center backdrop-blur-xl lg:w-80 lg:shrink-0 xl:w-96 2xl:w-105">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Lock className="h-6 w-6 text-slate-500" />
            </span>
            <p className="font-semibold text-slate-900">{t("closed.title")}</p>
            <p className="text-sm text-slate-500">{t("closed.hint")}</p>
            {onOpenRegister && (
              <Button onClick={onOpenRegister}>
                {t("closed.openRegister")}
              </Button>
            )}
          </aside>
        )}
      </div>

      <CheckoutDrawer
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        businessId={businessId}
        businessName={businessName}
        label={`${typeLabel} · ${tOrder("productsCount", { count: itemCount })}`}
        sale={sale}
        paymentMethods={composer.paymentMethods}
        session={session}
        canUseCash={canOperate}
        onCharge={charge}
        onDone={newSale}
        formatDate={formatDate}
      />
    </div>
  );
}
