"use client";

import { useTranslations } from "next-intl";
import { ImageOff, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationMessage, MessageSenderType } from "../../types";

interface MessageBubbleProps {
  message: ConversationMessage;
}

const MEDIA_CONTENT_TYPES = new Set([
  "IMAGE",
  "AUDIO",
  "VIDEO",
  "DOCUMENT",
  "STICKER",
]);

function bubbleAlignment(senderType: MessageSenderType): string {
  return senderType === "CUSTOMER" ? "justify-start" : "justify-end";
}

function bubbleStyles(senderType: MessageSenderType): string {
  switch (senderType) {
    case "CUSTOMER":
      return "bg-white border border-slate-200 text-slate-900";
    case "BOT":
      return "bg-indigo-600 text-white";
    case "OPERATOR":
      return "bg-emerald-600 text-white";
    case "SYSTEM":
    default:
      return "bg-slate-100 text-slate-500 italic";
  }
}

function MediaContent({ message }: { message: ConversationMessage }) {
  const t = useTranslations("conversations");
  const { media, contentType } = message;

  if (!media) return null;

  if (!media.url) {
    return (
      <div className="flex items-center gap-2 text-xs opacity-70">
        <ImageOff className="h-4 w-4 shrink-0" />
        {t(`media.unavailable.${media.unavailableReason ?? "UNRECOGNIZED_REF"}`)}
      </div>
    );
  }

  if (contentType === "IMAGE" || contentType === "STICKER") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal (TTL 15 min), no cacheable por next/image
      <img
        src={media.url}
        alt={media.filename ?? ""}
        className="max-w-64 rounded-lg"
      />
    );
  }

  if (contentType === "VIDEO") {
    return <video src={media.url} controls className="max-w-64 rounded-lg" />;
  }

  if (contentType === "AUDIO") {
    return <audio src={media.url} controls className="max-w-64" />;
  }

  return (
    <a
      href={media.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm underline"
    >
      <Paperclip className="h-4 w-4 shrink-0" />
      {media.filename ?? t("media.download")}
    </a>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const t = useTranslations("conversations");
  const isMediaHandled = MEDIA_CONTENT_TYPES.has(message.contentType);
  const showUnsupportedNotice =
    !isMediaHandled && message.contentType !== "TEXT" && !message.text;

  return (
    <div className={cn("flex", bubbleAlignment(message.senderType))}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2 space-y-1",
          bubbleStyles(message.senderType)
        )}
      >
        <div className="text-[10px] uppercase tracking-wide opacity-60">
          {t(`sender.${message.senderType}`)}
        </div>
        {message.media && <MediaContent message={message} />}
        {message.text && (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.text}
          </p>
        )}
        {showUnsupportedNotice && (
          <p className="text-xs italic opacity-70">
            {t(`contentType.${message.contentType}`)}
          </p>
        )}
        <div className="text-[10px] opacity-60 text-right">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
