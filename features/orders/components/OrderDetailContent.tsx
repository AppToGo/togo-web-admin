"use client";

import { useCallback, useMemo, useState } from "react";
import {
  User,
  Users,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  Wallet,
  Package,
  StickyNote,
  Store,
  Home,
  Utensils,
  Banknote,
  Bike,
  AlertTriangle,
  ChevronDown,
  Check,
  ClipboardList,
  MessageCircle,
  PencilLine,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useOrder,
  useOrderHistory,
  useUpdateOrderStatus,
} from "../hooks/useOrders";
import type { OrderStatus, OrderItem } from "../types";
import {
  formatCurrency,
  canCompleteOrder,
  BLOCKED_WHILE_CUSTOMER_EDITING,
  isCustomerEditing,
} from "../utils/order-status.utils";
import { formatOrderNumber } from "../utils/order-number.utils";
import { categoryBadgeVariants } from "../styles";
import { toast } from "sonner";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getColumnVariant } from "../config/kanban-columns.config";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useConversationByOrder } from "@/features/conversations";
import { OrderConversationPanel } from "./OrderConversationPanel";
import { HoverTooltip } from "./HoverTooltip";
import { checkStatusMove, isStatusApplicable } from "../utils/order-flow.utils";
import { DeliveryPickerDialog } from "./DeliveryPickerDialog";
import { CancelOrderDialog } from "./CancelOrderDialog";
import { useOrderFlow } from "../hooks/useOrderFlow";
import { PaymentProofIndicator } from "./PaymentProofDialog";
import { PaymentStatusEditor } from "./PaymentStatusEditor";
import { MoneyTrailBlock } from "./MoneyTrailBlock";
import { orderTipBreakdown } from "../utils/tip.utils";
import { isPlatformStaffRole } from "@/lib/auth/platform-staff";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";

export interface OrderDetailContentProps {
  orderId: string;
  isReadOnly?: boolean;
  onClose?: () => void;
}

// Order type with icon and color
function getOrderTypeInfo(
  order: {
    deliveryType?: string;
    addressId?: string | null;
    tableLabel?: string | null;
  },
  t: ReturnType<typeof useTranslations>
): {
  label: string;
  icon: React.ReactNode;
  variant: string;
} {
  const isDelivery = order.deliveryType
    ? order.deliveryType === "DELIVERY"
    : !!order.addressId;

  if (isDelivery) {
    return {
      label: t("deliveryTypes.delivery"),
      icon: <Home className="w-3 h-3" />,
      variant: "blue",
    };
  }

  // Venta de mostrador (docs/caja-pedidos.md): cobrada y entregada en el
  // acto desde caja.
  if (order.deliveryType === "COUNTER") {
    return {
      label: t("deliveryTypes.COUNTER"),
      icon: <Banknote className="w-3 h-3" />,
      variant: "amber",
    };
  }

  // Pedidos en mesa (docs/architecture/pedidos-en-mesa.md): antes se
  // inferían por `order.source === "OPERATOR"`, un valor que el enum real
  // OrderSource nunca produce (siempre era código muerto). deliveryType
  // ahora se setea de forma confiable a DINE_IN en los 3 caminos de
  // creación de pedido.
  if (order.deliveryType === "DINE_IN") {
    return {
      label: order.tableLabel
        ? `${t("deliveryTypes.table")} · ${order.tableLabel}`
        : t("deliveryTypes.table"),
      icon: <Utensils className="w-3 h-3" />,
      // "emerald" is not a categoryBadgeVariants key (only "green", already
      // used by the "Paid" chip), so the chip rendered with no color. "cyan"
      // doesn't clash with delivery (blue), pickup (amber) or paid (green).
      variant: "cyan",
    };
  }

  return {
    label: t("deliveryTypes.pickup"),
    icon: <Store className="w-3 h-3" />,
    variant: "amber",
  };
}

// Fila de la sección Responsables: visible para todos los roles con
// permiso order.view (pestaña General, sin gate de historial).
interface ResponsibleRow {
  key: string;
  label: string;
  value: string;
  empty: boolean;
  icon: React.ReactNode;
}

