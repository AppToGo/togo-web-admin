"use client";

import { useState, useEffect, useId, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Shield, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OperatorProfile, CreateProfileRequest, UpdateProfileRequest } from "../types";

interface OperatorProfileFormProps {
  profile?: OperatorProfile | null;
  onSubmit: (data: CreateProfileRequest | UpdateProfileRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function OperatorProfileForm({
  profile,
  onSubmit,
  onCancel,
  isLoading = false,
}: OperatorProfileFormProps) {
  const t = useTranslations("operatorProfiles");
  const tCommon = useTranslations("common");
  const formId = useId();

  const isEditing = !!profile;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form with profile data when editing
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
      });
      setErrors({});
      setTouched({});
    }
  }, [profile]);

  // Validate field
  const validateField = useCallback((name: string, value: string): string => {
    switch (name) {
      case "name":
        if (!value.trim()) return t("form.errors.nameRequired");
        if (value.length > 100) return t("form.errors.nameTooLong");
        return "";
      default:
        return "";
    }
  }, [t]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  // Handle blur for validation
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fieldsToValidate = ["name"];

    fieldsToValidate.forEach((field) => {
      const value = formData[field as keyof typeof formData] as string;
      const error = validateField(field, value);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    setTouched(
      fieldsToValidate.reduce((acc, field) => ({ ...acc, [field]: true }), {})
    );

    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const data = isEditing
      ? {
          // Update: send only changed fields
          name: formData.name,
        }
      : {
          // Create: send all required fields
          name: formData.name,
          permissions: [],
        };

    onSubmit(data);
  };

  const isFormValid = formData.name.trim() && formData.name.length <= 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card variant="glass">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" />
            {t("form.sections.basic")}
          </CardTitle>
          <CardDescription>{t("form.descriptions.basic")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-name`}>
              {t("form.fields.name")} <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${formId}-name`}
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={t("form.placeholders.name")}
              disabled={isLoading}
              error={errors.name}
              maxLength={100}
            />
            <p className="text-xs text-slate-500">
              {t("form.help.name")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          {tCommon("buttons.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !isFormValid}
          isLoading={isLoading}
        >
          {isEditing ? tCommon("buttons.saveChanges") : t("form.createProfile")}
        </Button>
      </div>
    </form>
  );
}
