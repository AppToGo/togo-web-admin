"use client";
/**
 * Caja como punto de venta (docs/caja-pos.md): encabezado con la caja y el
 * turno, pestañas y la pestaña activa.
 *
 * Pestañas: Vender (por defecto con turno abierto) · Por cobrar · Por
 * liquidar · Turno · Historial · Auditoría. Cada una se gatea por su
 * permiso: vender (`order.create`), cobrar al crear
 * (`order.change_payment_status`), efectivo, abrir y liquidar
 * (`cash.operate`), egreso-retiro (`cash.withdraw`), cerrar (`cash.close`),
 * cajas (`cash.manage`), auditoría (`cash.audit`), Por cobrar
 * (`order.view`). Sin `order.create` Caja abre en Turno.
 *
 * La venta en curso vive acá (no en la pestaña Vender) para que no se
 * pierda al cambiar de pestaña y para que "+ Agregar productos" de Por
 * cobrar pueda dejarla lista para una mesa.
 */
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { useBusiness } from "@/features/business/hooks/useBusiness";
import { useOrderComposer } from "@/features/orders/hooks/useOrderComposer";
import type { ManualOrderDeliveryType } from "@/features/orders/types";
import {
  useCollections,
  useReceivables,
  useRegisters,
  useSessionSummary,
} from "../../hooks/useCash";
import { useCashDateFormat } from "../../utils/cash-time";
import { RegisterTabs } from "../RegisterTabs";
import { OpenSessionDrawer } from "../OpenSessionDrawer";
import { ManualMovementDrawer } from "../ManualMovementDrawer";
import { CloseSessionDrawer } from "../CloseSessionDrawer";
import { SessionsHistory } from "../SessionsHistory";
import { CashAuditPanel } from "../CashAuditPanel";
import { CashHeader, type PosTab } from "./CashHeader";
import { CashBottomNav, CashMoreMenu, MORE_TABS } from "./CashMobileNav";
import { SellTab } from "./SellTab";
import { ReceivablesTab } from "./ReceivablesTab";
import { SettlementsTab } from "./SettlementsTab";
import { ShiftTab } from "./ShiftTab";
import {
  readLastDeliveryType,
  readSavedCart,
  saveCart,
  saveLastDeliveryType,
} from "./pos-storage";

interface CashPosPageProps {
  businessId: string;
  branchId: string;
}

