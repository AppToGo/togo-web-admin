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

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  ChevronLeft,
  Truck,
  Store,
  Utensils,
  Banknote,
  HandCoins,
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
import { PhoneInput } from "@/components/ui/phone-input";
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
import { useBranchStore } from "@/stores/branch.store";
import { useCreateOrder } from "../hooks";
import { useOrderComposer } from "../hooks/useOrderComposer";
import { formatCurrency } from "../utils/order-status.utils";
import { ProductRow } from "./ProductRow";
import { useOpenSessions } from "@/features/cash/hooks/useCash";
import { CurrencyInput } from "@/features/cash/components/CurrencyInput";
import { quickCashAmounts } from "@/features/cash/utils/cash.utils";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { TipSelector } from "./TipSelector";
import { tipAmount, toTipRequest, type TipChoice } from "../utils/tip.utils";
import type {
  ManualOrderDeliveryType,
  ManualOrderPaymentMethod,
} from "../types";

interface NewOrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Sede preseleccionada (la página de Caja abre el drawer ya ubicado en
   * su sede). El operador puede cambiarla con el selector interno.
   */
  presetBranchId?: string | null;
  /** Tipo preseleccionado (Caja abre en Mostrador cuando aplica). */
  presetDeliveryType?: ManualOrderDeliveryType;
}

const DELIVERY_TYPE_ICONS: Record<ManualOrderDeliveryType, LucideIcon> = {
  DELIVERY: Truck,
  PICKUP: Store,
  DINE_IN: Utensils,
  COUNTER: Banknote,
};

/**
 * 409 `COUNTER_SALE_PAYMENT_PENDING`: la venta de mostrador se creó pero el
 * cobro en caja falló. No es un error para reintentar.
 */
function isCounterSalePaymentPending(err: unknown): boolean {
  const data = (err as { response?: { data?: { code?: unknown } } } | null)?.response?.data;
  return data?.code === "COUNTER_SALE_PAYMENT_PENDING";
}

