"use client";

/**
 * useOrderComposer — armar un pedido manual: productos de la sede, carrito,
 * tipo de pedido, mesa o datos del cliente, totales y validación.
 *
 * Lo comparten el drawer de Nuevo pedido y Caja · Vender
 * (docs/caja-pos.md), para que las dos pantallas no diverjan. El método de
 * pago y el cobro quedan fuera: cada pantalla los resuelve a su manera y
 * los pasa a `buildRequest`.
 *
 * Las opciones dependen de la sede (misma regla que el bot):
 * - Mesa: solo si `dineInConfig.enabled && allowOperators`
 * - Mostrador: solo si la sede lo tiene habilitado
 * - Transferencia: solo si la sede tiene `transferOptions` configuradas
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PHONE_REGEX } from "@/components/ui/phone-input";
import { useBranch } from "@/features/branches/hooks/useBranches";
import {
  isCounterEnabled,
  resolveTipConfig,
} from "@/features/branches/types/branch-config.types";
import { isTippable } from "../utils/tip.utils";
import { useTables } from "@/features/tables/hooks";
import type { InventoryItem } from "@/features/branch-inventory/types";
import { useOrderableProducts } from "./useOrderableProducts";
import { maxQuantity, productLabel } from "../components/ProductRow";
import type {
  CreateOrderRequest,
  ManualOrderDeliveryType,
  ManualOrderPaymentMethod,
} from "../types";
import { useBusinessFeatures } from "@/features/business-features";

export interface CartLine {
  variantId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  /** Tope de la línea (carrito o stock). */
  max: number;
  image: string | null;
  /** Nota de cocina de la línea (ej. "sin cebolla"). */
  notes?: string;
}

export type OrderCart = Record<string, CartLine>;

interface UseOrderComposerOptions {
  businessId: string | null;
  branchId: string | null;
  enabled: boolean;
  /** Tipo con el que arranca (si la sede no lo ofrece, se usa `fallbackDeliveryType`). */
  initialDeliveryType: ManualOrderDeliveryType;
  /** Tipo cuando el elegido no está disponible en la sede. */
  fallbackDeliveryType?: ManualOrderDeliveryType;
  /** Carrito con el que arranca (p. ej. la venta guardada de Caja). */
  initialCart?: OrderCart;
}

