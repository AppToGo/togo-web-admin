"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";
import { useAssignableUsers } from "../../hooks/useAssignableUsers";

interface InboxAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAssignedUserId: string | null;
  onAssign: (userId: string | null) => void;
  isPending: boolean;
}

export function InboxAssignDialog({
  open,
  onOpenChange,
  currentAssignedUserId,
  onAssign,
  isPending,
}: InboxAssignDialogProps) {
  const t = useTranslations("inbox");
  const { data: users = [] } = useAssignableUsers(open);
  const [selected, setSelected] = useState(currentAssignedUserId ?? "");

  const options = useMemo(
    () => users.map((user) => ({ value: user.id, label: user.name })),
    [users]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("assignDialog.title")}</DialogTitle>
        </DialogHeader>

        <AutocompleteSelect
          options={options}
          value={selected}
          onChange={setSelected}
          searchPlaceholder={t("assignDialog.searchPlaceholder")}
        />

        <DialogFooter>
          {currentAssignedUserId && (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onAssign(null)}
            >
              {t("assignDialog.unassign")}
            </Button>
          )}
          <Button
            type="button"
            disabled={isPending || !selected}
            onClick={() => onAssign(selected)}
          >
            {t("actions.assign")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
