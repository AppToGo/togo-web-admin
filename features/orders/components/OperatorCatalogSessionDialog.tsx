"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Store } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffectiveBranches } from "@/features/branches/hooks";
import { useBranchStore } from "@/stores/branch.store";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import {
  useCreateOperatorCatalogSession,
  useMyOperatorCatalogSessions,
  useOperatorCatalogSessionOptions,
  useRevokeOperatorCatalogSession,
} from "../hooks/useOperatorCatalogSessions";
import { buildSessionExpiryOptions } from "../utils/session-expiry.utils";
import type { CreatedOperatorCatalogSession } from "../types";

interface OperatorCatalogSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** SUPER_ADMIN: negocio seleccionado. Sin él, el del usuario. */
  businessId?: string;
}

/**
 * "Tomar pedido en catálogo": abre el catálogo web en modo operador para
 * que el mesero tome pedidos de mesa desde ahí (en este equipo o
 * escaneando el QR con su celular). Lo suele usar el cajero o el
 * administrador: elige a nombre de qué operador queda la sesión y hasta qué
 * hora dura, sin pasar del cierre del turno de la sede (que puede ser del
 * día siguiente). El link con el token solo existe mientras este diálogo
 * está abierto.
 */
export function OperatorCatalogSessionDialog({
  isOpen,
  onClose,
  businessId: businessIdProp,
}: OperatorCatalogSessionDialogProps) {
  const t = useTranslations("orders.catalogSession");
  const locale = useLocale();
  const userBusinessId = useAuthStore((state) => state.user?.businessId ?? null);
  const currentUserId = useAuthStore((state) => state.user?.userId ?? null);
  const businessId = businessIdProp ?? userBusinessId;

  const { branches, defaultBranchId } = useEffectiveBranches();
  const selectedBranchIds = useBranchStore((state) => state.selectedBranchIds);
  const initialBranchId =
    (selectedBranchIds?.length === 1 ? selectedBranchIds[0] : null) ??
    defaultBranchId ??
    branches[0]?.id ??
    null;
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const branchId = selectedBranchId ?? initialBranchId;

  const [session, setSession] = useState<CreatedOperatorCatalogSession | null>(null);
  const [qr, setQr] = useState<{ url: string; dataUrl: string } | null>(null);
  const [qrAttempt, setQrAttempt] = useState(0);
  // URL que falló al generar el QR (igual que `qr`: amarrado a la sesión).
  const [qrErrorUrl, setQrErrorUrl] = useState<string | null>(null);
  const qrDataUrl = session && qr?.url === session.url ? qr.dataUrl : null;
  const qrFailed = session !== null && qrErrorUrl === session.url;

  const createSession = useCreateOperatorCatalogSession(businessId);
  const revokeSession = useRevokeOperatorCatalogSession(businessId);
  const { data: activeSessions = [] } = useMyOperatorCatalogSessions(businessId, isOpen);

  const optionsQuery = useOperatorCatalogSessionOptions(
    businessId,
    branchId,
    isOpen && !session
  );
  const operators = useMemo(
    () => optionsQuery.data?.operators ?? [],
    [optionsQuery.data]
  );
  const sessionWindow = optionsQuery.data?.window ?? null;

  // Por defecto, quien abre el diálogo si puede tomar pedidos en la sede.
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const operatorId =
    operators.find((o) => o.id === selectedOperatorId)?.id ??
    operators.find((o) => o.id === currentUserId)?.id ??
    operators[0]?.id ??
    null;

  const expiryOptions = useMemo(
    () =>
      sessionWindow
        ? buildSessionExpiryOptions(sessionWindow.closesAt, sessionWindow.timezone)
        : [],
    [sessionWindow]
  );
  // Por defecto, el cierre del turno (la última opción).
  const [selectedExpiresAt, setSelectedExpiresAt] = useState<string | null>(null);
  const expiresAt =
    expiryOptions.find((o) => o.value === selectedExpiresAt)?.value ??
    expiryOptions[expiryOptions.length - 1]?.value ??
    null;

  // Horas del selector en la zona de la sede, no la del navegador.
  const formatBranchTime = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: sessionWindow?.timezone,
    });
    return (iso: string) => formatter.format(new Date(iso));
  }, [locale, sessionWindow?.timezone]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    // Sin catch, un rechazo dejaba el Skeleton para siempre. El QR es
    // opcional (el link sigue sirviendo): se muestra error con reintento.
    QRCode.toDataURL(session.url, { width: 360, margin: 1, errorCorrectionLevel: "M" }).then(
      (dataUrl) => {
        if (!cancelled) setQr({ url: session.url, dataUrl });
      },
      () => {
        if (!cancelled) setQrErrorUrl(session.url);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [session, qrAttempt]);

  const handleClose = () => {
    // El token no queda guardado en el admin: se descarta al cerrar.
    setSession(null);
    setQr(null);
    setQrErrorUrl(null);
    setQrAttempt(0);
    setSelectedBranchId(null);
    setSelectedOperatorId(null);
    setSelectedExpiresAt(null);
    onClose();
  };

  const handleBranchChange = (id: string) => {
    // Otra sede: otros operadores y otro horario.
    setSelectedBranchId(id);
    setSelectedOperatorId(null);
    setSelectedExpiresAt(null);
  };

  const handleQrRetry = () => {
    setQrErrorUrl(null);
    setQrAttempt((n) => n + 1);
  };

  const handleCreate = () => {
    if (!branchId || !operatorId || !expiresAt) return;
    createSession.mutate(
      { branchId, userId: operatorId, expiresAt },
      { onSuccess: setSession }
    );
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-4 h-4 text-indigo-500" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6">
          {!session ? (
            <div className="space-y-4">
              {branches.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="operator-session-branch">{t("branch")}</Label>
                  <Select value={branchId ?? undefined} onValueChange={handleBranchChange}>
                    <SelectTrigger id="operator-session-branch">
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

              {!branchId ? null : optionsQuery.isPending ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : optionsQuery.isError ? (
                <p className="text-sm text-red-600">{t("optionsError")}</p>
              ) : !sessionWindow || expiryOptions.length === 0 ? (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  {t("noShift")}
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="operator-session-operator">{t("operator")}</Label>
                    {operators.length === 0 ? (
                      <p className="text-sm text-slate-500">{t("noOperators")}</p>
                    ) : (
                      <Select
                        value={operatorId ?? undefined}
                        onValueChange={setSelectedOperatorId}
                      >
                        <SelectTrigger id="operator-session-operator">
                          <SelectValue placeholder={t("operatorPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="operator-session-expires">{t("expiresAt")}</Label>
                    <Select
                      value={expiresAt ?? undefined}
                      onValueChange={setSelectedExpiresAt}
                    >
                      <SelectTrigger id="operator-session-expires">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {expiryOptions.map((option, index) => (
                          <SelectItem key={option.value} value={option.value}>
                            {formatBranchTime(option.value)}
                            {option.nextDay && ` (${t("nextDay")})`}
                            {index === expiryOptions.length - 1 &&
                              sessionWindow.scheduleConfigured &&
                              ` · ${t("closingTime")}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      {sessionWindow.scheduleConfigured
                        ? t("expiresHint")
                        : t("noScheduleHint")}
                    </p>
                  </div>
                </>
              )}

              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={!branchId || !businessId || !operatorId || !expiresAt}
                isLoading={createSession.isPending}
              >
                {t("create")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt={t("qrAlt")}
                    className="w-56 h-56 rounded-lg border border-slate-100"
                  />
                ) : qrFailed ? (
                  <div className="flex w-56 h-56 flex-col items-center justify-center gap-2 rounded-lg border border-slate-100 text-center">
                    <p className="px-4 text-sm text-slate-500">{t("qrError")}</p>
                    <Button variant="ghost" size="sm" onClick={handleQrRetry}>
                      {t("retry")}
                    </Button>
                  </div>
                ) : (
                  <Skeleton className="w-56 h-56" />
                )}
              </div>
              <p className="text-sm text-slate-500 text-center">
                {t("scanHint", {
                  operator: session.operatorName,
                  time: formatTime(session.expiresAt),
                })}
              </p>
              <Button asChild className="w-full">
                <a href={session.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink />
                  {t("openHere")}
                </a>
              </Button>
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                {t("doNotShare")}
              </p>
            </div>
          )}

          {activeSessions.length > 0 && (
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500">{t("activeSessions")}</p>
              <ul className="space-y-1">
                {activeSessions.map((active) => (
                  <li
                    key={active.id}
                    className="flex items-center justify-between gap-2 text-sm text-slate-700"
                  >
                    <span className="truncate">
                      {t("activeSessionLabel", {
                        operator: active.operatorName,
                        branch: active.branchName,
                        time: formatTime(active.expiresAt),
                      })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        revokeSession.mutate(active.id);
                        if (session?.id === active.id) setSession(null);
                      }}
                      disabled={revokeSession.isPending && revokeSession.variables === active.id}
                    >
                      {t("revoke")}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
