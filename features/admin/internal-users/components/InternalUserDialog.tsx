"use client";

/**
 * Crear o editar un usuario interno de ToGo (comercial, supervisor…).
 * Al crear se pide la contraseña inicial; al editar es opcional (cambiarla
 * cierra sus sesiones abiertas).
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput, PHONE_REGEX } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateInternalUser, useUpdateInternalUser } from "../hooks/useInternalUsers";
import type { InternalUser, PlatformProfile } from "../types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface InternalUserDialogProps {
  /** null = crear */
  user: InternalUser | null;
  profiles: PlatformProfile[];
  isOpen: boolean;
  onClose: () => void;
}

export function InternalUserDialog({ user, profiles, isOpen, onClose }: InternalUserDialogProps) {
  const t = useTranslations("admin-internal-users");
  const createUser = useCreateInternalUser();
  const updateUser = useUpdateInternalUser();
  const isEdit = user !== null;

  // La página monta el diálogo con key={user?.id}: cada apertura arranca con
  // los datos de ese usuario.
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    password: "",
    platformProfileId: user?.platformProfile?.id ?? "",
  });
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    name: form.name.trim().length < 2 ? t("users.form.errors.name") : undefined,
    email: !isEdit && !EMAIL_REGEX.test(form.email.trim()) ? t("users.form.errors.email") : undefined,
    phoneNumber: !PHONE_REGEX.test(form.phoneNumber.replace(/[\s-]/g, ""))
      ? t("users.form.errors.phone")
      : undefined,
    password:
      (!isEdit || form.password) && form.password.length < 8
        ? t("users.form.errors.password")
        : undefined,
    platformProfileId: !form.platformProfileId ? t("users.form.errors.profile") : undefined,
  };
  const isValid = Object.values(errors).every((e) => !e);
  const isPending = createUser.isPending || updateUser.isPending;

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) return;

    const phoneNumber = form.phoneNumber.replace(/[\s-]/g, "");
    if (isEdit) {
      updateUser.mutate(
        {
          id: user.id,
          data: {
            name: form.name.trim(),
            phoneNumber,
            platformProfileId: form.platformProfileId,
            ...(form.password && { password: form.password }),
          },
        },
        { onSuccess: onClose }
      );
    } else {
      createUser.mutate(
        {
          name: form.name.trim(),
          email: form.email.trim(),
          phoneNumber,
          password: form.password,
          platformProfileId: form.platformProfileId,
        },
        { onSuccess: onClose }
      );
    }
  };

  const showError = (field: keyof typeof errors) => (submitted ? errors[field] : undefined);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? t("users.form.editTitle") : t("users.form.createTitle")}</DialogTitle>
            <DialogDescription>{t("users.form.description")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 p-7">
            <div className="grid gap-2">
              <Label htmlFor="internal-user-name">{t("users.form.name")} *</Label>
              <Input
                id="internal-user-name"
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
              />
              {showError("name") && <p className="text-xs text-red-600">{showError("name")}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="internal-user-email">{t("users.form.email")} *</Label>
              <Input
                id="internal-user-email"
                type="email"
                value={form.email}
                disabled={isEdit}
                onChange={(e) => set("email")(e.target.value)}
              />
              {isEdit && <p className="text-xs text-slate-500">{t("users.form.emailLocked")}</p>}
              {showError("email") && <p className="text-xs text-red-600">{showError("email")}</p>}
            </div>

            <PhoneInput
              label={`${t("users.form.phone")} *`}
              value={form.phoneNumber}
              onChange={set("phoneNumber")}
              error={showError("phoneNumber")}
            />

            <div className="grid gap-2">
              <Label htmlFor="internal-user-password">
                {isEdit ? t("users.form.newPassword") : `${t("users.form.password")} *`}
              </Label>
              <Input
                id="internal-user-password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set("password")(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                {isEdit ? t("users.form.newPasswordHint") : t("users.form.passwordHint")}
              </p>
              {showError("password") && <p className="text-xs text-red-600">{showError("password")}</p>}
            </div>

            <div className="grid gap-2">
              <Label>{t("users.form.profile")} *</Label>
              <Select value={form.platformProfileId} onValueChange={set("platformProfileId")}>
                <SelectTrigger>
                  <SelectValue placeholder={t("users.form.profilePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showError("platformProfileId") && (
                <p className="text-xs text-red-600">{showError("platformProfileId")}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" isLoading={isPending}>
              {isEdit ? t("actions.save") : t("users.form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
