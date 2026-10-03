"use client";

/**
 * Visor del comprobante de pago
 *
 * Cuando el cliente paga por transferencia manda la captura o el PDF por
 * WhatsApp, y alguien del negocio tiene que mirarlo antes de dar el pedido
 * por pagado. Esto es ese momento: el comprobante en grande y el botón para
 * confirmar, sin salir del tablero.
 *
 * La URL viene firmada por el backend con un TTL de 15 minutos, así que el
 * visor pide el comprobante sólo cuando se abre — no al pintar cada tarjeta.
 */

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Receipt } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useOrderPaymentProof } from "../hooks/useOrderPaymentProof";
import { PaymentVerificationCard } from "./PaymentVerificationCard";
import { useUpdateOrderPaymentStatus } from "../hooks/useOrders";
import type { Order } from "../types/order.types";
import type { PaymentProofItem } from "../services/order.service";

type UnavailableKey =
  | "WHATSAPP_MEDIA_NOT_ARCHIVED"
  | "UNRECOGNIZED_REF"
  | "PRESIGN_FAILED"
  | "NOT_FOUND"
  | "FAILED";

/** Las imágenes se muestran acá mismo; un PDF se abre aparte. */
function isInlineImage(
  proofType: string | null,
  mimeType: string | null,
  url: string | null
): boolean {
  if (mimeType?.startsWith("image/")) return true;
  if (proofType === "image") return true;
  // Último recurso: la key firmada conserva la extensión del archivo.
  return !!url && /\.(png|jpe?g|webp|gif|heic)(\?|$)/i.test(url);
}

