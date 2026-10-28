"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { extractErrorMessage } from "@/lib/error.utils";
import {
  cancelScheduledDowngrade,
  cancelSubscription,
  payNow,
  saveCard,
  scheduleDowngrade,
  tokenizeCard,
  undoCancelSubscription,
  upgradePlan,
  type CardInput,
  type CardSetup,
  type PaymentStart,
} from "../services/subscription.service";
import { redirectToWompiCheckout } from "../utils/wompi-checkout.util";
import { BILLING_KEYS } from "./query-keys";

/** Reintentos del estado mientras Wompi confirma un cobro con tarjeta. */
const CHARGE_REFRESHES = [3000, 8000, 15000];

/**
 * Acciones de autogestión de la suscripción (docs/cobro-suscripciones.md §6
 * en api-togo). Todas refrescan el estado de cuenta; un pago con tarjeta
 * guardada se confirma por webhook, así que el estado se vuelve a pedir
 * unos segundos después. Sin tarjeta, el pago abre el checkout de Wompi.
 */
export function useSubscriptionActions() {
  const t = useTranslations("subscription.actions");
  const businessId = useEffectiveBusinessId();
  const queryClient = useQueryClient();

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: BILLING_KEYS.all });

  const handlePayment = (payment: PaymentStart | null) => {
    if (!payment) return;
    if (payment.mode === "CHECKOUT") {
      redirectToWompiCheckout(payment.checkout);
      return;
    }
    toast.success(t("chargeStarted"));
    for (const delay of CHARGE_REFRESHES) setTimeout(refresh, delay);
  };

  const onError = (fallback: string) => (error: unknown) =>
    toast.error(extractErrorMessage(error, fallback));

  const requireBusiness = () => {
    // Llega al toast vía extractErrorMessage: traducido (p. ej. staff de
    // ToGo sin negocio elegido).
    if (!businessId) throw new Error(t("noBusiness"));
    return businessId;
  };

  const pay = useMutation({
    mutationFn: () => payNow(requireBusiness()),
    onSuccess: handlePayment,
    onError: onError(t("payError")),
  });

  const upgrade = useMutation({
    mutationFn: (plan: number) => upgradePlan(requireBusiness(), plan),
    onSuccess: (payment) => {
      handlePayment(payment);
      refresh();
    },
    onError: onError(t("upgradeError")),
  });

  const downgrade = useMutation({
    mutationFn: (plan: number) => scheduleDowngrade(requireBusiness(), plan),
    onSuccess: (quote) => {
      toast.success(t("downgradeScheduled", { planName: quote.planName }));
      refresh();
    },
    onError: onError(t("downgradeError")),
  });

  const undoDowngrade = useMutation({
    mutationFn: () => cancelScheduledDowngrade(requireBusiness()),
    onSuccess: () => {
      toast.success(t("downgradeUndone"));
      refresh();
    },
    onError: onError(t("genericError")),
  });

  const cancel = useMutation({
    mutationFn: () => cancelSubscription(requireBusiness()),
    onSuccess: () => {
      toast.success(t("cancelScheduled"));
      refresh();
    },
    onError: onError(t("genericError")),
  });

  const undoCancel = useMutation({
    mutationFn: () => undoCancelSubscription(requireBusiness()),
    onSuccess: () => {
      toast.success(t("cancelUndone"));
      refresh();
    },
    onError: onError(t("genericError")),
  });

  /**
   * Guarda la tarjeta: la tokeniza en el navegador contra Wompi y a la API
   * solo le manda el token, con los términos aceptados.
   */
  const saveCardMutation = useMutation({
    mutationFn: async ({ card, setup }: { card: CardInput; setup: CardSetup }) => {
      const id = requireBusiness();
      const cardToken = await tokenizeCard(setup, card);
      return saveCard(id, {
        cardToken,
        acceptanceToken: setup.acceptanceToken,
        personalDataToken: setup.personalDataToken,
      });
    },
    onSuccess: (result) => {
      toast.success(t("cardSaved"));
      refresh();
      handlePayment(result.payment);
    },
    onError: onError(t("cardError")),
  });

  return {
    pay,
    upgrade,
    downgrade,
    undoDowngrade,
    cancel,
    undoCancel,
    saveCard: saveCardMutation,
  };
}
