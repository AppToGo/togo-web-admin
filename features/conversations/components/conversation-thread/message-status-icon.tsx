import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MessageDeliveryStatus } from "../../types";

interface MessageStatusIconProps {
  status: MessageDeliveryStatus;
  errorCode?: string | null;
}

/**
 * Ticks de entrega para mensajes OUTBOUND (Fase C, Etapa 3) — Fase B
 * exponía `status`/`errorCode` en el DTO pero no los renderizaba.
 */
export function MessageStatusIcon({ status, errorCode }: MessageStatusIconProps) {
  const t = useTranslations("conversations");

  switch (status) {
    case "QUEUED":
      return <Clock className="h-3 w-3 opacity-60" aria-label={t("deliveryStatus.QUEUED")} />;
    case "SENT":
      return <Check className="h-3 w-3 opacity-60" aria-label={t("deliveryStatus.SENT")} />;
    case "DELIVERED":
      return <CheckCheck className="h-3 w-3 opacity-60" aria-label={t("deliveryStatus.DELIVERED")} />;
    case "READ":
      return <CheckCheck className="h-3 w-3 text-sky-300" aria-label={t("deliveryStatus.READ")} />;
    case "FAILED":
      return (
        <span
          className="flex items-center gap-1 text-red-200"
          title={errorCode ?? undefined}
        >
          <AlertCircle className="h-3 w-3" aria-label={t("deliveryStatus.FAILED")} />
        </span>
      );
    default:
      return null;
  }
}