function ProofBody({ orderId, open }: { orderId: string; open: boolean }) {
  const t = useTranslations("orders");
  // Cuál se está mirando, identificado por su fecha y no por su posición: la
  // query es hija de `ORDERS_KEYS.detail`, así que se revalida con cualquier
  // cambio del pedido. Si llega un comprobante nuevo mientras el visor está
  // abierto, la lista se corre y un índice dejaría al operador mirando otro
  // archivo del que eligió, sin que nada se lo diga.
  // `undefined` es "todavía no eligió" y no se confunde con un
  // comprobante sin fecha: comparar contra null haría que el primero sin
  // fecha se robara la selección.
  const [selectedAt, setSelectedAt] = useState<string | undefined>(undefined);
  const { data, isLoading, isError, error } = useOrderPaymentProof(
    orderId,
    open
  );

  if (isLoading) {
    return (
      <div className="space-y-3" aria-label={t("paymentProof.loading")}>
        <Skeleton className="h-72 w-full rounded-lg" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  if (isError || !data) {
    const status = (error as { response?: { status?: number } } | null)
      ?.response?.status;
    const key: UnavailableKey = status === 404 ? "NOT_FOUND" : "FAILED";
    return <ProofUnavailable reason={key} />;
  }

  // El cliente puede haber mandado varios; el operador los mira todos antes
  // de marcar el pago. `proofs` es opcional: una API sin ese campo cae al
  // único de `media`, que es el más reciente.
  const proofs: PaymentProofItem[] =
    data.proofs && data.proofs.length > 0
      ? data.proofs
      : [
          {
            receivedAt: data.receivedAt,
            proofType: data.proofType,
            media: data.media,
          },
        ];

  // Del más nuevo al más viejo. El endpoint ya los manda así, pero el orden
  // decide cuál se abre primero y cuál lleva la etiqueta "El último": si
  // alguna vez llegaran ascendentes, el operador confirmaría el pago mirando
  // una captura vieja. Defenderlo acá cuesta una línea.
  const ordered = [...proofs].sort(
    (a, b) =>
      new Date(b.receivedAt ?? 0).getTime() -
      new Date(a.receivedAt ?? 0).getTime()
  );

  const currentIndex = Math.max(
    0,
    selectedAt === undefined
      ? 0
      : ordered.findIndex((p) => p.receivedAt === selectedAt)
  );
  const current = ordered[currentIndex];
  const { media, proofType } = current;
  const inline =
    !!media.url && isInlineImage(proofType, media.mimeType, media.url);

  const picker =
    ordered.length > 1 ? (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">
          {t("paymentProof.count", { count: ordered.length })}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {ordered.map((p, i) => (
            <button
              key={`${p.receivedAt ?? "sin-fecha"}-${i}`}
              type="button"
              onClick={() => setSelectedAt(p.receivedAt ?? undefined)}
              className={cn(
                "rounded-md border px-2 py-1 text-xs transition-colors",
                i === currentIndex
                  ? "border-sky-300 bg-sky-50 text-sky-800"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {i === 0
                ? t("paymentProof.latest")
                : p.receivedAt
                  ? new Date(p.receivedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : `#${ordered.length - i}`}
            </button>
          ))}
        </div>
      </div>
    ) : null;

  // El selector va SIEMPRE, también cuando el elegido no se puede mostrar.
  // Los comprobantes viejos guardaron el media id de WhatsApp y vuelven con
  // `url: null`: si el aviso reemplazara todo el cuerpo, elegir uno de esos
  // dejaba al operador sin forma de volver al que sí se ve, salvo cerrar y
  // reabrir el visor.
  if (!media.url) {
    return (
      <div className="space-y-3">
        {picker}
        <ProofUnavailable
          reason={(media.unavailableReason ?? "FAILED") as UnavailableKey}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {picker}

      {inline ? (
        <a
          href={media.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de un dominio externo con TTL corto; el optimizador de Next no puede cachearla */}
          <img
            src={media.url}
            alt={t("paymentProof.title")}
            className="mx-auto max-h-[60vh] w-auto object-contain"
          />
        </a>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
          <Receipt className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <p className="mb-4 text-sm text-slate-600">
            {t("paymentProof.documentHint")}
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href={media.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              {t("paymentProof.openExternal")}
            </a>
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        {current.receivedAt ? (
          <span>
            {t("paymentProof.receivedAt", {
              date: new Date(current.receivedAt).toLocaleString(),
            })}
          </span>
        ) : (
          <span />
        )}
        {inline && (
          <a
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-600 underline-offset-2 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            {t("paymentProof.openExternal")}
          </a>
        )}
      </div>
    </div>
  );
}

function ProofUnavailable({ reason }: { reason: UnavailableKey }) {
  const t = useTranslations("orders");
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
      <Receipt className="mx-auto mb-3 h-10 w-10 text-amber-400" />
      <p className="text-sm text-amber-800">
        {t(`paymentProof.unavailable.${reason}`)}
      </p>
    </div>
  );
}

interface PaymentProofDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentProofDialog({
  order,
  open,
  onOpenChange,
}: PaymentProofDialogProps) {
  const t = useTranslations("orders");
  const updatePaymentStatus = useUpdateOrderPaymentStatus();
  const isPaid = order.paymentStatus === "PAID";

  const handleConfirm = useCallback(() => {
    updatePaymentStatus.mutate(
      {
        orderId: order.id,
        data: {
          paymentStatus: "PAID",
          changeNotes: t("paymentNotes.confirmedFromAdmin"),
        },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  }, [order.id, updatePaymentStatus, onOpenChange, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("paymentProof.title")}</DialogTitle>
          <DialogDescription>
            {t("paymentProof.orderLabel", {
              order: order.orderNumber ?? order.id.slice(-6).toUpperCase(),
            })}
          </DialogDescription>
        </DialogHeader>

        <ProofBody orderId={order.id} open={open} />

        {open && <PaymentVerificationCard orderId={order.id} />}

        <DialogFooter>
          {isPaid ? (
            <span className="text-sm font-medium text-green-700">
              {t("paymentProof.alreadyPaid")}
            </span>
          ) : (
            <Button
              onClick={handleConfirm}
              isLoading={updatePaymentStatus.isPending}
            >
              {updatePaymentStatus.isPending
                ? t("paymentProof.confirming")
                : t("paymentProof.confirm")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Icono de "hay comprobante" para el tablero y las listas.
 *
 * No renderiza nada cuando el pedido no tiene comprobante, así se puede
 * poner al lado del badge de pago sin condicionales en cada sitio.
 */
export function PaymentProofIndicator({
  order,
  className,
  variant = "icon",
}: {
  order: Order;
  className?: string;
  /** "icon" para el tablero y las listas; "labeled" donde hay lugar. */
  variant?: "icon" | "labeled";
}) {
  const t = useTranslations("orders");
  const [open, setOpen] = useState(false);

  if (!order.paymentProofUrl) return null;

  return (
    // stopPropagation: el click no tiene que abrir además el detalle del
    // pedido ni arrancar un drag de la tarjeta.
    <span
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title={t("paymentProof.tooltip")}
        aria-label={t("paymentProof.tooltip")}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50",
          "text-sky-700 transition-opacity hover:opacity-80",
          variant === "labeled" ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5",
          className
        )}
      >
        <Receipt className={variant === "labeled" ? "h-3.5 w-3.5" : "h-3 w-3"} />
        {variant === "labeled" && <span>{t("paymentProof.badge")}</span>}
      </button>

      {open && (
        <PaymentProofDialog
          order={order}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </span>
  );
}
