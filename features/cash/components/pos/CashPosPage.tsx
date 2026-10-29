"use client";
/**
 * Caja como punto de venta (docs/caja-pos.md): la pestaña activa. La caja
 * y el turno (título), las acciones y las pestañas (submenú de Caja en el
 * Sidebar) se pintan fuera y se registran en `usePosPageStore`.
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
import { cn } from "@/lib/utils";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import {
  useCurrentUser,
  useHasRole,
} from "@/features/auth/stores/auth.store";
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
import { usePosPageStore } from "@/stores/pos-menu.store";
import { SellTab } from "./SellTab";
import { ReceivablesTab } from "./ReceivablesTab";
import { SettlementsTab } from "./SettlementsTab";
import { ShiftTab } from "./ShiftTab";
import { CashBottomNav, CashMoreMenu, MORE_TABS } from "./CashMobileNav";
import {
  readLastDeliveryType,
  readSavedCart,
  saveCart,
  saveLastDeliveryType,
} from "./pos-storage";

export type PosTab =
  "sell" | "receivables" | "settlements" | "shift" | "history" | "audit";

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

  // Propiedad del turno: solo quien lo abrió opera en él. Un turno ajeno se
  // ve (solo lectura) pero no se toca: ni vender, ni cobrar, ni mover, ni
  // liquidar en él. El cierre ajeno es privilegio de dueño/ADMIN o
  // supervisor (`cash.manage`).
  const me = useCurrentUser();
  const isOwnerOrAdmin = useHasRole(["OWNER", "ADMIN"]);
  const isMine =
    !!openSession && !!me && openSession.openedById === me.userId;
  const isForeign = !!openSession && !isMine;
  const mySession =
    isMine && openSessionId ? { id: openSessionId, registerName } : null;
  const canCloseForeign = isOwnerOrAdmin || canManage;

  // Primera caja sin turno abierto: destino de "Abrir mi turno" cuando la
  // elegida está ocupada por otro usuario.
  const freeRegister = registers.find((item) => !item.openSession) ?? null;

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

  // Acciones del turno: un solo callback por acción, compartido por el
  // encabezado de la página y la pestaña Vender.
  const canOpenRegister = canOperate && !openSessionId;
  const canMove = isMine && (canOperate || canWithdraw);
  // Sin el resumen el esperado saldría en $ 0 y la diferencia del arqueo
  // sería falsa. El turno ajeno solo lo cierra quien puede (dueño/ADMIN o
  // supervisor), y el servidor además le exige el motivo.
  const canCloseRegister =
    !!openSessionId &&
    canClose &&
    !!summary &&
    (isMine || (isForeign && canCloseForeign));
  const openRegister = useMemo(
    () => (canOpenRegister ? () => setOpening(true) : null),
    [canOpenRegister]
  );
  // Turno ajeno: abrir el mío en la primera caja libre (la selecciona y
  // abre el drawer). Sin cajas libres no hay a dónde ir: solo lectura.
  const openInFreeRegister = useMemo(
    () =>
      isForeign && canOperate && freeRegister
        ? () => {
            setSelectedId(freeRegister.id);
            setOpening(true);
          }
        : null,
    [isForeign, canOperate, freeRegister]
  );
  const movement = useMemo(
    () => (canMove ? () => setMoving(true) : null),
    [canMove]
  );
  const closeRegister = useMemo(
    () => (canCloseRegister ? () => setClosing(true) : null),
    [canCloseRegister]
  );

  const sessionStatusText = openSession
    ? t("pos.header.open", {
        name: openSession.openedByName ?? "—",
        time: fmt.time(openSession.openedAt),
      }) + (isForeign ? t("pos.header.readOnly") : "")
    : t("pos.header.closed");

  // Pestañas (submenú de Caja en el Sidebar), caja seleccionada (título de
  // la página) y acciones del turno (junto al título). Solo con la caja
  // lista: cargando o sin cajas los drawers no están montados y las
  // pestañas no cambian nada en pantalla. Van antes de los retornos
  // tempranos: son hooks.
  const ready = !isLoading && registers.length > 0 && !!register;
  const setPosPage = usePosPageStore((state) => state.setPage);
  const clearPosPage = usePosPageStore((state) => state.clearPage);
  const menuSignature = visibleTabs
    .map((item) => `${item.value}:${item.label}:${item.count ?? 0}`)
    .join("|");
  const registersSignature = registers
    .map((item) => `${item.id}:${item.name}`)
    .join("|");
  useEffect(() => {
    if (!ready || !register) {
      clearPosPage();
      return;
    }
    setPosPage({
      entries: visibleTabs.map((item) => ({
        id: item.value,
        label: item.label,
        count: item.count,
        active: tab === item.value,
        onSelect: () => setTab(item.value),
      })),
      header: {
        registers: registers.map(({ id, name }) => ({ id, name })),
        selectedId: register.id,
        onSelectRegister: setSelectedId,
        isOpen: !!openSession,
        statusText: sessionStatusText,
      },
      actions: {
        onMovement: movement,
        onCloseRegister: closeRegister,
        onOpenRegister: openRegister,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ready,
    menuSignature,
    tab,
    registersSignature,
    register?.id,
    openSession,
    sessionStatusText,
    movement,
    closeRegister,
    openRegister,
    setPosPage,
    clearPosPage,
  ]);
  useEffect(() => clearPosPage, [clearPosPage]);

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

  return (
    // Teléfono: espacio abajo para la barra fija de pestañas.
    <div className="space-y-4 pb-24 md:pb-0">
      {/* Tablet (768–1023 px) la barra lateral es un cajón: las pestañas van
          también acá para no abrir el menú en cada cambio. Desde 1024 px
          viven solo en el submenú de Caja; en el teléfono, abajo
          (CashBottomNav). */}
      <nav
        aria-label={t("title")}
        className="hidden gap-1 overflow-x-auto scrollbar-thin md:flex lg:hidden"
      >
        {visibleTabs.map((item) => {
          const active = tab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => setTab(item.value)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              )}
            >
              {item.label}
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs font-semibold tabular-nums",
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Teléfono: Turno · Historial · Auditoría y las acciones del turno,
          que en pantallas grandes van junto al título. */}
      {MORE_TABS.includes(tab) && (
        <CashMoreMenu
          tab={tab}
          onTabChange={setTab}
          canAudit={canAudit}
          onMovement={movement}
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
            session={mySession}
            summary={summary}
            pendingTotal={pendingTotal}
            onOpenRegister={openRegister}
            foreign={
              isForeign
                ? { openedByName: openSession?.openedByName ?? null }
                : null
            }
            onOpenInFreeRegister={openInFreeRegister}
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
          session={mySession && canOperate ? mySession : null}
          canCharge={canCharge}
          onAddToTable={canSell && mySession ? addToTable : null}
        />
      )}

      {tab === "settlements" && (
        <SettlementsTab
          businessId={businessId}
          branchId={branchId}
          collections={collections}
          session={mySession}
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
        isForeign={isForeign}
        openedByName={openSession?.openedByName ?? null}
        openedAt={openSession?.openedAt ?? null}
        expectedAmount={summary?.expectedAmount ?? "0"}
        cashTips={summary?.tipsTotal?.cash}
        pendingCount={collections.length}
        open={closing}
        onOpenChange={setClosing}
      />
    </div>
  );
}
