"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { extractErrorMessage } from "@/lib/error.utils";
import {
  cancelScheduledDowngrade,
  cancelSubscription,
  getCardSetup,
  payNow,
  saveCard,
  scheduleDowngrade,
  undoCancelSubscription,
  upgradePlan,
  type PaymentStart,
} from "../services/subscription.service";
import { redirectToWompiCheckout } from "../utils/wompi-checkout.util";
import { openWompiTokenizeWidget } from "../utils/wompi-widget.util";
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

  /** Crea la fuente de pago con el token que devolvió el widget de Wompi. */
  const saveCardMutation = useMutation({
    mutationFn: (payment: { token: string; type: string }) =>
      saveCard(requireBusiness(), {
        cardToken: payment.token,
        sourceType: payment.type,
      }),
    onSuccess: (result) => {
      toast.success(t("cardSaved"));
      refresh();
      handlePayment(result.payment);
    },
    onError: onError(t("cardError")),
  });

  /**
   * Guardar o cambiar la tarjeta: abre el widget oficial de Wompi en modo
   * tokenización (la tarjeta se captura en la ventana de Wompi, nunca en
   * una página de ToGo). Si el dueño cierra la ventana no pasa nada.
   */
  const [isOpeningCardWidget, setIsOpeningCardWidget] = React.useState(false);
  const openCardWidget = async () => {
    setIsOpeningCardWidget(true);
    try {
      const setup = await getCardSetup(requireBusiness());
      await openWompiTokenizeWidget(setup.publicKey, (payment) =>
        saveCardMutation.mutate(payment)
      );
    } catch (error) {
      onError(t("cardError"))(error);
    } finally {
      setIsOpeningCardWidget(false);
    }
  };

  return {
    pay,
    upgrade,
    downgrade,
    undoDowngrade,
    cancel,
    undoCancel,
    saveCard: saveCardMutation,
    openCardWidget,
    isOpeningCardWidget,
  };
}
