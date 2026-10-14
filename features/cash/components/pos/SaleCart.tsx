"use client";
/**
 * Venta actual de Caja · Vender (docs/caja-pos.md): tipo de pedido, mesa o
 * datos del cliente, líneas, nota, total y acciones.
 *
 * Las líneas hacen scroll por dentro y el pie (total y acciones) queda
 * siempre visible. Acciones según el tipo:
 * - Mostrador: "Cobrar $ X".
 * - Mesa / Recoger / Domicilio: "Cobrar ahora $ X" (nace pagado) y "Enviar
 *   pedido · Mesa N" o "Crear pedido sin cobrar" (pendiente de pago).
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Banknote,
  Loader2,
  MapPin,
  Phone,
  ShoppingBag,
  Store,
  Truck,
  User,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuantityStepper } from "@/features/orders/components/ProductRow";
import { formatCurrency } from "@/features/orders/utils/order-status.utils";
import type { OrderComposer } from "@/features/orders/hooks/useOrderComposer";
import type { ManualOrderDeliveryType } from "@/features/orders/types";

const TYPE_ORDER: ManualOrderDeliveryType[] = [
  "COUNTER",
  "PICKUP",
  "DINE_IN",
  "DELIVERY",
];

const TYPE_ICONS: Record<ManualOrderDeliveryType, LucideIcon> = {
  COUNTER: Banknote,
  PICKUP: Store,
  DINE_IN: Utensils,
  DELIVERY: Truck,
};

interface SaleCartProps {
  composer: OrderComposer;
  onTypeChange: (type: ManualOrderDeliveryType) => void;
  /** Abre el cobro (Mostrador o "Cobrar ahora"). */
  onCharge: () => void;
  /** Crea el pedido sin cobrar (Mesa / Recoger / Domicilio). */
  onHold: () => void;
  /** Puede cobrar al crear (`order.change_payment_status`). */
  canChargeNow: boolean;
  isHolding: boolean;
  /** Mostrar errores de validación (después del primer intento). */
  showErrors: boolean;
}