/**
 * Quién responde por el pedido según su tipo:
 * - DELIVERY → Domiciliario (asignado o "Sin asignar") + Tomado por si lo
 *   creó un operador.
 * - DINE_IN → Mesero que tomó el pedido.
 * - COUNTER → Cajero que lo cobró.
 * - PICKUP → Atendido por (solo si lo tomó un operador).
 * Sin filas (recoger creado por el cliente) la sección se oculta.
 */
function getResponsibleRows(
  order: {
    deliveryType?: string;
    assignedDelivery?: { name?: string } | null;
    createdByType?: string;
    createdByUser?: { name?: string } | null;
  },
  t: ReturnType<typeof useTranslations>
): ResponsibleRow[] {
  const rows: ResponsibleRow[] = [];
  const operatorName = order.createdByUser?.name?.trim() || null;
  const isOperatorOrder = order.createdByType === "OPERATOR";

  if (order.deliveryType === "DELIVERY") {
    rows.push({
      key: "delivery",
      label: t("detail.responsibleDelivery"),
      value: order.assignedDelivery?.name?.trim() || t("detail.unassigned"),
      empty: !order.assignedDelivery?.name?.trim(),
      icon: <Bike className="w-4 h-4 text-slate-400 shrink-0" />,
    });
    if (isOperatorOrder) {
      rows.push({
        key: "takenBy",
        label: t("detail.takenBy"),
        value: operatorName || t("detail.unregistered"),
        empty: !operatorName,
        icon: <User className="w-4 h-4 text-slate-400 shrink-0" />,
      });
    }
    return rows;
  }

  if (order.deliveryType === "DINE_IN") {
    rows.push({
      key: "waiter",
      label: t("detail.responsibleWaiter"),
      value: operatorName || t("detail.unregistered"),
      empty: !operatorName,
      icon: <Utensils className="w-4 h-4 text-slate-400 shrink-0" />,
    });
    return rows;
  }

  if (order.deliveryType === "COUNTER") {
    rows.push({
      key: "cashier",
      label: t("detail.responsibleCashier"),
      value: operatorName || t("detail.unregistered"),
      empty: !operatorName,
      icon: <Banknote className="w-4 h-4 text-slate-400 shrink-0" />,
    });
    return rows;
  }

  // PICKUP (u otro): solo hay responsable si un operador lo tomó.
  if (isOperatorOrder || operatorName) {
    rows.push({
      key: "attended",
      label: t("detail.responsibleAttendedBy"),
      value: operatorName || t("detail.unregistered"),
      empty: !operatorName,
      icon: <Store className="w-4 h-4 text-slate-400 shrink-0" />,
    });
  }
  return rows;
}

