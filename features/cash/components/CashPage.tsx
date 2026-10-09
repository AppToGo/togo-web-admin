"use client";
/**
 * Página de Caja por sede (docs/caja-pedidos.md), con el diseño acordado:
 * pestañas de sección, cajas como tarjetas, franja del turno, KPIs
 * `metrics-*`, movimientos y panel Por cobrar / Por liquidar.
 *
 * Gateo: la ruta exige `cash.view`. Cada acción se gatea por su permiso:
 * abrir/liquidar/ingreso (`cash.operate`), egreso-retiro (`cash.withdraw`),
 * cerrar (`cash.close`), cajas (`cash.manage`), auditoría (`cash.audit`),
 * nuevo pedido (`order.create`).
 */
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Minus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { NewOrderDrawer } from "@/features/orders/components/NewOrderDrawer";
import {
  useCollections,
  useReceivables,
  useRegisters,
  useSessionMovements,
  useSessionSummary,
} from "../hooks/useCash";
import { formatCOP } from "../utils/cash.utils";
import { RegisterTabs } from "./RegisterTabs";
import { OpenSessionDrawer } from "./OpenSessionDrawer";
import { SessionSummaryCard } from "./SessionSummary";
import { MovementsTable } from "./MovementsTable";
import { PendingCollectionsPanel } from "./PendingCollectionsPanel";
import { ReceivablesPanel } from "./ReceivablesPanel";
import { ManualMovementDrawer, type MovementKind } from "./ManualMovementDrawer";
import { CloseSessionDrawer } from "./CloseSessionDrawer";
import { SessionsHistory } from "./SessionsHistory";
import { CashAuditPanel } from "./CashAuditPanel";

interface CashPageProps {
  businessId: string;
  branchId: string;
}

type Section = "current" | "history" | "audit";
type PendingTab = "collect" | "settle";

const pillClass = (active: boolean) =>
  cn(
    "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-indigo-100 text-indigo-700"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
  );

