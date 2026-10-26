"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";
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
  useRevokeOperatorCatalogSession,
} from "../hooks/useOperatorCatalogSessions";
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
 * escaneando el QR con su celular). La sesión dura un turno; el link con
 * el token solo existe mientras este diálogo está abierto.
 */
export function OperatorCatalogSessionDialog({
  isOpen,
  onClose,
  businessId: businessIdProp,
}: OperatorCatalogSessionDialogProps) {
  const t = useTranslations("orders.catalogSession");
  const userBusinessId = useAuthStore((state) => state.user?.businessId ?? null);
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
  const qrDataUrl = session && qr?.url === session.url ? qr.dataUrl : null;

  const createSession = useCreateOperatorCatalogSession(businessId);
  const revokeSession = useRevokeOperatorCatalogSession(businessId);
  const { data: activeSessions = [] } = useMyOperatorCatalogSessions(businessId, isOpen);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    QRCode.toDataURL(session.url, { width: 360, margin: 1, errorCorrectionLevel: "M" }).then(
      (dataUrl) => {
        if (!cancelled) setQr({ url: session.url, dataUrl });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [session]);

  const handleClose = () => {
    // El token no queda guardado en el admin: se descarta al cerrar.
    setSession(null);
    setQr(null);
    setSelectedBranchId(null);
    onClose();
  };

  const handleCreate = () => {
    if (!branchId) return;
    createSession.mutate({ branchId }, { onSuccess: setSession });
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

        {!session ? (
          <div className="space-y-4">
            {branches.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="operator-session-branch">{t("branch")}</Label>
                <Select value={branchId ?? undefined} onValueChange={setSelectedBranchId}>
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
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={!branchId || !businessId}
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
              ) : (
                <Skeleton className="w-56 h-56" />
              )}
            </div>
            <p className="text-sm text-slate-500 text-center">
              {t("scanHint", { time: formatTime(session.expiresAt) })}
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
      </DialogContent>
    </Dialog>
  );
}