export function CashPosPage({ businessId, branchId }: CashPosPageProps) {
  const t = useTranslations("cash");
  const fmt = useCashDateFormat();
  const { hasPermission } = useMyPermissions();

  const canOperate = hasPermission("cash.operate");
  const canWithdraw = hasPermission("cash.withdraw");
  const canClose = hasPermission("cash.close");
  const canManage = hasPermission("cash.manage");
  const canAudit = hasPermission("cash.audit");
  const canSell = hasPermission("order.create");
  const canCharge = hasPermission("order.change_payment_status");
  // "Por cobrar" son pedidos: sin `order.view` no se pide ni se muestra.
  const canViewOrders = hasPermission("order.view");

  const { data: registers = [], isLoading } = useRegisters(
    businessId,
    branchId
  );
  const { data: collections = [] } = useCollections(businessId, branchId);
  const { data: receivables = [] } = useReceivables(
    businessId,
    branchId,
    canViewOrders
  );
  const { data: business } = useBusiness(businessId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Selección derivada (sin efecto): la explícita del operador, si no la
  // primera con turno abierto, si no la primera caja.
  const effectiveId =
    (selectedId && registers.some((register) => register.id === selectedId)
      ? selectedId
      : null) ??
    registers.find((register) => register.openSession)?.id ??
    registers[0]?.id ??
    null;
  const register = useMemo(
    () => registers.find((item) => item.id === effectiveId) ?? null,
    [registers, effectiveId]
  );
  const openSession = register?.openSession ?? null;
  const openSessionId = openSession?.id ?? null;
  const registerName = register?.name ?? "";
  const session = openSessionId ? { id: openSessionId, registerName } : null;

  const { data: summary } = useSessionSummary(
    businessId,
    branchId,
    openSessionId
  );

  const pendingTotal = useMemo(
    () =>
      collections
        .reduce((acc, item) => acc + Number(item.amount), 0)
        .toFixed(2),
    [collections]
  );

  // Venta en curso: el último tipo que usó el cajero en la sede (la primera
  // vez Mostrador, o Recoger si la sede no tiene mostrador).
  const [initialType] = useState<ManualOrderDeliveryType>(
    () => readLastDeliveryType(branchId) ?? "COUNTER"
  );
  const [initialCart] = useState(() => readSavedCart(branchId));
  const composer = useOrderComposer({
    businessId,
    branchId,
    enabled: canSell,
    initialDeliveryType: initialType,
    fallbackDeliveryType: "PICKUP",
    initialCart,
  });
  const cart = composer.cart;
  useEffect(() => {
    saveCart(branchId, cart);
  }, [branchId, cart]);

  const changeType = (type: ManualOrderDeliveryType) => {
    composer.setDeliveryType(type);
    saveLastDeliveryType(branchId, type);
  };

  const tabs: Array<{
    value: PosTab;
    label: string;
    count?: number;
    show: boolean;
  }> = [
    { value: "sell", label: t("pos.tabs.sell"), show: canSell },
    {
      value: "receivables",
      label: t("pos.tabs.receivables"),
      count: receivables.length,
      show: canViewOrders,
    },
    {
      value: "settlements",
      label: t("pos.tabs.settlements"),
      count: collections.length,
      show: true,
    },
    { value: "shift", label: t("pos.tabs.shift"), show: true },
    { value: "history", label: t("tabs.history"), show: true },
    { value: "audit", label: t("tabs.audit"), show: canAudit },
  ];
  const visibleTabs = tabs.filter((item) => item.show);
  const [pickedTab, setTab] = useState<PosTab | null>(null);
  const defaultTab: PosTab = canSell && openSessionId ? "sell" : "shift";
  const tab: PosTab =
    pickedTab && visibleTabs.some((item) => item.value === pickedTab)
      ? pickedTab
      : defaultTab;

  const [opening, setOpening] = useState(false);
  const [moving, setMoving] = useState(false);
  const [closing, setClosing] = useState(false);

  const addToTable = (tableId: string) => {
    // Un pedido nuevo para la misma mesa: no se edita el ya enviado a cocina.
    composer.setDeliveryType("DINE_IN");
    composer.setTableId(tableId);
    setTab("sell");
  };

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-slate-500">…</p>;
  }

  if (registers.length === 0) {
    return (
      <Card variant="glass">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="font-medium">{t("noRegisters")}</p>
          <p className="text-sm text-slate-500">
            {t("noRegistersDescription")}
          </p>
          {canManage && (
            <RegisterTabs
              businessId={businessId}
              branchId={branchId}
              registers={[]}
              selectedId={null}
              onSelect={() => {}}
              canManage
            />
          )}
        </CardContent>
      </Card>
    );
  }

  const openRegister =
    canOperate && !openSessionId ? () => setOpening(true) : null;
  const startMovement =
    openSessionId && (canOperate || canWithdraw) ? () => setMoving(true) : null;
  // Sin el resumen el esperado saldría en $ 0 y la diferencia del arqueo
  // sería falsa.
  const closeRegister =
    openSessionId && canClose && summary ? () => setClosing(true) : null;

  return (
    // < lg: espacio abajo para la barra fija de pestañas.
    <div className="space-y-4 pb-24 lg:pb-0">
      <CashHeader
        registers={registers}
        register={register}
        onSelectRegister={setSelectedId}
        tabs={visibleTabs}
        tab={tab}
        onTabChange={setTab}
        onMovement={startMovement}
        onCloseRegister={closeRegister}
        onOpenRegister={openRegister}
      />

      {MORE_TABS.includes(tab) && (
        <CashMoreMenu
          tab={tab}
          onTabChange={setTab}
          canAudit={canAudit}
          onMovement={startMovement}
          onCloseRegister={closeRegister}
          onOpenRegister={openRegister}
        />
      )}

      {canSell && (
        // Montada siempre (oculta fuera de Vender): el foco y el scroll del
        // catálogo se conservan al ir y volver de otras pestañas.
        <div hidden={tab !== "sell"}>
          <SellTab
            businessId={businessId}
            businessName={business?.name ?? ""}
            composer={composer}
            onTypeChange={changeType}
            session={session}
            summary={summary}
            pendingTotal={pendingTotal}
            onOpenShift={() => setTab("shift")}
            onOpenRegister={openRegister}
            canOperate={canOperate}
            canChargeNow={canCharge}
            formatDate={fmt.dateTime}
          />
        </div>
      )}

      {tab === "receivables" && canViewOrders && (
        <ReceivablesTab
          branchId={branchId}
          receivables={receivables}
          session={session && canOperate ? session : null}
          canCharge={canCharge}
          onAddToTable={canSell && openSessionId ? addToTable : null}
        />
      )}

      {tab === "settlements" && (
        <SettlementsTab
          businessId={businessId}
          branchId={branchId}
          collections={collections}
          session={session}
          canOperate={canOperate}
        />
      )}

      {tab === "shift" && (
        <ShiftTab
          key={effectiveId}
          businessId={businessId}
          branchId={branchId}
          registers={registers}
          register={register}
          onSelectRegister={setSelectedId}
          summary={summary}
          pendingTotal={pendingTotal}
          pendingCount={collections.length}
          canManage={canManage}
        />
      )}

      {tab === "history" && (
        <SessionsHistory businessId={businessId} branchId={branchId} />
      )}

      {tab === "audit" && canAudit && (
        <CashAuditPanel businessId={businessId} branchId={branchId} />
      )}

      <CashBottomNav
        tab={tab}
        onTabChange={setTab}
        canSell={canSell}
        canViewOrders={canViewOrders}
        receivablesCount={receivables.length}
        settlementsCount={collections.length}
      />

      <OpenSessionDrawer
        businessId={businessId}
        branchId={branchId}
        register={register}
        open={opening}
        onOpenChange={setOpening}
      />
      {moving && (
        <ManualMovementDrawer
          businessId={businessId}
          branchId={branchId}
          sessionId={openSessionId}
          registerName={registerName}
          expectedAmount={summary?.expectedAmount ?? "0"}
          initialKind={canOperate ? "MANUAL_IN" : "MANUAL_OUT"}
          canOperate={canOperate}
          canWithdraw={canWithdraw}
          open
          onOpenChange={(open) => {
            if (!open) setMoving(false);
          }}
        />
      )}
      <CloseSessionDrawer
        businessId={businessId}
        branchId={branchId}
        sessionId={openSessionId}
        registerName={registerName}
        openedByName={openSession?.openedByName ?? null}
        openedAt={openSession?.openedAt ?? null}
        expectedAmount={summary?.expectedAmount ?? "0"}
        pendingCount={collections.length}
        open={closing}
        onOpenChange={setClosing}
      />
    </div>
  );
}
