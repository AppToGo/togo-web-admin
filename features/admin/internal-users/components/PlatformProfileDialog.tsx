"use client";

/**
 * Crear o editar un perfil de usuarios internos: nombre, descripción y
 * permisos de plataforma agrupados por área.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSavePlatformProfile } from "../hooks/useInternalUsers";
import { usePlatformPermissionLabels } from "../hooks/usePlatformPermissionLabels";
import type { PlatformPermissionDef, PlatformProfile } from "../types";

interface PlatformProfileDialogProps {
  /** null = crear */
  profile: PlatformProfile | null;
  permissions: PlatformPermissionDef[];
  isOpen: boolean;
  onClose: () => void;
}

export function PlatformProfileDialog({
  profile,
  permissions,
  isOpen,
  onClose,
}: PlatformProfileDialogProps) {
  const t = useTranslations("admin-internal-users");
  const { groupOf, labelOf, groupLabel } = usePlatformPermissionLabels();
  const save = useSavePlatformProfile();

  // Montado con key={profile?.id}: arranca con los datos del perfil
  const [name, setName] = useState(profile?.name ?? "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [codes, setCodes] = useState<string[]>(profile?.permissionCodes ?? []);
  const [submitted, setSubmitted] = useState(false);

  const nameError = name.trim().length < 2 ? t("profiles.form.errors.name") : undefined;

  const groups = permissions.reduce<Record<string, PlatformPermissionDef[]>>((acc, permission) => {
    const group = groupOf(permission.code);
    (acc[group] ??= []).push(permission);
    return acc;
  }, {});

  const toggle = (code: string, checked: boolean) =>
    setCodes((prev) => (checked ? [...prev, code] : prev.filter((c) => c !== code)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (nameError) return;
    save.mutate(
      {
        id: profile?.id,
        data: { name: name.trim(), description: description.trim(), permissionCodes: codes },
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {profile ? t("profiles.form.editTitle") : t("profiles.form.createTitle")}
            </DialogTitle>
            <DialogDescription>{t("profiles.form.description")}</DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[65vh] gap-4 overflow-y-auto p-7">
            <div className="grid gap-2">
              <Label htmlFor="platform-profile-name">{t("profiles.form.name")} *</Label>
              <Input
                id="platform-profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {submitted && nameError && <p className="text-xs text-red-600">{nameError}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="platform-profile-description">{t("profiles.form.descriptionLabel")}</Label>
              <Textarea
                id="platform-profile-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-900">{t("profiles.form.permissions")}</p>
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {groupLabel(group)}
                  </p>
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {items.map((permission) => (
                      <label
                        key={permission.code}
                        className="flex cursor-pointer items-start gap-3 p-3 hover:bg-slate-50"
                      >
                        <Checkbox
                          checked={codes.includes(permission.code)}
                          onCheckedChange={(value) => toggle(permission.code, value === true)}
                          className="mt-0.5"
                        />
                        <span className="text-sm text-slate-700">
                          {labelOf(permission.code, permission.description)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" isLoading={save.isPending}>
              {t("actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
