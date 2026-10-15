"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { StickyNote, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Can } from "@/components/auth/Can";
import { useNoteDraft } from "../../hooks/useComposerDraft";
import { InboxComposer } from "./inbox-composer";
import type { ConversationDetail } from "../../types";

interface InboxNoteComposerProps {
  conversation: ConversationDetail;
  /** Se pasa tal cual al composer de mensajes. */
  initialText?: string;
}

function NoteInput({ sessionId, onDone }: { sessionId: string; onDone: () => void }) {
  const t = useTranslations("inbox");
  const draft = useNoteDraft(sessionId);

  return (
    <div className="border-t border-amber-200 bg-amber-50/50 px-4 py-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-amber-700">
          {t("composer.noteToggleOn")}
        </span>
        <button
          type="button"
          onClick={onDone}
          aria-label={t("composer.noteToggleOff")}
          className="text-amber-500 hover:text-amber-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-end gap-2">
        <Textarea
          value={draft.text}
          onChange={(e) => draft.setText(e.target.value)}
          placeholder={t("composer.notePlaceholder")}
          className="min-h-[40px] flex-1 resize-none"
          rows={1}
        />
        <Button
          variant="outline"
          disabled={!draft.canSubmit}
          onClick={() => draft.submit()}
        >
          {t("composer.addNote")}
        </Button>
      </div>
    </div>
  );
}

export function InboxNoteComposer({ conversation, initialText }: InboxNoteComposerProps) {
  const t = useTranslations("inbox");
  const [isNoteMode, setIsNoteMode] = useState(false);

  // Los dos quedan montados (solo se oculta el inactivo) para que alternar
  // entre mensaje y nota no borre ninguno de los dos borradores.
  return (
    <div>
      <div hidden={!isNoteMode}>
        <NoteInput sessionId={conversation.id} onDone={() => setIsNoteMode(false)} />
      </div>
      <div hidden={isNoteMode}>
        <InboxComposer conversation={conversation} initialText={initialText} />
        <Can permission="conversation.note">
          <div className="border-t border-slate-100 px-4 py-1.5">
            <button
              type="button"
              onClick={() => setIsNoteMode(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              <StickyNote className="h-3.5 w-3.5" />
              {t("composer.noteToggleOff")}
            </button>
          </div>
        </Can>
      </div>
    </div>
  );
}
