"use client";

import { useTranslations } from "next-intl";
import {
  CornerDownRight,
  ExternalLink,
  List,
  MapPin,
  Smile,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InteractivePreview } from "../../types/interactive.types";

type Tone = "onDark" | "onLight";

interface InteractiveMessagePreviewProps {
  preview: InteractivePreview;
  tone: Tone;
}

/**
 * Contraste de la superficie secundaria (fila de botón, hairline de
 * sección, badge) según el fondo de la burbuja que la contiene: BOT/OPERATOR
 * son sólidas y oscuras (`bg-indigo-600`/`bg-emerald-600`), CUSTOMER es
 * blanca — ver `bubbleStyles` en `message-bubble.tsx`.
 */
const surface: Record<Tone, string> = {
  onDark: "border-white/25 bg-white/10",
  onLight: "border-slate-200 bg-slate-50",
};

const divider: Record<Tone, string> = {
  onDark: "divide-white/20",
  onLight: "divide-slate-200",
};

const mutedText: Record<Tone, string> = {
  onDark: "text-white/70",
  onLight: "text-slate-500",
};

function Row({ label, tone }: { label: string; tone: Tone }) {
  return (
    <div
      role="presentation"
      className={cn(
        "rounded-lg border px-3 py-1.5 text-center text-sm font-medium",
        surface[tone]
      )}
    >
      {label}
    </div>
  );
}

export function InteractiveMessagePreview({ preview, tone }: InteractiveMessagePreviewProps) {
  const t = useTranslations("conversations.interactive");

  switch (preview.kind) {
    case "buttons":
      return (
        <div className="space-y-1.5">
          {preview.body && (
            <p className="text-sm whitespace-pre-wrap break-words">{preview.body}</p>
          )}
          {preview.footer && (
            <p className={cn("text-xs", mutedText[tone])}>{preview.footer}</p>
          )}
          <div className="space-y-1 pt-0.5">
            {preview.buttons.map((label, i) => (
              <Row key={i} label={label} tone={tone} />
            ))}
          </div>
        </div>
      );

    case "list":
      return (
        <div className="space-y-1.5">
          {preview.body && (
            <p className="text-sm whitespace-pre-wrap break-words">{preview.body}</p>
          )}
          {preview.footer && (
            <p className={cn("text-xs", mutedText[tone])}>{preview.footer}</p>
          )}
          <div className={cn("rounded-lg border overflow-hidden", surface[tone])}>
            <div className={cn("flex items-center gap-2 px-3 py-1.5 text-sm font-medium border-b", surface[tone])}>
              <List className="h-3.5 w-3.5 shrink-0" />
              {preview.buttonText}
            </div>
            <div className={cn("divide-y", divider[tone])}>
              {preview.sections.map((section, si) => (
                <div key={si} className="px-3 py-1.5">
                  {section.title && (
                    <div className="text-[10px] uppercase tracking-wide opacity-60 pb-1">
                      {section.title}
                    </div>
                  )}
                  <div className={cn("divide-y", divider[tone])}>
                    {section.rows.map((row, ri) => (
                      <div key={ri} className="py-1.5 first:pt-0 last:pb-0">
                        <div className="text-sm font-medium">{row.title}</div>
                        {row.description && (
                          <div className={cn("text-xs", mutedText[tone])}>
                            {row.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "cta":
      return (
        <div className="space-y-1.5">
          {preview.header && <p className="text-sm font-semibold">{preview.header}</p>}
          {preview.body && (
            <p className="text-sm whitespace-pre-wrap break-words">{preview.body}</p>
          )}
          {preview.footer && (
            <p className={cn("text-xs", mutedText[tone])}>{preview.footer}</p>
          )}
          <div
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium",
              surface[tone]
            )}
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            {preview.buttonText}
          </div>
          <a
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-xs underline"
          >
            {preview.url}
          </a>
        </div>
      );

    case "carousel":
      return (
        <div className="space-y-1.5">
          {preview.body && (
            <p className="text-sm whitespace-pre-wrap break-words">{preview.body}</p>
          )}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {preview.cards.map((card, i) => (
              <div
                key={i}
                className={cn(
                  "w-40 shrink-0 space-y-1 rounded-lg border p-2",
                  surface[tone]
                )}
              >
                {card.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal (TTL 15 min), no cacheable por next/image
                  <img
                    src={card.imageUrl}
                    alt={card.title ?? ""}
                    className="h-24 w-full rounded object-cover"
                  />
                )}
                {card.title && <div className="text-xs font-semibold">{card.title}</div>}
                {card.description && (
                  <div className={cn("text-xs", mutedText[tone])}>{card.description}</div>
                )}
                {card.buttons.map((label, bi) => (
                  <Row key={bi} label={label} tone={tone} />
                ))}
              </div>
            ))}
          </div>
        </div>
      );

    case "productCarousel":
      return (
        <div className="space-y-1.5">
          {preview.header && <p className="text-sm font-semibold">{preview.header}</p>}
          {preview.body && (
            <p className="text-sm whitespace-pre-wrap break-words">{preview.body}</p>
          )}
          {preview.footer && (
            <p className={cn("text-xs", mutedText[tone])}>{preview.footer}</p>
          )}
          <p className={cn("text-xs", mutedText[tone])}>
            {t("productCarousel.count", { count: preview.productCount })}
          </p>
        </div>
      );

    case "locationRequest":
      return (
        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              {preview.name && <div className="text-sm font-medium">{preview.name}</div>}
              {preview.address && (
                <div className={cn("text-xs", mutedText[tone])}>{preview.address}</div>
              )}
            </div>
          </div>
          <Row label={preview.buttonText ?? t("locationRequest.default")} tone={tone} />
        </div>
      );

    case "location":
      return (
        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium">
                {preview.name ?? preview.address ?? `${preview.latitude}, ${preview.longitude}`}
              </div>
              {preview.name && preview.address && (
                <div className={cn("text-xs", mutedText[tone])}>{preview.address}</div>
              )}
            </div>
          </div>
          <a
            href={`https://www.google.com/maps?q=${preview.latitude},${preview.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline"
          >
            {t("location.open")}
          </a>
        </div>
      );

    case "template":
      return (
        <div className="space-y-1">
          <div className={cn("text-[10px] uppercase tracking-wide", mutedText[tone])}>
            {t("template.label")}
          </div>
          <div className="text-sm font-mono">{preview.templateName}</div>
          {preview.params.map((param, i) => (
            <p key={i} className="text-sm whitespace-pre-wrap break-words">
              {param}
            </p>
          ))}
        </div>
      );

    case "contacts":
      return (
        <div className="space-y-2">
          {preview.contacts.map((contact, i) => (
            <div key={i} className="flex items-start gap-2">
              <User className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium">{contact.name}</div>
                {contact.phones.map((phone, pi) => (
                  <div key={pi} className={cn("text-xs", mutedText[tone])}>
                    {phone}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    case "reaction":
      return preview.emoji ? (
        <div className="text-2xl leading-none">{preview.emoji}</div>
      ) : (
        <div className={cn("flex items-center gap-1.5 text-xs italic", mutedText[tone])}>
          <Smile className="h-3.5 w-3.5 shrink-0" />
          {t("reaction.removed")}
        </div>
      );

    case "reply":
      return (
        <div className="flex items-center gap-1.5 text-sm">
          <CornerDownRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
          {preview.label}
        </div>
      );

    default: {
      // Exhaustividad: si se agrega un `kind` nuevo sin cubrirlo acá, tsc falla.
      const _exhaustive: never = preview;
      return _exhaustive;
    }
  }
}
