"use client";
/**
 * Icono de método de pago con tooltip. Extraído de `OrderCard` para
 * reutilizarlo en `PaymentStatusEditor` sin duplicar.
 */
import { useTranslations } from "next-intl";
import {
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Wallet,
} from "lucide-react";

export function PaymentMethodIcon({ method }: { method?: string }) {
  const t = useTranslations("orders");
  const getIconAndLabel = () => {
    if (!method) return { icon: CreditCard, label: t("paymentMethods.NOT_SPECIFIED") };
    const lower = method.toLowerCase();
    if (lower === "cash") return { icon: Banknote, label: t("paymentMethods.CASH") };
    if (lower.includes("card") || lower === "dataphone")
      return { icon: CreditCard, label: t("paymentMethods.CREDIT_CARD") };
    if (lower === "transfer")
      return { icon: ArrowLeftRight, label: t("paymentMethods.TRANSFER") };
    if (lower === "wallet") return { icon: Wallet, label: t("paymentMethods.OTHER") };
    return { icon: CreditCard, label: method };
  };

  const { icon: Icon, label } = getIconAndLabel();

  return (
    <div className="group relative">
      <Icon className="w-3.5 h-3.5 text-current" />
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {label}
      </div>
    </div>
  );
}
