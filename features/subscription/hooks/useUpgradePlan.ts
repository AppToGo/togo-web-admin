"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { upgradePlan } from "../services/subscription.service";
import { extractErrorMessage } from "@/lib/error.utils";

export function useUpgradePlan() {
  const { setSubscriptionPlan } = useAuthStore();
  const user = useCurrentUser();

  return useMutation({
    mutationFn: async (newPlan: number) => {
      if (!user?.businessId) throw new Error("No business associated with user");
      return upgradePlan(user.businessId, { plan: newPlan });
    },
    onSuccess: (data) => {
      setSubscriptionPlan(data.subscriptionPlan);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Error al actualizar el plan"));
    },
  });
}
