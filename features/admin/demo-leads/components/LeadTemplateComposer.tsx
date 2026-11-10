"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSendLeadConversationTemplate } from "../hooks/useLeadConversation";

/** Máximo de caracteres del mensaje (variable {{2}} de la plantilla). */
export const TEMPLATE_TEXT_MAX = 500;

/**
 * Envío con plantilla aprobada cuando la ventana de 24 h está cerrada.
 * Muestra el texto fijo de la plantilla con el mensaje del comercial dentro,
 * y pide confirmación porque la plantilla de Meta tiene costo.
 */
export function LeadTemplateComposer({
  leadId,
  senderName,
}: {
  leadId: string;
  senderName: string;
}) {
  const t = useTranslations("admin-demo-leads");
  const send = useSendLeadConversationTemplate(leadId);
  const [text, setText] = useState("");
  const [confirming, setConfirming] = useState(false);
  // La plantilla no admite saltos de línea: se aplanan al escribir/pegar.
  const clean = text.replace(/[\r\n]+/g, " ").trim();
  const name = senderName || t("template.defaultSender");

  const confirm = () => {
    setConfirming(false);
    send.mutate(clean, { onSuccess: () => setText("") });
  };

  return (
    <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {t("template.title")}
        </p>
        <p className="mt-0.5 text-[12.5px] text-slate-500">
          {t("template.hint")}
        </p>
      </div>
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-[13px] leading-relaxed text-slate-600">
        {t("template.before", { name })}{" "}
        <span className="font-semibold text-slate-900">
          {clean || t("template.placeholderToken")}
        </span>
        {t("template.after")}
      </p>
      <Textarea
        value={text}
        onChange={(e) =>
          setText(e.target.value.replace(/[\r\n]+/g, " ").slice(0, TEMPLATE_TEXT_MAX))
        }
        placeholder={t("template.placeholder")}
        maxLength={TEMPLATE_TEXT_MAX}
        rows={2}
        className="resize-none"
        aria-label={t("template.fieldLabel")}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs tabular-nums text-slate-500">
          {text.length}/{TEMPLATE_TEXT_MAX}
        </span>
        <Button
          size="sm"
          disabled={!clean || send.isPending}
          onClick={() => setConfirming(true)}
        >
          <Send className="h-4 w-4" aria-hidden />
          {send.isPending ? t("template.sending") : t("template.send")}
        </Button>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("template.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("template.confirmBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("template.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirm}>
              {t("template.confirmSend")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
