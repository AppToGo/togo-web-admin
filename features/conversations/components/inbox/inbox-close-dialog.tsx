"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConversationOutcome } from "../../types";

const OUTCOME_OPTIONS: ConversationOutcome[] = [
  "SUPPORT",
  "ABANDONED",
  "NO_INTENT",
  "SPAM",
];

interface InboxCloseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (outcome?: ConversationOutcome) => void;
  isPending: boolean;
}

export function InboxCloseDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: InboxCloseDialogProps) {
  const t = useTranslations("inbox");
  const tConversations = useTranslations("conversations");
  const [outcome, setOutcome] = useState<ConversationOutcome | "">("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("closeDialog.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("closeDialog.outcomeLabel")}</label>
          <Select
            value={outcome}
            onValueChange={(value) => setOutcome(value as ConversationOutcome)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OUTCOME_OPTIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {tConversations(`outcome.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => onConfirm(outcome || undefined)}
          >
            {t("closeDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
