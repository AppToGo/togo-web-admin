"use client";

/**
 * Visor del comprobante de pago.
 *
 * Cuando el cliente paga por transferencia manda la captura o el PDF por
 * WhatsApp, y alguien del negocio tiene que mirarlo antes de dar el pedido
 * por pagado. Esto es ese momento: el comprobante a la izquierda, el
 * análisis a la derecha y la decisión abajo, sin salir del tablero.
 *
 * La URL viene firmada por el backend con un TTL de 15 minutos, así que el
 * visor pide el comprobante sólo cuando se abre — no al pintar cada tarjeta.
 */

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ExternalLink,
  Receipt,
  ShieldAlert,
  X,
  ZoomIn,
} from "lucide-react";
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
import { HoverTooltip } from "./HoverTooltip";
import {
  useRejectPaymentProof,
  useUpdateOrderPaymentStatus,
} from "../hooks/useOrders";
import type { Order } from "../types/order.types";
import type { PaymentProof, PaymentProofItem } from "../services/order.service";

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

function ProofUnavailable({ reason }: { reason: UnavailableKey }) {
  const t = useTranslations("orders");
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
      <Receipt className="mx-auto mb-3 h-10 w-10 text-amber-400" />
      <p className="text-sm text-amber-800">
        {t(`paymentProof.unavailable.${reason}`)}
      </p>
    </div>
  );
}