// Component to change order status (similar to PaymentStatusEditor)
function OrderStatusEditor({
  currentStatus,
  deliveryType,
  onStatusChange,
  customerEditing = false,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  deliveryType?: string;
  onStatusChange: (status: OrderStatus) => void;
  /** El cliente lo está editando: no se puede mandar a producción. */
  customerEditing?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const variant = getColumnVariant(currentStatus);
  const tStatus = useTranslations("orders.status");
  // Mismas reglas que el tablero: solo la siguiente columna visible, cancelar,
  // o retroceder con permiso. Las demás opciones quedan deshabilitadas.
  const flow = useOrderFlow();

  const handleSelect = useCallback(
    (newStatus: OrderStatus) => {
      if (newStatus !== currentStatus) {
        onStatusChange(newStatus);
      }
      setIsOpen(false);
    },
    [currentStatus, onStatusChange]
  );

  // Available statuses (including current to show it in its position)
  // Logical flow: CONFIRMED → IN_PROGRESS → READY → ON_THE_WAY → COMPLETED
  // CANCELLED is shown at the end as an exception option
  // Solo los estados del flujo del negocio (más el actual, por si quedó en
  // uno que el negocio dejó de usar); "En camino" solo para domicilio.
  const availableStatuses = (
    ["CONFIRMED", "IN_PROGRESS", "READY", "ON_THE_WAY", "COMPLETED", "CANCELLED"] as OrderStatus[]
  ).filter(
    (status) =>
      status === currentStatus ||
      ((flow.visible?.has(status) ?? true) && isStatusApplicable(status, deliveryType))
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            categoryBadgeVariants({ variant: variant as any }),
            "cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 text-xs"
          )}
        >
          <span>{tStatus(currentStatus)}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-40 z-9999"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {availableStatuses.map((status) => {
          const isCurrent = status === currentStatus;
          const isBlocked =
            (customerEditing && BLOCKED_WHILE_CUSTOMER_EDITING.includes(status)) ||
            (!isCurrent &&
              !checkStatusMove(currentStatus, status, { ...flow, deliveryType }).ok);
          return (
            <DropdownMenuItem
              key={status}
              onSelect={() => handleSelect(status)}
              disabled={isCurrent || isBlocked}
              className={cn(
                "flex items-center gap-2 text-xs",
                isCurrent
                  ? "opacity-50 cursor-not-allowed bg-slate-50"
                  : "cursor-pointer"
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  getColumnVariant(status) === "blue" && "bg-blue-500",
                  getColumnVariant(status) === "purple" && "bg-purple-500",
                  getColumnVariant(status) === "orange" && "bg-orange-500",
                  getColumnVariant(status) === "emerald" && "bg-emerald-500",
                  getColumnVariant(status) === "pink" && "bg-pink-500",
                  getColumnVariant(status) === "gray" && "bg-slate-500"
                )}
              />
              <span
                className={cn(
                  "flex-1",
                  isCurrent ? "text-slate-500 font-medium" : "text-slate-700"
                )}
              >
                {tStatus(status)}
              </span>
              {isCurrent && <Check className="w-3.5 h-3.5 text-slate-400" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OrderDetailContent({
  orderId,
  isReadOnly = false,
  onClose,
}: OrderDetailContentProps) {
  const { data: order, isLoading: isLoadingOrder } = useOrder(orderId);
  const { data: history, isLoading: isLoadingHistory } = useOrderHistory(orderId);
  const updateStatus = useUpdateOrderStatus();
  // Borrador que el ⚠ de un producto precarga en el composer de la pestaña Conversación.
  const [conversationDraft, setConversationDraft] = useState<string | undefined>();
  const [activeTab, setActiveTabState] = useState("general");
  const { user } = useAuthStore();

  // Translations
  const t = useTranslations("orders");
  const tc = useTranslations("common");
  const tStatus = useTranslations("orders.status");

  // Verificar permisos para ver historial
  const canViewHistory =
    user?.role === "OWNER" ||
    user?.role === "ADMIN" ||
    isPlatformStaffRole(user?.role);

  // Sesión demo: sin pestaña Conversación — el backend la deniega (solo
  // inbox propio) y el 403 se vería como error en vez de estado vacío.
  const isDemo = user?.isDemo === true;

  // Sin permiso conversation.view el backend responde 403 en
  // GET .../orders/:id/conversation: se oculta la pestaña y ni siquiera se
  // llama al endpoint para no arruinar la experiencia.
  const { hasPermission } = useMyPermissions();
  const canViewConversation = !isDemo && hasPermission("conversation.view");

  // Tab "Conversación" se muestra de forma optimista (§4 del plan Fase B):
  // en vez de agregar conversationSessionId a Order, se resuelve perezosamente
  // vía GET .../orders/:id/conversation sólo cuando el tab está activo. Un
  // 404 (pedido de catálogo web sin conversación) se traduce a estado vacío,
  // no se oculta el tab — evita reordenar la lista de tabs a media sesión.
  const conversationQuery = useConversationByOrder(
    orderId,
    canViewConversation && activeTab === "conversation"
  );

  const tabs = [
    { value: "general", icon: ClipboardList, label: t("tabs.general") },
    ...(canViewConversation
      ? [
          {
            value: "conversation",
            icon: MessageCircle,
            label: t("tabs.conversation"),
          },
        ]
      : []),
    ...(canViewHistory
      ? [{ value: "history", icon: Clock, label: t("tabs.history") }]
      : []),
  ] as const;

  const flow = useOrderFlow();
  // Selector de repartidor al pasar el pedido a "En camino".
  const [isDeliveryPickerOpen, setIsDeliveryPickerOpen] = useState(false);
  // Motivo obligatorio al cancelar.
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const handleStatusChange = useCallback(
    (newStatus: OrderStatus) => {
      if (!order || newStatus === order.status) return;
      if (
        !checkStatusMove(order.status, newStatus, {
          ...flow,
          deliveryType: order.deliveryType,
        }).ok
      ) {
        return;
      }

      if (newStatus === "COMPLETED") {
        const validation = canCompleteOrder(order);
        if (!validation.valid) {
          toast.error(t("errors.cannotComplete"));
          return;
        }
      }

      // "En camino" exige repartidor: si el pedido no tiene, se pide antes.
      if (newStatus === "ON_THE_WAY" && !order.assignedDeliveryId) {
        setIsDeliveryPickerOpen(true);
        return;
      }

      // Cancelar exige el motivo obligatorio: se pide en el modal y sin él
      // no se cambia el estado.
      if (newStatus === "CANCELLED") {
        setIsCancelOpen(true);
        return;
      }

      updateStatus.mutate(
        { orderId, data: { status: newStatus } },
        {
          onSuccess: () => {
            onClose?.();
          },
        }
      );
    },
    [order, orderId, updateStatus, onClose, t, flow]
  );

  const handleDeliveryConfirm = useCallback(
    (assignedDeliveryId: string) => {
      updateStatus.mutate(
        { orderId, data: { status: "ON_THE_WAY", assignedDeliveryId } },
        {
          onSuccess: () => {
            setIsDeliveryPickerOpen(false);
            onClose?.();
          },
        }
      );
    },
    [orderId, updateStatus, onClose]
  );

  const handleCancelConfirm = useCallback(
    (reason: string) => {
      updateStatus.mutate(
        { orderId, data: { status: "CANCELLED", changeNotes: reason } },
        {
          onSuccess: () => {
            setIsCancelOpen(false);
            onClose?.();
          },
        }
      );
    },
    [orderId, updateStatus, onClose]
  );

  // El borrador solo vale para la visita a la pestaña que dispara el ⚠: al
  // cambiar de pestaña a mano se descarta, para que no reaparezca después.
  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    setConversationDraft(undefined);
  }, []);

  // El ⚠ de un producto no envía nada: lleva a la pestaña Conversación con un
  // borrador para que el operador le escriba al cliente por el canal oficial
  // (tomando la conversación si la ventana de 24 h está abierta).
  const handleItemIssue = useCallback(
    (item: OrderItem) => {
      if (!canViewConversation) return;
      setActiveTabState("conversation");
      setConversationDraft(t("itemIssue.draft", { productName: item.productName }));
    },
    [canViewConversation, t]
  );

  // Calcular totales incluyendo domicilio y propina. Las filas se muestran
  // por tipo de pedido (domicilio si es DELIVERY, propina si es mesa o
  // mostrador) aunque el valor sea 0: así el valor siempre queda explícito.
  const { subtotal, deliveryFee, tip, total, isDelivery, isTippableType } =
    useMemo(() => {
      if (!order)
        return {
          subtotal: 0,
          deliveryFee: 0,
          tip: 0,
          total: 0,
          isDelivery: false,
          isTippableType: false,
        };

      const itemsTotal =
        order.items?.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        ) || 0;

      const delivery = order.deliveryType === "DELIVERY" || !!order.addressId;
      const fee = delivery ? order.deliveryFee || 0 : 0;
      const tipValue = order.tip || 0;

      return {
        subtotal: itemsTotal,
        deliveryFee: fee,
        tip: tipValue,
        total: itemsTotal + fee + tipValue,
        isDelivery: delivery,
        isTippableType:
          order.deliveryType === "DINE_IN" || order.deliveryType === "COUNTER",
      };
    }, [order]);

  if (isLoadingOrder) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <svg
          className="w-12 h-12 text-slate-300 mx-auto mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="text-slate-500">{t("orderNotFound")}</p>
      </div>
    );
  }

  const orderType = getOrderTypeInfo(order, t);
  const customerEditing = isCustomerEditing(order);

  return (
    <div className="space-y-6">
      {/* Header: Número de orden, Estado, Tipo y Total */}
      <div className="flex items-start justify-between">
        {/* Izquierda: Número, badges de estado y tipo */}
        <div className="flex flex-col gap-2">
          {/* Número de orden */}
          <span className="text-xl font-bold text-slate-900">
            {order.id ? formatOrderNumber(order.id, order.orderNumber) : "#------"}
          </span>

          {/* Badges debajo del número */}
          <div
            className="flex items-center gap-2"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Badge de estado cliqueable */}
            <OrderStatusEditor
              orderId={order.id ?? ""}
              currentStatus={order.status}
              deliveryType={order.deliveryType}
              onStatusChange={handleStatusChange}
              customerEditing={customerEditing}
            />
            <DeliveryPickerDialog
              isOpen={isDeliveryPickerOpen}
              orderLabel={formatOrderNumber(order.id, order.orderNumber)}
              isSubmitting={updateStatus.isPending}
              onClose={() => setIsDeliveryPickerOpen(false)}
              onConfirm={handleDeliveryConfirm}
            />
            <CancelOrderDialog
              isOpen={isCancelOpen}
              orderLabel={formatOrderNumber(order.id, order.orderNumber)}
              isSubmitting={updateStatus.isPending}
              onClose={() => setIsCancelOpen(false)}
              onConfirm={handleCancelConfirm}
            />

            {customerEditing && (
              <HoverTooltip content={t("card.customerEditingHint")}>
                <span
                  className={cn(
                    categoryBadgeVariants({ variant: "amber" }),
                    "text-xs"
                  )}
                >
                  <PencilLine className="w-3 h-3" />
                  <span>{t("card.customerEditing")}</span>
                </span>
              </HoverTooltip>
            )}

            {/* Badge de tipo (domicilio/recoger/en mesa) */}
            <span
              className={cn(
                categoryBadgeVariants({ variant: orderType.variant as any }),
                "text-xs"
              )}
            >
              {orderType.icon}
              <span>{orderType.label}</span>
            </span>
          </div>
        </div>

        {/* Right: Total */}
        <div className="text-right">
          <p className="text-sm text-slate-500">{t("detail.total")}</p>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(total)}
          </p>
          {deliveryFee > 0 && (
            <p className="text-xs text-slate-500">
              {t("includesDelivery").replace(
                "{fee}",
                formatCurrency(deliveryFee)
              )}
            </p>
          )}
        </div>
      </div>

      <Separator />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Tab navigation — mismo patrón que users/[id]/page.tsx: pills
            custom con role="tablist"/"tab", no TabsList/TabsTrigger directo. */}
        <div
          className="inline-flex bg-white border border-slate-100 rounded-lg p-1 gap-1"
          role="tablist"
        >
          {tabs.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              role="tab"
              aria-selected={activeTab === value}
              onClick={() => setActiveTab(value)}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === value
                  ? "bg-indigo-100 text-indigo-600"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4" />
              {t("detail.customerInfo")}
            </h4>
            <div className="bg-slate-50 rounded-card p-4 space-y-2">
              {order.customer?.name ? (
                <p className="font-medium text-slate-900">{order.customer.name}</p>
              ) : null}
              {order.customer?.phoneNumber && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4" />
                  {order.customer.phoneNumber}
                </div>
              )}
              {!order.customer?.name && !order.customer?.phoneNumber && (
                <p className="text-sm text-slate-500">
                  {tc("empty.infoNotAvailable")}
                </p>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          {order.address && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t("detail.deliveryAddress")}
              </h4>
              <div className="bg-slate-50 rounded-card p-4">
                <p className="font-medium text-slate-900">{order.address.label}</p>
                <p className="text-sm text-slate-600 mt-1">
                  {order.address.addressText}
                </p>
              </div>
            </div>
          )}

          {/* Responsables: visible para todos los roles (pestaña General).
              Domicilio → domiciliario, mesa → mesero, resto según el caso. */}
          {(() => {
            const responsibleRows = getResponsibleRows(order, t);
            if (responsibleRows.length === 0) return null;
            return (
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t("detail.responsibles")}
                </h4>
                <div className="bg-slate-50 rounded-card p-4 space-y-2">
                  {responsibleRows.map((row) => (
                    <div
                      key={row.key}
                      className="flex items-center gap-2 text-sm"
                    >
                      {row.icon}
                      <span className="text-slate-500">{row.label}:</span>
                      <span
                        className={cn(
                          "font-medium",
                          row.empty ? "text-slate-400" : "text-slate-900"
                        )}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4" />
                {t("detail.itemsCount", { count: order.items.length })}
              </h4>
              <div className="bg-slate-50 rounded-card overflow-hidden">
                {order.items.map((item: OrderItem, index: number) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 ${
                      index !== order.items!.length - 1
                        ? "border-b border-slate-200"
                        : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm">
                        {item.quantity}x {item.productName}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 text-sm">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </p>
                      {/* Subtle icon to indicate out of stock */}
                      {!isReadOnly && canViewConversation && (
                        <button
                          onClick={() => handleItemIssue(item)}
                          className="text-slate-300 hover:text-amber-500 transition-colors"
                          title={t("itemIssue.tooltip")}
                          aria-label={t("itemIssue.tooltip")}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {/* Totals breakdown */}
                <div className="p-3 bg-slate-100 border-t border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{t("detail.subtotal")}</span>
                    <span className="text-slate-700">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  {isDelivery && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        {t("detail.deliveryFee")}
                      </span>
                      <span className="text-slate-700">
                        {formatCurrency(deliveryFee)}
                      </span>
                    </div>
                  )}
                  {(isTippableType || tip > 0) && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        {order.tipPercent
                          ? t("tip.labelWithPercent", { percent: order.tipPercent })
                          : t("tip.label")}
                      </span>
                      <span className="text-slate-700">{formatCurrency(tip)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <p className="font-semibold text-slate-900">
                      {t("detail.total")}
                    </p>
                    <p className="font-bold text-slate-900">
                      {formatCurrency(total)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                <StickyNote className="w-4 h-4" />
                {t("detail.notes")}
              </h4>
              <div className="bg-amber-50 rounded-card p-4">
                <p className="text-sm text-amber-800">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              {t("paymentInfo")}
            </h4>
            <div
              className="flex items-center gap-4"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {order.cashCollection?.status === "PENDING_SETTLEMENT" ? (
                <span
                  className={cn(
                    categoryBadgeVariants({ variant: "orange" }),
                    "flex items-center gap-1"
                  )}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{t("cashPendingSettlement")}</span>
                </span>
              ) : (
                <PaymentStatusEditor
                  orderId={order.id ?? ""}
                  total={order.total}
                  branchId={order.branchId}
                  paymentMethod={order.paymentMethod}
                  currentStatus={order.paymentStatus}
                  chargeLabel={
                    order.id ? formatOrderNumber(order.id, order.orderNumber) : undefined
                  }
                  tipBreakdown={orderTipBreakdown(order)}
                />
              )}
              <PaymentProofIndicator order={order} variant="labeled" />
              {order.paymentMethod && (
                <span className="text-sm text-slate-600">
                  {t("paymentMethod", { method: order.paymentMethod })}
                </span>
              )}
            </div>
            <MoneyTrailBlock order={order} />
          </div>
        </TabsContent>

        {/* Conversación Tab */}
        {canViewConversation && (
          <TabsContent value="conversation" className="space-y-4">
            <OrderConversationPanel
              conversationQuery={conversationQuery}
              draft={conversationDraft}
            />
          </TabsContent>
        )}

        {/* Historial Tab */}
        {canViewHistory && (
          <TabsContent value="history" className="space-y-3">
            {isLoadingHistory ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : history && history.length > 0 ? (
              <div className="space-y-2">
                {history.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <span className="text-slate-600">
                        {entry.fromStatus
                          ? `${tStatus(entry.fromStatus)} → ${tStatus(entry.toStatus)}`
                          : t("history.created").replace(
                              "{status}",
                              tStatus(entry.toStatus)
                            )}
                      </span>
                      {entry.notes && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">
                {t("detail.noHistory")}
              </p>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-16 w-full rounded-card" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full rounded-card" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-32 w-full rounded-card" />
      </div>
    </div>
  );
}
