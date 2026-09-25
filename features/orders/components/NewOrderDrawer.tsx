"use client";

/**
 * NewOrderDrawer — "Nuevo pedido" desde la pantalla de pedidos.
 *
 * El operador arma el pedido con las mismas opciones que el bot de WhatsApp:
 * productos (listados acá mismo, con buscador y filtro por categoría), tipo
 * de pedido (domicilio / recoger / mesa) y método de pago, más los datos del
 * cliente que pide cada modalidad. El backend lo deja confirmado en la
 * columna "Nueva" y atribuido al operador que lo creó.
 *
 * Las opciones dependen de la sede (misma regla que el bot):
 * - Mesa: solo si `dineInConfig.enabled && allowOperators`
 * - Transferencia: solo si la sede tiene `transferOptions` configuradas
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  Minus,
  Plus,
  Truck,
  Store,
  Utensils,
  Phone,
  User,
  MapPin,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PhoneInput, PHONE_REGEX } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { useEffectiveBranches } from "@/features/branches/hooks";
import { useBranch } from "@/features/branches/hooks/useBranches";
import { useBranchStore } from "@/stores/branch.store";
import { useTables } from "@/features/tables/hooks";
import type { InventoryItem } from "@/features/branch-inventory/types";
import { useCreateOrder } from "../hooks";
import { useOrderableProducts } from "../hooks/useOrderableProducts";
import { formatCurrency } from "../utils/order-status.utils";
import type {
  ManualOrderDeliveryType,
  ManualOrderPaymentMethod,
} from "../types";

interface NewOrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CartLine {
  variantId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

/** Mismo tope por línea que el carrito de WhatsApp. */
const MAX_QUANTITY = 99;

const DELIVERY_TYPE_ICONS: Record<ManualOrderDeliveryType, LucideIcon> = {
  DELIVERY: Truck,
  PICKUP: Store,
  DINE_IN: Utensils,
};

function productLabel(item: InventoryItem): string {
  return item.variantLabel && item.variantLabel !== item.productName
    ? `${item.productName} · ${item.variantLabel}`
    : item.productName;
}

