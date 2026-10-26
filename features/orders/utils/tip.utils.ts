/**
 * Propina voluntaria (mesa y mostrador). Misma fórmula que el backend
 * (`api-togo/src/order/utils/order-totals.ts`): el % se aplica sobre el
 * subtotal y se redondea a pesos enteros. El servidor recalcula siempre;
 * esto es solo para mostrar el total antes de cobrar.
 */
import type { TipConfig } from "@/features/branches/types";
import type { TipRequest } from "../types";

/** Propina elegida en pantalla: un % de los presets o un monto libre. */
export type TipChoice = { percent: number } | { amount: number };

export const NO_TIP_CHOICE: TipChoice = { percent: 0 };

const TIP_DELIVERY_TYPES = ["DINE_IN", "COUNTER"];

export function isTippable(
  deliveryType: string | null | undefined,
  config: TipConfig
): boolean {
  return config.enabled && !!deliveryType && TIP_DELIVERY_TYPES.includes(deliveryType);
}

export function tipAmount(choice: TipChoice, subtotal: number): number {
  return "percent" in choice
    ? Math.round((subtotal * choice.percent) / 100)
    : choice.amount;
}

export function toTipRequest(choice: TipChoice): TipRequest {
  return "percent" in choice ? { percent: choice.percent } : { amount: choice.amount };
}

/**
 * Propina con la que arranca el cobro: la que ya trae el pedido (la eligió
 * el comensal en el QR, incluido "Sin propina", que llega como
 * `tipPercent: 0`) o, si nunca se eligió, la sugerida de la sede.
 */
export function initialTipChoice(
  order: { tip?: number; tipPercent?: number | null },
  config: TipConfig
): TipChoice {
  if (order.tipPercent === 0) return NO_TIP_CHOICE;
  if (order.tip && order.tip > 0) {
    return order.tipPercent != null
      ? { percent: order.tipPercent }
      : { amount: order.tip };
  }
  return { percent: config.suggestedPercent };
}

/**
 * Desglose de un pedido del listado/detalle para el cobro con propina.
 * Solo se usa en mesa/mostrador, que no llevan domicilio: el `deliveryFee`
 * del listado viene de la config del negocio, no del pedido, así que no se
 * pasa.
 */
export function orderTipBreakdown(order: {
  subtotal: number;
  tip?: number;
  tipPercent?: number | null;
  deliveryType?: string | null;
}) {
  return {
    subtotal: order.subtotal,
    deliveryFee: 0,
    tip: order.tip ?? 0,
    tipPercent: order.tipPercent ?? null,
    deliveryType: order.deliveryType,
  };
}
