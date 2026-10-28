"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getCardSetup, type CardInput } from "../../services/subscription.service";
import { useSubscriptionActions } from "../../hooks/useSubscriptionActions";

interface CardFormDialogProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY: CardInput = { number: "", cvc: "", expMonth: "", expYear: "", cardHolder: "" };

/**
 * Guardar o cambiar la tarjeta del cobro automático. La tarjeta se tokeniza
 * en el navegador directo contra Wompi (los datos no pasan por ToGo) y el
 * dueño acepta los términos de Wompi, con sus enlaces, antes de guardarla.
 */
export function CardFormDialog({ open, onClose }: CardFormDialogProps) {
  const t = useTranslations("subscription.cardForm");
  const businessId = useEffectiveBusinessId();
  const { saveCard } = useSubscriptionActions();
  const [card, setCard] = React.useState<CardInput>(EMPTY);
  const [accepted, setAccepted] = React.useState(false);

  const { data: setup, isLoading } = useQuery({
    queryKey: ["billing", "card-setup", businessId],
    queryFn: () => getCardSetup(businessId!),
    enabled: open && !!businessId,
    // Los tokens de aceptación vencen: se piden de nuevo en cada apertura.
    staleTime: 0,
    gcTime: 0,
  });

  React.useEffect(() => {
    if (open) {
      setCard(EMPTY);
      setAccepted(false);
    }
  }, [open]);

  const set = (field: keyof CardInput) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setCard((prev) => ({ ...prev, [field]: event.target.value }));

  const complete =
    card.number.replace(/\s+/g, "").length >= 13 &&
    card.cvc.length >= 3 &&
    card.expMonth.length > 0 &&
    card.expYear.length >= 2 &&
    card.cardHolder.trim().length > 2;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!setup || !accepted || !complete) return;
    saveCard.mutate({ card, setup }, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <p className="text-sm text-slate-500">{t("subtitle")}</p>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="card-number">{t("number")}</Label>
            <Input
              id="card-number"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4242 4242 4242 4242"
              value={card.number}
              onChange={set("number")}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="card-exp-month">{t("expMonth")}</Label>
              <Input
                id="card-exp-month"
                inputMode="numeric"
                autoComplete="cc-exp-month"
                placeholder="MM"
                maxLength={2}
                value={card.expMonth}
                onChange={set("expMonth")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="card-exp-year">{t("expYear")}</Label>
              <Input
                id="card-exp-year"
                inputMode="numeric"
                autoComplete="cc-exp-year"
                placeholder="AA"
                maxLength={4}
                value={card.expYear}
                onChange={set("expYear")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="card-cvc">{t("cvc")}</Label>
              <Input
                id="card-cvc"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                maxLength={4}
                value={card.cvc}
                onChange={set("cvc")}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="card-holder">{t("holder")}</Label>
            <Input
              id="card-holder"
              autoComplete="cc-name"
              value={card.cardHolder}
              onChange={set("cardHolder")}
            />
          </div>

          <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-3">
            <Checkbox
              id="card-terms"
              checked={accepted}
              onCheckedChange={(value) => setAccepted(value === true)}
              disabled={!setup}
              className="mt-0.5"
            />
            <label htmlFor="card-terms" className="text-xs text-slate-600 leading-relaxed">
              {t.rich("terms", {
                privacy: (chunks) => (
                  <a
                    href={setup?.acceptancePermalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {chunks}
                  </a>
                ),
                personal: (chunks) => (
                  <a
                    href={setup?.personalDataPermalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </label>
          </div>

          <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Lock className="h-3 w-3" />
            {t("secure")}
          </p>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isLoading || !setup || !accepted || !complete || saveCard.isPending}
            >
              {saveCard.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
