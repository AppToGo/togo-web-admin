"use client";

import { useState, useId } from "react";
import { useTranslations } from "next-intl";
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { OperatorProfile } from "../types";

interface CloneProfileDialogProps {
  profile: OperatorProfile;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClone: (name: string) => void;
  isLoading?: boolean;
}

export function CloneProfileDialog({
  profile,
  isOpen,
  onOpenChange,
  onClone,
  isLoading = false,
}: CloneProfileDialogProps) {
  const t = useTranslations("operatorProfiles");
  const tCommon = useTranslations("common");
  const formId = useId();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Precarga "{nombre original} (Copia)" al abrir el diálogo (o si cambia el
  // perfil con el diálogo abierto). Ajuste de estado durante el render en
  // vez de un efecto.
  const openedFor = isOpen ? profile : null;
  const [prefilledFor, setPrefilledFor] = useState<typeof openedFor>(null);
  if (openedFor !== prefilledFor) {
    setPrefilledFor(openedFor);
    if (openedFor) {
      setName(t("clone.defaultName", { name: openedFor.name }));
      setError(null);
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);

    // Validate
    if (!value.trim()) {
      setError(t("form.errors.nameRequired"));
    } else if (value.length > 100) {
      setError(t("form.errors.nameTooLong"));
    } else {
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(t("form.errors.nameRequired"));
      return;
    }

    if (name.length > 100) {
      setError(t("form.errors.nameTooLong"));
      return;
    }

    onClone(name.trim());
  };

  const handleCancel = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  const isValid = name.trim() && name.length <= 100 && !isLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="w-5 h-5 text-indigo-500" />
              {t("clone.title")}
            </DialogTitle>
            <DialogDescription>
              {t("clone.description", { name: profile?.name })}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="space-y-3">
              <Label htmlFor={`${formId}-name`}>
                {t("clone.fields.name")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`${formId}-name`}
                value={name}
                onChange={handleNameChange}
                placeholder={t("clone.placeholders.name")}
                disabled={isLoading}
                error={error || undefined}
                maxLength={100}
                autoFocus
              />
              <div className="flex justify-between text-xs">
                <span
                  className={cn(
                    "text-slate-500",
                    error && "text-red-500"
                  )}
                >
                  {error || t("clone.help.name")}
                </span>
                <span
                  className={cn(
                    "text-slate-400",
                    name.length > 90 && "text-amber-500",
                    name.length >= 100 && "text-red-500"
                  )}
                >
                  {name.length}/100
                </span>
              </div>
            </div>

            {/* Clone Info */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="text-sm font-medium text-slate-900 mb-2">
                {t("clone.whatWillBeCloned")}
              </h4>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {t("clone.items.permissions", {
                    count: profile?.permissions?.length || 0,
                  })}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {t("clone.items.configuration")}
                </li>
              </ul>
              <p className="text-xs text-slate-500 mt-3">
                {t("clone.usersNotCloned")}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {tCommon("buttons.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!isValid}
              isLoading={isLoading}
            >
              {isLoading ? t("clone.cloning") : t("clone.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