function ProofPicker({
  proofs,
  currentIndex,
  onSelect,
}: {
  proofs: PaymentProofItem[];
  currentIndex: number;
  onSelect: (receivedAt: string | undefined) => void;
}) {
  const t = useTranslations("orders");
  if (proofs.length <= 1) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-500">
        {t("paymentProof.count", { count: proofs.length })}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {proofs.map((p, i) => (
          <button
            key={`${p.receivedAt ?? "sin-fecha"}-${i}`}
            type="button"
            onClick={() => onSelect(p.receivedAt ?? undefined)}
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
                : `#${proofs.length - i}`}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Comprobante ampliado sobre toda la pantalla.
 *
 * Va en un portal al body: dentro del diálogo, `fixed inset-0` quedaba
 * recortado a la caja del diálogo (su `backdrop-filter` y el
 * `overflow-y-auto` lo vuelven el contenedor del `fixed`), así que la
 * imagen casi no crecía y con el contenido scrolleado aparecía corrida.
 *
 * Escape cierra solo la imagen: se atiende en captura sobre `window` y no
 * sigue hasta el listener del Dialog, que cerraba el visor entero.
 */
function ZoomOverlay({
  url,
  alt,
  onClose,
}: {
  url: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  return createPortal(
    <div
      className="pointer-events-auto fixed inset-0 z-[200] flex cursor-zoom-out items-center justify-center p-6"
      style={{ background: "rgba(15,23,42,.85)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- misma URL firmada del visor */}
      <img src={url} alt={alt} className="max-h-full max-w-full rounded-2xl" />
    </div>,
    document.body
  );
}

/**
 * Comprobantes del pedido, del más nuevo al más viejo. `proofs` es
 * opcional: una API sin ese campo cae al único de `media`, que es el más
 * reciente. El endpoint ya los manda descendentes, pero el orden decide
 * cuál se abre primero, cuál lleva "El último" y sobre cuál se puede
 * rechazar: si alguna vez llegaran ascendentes, el operador confirmaría el
 * pago mirando una captura vieja.
 */
function orderedProofs(data: PaymentProof): PaymentProofItem[] {
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
  return [...proofs].sort(
    (a, b) =>
      new Date(b.receivedAt ?? 0).getTime() -
      new Date(a.receivedAt ?? 0).getTime()
  );
}

/**
 * Índice del comprobante elegido. Se identifica por su fecha y no por su
 * posición: la query es hija de `ORDERS_KEYS.detail`, así que se revalida
 * con cualquier cambio del pedido, y si llega uno nuevo con el visor
 * abierto un índice dejaría al operador mirando otro archivo sin saberlo.
 * `undefined` es "todavía no eligió" (= el último) y no se confunde con un
 * comprobante sin fecha.
 */
function selectedIndex(
  ordered: PaymentProofItem[],
  selectedAt: string | undefined
): number {
  return Math.max(
    0,
    selectedAt === undefined
      ? 0
      : ordered.findIndex((p) => p.receivedAt === selectedAt)
  );
}

function ProofViewer({
  orderId,
  open,
  selectedAt,
  onSelect,
}: {
  orderId: string;
  open: boolean;
  selectedAt: string | undefined;
  onSelect: (receivedAt: string | undefined) => void;
}) {
  const t = useTranslations("orders");
  const [zoom, setZoom] = useState(false);
  const { data, isLoading, isError, error } = useOrderPaymentProof(
    orderId,
    open
  );

  if (isLoading) {
    return (
      <div className="space-y-3" aria-label={t("paymentProof.loading")}>
        <Skeleton className="h-72 w-full rounded-2xl" />
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
  // de marcar el pago.
  const ordered = orderedProofs(data);
  const currentIndex = selectedIndex(ordered, selectedAt);
  const current = ordered[currentIndex];
  const { media, proofType } = current;
  const inline =
    !!media.url && isInlineImage(proofType, media.mimeType, media.url);

  // El selector va SIEMPRE, también cuando el elegido no se puede mostrar.
  // Los comprobantes viejos guardaron el media id de WhatsApp y vuelven con
  // `url: null`: si el aviso reemplazara todo el cuerpo, elegir uno de esos
  // dejaba al operador sin forma de volver al que sí se ve, salvo cerrar y
  // reabrir el visor.
  return (
    <div className="flex min-h-0 flex-col gap-4">
      <ProofPicker
        proofs={ordered}
        currentIndex={currentIndex}
        onSelect={onSelect}
      />

      {!media.url ? (
        <ProofUnavailable
          reason={(media.unavailableReason ?? "FAILED") as UnavailableKey}
        />
      ) : (
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-slate-100">
          {inline ? (
            <button
              type="button"
              onClick={() => setZoom(true)}
              title={t("paymentProof.zoom")}
              className="group relative flex min-h-0 flex-1 items-start justify-center overflow-hidden px-5 pt-5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de un dominio externo con TTL corto; el optimizador de Next no puede cachearla */}
              <img
                src={media.url}
                alt={t("paymentProof.title")}
                className="w-full rounded-2xl"
                style={{ boxShadow: "0 6px 20px rgba(15,23,42,.12)" }}
              />
              <span className="absolute bottom-3 right-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-900/85 px-3 text-[12px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                <ZoomIn className="h-3.5 w-3.5" />
                {t("paymentProof.zoom")}
              </span>
            </button>
          ) : (
            <div className="bg-slate-50 p-6 text-center">
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
          <a
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 shrink-0 items-center justify-center gap-1.5 border-t border-slate-200 bg-white/60 text-[13px] font-semibold text-slate-700 hover:bg-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("paymentProof.openExternal")}
          </a>
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
      </div>

      {zoom && inline && media.url && (
        <ZoomOverlay
          url={media.url}
          alt={t("paymentProof.title")}
          onClose={() => setZoom(false)}
        />
      )}
    </div>
  );
}

/**
 * Estado final del visor. `rejectedNotNotified` y `rejectedNoPhone`: el
 * comprobante se rechazó pero el cliente no recibe el aviso (ventana de
 * 24 h de WhatsApp cerrada o sin teléfono) y el negocio tiene que
 * contactarlo por otro medio.
 */
type DoneState =
  "confirmed" | "rejected" | "rejectedNotNotified" | "rejectedNoPhone" | null;

const DONE_MESSAGE_KEYS = {
  confirmed: "paymentProof.confirmedBanner",
  rejected: "paymentProof.rejectedBanner",
  rejectedNotNotified: "paymentProof.rejectedNotNotified",
  rejectedNoPhone: "paymentProof.rejectedNoPhone",
} as const;

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
  const rejectPaymentProof = useRejectPaymentProof();
  const [done, setDone] = useState<DoneState>(null);
  const [selectedAt, setSelectedAt] = useState<string | undefined>(undefined);
  // Misma query que el visor (comparten caché): para saber si el operador
  // está mirando el último comprobante.
  const { data: proofData } = useOrderPaymentProof(order.id, open);
  // El rechazo es del pedido: le pide al cliente uno nuevo. Solo tiene
  // sentido sobre el último que mandó; rechazar mirando uno viejo pediría
  // otro aunque el último estuviera bien.
  const viewingLatest =
    !proofData || selectedIndex(orderedProofs(proofData), selectedAt) === 0;
  const isPaid = order.paymentStatus === "PAID";
  const busy = updatePaymentStatus.isPending || rejectPaymentProof.isPending;

  const handleConfirm = useCallback(() => {
    updatePaymentStatus.mutate(
      {
        orderId: order.id,
        data: {
          paymentStatus: "PAID",
          changeNotes: t("paymentNotes.confirmedFromAdmin"),
        },
      },
      { onSuccess: () => setDone("confirmed") }
    );
  }, [order.id, updatePaymentStatus, t]);

  const handleReject = useCallback(() => {
    rejectPaymentProof.mutate(
      { orderId: order.id },
      {
        onSuccess: (result) =>
          setDone(
            result.customerNotified
              ? "rejected"
              : result.reason === "NO_PHONE"
                ? "rejectedNoPhone"
                : "rejectedNotNotified"
          ),
      }
    );
  }, [order.id, rejectPaymentProof]);

  const handleClose = useCallback(() => {
    // Al cerrar se limpia el estado final y la selección: reabrir siempre
    // empieza en idle y en el último comprobante.
    setDone(null);
    setSelectedAt(undefined);
    onOpenChange(false);
  }, [onOpenChange]);

  const subtitle = [
    t("paymentProof.orderLabel", {
      order: order.orderNumber ?? order.id.slice(-6).toUpperCase(),
    }),
    order.customer?.name,
  ]
    .filter(Boolean)
    .join(" · ");

  // El ancho va en <Dialog>: su contenedor trae max-w-lg y en
  // DialogContent no tiene efecto.
  return (
    <Dialog open={open} onOpenChange={handleClose} className="max-w-[1040px]">
      <DialogContent
        className="overflow-y-auto"
        data-testid="payment-proof-viewer"
      >
        <DialogHeader>
          <DialogTitle className="text-[20px] font-bold">
            {t("paymentProof.title")}
          </DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <ProofViewer
            orderId={order.id}
            open={open}
            selectedAt={selectedAt}
            onSelect={setSelectedAt}
          />
          <div className="min-w-0">
            {open && <PaymentVerificationCard orderId={order.id} />}
          </div>
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col sm:items-stretch sm:justify-start">
          {done ? (
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl text-[14px] font-semibold",
                done === "confirmed" || done === "rejected"
                  ? "h-12 justify-center"
                  : "px-4 py-3 text-left",
                done === "confirmed" && "bg-emerald-50 text-emerald-700",
                done === "rejected" && "bg-rose-50 text-rose-700",
                (done === "rejectedNotNotified" ||
                  done === "rejectedNoPhone") &&
                  "bg-amber-50 text-amber-800"
              )}
              role="status"
            >
              {done === "confirmed" ? (
                <Check className="h-4 w-4 shrink-0" strokeWidth={2.6} />
              ) : done === "rejected" ? (
                <X className="h-4 w-4 shrink-0" strokeWidth={2.6} />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2.4} />
              )}
              <span
                className={cn(
                  done !== "confirmed" &&
                    done !== "rejected" &&
                    "flex-1 font-medium leading-snug"
                )}
              >
                {t(DONE_MESSAGE_KEYS[done])}
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="ml-2 shrink-0 text-[12px] font-normal text-slate-500 underline"
              >
                {t("paymentProof.close")}
              </button>
            </div>
          ) : isPaid ? (
            <span className="text-sm font-medium text-green-700">
              {t("paymentProof.alreadyPaid")}
            </span>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="flex flex-1 items-center gap-1.5 text-[12px] text-slate-400">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                {t("paymentProof.verificationDisclaimer")}
              </span>
              <div className="flex items-center gap-3">
                {viewingLatest ? (
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={busy}
                    className="h-11 rounded-xl bg-slate-100 px-5 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {rejectPaymentProof.isPending
                      ? t("paymentProof.rejecting")
                      : t("paymentProof.reject")}
                  </button>
                ) : (
                  // Mirando uno viejo: se rechaza el último, así que primero
                  // se lo muestra.
                  <button
                    type="button"
                    onClick={() => setSelectedAt(undefined)}
                    disabled={busy}
                    className="h-11 rounded-xl px-4 text-[13px] font-semibold text-slate-600 underline-offset-2 transition hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("paymentProof.rejectGoToLatest")}
                  </button>
                )}
                <Button
                  variant="green"
                  onClick={handleConfirm}
                  isLoading={updatePaymentStatus.isPending}
                  disabled={busy}
                  className="h-11 rounded-xl px-5 text-[14px]"
                >
                  {updatePaymentStatus.isPending
                    ? t("paymentProof.confirming")
                    : t("paymentProof.confirm")}
                  {!updatePaymentStatus.isPending && (
                    <ArrowRight className="ml-1 h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Color del ícono según el último análisis del comprobante, con la misma
 * paleta que el visor (`PaymentVerificationCard`). El nivel lo manda el
 * backend (`riskLevel`): el front no reumbraliza. Solo informa.
 */
function indicatorTone(order: Order): {
  className: string;
  tip:
    | {
        key: "indicatorTip";
        level: "verificationHigh" | "verificationMedium" | "verificationLow";
        score: number;
      }
    | { key: "indicatorPending" | "indicatorNoScore" | "tooltip" };
} {
  const verification = order.paymentVerification;
  if (!verification) {
    return {
      className: "border-sky-200 bg-sky-50 text-sky-700",
      tip: { key: "tooltip" },
    };
  }
  if (verification.analysisStatus === "PENDING") {
    return {
      className: "border-sky-200 bg-sky-50 text-sky-700",
      tip: { key: "indicatorPending" },
    };
  }
  const score = verification.confidenceScore;
  if (verification.analysisStatus === "ANALYZED" && score !== null) {
    switch (verification.riskLevel) {
      case "LOW":
        return {
          className: "border-green-200 bg-green-50 text-green-600",
          tip: { key: "indicatorTip", level: "verificationHigh", score },
        };
      case "MEDIUM":
        return {
          className: "border-amber-200 bg-amber-50 text-amber-600",
          tip: { key: "indicatorTip", level: "verificationMedium", score },
        };
      case "HIGH":
        return {
          className: "border-red-200 bg-red-50 text-red-600",
          tip: { key: "indicatorTip", level: "verificationLow", score },
        };
    }
  }
  // Sin cupo, sin datos para comparar o análisis fallido: no hay índice.
  return {
    className: "border-slate-200 bg-slate-50 text-slate-500",
    tip: { key: "indicatorNoScore" },
  };
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

  const tone = indicatorTone(order);
  const tip =
    tone.tip.key === "indicatorTip"
      ? t("paymentProof.indicatorTip", {
          level: t(`paymentProof.${tone.tip.level}`),
          score: tone.tip.score,
        })
      : t(`paymentProof.${tone.tip.key}`);

  return (
    // stopPropagation: el click no tiene que abrir además el detalle del
    // pedido ni arrancar un drag de la tarjeta.
    <span
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <HoverTooltip content={tip}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          aria-label={tip}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border transition-opacity hover:opacity-80",
            tone.className,
            variant === "labeled" ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5",
            className
          )}
        >
          <Receipt
            className={variant === "labeled" ? "h-3.5 w-3.5" : "h-3 w-3"}
          />
          {variant === "labeled" && <span>{t("paymentProof.badge")}</span>}
        </button>
      </HoverTooltip>

      {open && (
        <PaymentProofDialog order={order} open={open} onOpenChange={setOpen} />
      )}
    </span>
  );
}
