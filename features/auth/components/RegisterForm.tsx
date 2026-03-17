"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/features/auth/hooks/useAuth";

export function RegisterForm() {
  const t = useTranslations("auth.register");
  
  const register = useRegister();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    businessName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return;
    }
    register.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t("name.label")}
        placeholder={t("name.placeholder")}
        value={formData.name}
        onChange={(e) =>
          setFormData({ ...formData, name: e.target.value })
        }
        required
      />

      <Input
        label={t("businessName.label")}
        placeholder={t("businessName.placeholder")}
        value={formData.businessName}
        onChange={(e) =>
          setFormData({ ...formData, businessName: e.target.value })
        }
        required
      />

      <Input
        label={t("email.label")}
        type="email"
        placeholder={t("email.placeholder")}
        value={formData.email}
        onChange={(e) =>
          setFormData({ ...formData, email: e.target.value })
        }
        required
      />

      <Input
        label={t("phone.label")}
        type="tel"
        placeholder={t("phone.placeholder")}
        value={formData.phoneNumber}
        onChange={(e) =>
          setFormData({ ...formData, phoneNumber: e.target.value })
        }
        required
        helperText={t("phone.helper")}
      />

      <Input
        label={t("password.label")}
        type="password"
        placeholder={t("password.placeholder")}
        value={formData.password}
        onChange={(e) =>
          setFormData({ ...formData, password: e.target.value })
        }
        required
        helperText={t("password.helper")}
      />

      <Input
        label={t("confirmPassword.label")}
        type="password"
        placeholder={t("confirmPassword.placeholder")}
        value={formData.confirmPassword}
        onChange={(e) =>
          setFormData({ ...formData, confirmPassword: e.target.value })
        }
        required
        error={
          formData.confirmPassword &&
          formData.password !== formData.confirmPassword
            ? t("passwordMismatch")
            : undefined
        }
      />

      <Button
        type="submit"
        className="w-full"
        isLoading={register.isPending}
        disabled={register.isPending}
      >
        {register.isPending ? t("creatingAccount") : t("submit")}
      </Button>

      <p className="text-center text-sm text-slate-500">
        {t("hasAccount")}{" "}
        <Link
          href="/login"
          className="text-[#6366F1] hover:text-[#5558E0] hover:underline font-medium"
        >
          {t("loginLink")}
        </Link>
      </p>
    </form>
  );
}