export function useOrderComposer({
  businessId,
  branchId,
  enabled,
  initialDeliveryType,
  fallbackDeliveryType = "DELIVERY",
  initialCart,
}: UseOrderComposerOptions) {
  const t = useTranslations("orders.createOrder");

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<OrderCart>(() => initialCart ?? {});
  const [selectedDeliveryType, setDeliveryType] =
    useState<ManualOrderDeliveryType>(initialDeliveryType);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [addressText, setAddressText] = useState("");
  const [tableId, setTableId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const { data: branch } = useBranch(branchId, enabled);
  const { data: products = [], isLoading: isLoadingProducts } = useOrderableProducts(
    businessId,
    branchId,
    enabled
  );

  // Además de la sede, el negocio debe tener activa la funcionalidad
  const { isEnabled: isFeatureEnabled } = useBusinessFeatures();
  const dineInAllowed =
    isFeatureEnabled("DINE_IN_QR") &&
    !!branch?.dineInConfig?.enabled &&
    !!branch.dineInConfig.allowOperators;
  // Mostrador (docs/caja-pedidos.md): solo si la sede lo tiene habilitado.
  const counterAllowed =
    isFeatureEnabled("COUNTER_SALE") && isCounterEnabled(branch?.counterConfig);
  const { data: tables = [] } = useTables(enabled && dineInAllowed ? businessId : null, branchId);
  const activeTables = useMemo(() => tables.filter((table) => table.isActive), [tables]);

  const deliveryTypes: ManualOrderDeliveryType[] = [
    "DELIVERY",
    "PICKUP",
    ...(dineInAllowed ? ["DINE_IN" as const] : []),
    ...(counterAllowed ? ["COUNTER" as const] : []),
  ];

  const hasTransfer =
    !!branch?.transferOptions?.enabled && (branch.transferOptions.options?.length ?? 0) > 0;
  const paymentMethods: ManualOrderPaymentMethod[] = hasTransfer
    ? ["CASH", "TRANSFER", "DATAPHONE"]
    : ["CASH", "DATAPHONE"];

  // Si la sede cambia y la opción elegida ya no está disponible, se ignora.
  const deliveryType = deliveryTypes.includes(selectedDeliveryType)
    ? selectedDeliveryType
    : deliveryTypes.includes(fallbackDeliveryType)
      ? fallbackDeliveryType
      : "DELIVERY";

  // Subcategorías del negocio con al menos un producto disponible en la
  // sede, ordenadas por el campo `order` (como el catálogo web). Sin orden
  // configurado van al final, por nombre.
  const categories = useMemo(() => {
    const byId = new Map<string, { name: string; order: number | null }>();
    for (const item of products) {
      if (item.categoryId && item.categoryName && !byId.has(item.categoryId)) {
        byId.set(item.categoryId, {
          name: item.categoryName,
          order: item.categoryOrder ?? null,
        });
      }
    }
    return [...byId.entries()]
      .map(([id, category]) => ({ id, ...category }))
      .sort(
        (a, b) =>
          (a.order ?? Number.MAX_SAFE_INTEGER) -
            (b.order ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name)
      );
  }, [products]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter(
      (item) =>
        (!categoryId || item.categoryId === categoryId) &&
        (!query ||
          productLabel(item).toLowerCase().includes(query) ||
          (item.internalSku ?? "").toLowerCase().includes(query))
    );
  }, [products, search, categoryId]);

  const hasProductImages = useMemo(
    () => products.some((item) => !!item.productImage),
    [products]
  );

  const cartLines = Object.values(cart);
  const itemCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cartLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  // Vista previa del domicilio: tarifa plana o gratis se conocen acá; por
  // distancia la calcula el backend al crear (necesita geocodificar).
  const deliveryConfig = branch?.deliveryConfig;
  const deliveryFee: number | null =
    deliveryType !== "DELIVERY"
      ? 0
      : deliveryConfig?.type === "FLAT"
        ? (deliveryConfig.flatFee ?? 0)
        : deliveryConfig?.type === "FREE" || !deliveryConfig
          ? 0
          : null;
  const total = subtotal + (deliveryFee ?? 0);
  // Propina: se elige al cobrar (mesa/mostrador con propina en la sede).
  const branchTipConfig = resolveTipConfig(branch?.tipConfig);
  const tipConfig =
    isFeatureEnabled("TIPS") && isTippable(deliveryType, branchTipConfig)
      ? branchTipConfig
      : null;

  const setQuantity = (item: InventoryItem, quantity: number) => {
    setCart((prev) => {
      const next = { ...prev };
      const max = maxQuantity(item);
      const clamped = Math.min(Math.max(quantity, 0), max);
      if (clamped === 0) {
        delete next[item.productVariantId];
      } else {
        const previousNotes = prev[item.productVariantId]?.notes;
        next[item.productVariantId] = {
          variantId: item.productVariantId,
          name: productLabel(item),
          unitPrice: item.effectivePrice,
          quantity: clamped,
          max,
          image: item.productImage ?? null,
          ...(previousNotes && { notes: previousNotes }),
        };
      }
      return next;
    });
  };

  /** Nota de cocina de una línea (se conserva al cambiar cantidad). */
  const setLineNote = (variantId: string, notes: string) => {
    setCart((prev) => {
      const line = prev[variantId];
      if (!line) return prev;
      const trimmed = notes.trim();
      const next = { ...prev };
      next[variantId] = trimmed ? { ...line, notes: trimmed } : { ...line, notes: undefined };
      return next;
    });
  };

  /** Cambia la cantidad de una línea ya en el carrito (0 la quita). */
  const setLineQuantity = (variantId: string, quantity: number) => {
    setCart((prev) => {
      const line = prev[variantId];
      if (!line) return prev;
      const next = { ...prev };
      const clamped = Math.min(Math.max(quantity, 0), line.max);
      if (clamped === 0) delete next[variantId];
      else next[variantId] = { ...line, quantity: clamped };
      return next;
    });
  };

  const needsCustomer = deliveryType !== "DINE_IN" && deliveryType !== "COUNTER";
  // Mostrador: el cliente es opcional (Caja lo pide para mandarle el recibo
  // por WhatsApp). Si se escribe un teléfono, tiene que ser válido.
  const optionalCustomer = deliveryType === "COUNTER" && customerPhone !== "";
  const errors = {
    items: cartLines.length === 0 ? t("validation.items") : undefined,
    customerPhone:
      (needsCustomer || optionalCustomer) && !PHONE_REGEX.test(customerPhone)
        ? t("validation.phone")
        : undefined,
    customerName: needsCustomer && !customerName.trim() ? t("validation.name") : undefined,
    addressText:
      deliveryType === "DELIVERY" && !addressText.trim() ? t("validation.address") : undefined,
    tableId: deliveryType === "DINE_IN" && !tableId ? t("validation.table") : undefined,
  };
  const isValid = !!branchId && Object.values(errors).every((error) => !error);

  /** Cuerpo de `POST …/orders/manual` con lo que armó el operador. */
  const buildRequest = (
    paymentMethod: ManualOrderPaymentMethod,
    extra?: Pick<CreateOrderRequest, "cash" | "payNow" | "tip">
  ): CreateOrderRequest => ({
    branchId: branchId!,
    deliveryType,
    paymentMethod,
    items: cartLines.map((line) => ({
      productVariantId: line.variantId,
      quantity: line.quantity,
      ...(line.notes?.trim() && { notes: line.notes.trim() }),
    })),
    ...(needsCustomer && {
      customerName: customerName.trim(),
      customerPhone,
    }),
    ...(optionalCustomer && {
      customerPhone,
      ...(customerName.trim() && { customerName: customerName.trim() }),
    }),
    ...(deliveryType === "DELIVERY" && { addressText: addressText.trim() }),
    ...(deliveryType === "DINE_IN" && tableId && { tableId }),
    ...(notes.trim() && { notes: notes.trim() }),
    ...extra,
  });

  /** Precios, disponibilidad y mesas son por sede: el carrito no se arrastra. */
  const resetForBranch = () => {
    setCart({});
    setTableId(null);
    setCategoryId(null);
  };

  /** Deja todo listo para la venta siguiente (conserva el tipo de pedido). */
  const clear = () => {
    setSearch("");
    setCategoryId(null);
    setCart({});
    setCustomerPhone("");
    setCustomerName("");
    setAddressText("");
    setTableId(null);
    setNotes("");
  };

  return {
    branch,
    products,
    isLoadingProducts,
    hasProductImages,
    categories,
    visibleProducts,
    search,
    setSearch,
    categoryId,
    setCategoryId,
    cart,
    cartLines,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    tipConfig,
    setQuantity,
    setLineQuantity,
    setLineNote,
    deliveryTypes,
    deliveryType,
    setDeliveryType,
    paymentMethods,
    activeTables,
    needsCustomer,
    customerPhone,
    setCustomerPhone,
    customerName,
    setCustomerName,
    addressText,
    setAddressText,
    tableId,
    setTableId,
    notes,
    setNotes,
    errors,
    isValid,
    buildRequest,
    resetForBranch,
    clear,
  };
}

export type OrderComposer = ReturnType<typeof useOrderComposer>;
