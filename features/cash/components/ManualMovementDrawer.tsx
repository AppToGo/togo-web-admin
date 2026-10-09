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
  DrawerDescription,
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
import { cn } from "@/lib/utils";
import { CurrencyInput } from "./CurrencyInput";
import { useCreateManualMovement } from "../hooks/useCashMutations";
import { useWithdrawalAuthorizers } from "../hooks/useCash";
import { formatCOP } from "../utils/cash.utils";

export type MovementKind = "MANUAL_IN" | "MANUAL_OUT" | "WITHDRAWAL";

interface ManualMovementDrawerProps {
  businessId: string;
  branchId: string;
  sessionId: string | null;
  registerName: string;
  expectedAmount: string;
  initialKind: MovementKind;
  canOperate: boolean;
  canWithdraw: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualMovementDrawer({
  businessId,
  branchId,
  sessionId,
  registerName,
  expectedAmount,
  initialKind,
  canOperate,
  canWithdraw,
  open,
  onOpenChange,
}: ManualMovementDrawerProps) {
  const t = useTranslations("cash");
  const [kind, setKind] = useState<MovementKind>(initialKind);
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState("");
  const [reason, setReason] = useState("");
  const [authorizedBy, setAuthorizedBy] = useState("");
  const createMovement = useCreateManualMovement(businessId, branchId, sessionId ?? "");

  const isIncome = kind === "MANUAL_IN";
  const isWithdrawal = kind === "WITHDRAWAL";
  // Endpoint propio del retiro (`cash.withdraw`), no el listado de usuarios
  // del negocio (`user.view`, que un cajero no tiene). Solo al necesitarlo.
  const { data: authorizers = [], isLoading: isLoadingAuthorizers } =
    useWithdrawalAuthorizers(businessId, branchId, open && isWithdrawal);
  const valid =
    !!sessionId &&
    amount > 0 &&
    (isIncome || reason.trim().length > 0) &&
    (!isWithdrawal || authorizedBy.trim().length > 0);

  const remaining = Number(expectedAmount) + (isIncome ? amount : -amount);

  const kinds: Array<{ value: MovementKind; label: string; allowed: boolean }> = [
    { value: "MANUAL_IN", label: t("actions.income"), allowed: canOperate },
    { value: "MANUAL_OUT", label: t("actions.expense"), allowed: canWithdraw },
    { value: "WITHDRAWAL", label: t("movements.withdrawal"), allowed: canWithdraw },
  ];

  const submit = () => {
    if (!sessionId || !valid) return;
    createMovement.mutate(
      {
        type: kind,
        amount,
        category: category.trim() || undefined,
        notes: reason.trim() || undefined,
        reason: isIncome ? undefined : reason.trim(),
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

  const confirmLabel = isIncome
    ? t("movementDrawer.confirmIn", { amount: formatCOP(amount) })
    : isWithdrawal
      ? t("movementDrawer.confirmWithdrawal", { amount: formatCOP(amount) })
      : t("movementDrawer.confirmOut", { amount: formatCOP(amount) });

  return (
    <Drawer open={open} onOpenChange={onOpenChange} isLoading={createMovement.isPending}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("movementDrawer.title")}</DrawerTitle>
          <DrawerDescription>
            {t("movementDrawer.desc", {
              register: registerName,
              amount: formatCOP(expectedAmount),
            })}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-6 py-4">
          <div
            role="group"
            aria-label={t("movementDrawer.type")}
            className="grid grid-cols-3 gap-1 rounded-card bg-slate-100 p-1"
          >
            {kinds.map((option) => {
              const active = kind === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={!option.allowed}
                  aria-pressed={active}
                  onClick={() => setKind(option.value)}
                  className={cn(
                    "rounded-lg py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    active
                      ? option.value === "MANUAL_IN"
                        ? "bg-white text-emerald-700 shadow-card-sm"
                        : "bg-white text-red-700 shadow-card-sm"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label htmlFor="cash-movement-amount" className="text-sm font-medium">
              {t("movements.amount")}
            </label>
            <CurrencyInput
              id="cash-movement-amount"
              size="lg"
              value={amount}
              onChange={setAmount}
              placeholder="0"
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
                maxLength={60}
                placeholder={t("movements.categoryPlaceholder")}
                onChange={(event) => setCategory(event.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="cash-movement-reason" className="text-sm font-medium">
              {isIncome ? t("movementDrawer.noteOptional") : t("movements.reason")}
            </label>
            <Textarea
              id="cash-movement-reason"
              value={reason}
              maxLength={500}
              placeholder={isIncome ? undefined : t("movements.reasonPlaceholder")}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
            />
          </div>

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

          <div className="flex items-center justify-between rounded-card bg-slate-50 p-4 text-sm text-slate-600">
            <span>{t("movementDrawer.remaining")}</span>
            <strong className="tabular-nums text-slate-900">{formatCOP(remaining)}</strong>
          </div>
          <p className="text-xs text-slate-500">{t("movementDrawer.immutable")}</p>
        </div>
        <DrawerFooter className="gap-2 sm:space-x-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant={isIncome ? "default" : "destructive"}
            onClick={submit}
            disabled={!valid || createMovement.isPending}
          >
            {confirmLabel}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
