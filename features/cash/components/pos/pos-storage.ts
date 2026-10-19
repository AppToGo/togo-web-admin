/**
 * Preferencias del cajero en el navegador (docs/caja-pos.md): el último
 * tipo de pedido por sede, la vista de productos y la venta en curso.
 * Son comodidades: si el almacenamiento no está disponible (modo privado,
 * datos bloqueados) la caja funciona igual con los valores por defecto.
 */
import type { ManualOrderDeliveryType } from "@/features/orders/types";
import type { OrderCart } from "@/features/orders/hooks/useOrderComposer";

export type ProductView = "list" | "grid";

const LAST_TYPE_KEY = (branchId: string) =>
  `togo.cash.pos.lastType.${branchId}`;
const VIEW_KEY = "togo.cash.pos.view";
const CART_KEY = (branchId: string) => `togo.cash.pos.cart.${branchId}`;

const DELIVERY_TYPES: ManualOrderDeliveryType[] = [
  "COUNTER",
  "PICKUP",
  "DINE_IN",
  "DELIVERY",
];

function read(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function write(
  storage: () => Storage,
  key: string,
  value: string | null
): void {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, value);
  } catch {
    // Sin almacenamiento: la preferencia no se recuerda.
  }
}

const local = () => window.localStorage;
const session = () => window.sessionStorage;

export function readLastDeliveryType(
  branchId: string
): ManualOrderDeliveryType | null {
  const value = read(local, LAST_TYPE_KEY(branchId));
  return DELIVERY_TYPES.find((type) => type === value) ?? null;
}

export function saveLastDeliveryType(
  branchId: string,
  type: ManualOrderDeliveryType
): void {
  write(local, LAST_TYPE_KEY(branchId), type);
}

export function readProductView(): ProductView | null {
  const value = read(local, VIEW_KEY);
  return value === "list" || value === "grid" ? value : null;
}

export function saveProductView(view: ProductView): void {
  write(local, VIEW_KEY, view);
}

function isCartLine(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.variantId === "string" &&
    typeof line.name === "string" &&
    typeof line.unitPrice === "number" &&
    Number.isFinite(line.unitPrice) &&
    typeof line.quantity === "number" &&
    Number.isFinite(line.quantity) &&
    (line.notes === undefined || typeof line.notes === "string")
  );
}

/** La venta en curso sobrevive a una recarga de la pestaña. */
export function readSavedCart(branchId: string): OrderCart | undefined {
  const raw = read(session, CART_KEY(branchId));
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }
    const entries = Object.entries(parsed as Record<string, unknown>);
    if (entries.some(([key, line]) => typeof key !== "string" || !isCartLine(line))) {
      return undefined;
    }
    return parsed as OrderCart;
  } catch {
    return undefined;
  }
}

export function saveCart(branchId: string, cart: OrderCart): void {
  write(
    session,
    CART_KEY(branchId),
    Object.keys(cart).length > 0 ? JSON.stringify(cart) : null
  );
}