export function NewOrderDrawer({ isOpen, onClose }: NewOrderDrawerProps) {
  const t = useTranslations("orders.createOrder");
  const tStatus = useTranslations("orders.status");
  const tDelivery = useTranslations("orders.deliveryTypes");
  const tPayment = useTranslations("orders.paymentMethods");

  const user = useCurrentUser();
  const businessId = useEffectiveBusinessId();
  const { branches, defaultBranchId } = useEffectiveBranches();
  const selectedBranchIds = useBranchStore((state) => state.selectedBranchIds);

  // Sede inicial: la única filtrada en el tablero, o la default del usuario.
  const initialBranchId =
    (selectedBranchIds?.length === 1 ? selectedBranchIds[0] : null) ??
    defaultBranchId ??
    branches[0]?.id ??
    null;

  // Selección explícita del operador; mientras no elija, la sede inicial
  // (que puede resolverse después de montar, cuando cargan las sedes).
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const branchId = selectedBranchId ?? initialBranchId;
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [selectedDeliveryType, setDeliveryType] = useState<ManualOrderDeliveryType>("DELIVERY");
  const [selectedPaymentMethod, setPaymentMethod] = useState<ManualOrderPaymentMethod | null>(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [addressText, setAddressText] = useState("");
  const [tableId, setTableId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: branch } = useBranch(branchId, isOpen);
  const { data: products = [], isLoading: isLoadingProducts } = useOrderableProducts(
    businessId,
    branchId,
    isOpen
  );

  const dineInAllowed = !!branch?.dineInConfig?.enabled && !!branch.dineInConfig.allowOperators;
  const { data: tables = [] } = useTables(
    isOpen && dineInAllowed ? businessId : null,
    branchId
  );
  const activeTables = useMemo(() => tables.filter((table) => table.isActive), [tables]);

  const deliveryTypes: ManualOrderDeliveryType[] = dineInAllowed
    ? ["DELIVERY", "PICKUP", "DINE_IN"]
    : ["DELIVERY", "PICKUP"];

  const hasTransfer =
    !!branch?.transferOptions?.enabled && (branch.transferOptions.options?.length ?? 0) > 0;
  const paymentMethods: ManualOrderPaymentMethod[] = hasTransfer
    ? ["CASH", "TRANSFER", "DATAPHONE"]
    : ["CASH", "DATAPHONE"];

  // Si la sede cambia y la opción elegida ya no está disponible, se ignora.
  const deliveryType = deliveryTypes.includes(selectedDeliveryType)
    ? selectedDeliveryType
    : "DELIVERY";
  const paymentMethod =
    selectedPaymentMethod && paymentMethods.includes(selectedPaymentMethod)
      ? selectedPaymentMethod
      : null;

  // Categorías que tienen al menos un producto disponible en la sede.
  const categories = useMemo(() => {
    const byId = new Map<string, string>();
    for (const item of products) {
      if (item.categoryId && item.categoryName) byId.set(item.categoryId, item.categoryName);
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter(
      (item) =>
        (!categoryId || item.categoryId === categoryId) &&
        (!query || productLabel(item).toLowerCase().includes(query))
    );
  }, [products, search, categoryId]);

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

  const setQuantity = (item: InventoryItem, quantity: number) => {
    setCart((prev) => {
      const next = { ...prev };
      const max = Math.min(MAX_QUANTITY, item.stock ?? MAX_QUANTITY);
      const clamped = Math.min(Math.max(quantity, 0), max);
      if (clamped === 0) {
        delete next[item.productVariantId];
      } else {
        next[item.productVariantId] = {
          variantId: item.productVariantId,
          name: productLabel(item),
          unitPrice: item.effectivePrice,
          quantity: clamped,
        };
      }
      return next;
    });
  };

  const handleBranchChange = (id: string) => {
    // Precios, disponibilidad y mesas son por sede: el carrito no se arrastra.
    setSelectedBranchId(id);
    setCart({});
    setTableId(null);
    setCategoryId(null);
  };

  const needsCustomer = deliveryType !== "DINE_IN";
  const errors = {
    items: cartLines.length === 0 ? t("validation.items") : undefined,
    paymentMethod: !paymentMethod ? t("validation.paymentMethod") : undefined,
    customerPhone:
      needsCustomer && !PHONE_REGEX.test(customerPhone) ? t("validation.phone") : undefined,
    customerName: needsCustomer && !customerName.trim() ? t("validation.name") : undefined,
    addressText:
      deliveryType === "DELIVERY" && !addressText.trim() ? t("validation.address") : undefined,
    tableId: deliveryType === "DINE_IN" && !tableId ? t("validation.table") : undefined,
  };
  const isValid = !!branchId && Object.values(errors).every((error) => !error);
  const showError = (error: string | undefined) => (submitted ? error : undefined);

  const createOrder = useCreateOrder(businessId ?? undefined);

  const resetForm = () => {
    setSearch("");
    setCategoryId(null);
    setCart({});
    setDeliveryType("DELIVERY");
    setPaymentMethod(null);
    setCustomerPhone("");
    setCustomerName("");
    setAddressText("");
    setTableId(null);
    setNotes("");
    setSubmitted(false);
  };

  const handleClose = () => {
    if (createOrder.isPending) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!isValid || !branchId || !paymentMethod) return;
    try {
      await createOrder.mutateAsync({
        branchId,
        deliveryType,
        paymentMethod,
        items: cartLines.map((line) => ({
          productVariantId: line.variantId,
          quantity: line.quantity,
        })),
        ...(needsCustomer && {
          customerName: customerName.trim(),
          customerPhone,
        }),
        ...(deliveryType === "DELIVERY" && { addressText: addressText.trim() }),
        ...(deliveryType === "DINE_IN" && tableId && { tableId }),
        ...(notes.trim() && { notes: notes.trim() }),
      });
      resetForm();
      onClose();
    } catch {
      // El toast de error lo muestra useCreateOrder; el formulario queda
      // intacto para que el operador corrija y reintente.
    }
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      isLoading={createOrder.isPending}
    >
      <DrawerContent size="2xl" className="sm:max-w-6xl">
        <DrawerHeader>
          <DrawerTitle>{t("title")}</DrawerTitle>
          <DrawerDescription>
            {t.rich("subtitle", {
              status: tStatus("CONFIRMED"),
              name: user?.name ?? "",
              strong: (chunks) => (
                <span className="font-semibold text-indigo-600">{chunks}</span>
              ),
            })}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
          {/* Productos */}
          <section className="flex flex-col min-h-0 md:flex-1 p-4 sm:p-6 gap-4 md:border-r border-slate-100">
            {branches.length > 1 && (
              <div className="space-y-2">
                <Label>{t("branch")}</Label>
                <Select value={branchId ?? undefined} onValueChange={handleBranchChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("branchPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-9"
                aria-label={t("searchPlaceholder")}
              />
            </div>

            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin shrink-0">
                <CategoryChip
                  label={t("allCategories")}
                  active={!categoryId}
                  onClick={() => setCategoryId(null)}
                />
                {categories.map((category) => (
                  <CategoryChip
                    key={category.id}
                    label={category.name}
                    active={categoryId === category.id}
                    onClick={() => setCategoryId(category.id)}
                  />
                ))}
              </div>
            )}

            <div className="md:flex-1 md:min-h-0 md:overflow-y-auto scrollbar-thin space-y-2 pr-1">
              {isLoadingProducts ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-card" />
                ))
              ) : visibleProducts.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-10">
                  {products.length === 0 ? t("noProducts") : t("noResults")}
                </p>
              ) : (
                visibleProducts.map((item) => (
                  <ProductRow
                    key={item.productVariantId}
                    item={item}
                    quantity={cart[item.productVariantId]?.quantity ?? 0}
                    onChange={(quantity) => setQuantity(item, quantity)}
                    addLabel={t("add")}
                    removeLabel={t("remove")}
                  />
                ))
              )}
            </div>
            {showError(errors.items) && (
              <p className="text-xs text-red-600">{errors.items}</p>
            )}
          </section>

          {/* Datos del pedido */}
          <aside className="flex flex-col min-h-0 md:w-105 md:shrink-0 bg-slate-50/60">
            <div className="md:flex-1 md:min-h-0 md:overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-6">
              <FieldGroup label={t("orderType")}>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-card bg-slate-100">
                  {deliveryTypes.map((type) => {
                    const Icon = DELIVERY_TYPE_ICONS[type];
                    const active = deliveryType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDeliveryType(type)}
                        aria-pressed={active}
                        className={cn(
                          "flex flex-col items-center gap-1 py-3 rounded-lg text-sm font-medium transition-colors",
                          active
                            ? "bg-white text-indigo-600 shadow-card-sm"
                            : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {tDelivery(type)}
                      </button>
                    );
                  })}
                </div>
              </FieldGroup>

              {needsCustomer && (
                <>
                  <FieldGroup label={t("customerPhone")} icon={Phone}>
                    <PhoneInput
                      id="new-order-phone"
                      value={customerPhone}
                      onChange={setCustomerPhone}
                      error={showError(errors.customerPhone)}
                    />
                  </FieldGroup>
                  <FieldGroup label={t("customerName")} icon={User}>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={t("customerNamePlaceholder")}
                      maxLength={100}
                      error={showError(errors.customerName)}
                    />
                  </FieldGroup>
                </>
              )}

              {deliveryType === "DELIVERY" && (
                <FieldGroup label={t("address")} icon={MapPin}>
                  <Input
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    placeholder={t("addressPlaceholder")}
                    maxLength={300}
                    error={showError(errors.addressText)}
                  />
                </FieldGroup>
              )}

              {deliveryType === "DINE_IN" && (
                <FieldGroup label={t("table")} icon={Utensils}>
                  <Select value={tableId ?? undefined} onValueChange={setTableId}>
                    <SelectTrigger aria-invalid={!!showError(errors.tableId)}>
                      <SelectValue placeholder={t("tablePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTables.map((table) => (
                        <SelectItem key={table.id} value={table.id}>
                          {table.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {activeTables.length === 0 && (
                    <p className="text-xs text-slate-500">{t("noTables")}</p>
                  )}
                  {showError(errors.tableId) && (
                    <p className="text-xs text-red-600">{errors.tableId}</p>
                  )}
                </FieldGroup>
              )}

              <FieldGroup label={t("paymentMethod")}>
                <div className="flex flex-wrap gap-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      aria-pressed={paymentMethod === method}
                      className={cn(
                        "px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors",
                        paymentMethod === method
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      )}
                    >
                      {tPayment(method)}
                    </button>
                  ))}
                </div>
                {showError(errors.paymentMethod) && (
                  <p className="text-xs text-red-600">{errors.paymentMethod}</p>
                )}
              </FieldGroup>

              <FieldGroup label={t("notes")}>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("notesPlaceholder")}
                  maxLength={500}
                />
              </FieldGroup>

              {/* Resumen */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {t("summary")}
                  </h4>
                  <span className="text-xs text-slate-400">
                    {t("productsCount", { count: itemCount })}
                  </span>
                </div>
                <div className="rounded-card border border-slate-100 bg-white shadow-card p-4 space-y-2 text-sm">
                  {cartLines.length === 0 ? (
                    <p className="text-slate-400">{t("emptySummary")}</p>
                  ) : (
                    cartLines.map((line) => (
                      <div key={line.variantId} className="flex items-baseline gap-3">
                        <span className="text-slate-400 w-8 shrink-0">{line.quantity}x</span>
                        <span className="flex-1 text-slate-700 truncate">{line.name}</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(line.unitPrice * line.quantity)}
                        </span>
                      </div>
                    ))
                  )}
                  <div className="border-t border-slate-100 pt-2 mt-2 space-y-1 text-slate-500">
                    <div className="flex justify-between">
                      <span>{t("subtotal")}</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {deliveryType === "DELIVERY" && (
                      <div className="flex justify-between">
                        <span>{t("deliveryFee")}</span>
                        <span>
                          {deliveryFee === null
                            ? t("deliveryFeeByDistance")
                            : formatCurrency(deliveryFee)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 p-4 sm:p-6 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={createOrder.isPending || (submitted && !isValid)}
                className={cn(
                  "w-full flex items-center justify-between px-5 py-4 rounded-card text-white font-semibold transition-colors",
                  "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                )}
              >
                <span className="flex items-center gap-2">
                  {createOrder.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("submit")}
                </span>
                <span>{formatCurrency(total)}</span>
              </button>
            </div>
          </aside>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
        active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      )}
    >
      {label}
    </button>
  );
}

function FieldGroup({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </h4>
      {children}
    </div>
  );
}

function ProductRow({
  item,
  quantity,
  onChange,
  addLabel,
  removeLabel,
}: {
  item: InventoryItem;
  quantity: number;
  onChange: (quantity: number) => void;
  addLabel: string;
  removeLabel: string;
}) {
  const name = productLabel(item);
  const maxReached = quantity >= Math.min(MAX_QUANTITY, item.stock ?? MAX_QUANTITY);

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-card transition-colors",
        quantity > 0 ? "bg-indigo-50/60" : "hover:bg-slate-50"
      )}
    >
      {item.productImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.productImage}
          alt=""
          className="w-12 h-12 rounded-icon object-cover shrink-0 bg-slate-100"
        />
      ) : (
        <div className="w-12 h-12 rounded-icon bg-slate-100 text-slate-400 font-semibold flex items-center justify-center shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
        <p className="text-xs text-slate-500 truncate">
          {[item.categoryName, formatCurrency(item.effectivePrice)].filter(Boolean).join(" · ")}
        </p>
      </div>
      {quantity > 0 ? (
        <div className="flex items-center rounded-icon bg-indigo-600 text-white shrink-0">
          <button
            type="button"
            onClick={() => onChange(quantity - 1)}
            aria-label={`${removeLabel} ${name}`}
            className="w-9 h-9 flex items-center justify-center hover:bg-indigo-700 rounded-l-icon"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-7 text-center text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => onChange(quantity + 1)}
            disabled={maxReached}
            aria-label={`${addLabel} ${name}`}
            className="w-9 h-9 flex items-center justify-center hover:bg-indigo-700 rounded-r-icon disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onChange(1)}
          aria-label={`${addLabel} ${name}`}
          className="w-9 h-9 rounded-icon bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
