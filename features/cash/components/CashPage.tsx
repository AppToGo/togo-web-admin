"use client";
/**
 * Página de Caja por sede (docs/caja-pedidos.md).
 *
 * Gateo: la ruta exige `cash.view` (ver `app/.../cash/page.tsx`). Cada
 * acción se gatea por su permiso: abrir/liquidar (`cash.operate`),
 * egreso-retiro (`cash.withdraw`), cerrar (`cash.close`), cajas
 * (`cash.manage`), auditoría (`cash.audit`), nuevo pedido
 * (`order.create`).
 */
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, ArrowLeftRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { NewOrderDrawer } from "@/features/orders/components/NewOrderDrawer";
import {
  useCollections,
  useRegisters,
  useSessionMovements,
  useSessionSummary,
} from "../hooks/useCash";
import { RegisterTabs } from "./RegisterTabs";
import { OpenSessionDialog } from "./OpenSessionDialog";
import { SessionSummaryCard } from "./SessionSummary";
import { MovementsTable } from "./MovementsTable";
import { PendingCollectionsPanel } from "./PendingCollectionsPanel";
import { ManualMovementDialog } from "./ManualMovementDialog";
import { CloseSessionDrawer } from "./CloseSessionDrawer";
import { SessionsHistory } from "./SessionsHistory";
import { CashAuditPanel } from "./CashAuditPanel";

interface CashPageProps {
  businessId: string;
  branchId: string;
}

export function CashPage({ businessId, branchId }: CashPageProps) {
  const t = useTranslations("cash");
  const { hasPermission } = useMyPermissions();

  const canOperate = hasPermission("cash.operate");
  const canWithdraw = hasPermission("cash.withdraw");
  const canClose = hasPermission("cash.close");
  const canManage = hasPermission("cash.manage");
  const canAudit = hasPermission("cash.audit");
  const canCreateOrder = hasPermission("order.create");

  const { data: registers = [], isLoading } = useRegisters(businessId, branchId);
  const { data: collections = [] } = useCollections(businessId, branchId);

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
  const openSessionId = register?.openSession?.id ?? null;

  const { data: summary } = useSessionSummary(businessId, branchId, openSessionId);
  const { data: movementsPage } = useSessionMovements(
    businessId,
    branchId,
    openSessionId,
    { page: 1, limit: 30 }
  );

  const [opening, setOpening] = useState(false);
  const [moving, setMoving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [ordering, setOrdering] = useState(false);

  const pendingTotal = useMemo(
    () =>
      collections
        .reduce((acc, item) => acc + Number(item.amount), 0)
        .toFixed(2),
    [collections]
  );

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-slate-500">…</p>;
  }

  if (registers.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-3 py-10 text-center">
          <p className="font-medium">{t("noRegisters")}</p>
          <p className="text-sm text-slate-500">{t("noRegistersDescription")}</p>
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <RegisterTabs
            businessId={businessId}
            branchId={branchId}
            registers={registers}
            selectedId={effectiveId}
            onSelect={setSelectedId}
            canManage={canManage}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreateOrder && (
            <Button variant="outline" size="sm" onClick={() => setOrdering(true)}>
              <Plus className="mr-1 h-4 w-4" />
              {t("orders.newOrder")}
            </Button>
          )}
          {openSessionId ? (
            <>
              {(canOperate || canWithdraw) && (
                <Button variant="outline" size="sm" onClick={() => setMoving(true)}>
                  <ArrowLeftRight className="mr-1 h-4 w-4" />
                  {t("summary.movements")}
                </Button>
              )}
              {canClose && (
                <Button size="sm" onClick={() => setClosing(true)}>
                  <Lock className="mr-1 h-4 w-4" />
                  {t("sessions.close")}
                </Button>
              )}
            </>
          ) : (
            canOperate && (
              <Button size="sm" onClick={() => setOpening(true)}>
                <Plus className="mr-1 h-4 w-4" />
                {t("openSession")}
              </Button>
            )
          )}
        </div>
      </div>

      {summary && (
        <SessionSummaryCard
          summary={summary}
          pendingTotal={pendingTotal}
          pendingCount={collections.length}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <PendingCollectionsPanel
          businessId={businessId}
          branchId={branchId}
          sessionId={openSessionId}
          collections={collections}
          canOperate={canOperate}
        />
        <Card>
          <CardContent className="pt-4">
            <MovementsTable movements={movementsPage?.items ?? []} />
          </CardContent>
        </Card>
      </div>

      <SessionsHistory businessId={businessId} branchId={branchId} />

      {canAudit && (
        <CashAuditPanel
          businessId={businessId}
          branchId={branchId}
          sessionId={openSessionId ?? undefined}
        />
      )}

      <OpenSessionDialog
        businessId={businessId}
        branchId={branchId}
        register={register}
        open={opening}
        onOpenChange={setOpening}
      />
      <ManualMovementDialog
        businessId={businessId}
        branchId={branchId}
        sessionId={openSessionId}
        canOperate={canOperate}
        canWithdraw={canWithdraw}
        open={moving}
        onOpenChange={setMoving}
      />
      <CloseSessionDrawer
        businessId={businessId}
        branchId={branchId}
        sessionId={openSessionId}
        expectedAmount={summary?.expectedAmount ?? "0"}
        pendingCount={collections.length}
        open={closing}
        onOpenChange={setClosing}
      />
      {ordering && (
        <NewOrderDrawer
          isOpen={ordering}
          onClose={() => setOrdering(false)}
          presetBranchId={branchId}
          presetDeliveryType="COUNTER"
        />
      )}
    </div>
  );
}