export function SaleCart({
  composer,
  onTypeChange,
  onCharge,
  onHold,
  canChargeNow,
  isHolding,
  showErrors,
}: SaleCartProps) {
  const t = useTranslations("cash.pos");
  const tOrder = useTranslations("orders.createOrder");
  const tDelivery = useTranslations("orders.deliveryTypes");
  const [noteOpen, setNoteOpen] = useState(false);
  // Mostrador: cliente opcional, para mandarle el recibo por WhatsApp.
  const [counterCustomerOpen, setCounterCustomerOpen] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const {
    deliveryTypes,
    deliveryType,
    activeTables,
    tableId,
    setTableId,
    customerPhone,
    setCustomerPhone,
    customerName,
    setCustomerName,
    addressText,
    setAddressText,
    notes,
    setNotes,
    cartLines,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    setLineQuantity,
    setLineNote,
    errors,
  } = composer;
  const [notedLines, setNotedLines] = useState<Record<string, boolean>>({});

  const types = TYPE_ORDER.filter((type) => deliveryTypes.includes(type));
  const error = (value: string | undefined) => (showErrors ? value : undefined);
  const tableName = activeTables.find((table) => table.id === tableId)?.name;
  const isCounter = deliveryType === "COUNTER";
  const empty = cartLines.length === 0;
  const showCustomer =
    deliveryType === "PICKUP" ||
    deliveryType === "DELIVERY" ||
    (isCounter && (counterCustomerOpen || customerPhone !== ""));

  const clear = () => {
    if (!empty && !confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    composer.clear();
    setConfirmingClear(false);
    setCounterCustomerOpen(false);
    setNoteOpen(false);
  };

  return (
    <aside
      className="flex min-h-0 flex-col overflow-hidden rounded-card-lg border border-white/80 bg-white/60 backdrop-blur-xl lg:w-80 lg:shrink-0 xl:w-96 2xl:w-105"
      aria-label={t("cart.title")}
    >
      <div className="shrink-0 space-y-3 border-b border-slate-100 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            {t("cart.title")}
          </h2>
          {isCounter && !showCustomer ? (
            <button
              type="button"
              onClick={() => setCounterCustomerOpen(true)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              {t("cart.addCustomer")}
            </button>
          ) : (
            <span className="text-xs text-slate-500">
              {tOrder("productsCount", { count: itemCount })}
            </span>
          )}
        </div>

        <div
          role="group"
          aria-label={tOrder("orderType")}
          className={cn(
            "grid gap-1 rounded-card bg-slate-100 p-1",
            types.length === 4
              ? "grid-cols-4"
              : types.length === 3
                ? "grid-cols-3"
                : "grid-cols-2"
          )}
        >
          {types.map((type) => {
            const Icon = TYPE_ICONS[type];
            const active = deliveryType === type;
            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                onClick={() => onTypeChange(type)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg py-2 text-xs font-medium transition-colors",
                  active
                    ? "bg-white text-indigo-600 shadow-card-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Icon className="h-4 w-4" />
                {tDelivery(type)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 scrollbar-thin">
        <div className="space-y-3 pb-3 empty:hidden">
          {deliveryType === "DINE_IN" && (
            <div className="space-y-1">
              <Select value={tableId ?? undefined} onValueChange={setTableId}>
                <SelectTrigger
                  aria-label={tOrder("table")}
                  aria-invalid={!!error(errors.tableId)}
                >
                  <SelectValue placeholder={tOrder("tablePlaceholder")} />
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
                <p className="text-xs text-slate-500">{tOrder("noTables")}</p>
              )}
              {error(errors.tableId) && (
                <p className="text-xs text-red-600">{errors.tableId}</p>
              )}
            </div>
          )}

          {showCustomer && (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
              <Field icon={Phone} label={tOrder("customerPhone")}>
                <PhoneInput
                  id="pos-customer-phone"
                  value={customerPhone}
                  onChange={setCustomerPhone}
                  error={error(errors.customerPhone)}
                />
              </Field>
              <Field icon={User} label={tOrder("customerName")}>
                <Input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder={tOrder("customerNamePlaceholder")}
                  maxLength={100}
                  error={error(errors.customerName)}
                />
              </Field>
              {deliveryType === "DELIVERY" && (
                <div className="sm:col-span-2 lg:col-span-1 2xl:col-span-2">
                  <Field icon={MapPin} label={tOrder("address")}>
                    <Input
                      value={addressText}
                      onChange={(event) => setAddressText(event.target.value)}
                      placeholder={tOrder("addressPlaceholder")}
                      maxLength={300}
                      error={error(errors.addressText)}
                    />
                  </Field>
                </div>
              )}
            </div>
          )}
        </div>
        {empty ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center">
            <ShoppingBag className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">
              {t("cart.emptyTitle")}
            </p>
            <p className="max-w-60 text-xs text-slate-500">
              {t("cart.emptyHint")}
            </p>
            {error(errors.items) && (
              <p className="text-xs text-red-600">{errors.items}</p>
            )}
          </div>
        ) : (
          <ul className="space-y-2" data-testid="pos-cart-lines">
            {cartLines.map((line) => (
              <li key={line.variantId} className="py-1">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {line.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t("cart.unitPrice", {
                        price: formatCurrency(line.unitPrice),
                      })}
                    </p>
                  </div>
                  <QuantityStepper
                    name={line.name}
                    quantity={line.quantity}
                    onChange={(quantity) =>
                      setLineQuantity(line.variantId, quantity)
                    }
                    maxReached={line.quantity >= line.max}
                    addLabel={tOrder("add")}
                    removeLabel={tOrder("remove")}
                    size="sm"
                  />
                  <span className="w-20 text-right text-sm font-semibold tabular-nums text-slate-900">
                    {formatCurrency(line.unitPrice * line.quantity)}
                  </span>
                </div>
                {notedLines[line.variantId] || line.notes ? (
                  <Input
                    className="mt-1"
                    autoFocus={!!notedLines[line.variantId] && !line.notes}
                    value={line.notes ?? ""}
                    onChange={(event) =>
                      setLineNote(line.variantId, event.target.value)
                    }
                    placeholder={tOrder("itemNotesPlaceholder")}
                    aria-label={tOrder("itemNotes")}
                    maxLength={200}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setNotedLines((prev) => ({ ...prev, [line.variantId]: true }))
                    }
                    className="mt-0.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    {tOrder("itemNotes")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {noteOpen || notes ? (
          <Input
            className="mt-3"
            autoFocus={noteOpen && !notes}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={tOrder("notesPlaceholder")}
            aria-label={tOrder("notes")}
            maxLength={500}
          />
        ) : (
          <button
            type="button"
            onClick={() => setNoteOpen(true)}
            className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            {t("cart.addNote")}
          </button>
        )}
      </div>

      <div className="shrink-0 space-y-3 border-t border-slate-100 bg-white/70 p-4">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>{t("cart.subtotal", { count: itemCount })}</span>
            <span className="tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          {deliveryType === "DELIVERY" && (
            <div className="flex justify-between text-slate-500">
              <span>{tOrder("deliveryFee")}</span>
              <span className="tabular-nums">
                {deliveryFee === null
                  ? tOrder("deliveryFeeByDistance")
                  : formatCurrency(deliveryFee)}
              </span>
            </div>
          )}
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-semibold text-slate-900">
              {t("cart.total")}
            </span>
            <span className="text-2xl font-bold tabular-nums text-slate-900">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={clear}
            disabled={empty && !notes}
            className={cn("h-12", confirmingClear && "border-red-300 text-red-700")}
            onBlur={() => setConfirmingClear(false)}
          >
            {confirmingClear ? t("cart.confirmClear") : t("cart.clear")}
          </Button>
          {(isCounter || canChargeNow) && (
            <Button
              className="h-12 flex-1 justify-between text-base"
              onClick={onCharge}
              disabled={isHolding}
            >
              <span>{isCounter ? t("cart.charge") : t("cart.chargeNow")}</span>
              <span className="tabular-nums">{formatCurrency(total)}</span>
            </Button>
          )}
        </div>
        {!isCounter && (
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={onHold}
            disabled={isHolding}
          >
            {isHolding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {deliveryType === "DINE_IN"
              ? tableName
                ? t("cart.sendToTable", { table: tableName })
                : t("cart.sendToTableGeneric")
              : t("cart.createUnpaid")}
          </Button>
        )}
      </div>
    </aside>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      {children}
    </div>
  );
}
