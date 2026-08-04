"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { StickyNote, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Can } from "@/components/auth/Can";
import { useAddConversationNote } from "../../hooks/useAddConversationNote";
import { InboxComposer } from "./inbox-composer";
import type { ConversationDetail } from "../../types";

interface InboxNoteComposerProps {
  conversation: ConversationDetail;
}

function NoteInput({ sessionId, onDone }: { sessionId: string; onDone: () => void }) {
  const t = useTranslations("inbox");
  const [text, setText] = useState("");
  const addNote = useAddConversationNote(sessionId);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addNote.mutate({ text: trimmed }, { onSuccess: () => setText("") });
  };

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
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("composer.notePlaceholder")}
          className="min-h-[40px] flex-1 resize-none"
          rows={1}
        />
        <Button
          variant="outline"
          disabled={!text.trim() || addNote.isPending}
          onClick={handleSubmit}
        >
          {t("composer.addNote")}
        </Button>
      </div>
    </div>
  );
}

export function InboxNoteComposer({ conversation }: InboxNoteComposerProps) {
  const t = useTranslations("inbox");
  const [isNoteMode, setIsNoteMode] = useState(false);

  return (
    <div>
      {isNoteMode ? (
        <NoteInput sessionId={conversation.id} onDone={() => setIsNoteMode(false)} />
      ) : (
        <>
          <InboxComposer conversation={conversation} />
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
        </>
      )}
    </div>
  );
}
