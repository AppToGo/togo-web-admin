"use client";
/**
 * Movimiento manual: Ingreso (`cash.operate`) y Egreso/Retiro
 * (`cash.withdraw`). El retiro exige autorizador del mismo negocio y
 * motivo — el servidor lo valida (`authorizedByUserId`).
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "./CurrencyInput";
import { useCreateManualMovement } from "../hooks/useCashMutations";
import { useWithdrawalAuthorizers } from "../hooks/useCash";

type MovementKind = "MANUAL_IN" | "MANUAL_OUT" | "WITHDRAWAL";

interface ManualMovementDialogProps {
  businessId: string;
  branchId: string;
  sessionId: string | null;
  canOperate: boolean;
  canWithdraw: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualMovementDialog({
  businessId,
  branchId,
  sessionId,
  canOperate,
  canWithdraw,
  open,
  onOpenChange,
}: ManualMovementDialogProps) {
  const t = useTranslations("cash");
  const [kind, setKind] = useState<MovementKind>(canOperate ? "MANUAL_IN" : "WITHDRAWAL");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState("");
  const [reason, setReason] = useState("");
  const [authorizedBy, setAuthorizedBy] = useState("");
  const createMovement = useCreateManualMovement(businessId, branchId, sessionId ?? "");

  const isWithdrawal = kind === "WITHDRAWAL";
  // Endpoint propio del retiro (`cash.withdraw`), no el listado de usuarios
  // del negocio (`user.view`, que un cajero no tiene). Solo al necesitarlo.
  const { data: authorizers = [], isLoading: isLoadingAuthorizers } =
    useWithdrawalAuthorizers(businessId, branchId, open && isWithdrawal);
  const valid =
    !!sessionId &&
    amount > 0 &&
    (kind === "MANUAL_IN" || reason.trim().length > 0) &&
    (!isWithdrawal || authorizedBy.trim().length > 0);

  const submit = () => {
    if (!sessionId || !valid) return;
    createMovement.mutate(
      {
        type: kind,
        amount,
        category: category.trim() || undefined,
        notes: reason.trim() || undefined,
        reason: kind === "MANUAL_IN" ? undefined : reason.trim(),
        authorizedByUserId: isWithdrawal ? authorizedBy.trim() : undefined,
      },
      {
        onSuccess: () => {
          setAmount(0);
          setCategory("");
          setReason("");
          setAuthorizedBy("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {kind === "MANUAL_IN"
              ? t("movements.manualIn")
              : kind === "MANUAL_OUT"
                ? t("movements.manualOut")
                : t("movements.withdrawal")}
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <label htmlFor="cash-movement-kind" className="text-sm font-medium">
              {t("summary.movements")}
            </label>
            <Select
              value={kind}
              onValueChange={(value) => setKind(value as MovementKind)}
            >
              <SelectTrigger id="cash-movement-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {canOperate && (
                  <SelectItem value="MANUAL_IN">{t("movements.manualIn")}</SelectItem>
                )}
                {canWithdraw && (
                  <>
                    <SelectItem value="MANUAL_OUT">{t("movements.manualOut")}</SelectItem>
                    <SelectItem value="WITHDRAWAL">{t("movements.withdrawal")}</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="cash-movement-amount" className="text-sm font-medium">
              {t("movements.amount")}
            </label>
            <CurrencyInput
              id="cash-movement-amount"
              value={amount}
              onChange={setAmount}
            />
          </div>
          {kind === "MANUAL_OUT" && (
            <div className="space-y-2">
              <label htmlFor="cash-movement-category" className="text-sm font-medium">
                {t("movements.category")}
              </label>
              <Input
                id="cash-movement-category"
                value={category}
                placeholder={t("movements.categoryPlaceholder")}
                onChange={(event) => setCategory(event.target.value)}
              />
            </div>
          )}
          {kind !== "MANUAL_IN" && (
            <div className="space-y-2">
              <label htmlFor="cash-movement-reason" className="text-sm font-medium">
                {t("movements.reason")}
              </label>
              <Textarea
                id="cash-movement-reason"
                value={reason}
                placeholder={t("movements.reasonPlaceholder")}
                onChange={(event) => setReason(event.target.value)}
                rows={2}
              />
            </div>
          )}
          {isWithdrawal && (
            <div className="space-y-2">
              <label htmlFor="cash-movement-auth" className="text-sm font-medium">
                {t("movements.authorizedBy")}
              </label>
              <Select value={authorizedBy} onValueChange={setAuthorizedBy}>
                <SelectTrigger id="cash-movement-auth">
                  <SelectValue placeholder={t("movements.authorizedBy")} />
                </SelectTrigger>
                <SelectContent>
                  {authorizers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                {!isLoadingAuthorizers && authorizers.length === 0
                  ? t("movements.noAuthorizers")
                  : t("movements.authorizedByHint")}
              </p>
            </div>
          )}
        </div>
        <DrawerFooter>
          <Button onClick={submit} disabled={!valid || createMovement.isPending}>
            {t("movements.register")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