export function CashPage({ businessId, branchId }: CashPageProps) {
  const t = useTranslations("cash");
  const locale = useLocale();
  const { hasPermission } = useMyPermissions();

  const canOperate = hasPermission("cash.operate");
  const canWithdraw = hasPermission("cash.withdraw");
  const canClose = hasPermission("cash.close");
  const canManage = hasPermission("cash.manage");
  const canAudit = hasPermission("cash.audit");
  const canCreateOrder = hasPermission("order.create");
  const canCharge = hasPermission("order.change_payment_status");

  const { data: registers = [], isLoading } = useRegisters(businessId, branchId);
  const { data: collections = [] } = useCollections(businessId, branchId);
  const { data: receivables = [] } = useReceivables(businessId, branchId);

  const [section, setSection] = useState<Section>("current");
  const [pendingTab, setPendingTab] = useState<PendingTab>("collect");
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

  const { data: summary } = useSessionSummary(businessId, branchId, openSessionId);
  const { data: movementsPage } = useSessionMovements(
    businessId,
    branchId,
    openSessionId,
    { page: 1, limit: 30 }
  );

  const [opening, setOpening] = useState(false);
  const [movingKind, setMovingKind] = useState<MovementKind | null>(null);
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
      <Card variant="glass">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
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

  const sections: Array<{ value: Section; label: string; show: boolean }> = [
    { value: "current", label: t("tabs.current"), show: true },
    { value: "history", label: t("tabs.history"), show: true },
    { value: "audit", label: t("tabs.audit"), show: canAudit },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          className="inline-flex gap-1 rounded-card border border-slate-100 bg-white p-1"
        >
          {sections
            .filter((item) => item.show)
            .map((item) => (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={section === item.value}
                onClick={() => setSection(item.value)}
                className={pillClass(section === item.value)}
              >
                {item.label}
              </button>
            ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreateOrder && (
            <Button onClick={() => setOrdering(true)}>
              <Plus className="mr-1 h-4 w-4" />
              {t("orders.newOrder")}
            </Button>
          )}
          {openSessionId ? (
            <>
              {canOperate && (
                <Button variant="green-outline" onClick={() => setMovingKind("MANUAL_IN")}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t("actions.income")}
                </Button>
              )}
              {canWithdraw && (
                <Button
                  variant="destructive-outline"
                  onClick={() => setMovingKind("MANUAL_OUT")}
                >
                  <Minus className="mr-1 h-4 w-4" />
                  {t("actions.expense")}
                </Button>
              )}
              {canClose && (
                <Button variant="slate" onClick={() => setClosing(true)}>
                  <Lock className="mr-1 h-4 w-4" />
                  {t("actions.closeRegister")}
                </Button>
              )}
            </>
          ) : (
            canOperate && (
              <Button variant="slate" onClick={() => setOpening(true)}>
                {t("actions.openRegister")}
              </Button>
            )
          )}
        </div>
      </div>

      {section === "current" && (
        <>
          <RegisterTabs
            businessId={businessId}
            branchId={branchId}
            registers={registers}
            selectedId={effectiveId}
            onSelect={setSelectedId}
            canManage={canManage}
          />

          <div className="flex flex-wrap items-center gap-3 rounded-card-lg border border-white/80 bg-white/40 px-5 py-3.5 backdrop-blur-xl">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                openSession ? "bg-emerald-600" : "bg-slate-400"
              )}
            />
            {openSession ? (
              <>
                <span className="font-semibold text-slate-900">{t("strip.open")}</span>
                <span className="text-sm text-slate-600">
                  {t("strip.detail", {
                    name: openSession.openedByName ?? "—",
                    time: new Date(openSession.openedAt).toLocaleTimeString(locale, {
                      hour: "numeric",
                      minute: "2-digit",
                    }),
                    amount: formatCOP(summary?.session.openingAmount ?? 0),
                  })}
                </span>
              </>
            ) : (
              <>
                <span className="font-semibold text-slate-900">{t("strip.closed")}</span>
                <span className="text-sm text-slate-600">{t("strip.closedHint")}</span>
              </>
            )}
          </div>

          {summary && (
            <SessionSummaryCard
              summary={summary}
              pendingTotal={pendingTotal}
              pendingCount={collections.length}
            />
          )}

          <div className="grid items-start gap-6 xl:grid-cols-5">
            <Card variant="glass" className="xl:col-span-3">
              <CardContent className="p-6">
                <h2 className="mb-3 text-base font-semibold text-slate-900">
                  {t("table.title")}
                </h2>
                <MovementsTable movements={movementsPage?.items ?? []} />
              </CardContent>
            </Card>

            <div className="space-y-6 xl:col-span-2">
              <Card variant="glass">
                <CardContent className="p-6">
                  <div
                    role="tablist"
                    className="mb-3 inline-flex gap-1 rounded-card border border-slate-100 bg-white p-1"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={pendingTab === "collect"}
                      onClick={() => setPendingTab("collect")}
                      className={pillClass(pendingTab === "collect")}
                    >
                      {t("collections.toCollect")} · {receivables.length}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={pendingTab === "settle"}
                      onClick={() => setPendingTab("settle")}
                      className={pillClass(pendingTab === "settle")}
                    >
                      {t("collections.toSettle")} · {collections.length}
                    </button>
                  </div>
                  <p className="mb-4 text-xs text-slate-500">
                    {pendingTab === "collect"
                      ? t("pending.collectHint")
                      : t("pending.settleHint")}
                  </p>
                  {pendingTab === "collect" ? (
                    <ReceivablesPanel
                      branchId={branchId}
                      receivables={receivables}
                      canCharge={canCharge}
                      session={
                        openSessionId && canOperate
                          ? { id: openSessionId, registerName }
                          : null
                      }
                    />
                  ) : (
                    <PendingCollectionsPanel
                      businessId={businessId}
                      branchId={branchId}
                      sessionId={openSessionId}
                      registerName={registerName}
                      collections={collections}
                      canOperate={canOperate}
                    />
                  )}
                </CardContent>
              </Card>

              {summary && (
                <Card variant="glass">
                  <CardContent className="p-6">
                    <h2 className="text-base font-semibold text-slate-900">
                      {t("otherMethods.title")}
                    </h2>
                    <p className="mb-3 text-xs text-slate-500">{t("otherMethods.hint")}</p>
                    {summary.otherPaymentMethods.length === 0 ? (
                      <p className="text-sm text-slate-500">{t("otherMethods.none")}</p>
                    ) : (
                      <ul>
                        {summary.otherPaymentMethods.map((row) => (
                          <li
                            key={row.method}
                            className="flex justify-between border-t border-slate-300/50 py-2.5 text-sm"
                          >
                            <span className="text-slate-700">
                              {t("otherMethods.row", {
                                method: row.method,
                                count: row.count,
                              })}
                            </span>
                            <span className="font-semibold tabular-nums">
                              {formatCOP(row.total)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {section === "history" && (
        <SessionsHistory businessId={businessId} branchId={branchId} />
      )}

      {section === "audit" && canAudit && (
        <CashAuditPanel businessId={businessId} branchId={branchId} />
      )}

      <OpenSessionDrawer
        businessId={businessId}
        branchId={branchId}
        register={register}
        open={opening}
        onOpenChange={setOpening}
      />
      {movingKind && (
        <ManualMovementDrawer
          key={movingKind}
          businessId={businessId}
          branchId={branchId}
          sessionId={openSessionId}
          registerName={registerName}
          expectedAmount={summary?.expectedAmount ?? "0"}
          initialKind={movingKind}
          canOperate={canOperate}
          canWithdraw={canWithdraw}
          open
          onOpenChange={(open) => {
            if (!open) setMovingKind(null);
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
