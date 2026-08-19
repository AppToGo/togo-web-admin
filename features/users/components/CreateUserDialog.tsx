"use client";

import { useState, useId, useCallback } from "react";
import { useTranslations } from "next-intl";
import { User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput, PHONE_REGEX } from "@/components/ui/phone-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateUser } from "../hooks/useUsers";
import { useOperatorProfiles } from "@/features/operator-profiles";
import type { CreateUserRequest } from "../types";
import { getHumanizedErrorMessage } from "@/lib/error.utils";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateUserDialogProps) {
  const t = useTranslations("users.createDialog");
  const tErrors = useTranslations("users.errors");
  const formId = useId();
  const createUser = useCreateUser();
  const { data: profiles, isLoading: isLoadingProfiles } =
    useOperatorProfiles();

  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    password: "",
    operatorProfileId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    (name: string, value: string): string => {
      switch (name) {
        case "name":
          if (!value.trim()) return t("errors.nameRequired");
          if (value.trim().length < 2) return t("errors.nameTooShort");
          if (value.trim().length > 100) return t("errors.nameTooLong");
          return "";
        case "phoneNumber": {
          const v = value.trim();
          if (!v) return t("errors.phoneRequired");
          if (!PHONE_REGEX.test(v.replace(/[\s-]/g, "")))
            return t("errors.phoneInvalid");
          return "";
        }
        case "email": {
          const v = value.trim();
          if (!v) return "";
          const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          if (!emailOk) return t("errors.emailInvalid");
          return "";
        }
        case "password": {
          const v = value.trim();
          if (!v) return ""; // opcional — backend autogenera si vacío
          if (v.length < 8) return t("errors.passwordTooShort");
          return "";
        }
        default:
          return "";
      }
    },
    [t]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateAll = (): boolean => {
    const fields = ["name", "phoneNumber", "email", "password"];
    const next: Record<string, string> = {};
    fields.forEach((f) => {
      const v = form[f as keyof typeof form] as string;
      const err = validateField(f, v);
      if (err) next[f] = err;
    });
    setErrors(next);
    setTouched({ name: true, phoneNumber: true, email: true, password: true });
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    const payload: CreateUserRequest = {
      name: form.name.trim(),
      phoneNumber: form.phoneNumber.trim().replace(/[\s-]/g, ""),
      role: "OPERATOR",
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.password.trim() ? { password: form.password.trim() } : {}),
      ...(form.operatorProfileId
        ? { operatorProfileId: form.operatorProfileId }
        : {}),
    };

    createUser.mutate(payload, {
      onSuccess: () => {
        toast.success(t("success"));
        setForm({
          name: "",
          phoneNumber: "",
          email: "",
          password: "",
          operatorProfileId: "",
        });
        setErrors({});
        setTouched({});
        onOpenChange(false);
        onCreated?.();
      },
      onError: (err) => {
        const msg = getHumanizedErrorMessage(err) || tErrors("createFailed");
        toast.error(msg);
      },
    });
  };

  const isValid =
    form.name.trim().length >= 2 &&
    PHONE_REGEX.test(form.phoneNumber.trim().replace(/[\s-]/g, "")) &&
    !errors.name &&
    !errors.phoneNumber &&
    !errors.email &&
    !errors.password;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
          <div className="space-y-2">
            <Label htmlFor={`${formId}-name`}>
              {t("fields.name")} <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${formId}-name`}
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={t("placeholders.name")}
              maxLength={100}
              error={errors.name}
              disabled={createUser.isPending}
            />
          </div>

          <PhoneInput
            value={form.phoneNumber}
            onChange={(v) => {
              setForm((prev) => ({ ...prev, phoneNumber: v }));
              if (touched.phoneNumber) {
                setErrors((prev) => ({
                  ...prev,
                  phoneNumber: validateField("phoneNumber", v),
                }));
              }
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, phoneNumber: true }));
              setErrors((prev) => ({
                ...prev,
                phoneNumber: validateField("phoneNumber", form.phoneNumber),
              }));
            }}
            label={t("fields.phoneNumber")}
            required
            error={errors.phoneNumber}
            helperText={t("help.phoneNumber")}
            disabled={createUser.isPending}
            id={`${formId}-phone`}
          />

          <div className="space-y-2">
            <Label htmlFor={`${formId}-email`}>{t("fields.email")}</Label>
            <Input
              id={`${formId}-email`}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={t("placeholders.email")}
              error={errors.email}
              disabled={createUser.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-password`}>{t("fields.password")}</Label>
            <Input
              id={`${formId}-password`}
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={t("placeholders.password")}
              error={errors.password}
              disabled={createUser.isPending}
            />
            <p className="text-xs text-slate-500">{t("help.password")}</p>
          </div>

          <div className="space-y-2">
            <Label>{t("fields.operatorProfile")}</Label>
            <Select
              value={form.operatorProfileId || "none"}
              onValueChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  operatorProfileId: v === "none" ? "" : v,
                }))
              }
              disabled={createUser.isPending || isLoadingProfiles}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("placeholders.operatorProfile")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t("placeholders.noProfile")}
                </SelectItem>
                {profiles?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              {t("help.operatorProfile")}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createUser.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createUser.isPending}
              isLoading={createUser.isPending}
            >
              {createUser.isPending ? t("creating") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