export function NewOrderDrawer({
  isOpen,
  onClose,
  presetBranchId: presetBranchIdProp,
  presetDeliveryType,
}: NewOrderDrawerProps) {
  const t = useTranslations("orders.createOrder");
  const tStatus = useTranslations("orders.status");
  const tDelivery = useTranslations("orders.deliveryTypes");
  const tPayment = useTranslations("orders.paymentMethods");
  const tCash = useTranslations("cash");
  const tTip = useTranslations("orders.tip");

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
  // `presetBranchId` (p. ej. desde Caja) arranca como selección explícita.
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(
    presetBranchIdProp ?? null
  );
  const branchId = selectedBranchId ?? initialBranchId;
  const [selectedPaymentMethod, setPaymentMethod] = useState<ManualOrderPaymentMethod | null>(null);
  // Mostrador + efectivo: turno donde entra el dinero y recibido del cliente.
  const [pickedCashSessionId, setCashSessionId] = useState<string | null>(null);
  const [cashReceived, setCashReceived] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  // Teléfono (< md): primero los productos a pantalla completa y después
  // los datos del pedido, como la venta de Caja. En md+ van lado a lado.
  const [mobileStep, setMobileStep] = useState<"products" | "details">("products");

  const composer = useOrderComposer({
    businessId,
    branchId,
    enabled: isOpen,
    initialDeliveryType: presetDeliveryType ?? "DELIVERY",
  });
  const {
    products,
    isLoadingProducts,
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
    total: itemsTotal,
    tipConfig,
    setQuantity,
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
    setLineNote,
  } = composer;

  const paymentMethod =
    selectedPaymentMethod && paymentMethods.includes(selectedPaymentMethod)
      ? selectedPaymentMethod
      : null;

  const handleBranchChange = (id: string) => {
    setSelectedBranchId(id);
    composer.resetForBranch();
    // El turno es de la sede anterior: mandarlo con la nueva lo rechaza el
    // servidor después de crear el pedido.
    setCashSessionId(null);
    setCashReceived(0);
  };

  // Propina: solo mostrador se cobra al crear desde acá; la mesa la elige
  // al cobrar en Caja.
  const counterTipConfig = deliveryType === "COUNTER" ? tipConfig : null;
  const [pickedTip, setTip] = useState<TipChoice | null>(null);
  const tipChoice: TipChoice | null = counterTipConfig
    ? (pickedTip ?? { percent: counterTipConfig.suggestedPercent })
    : null;
  const tip = tipChoice ? tipAmount(tipChoice, subtotal) : 0;
  const total = itemsTotal + tip;

  const isCounterCash = deliveryType === "COUNTER" && paymentMethod === "CASH";
  // Ver los turnos exige `cash.view`: sin él no se piden (403 con reintentos).
  const { hasPermission } = useMyPermissions();
  const canSeeCash = hasPermission("cash.view");
  const { data: fetchedSessions = [] } = useOpenSessions(
    isOpen && isCounterCash && canSeeCash ? businessId : null,
    isOpen && isCounterCash && canSeeCash ? branchId : null
  );
  const openSessions = canSeeCash ? fetchedSessions : [];
  // Solo vale un turno que siga abierto en esta sede.
  const cashSessionId =
    pickedCashSessionId && openSessions.some((session) => session.id === pickedCashSessionId)
      ? pickedCashSessionId
      : // Con un solo turno abierto no hay nada que elegir.
        openSessions.length === 1
        ? openSessions[0].id
        : null;
  const errors = {
    ...composer.errors,
    paymentMethod: !paymentMethod ? t("validation.paymentMethod") : undefined,
    cashSession: isCounterCash && !cashSessionId ? t("validation.cashSession") : undefined,
    // Vacío = pago exacto. Si se escribe, tiene que cubrir el total: con
    // menos el servidor rechaza el cobro cuando el pedido ya está creado.
    cashReceived:
      isCounterCash && cashReceived > 0 && cashReceived < total
        ? t("validation.cashReceived")
        : undefined,
  };
  const isValid = !!branchId && Object.values(errors).every((error) => !error);
  const showError = (error: string | undefined) => (submitted ? error : undefined);

  const createOrder = useCreateOrder(businessId ?? undefined);

  const resetForm = () => {
    composer.clear();
    setSelectedBranchId(presetBranchIdProp ?? null);
    setDeliveryType(presetDeliveryType ?? "DELIVERY");
    setPaymentMethod(null);
    setCashSessionId(null);
    setCashReceived(0);
    setTip(null);
    setSubmitted(false);
    setMobileStep("products");
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
      await createOrder.mutateAsync(
        composer.buildRequest(paymentMethod, {
          // Mostrador en efectivo: el turno es obligatorio (validado arriba);
          // sin recibido se asume pago exacto y el servidor calcula las vueltas.
          ...(isCounterCash &&
            cashSessionId && {
              cash: {
                sessionId: cashSessionId,
                ...(cashReceived > 0 && { receivedAmount: cashReceived }),
              },
            }),
          ...(tipChoice && { tip: toTipRequest(tipChoice) }),
        })
      );
      resetForm();
      onClose();
    } catch (err) {
      // El toast de error lo muestra useCreateOrder; el formulario queda
      // intacto para que el operador corrija y reintente.
      if (isCounterSalePaymentPending(err)) {
        // Excepción: el pedido SÍ quedó creado, solo falló el cobro. Se
        // cierra el formulario para que no lo vuelvan a crear; el toast ya
        // dice el número y que se cobra desde el tablero.
        resetForm();
        onClose();
      }
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

        <div className="flex-1 min-h-0 flex flex-col md:flex-row md:overflow-hidden">
          {/* Productos */}
          <section
            className={cn(
              "flex-1 flex-col min-h-0 p-4 sm:p-6 gap-4 md:border-r border-slate-100",
              mobileStep === "products" ? "flex" : "hidden md:flex"
            )}
          >
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

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin space-y-2 pr-1">
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

            {/* Teléfono: pasa a los datos del pedido. */}
            <button
              type="button"
              onClick={() => setMobileStep("details")}
              disabled={itemCount === 0}
              className="md:hidden shrink-0 h-14 flex items-center justify-between gap-3 px-5 rounded-card bg-indigo-600 text-white font-semibold disabled:bg-indigo-300"
              data-testid="new-order-continue"
            >
              <span className="flex items-center gap-2.5">
                <span className="h-6 min-w-6 px-1.5 rounded-full bg-white text-indigo-700 text-xs font-bold flex items-center justify-center tabular-nums">
                  {itemCount}
                </span>
                {t("mobileContinue")}
              </span>
              <span className="tabular-nums">{formatCurrency(total)}</span>
            </button>
          </section>

          {/* Datos del pedido */}
          <aside
            className={cn(
              "flex-1 md:flex-none flex-col min-h-0 md:w-105 md:shrink-0 bg-slate-50/60",
              mobileStep === "details" ? "flex" : "hidden md:flex"
            )}
          >
            {/* Teléfono: volver a los productos. */}
            <button
              type="button"
              onClick={() => setMobileStep("products")}
              className="md:hidden shrink-0 flex items-center gap-1.5 px-4 pt-3 text-sm font-semibold text-indigo-600"
            >
              <ChevronLeft className="w-4 h-4" />
              {t("mobileBack", { count: itemCount })}
            </button>
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-6">
              <FieldGroup label={t("orderType")}>
                <div
                  className={cn(
                    "grid gap-1 p-1 rounded-card bg-slate-100",
                    deliveryTypes.length > 3 ? "grid-cols-4" : "grid-cols-3"
                  )}
                >
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

              {counterTipConfig && tipChoice && (
                <FieldGroup label={tTip("label")} icon={HandCoins}>
                  <TipSelector
                    id="new-order-tip"
                    config={counterTipConfig}
                    subtotal={subtotal}
                    value={tipChoice}
                    onChange={setTip}
                    hideLabel
                  />
                </FieldGroup>
              )}

              {isCounterCash && (
                <FieldGroup label={t("cashSection")} icon={Banknote}>
                  {!canSeeCash ? (
                    <p className="text-xs text-amber-700">{t("noCashPermission")}</p>
                  ) : openSessions.length === 0 ? (
                    <p className="text-xs text-amber-700">{t("noOpenSession")}</p>
                  ) : (
                    <div className="rounded-card border border-slate-100 bg-white shadow-card p-4 space-y-3">
                      <Label htmlFor="new-order-cash-received">{tCash("charge.payWith")}</Label>
                      <CurrencyInput
                        id="new-order-cash-received"
                        size="lg"
                        // Vacío = pago exacto: el total va de placeholder para
                        // que el campo se pueda borrar y reescribir.
                        value={cashReceived}
                        onChange={setCashReceived}
                        placeholder={formatCurrency(total)}
                      />
                      <div className="grid grid-cols-4 gap-1.5">
                        {quickCashAmounts(total).map((value, index) => {
                          const active = (cashReceived > 0 ? cashReceived : total) === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setCashReceived(value)}
                              className={cn(
                                "h-10 rounded-lg border text-xs font-semibold tabular-nums transition-colors",
                                active
                                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                              )}
                            >
                              {index === 0 ? tCash("charge.exact") : formatCurrency(value)}
                            </button>
                          );
                        })}
                      </div>
                      {showError(errors.cashReceived) && (
                        <p className="text-xs text-red-600">{errors.cashReceived}</p>
                      )}
                      <div
                        className={cn(
                          "flex items-baseline justify-between rounded-icon p-3",
                          cashReceived > 0 && cashReceived < total
                            ? "bg-red-100 text-red-800"
                            : "bg-emerald-100 text-emerald-800"
                        )}
                      >
                        <span className="text-sm font-semibold">
                          {cashReceived > 0 && cashReceived < total
                            ? tCash("charge.missing")
                            : tCash("charge.change")}
                        </span>
                        <span className="text-xl font-bold tabular-nums">
                          {formatCurrency(
                            cashReceived > 0 ? Math.abs(cashReceived - total) : 0
                          )}
                        </span>
                      </div>
                      {openSessions.length > 1 ? (
                        <Select
                          value={cashSessionId ?? undefined}
                          onValueChange={setCashSessionId}
                        >
                          <SelectTrigger aria-invalid={!!showError(errors.cashSession)}>
                            <SelectValue placeholder={t("cashSessionPlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            {openSessions.map((session) => (
                              <SelectItem key={session.id} value={session.id}>
                                {t("cashSessionOption", {
                                  register:
                                    session.register?.name ?? session.cashRegisterId,
                                })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
                          {tCash("charge.toRegister", {
                            register: openSessions[0]?.register?.name ?? "",
                          })}
                        </p>
                      )}
                      {showError(errors.cashSession) && (
                        <p className="text-xs text-red-600">{errors.cashSession}</p>
                      )}
                    </div>
                  )}
                </FieldGroup>
              )}

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
                      <div key={line.variantId} className="py-0.5">
                        <div className="flex items-baseline gap-3">
                          <span className="text-slate-400 w-8 shrink-0">{line.quantity}x</span>
                          <span className="flex-1 text-slate-700 truncate">{line.name}</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(line.unitPrice * line.quantity)}
                          </span>
                        </div>
                        <Input
                          className="mt-1"
                          value={line.notes ?? ""}
                          onChange={(e) => setLineNote(line.variantId, e.target.value)}
                          placeholder={t("itemNotesPlaceholder")}
                          aria-label={t("itemNotes")}
                          maxLength={200}
                        />
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
                    {tip > 0 && (
                      <div className="flex justify-between">
                        <span>{tTip("label")}</span>
                        <span>{formatCurrency(tip)}</span>
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
                  {deliveryType === "COUNTER" ? t("submitCounter") : t("submit")}
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

