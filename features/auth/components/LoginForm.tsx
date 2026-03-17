"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/features/auth/hooks/useAuth";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const tv = useTranslations("auth.validation");
  
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Field */}
      <div>
        <Input
          label={t("email.label")}
          type="email"
          placeholder={t("email.placeholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          error={login.error?.message}
        />
      </div>

      {/* Password Field */}
      <div>
        <Input
          label={t("password.label")}
          type="password"
          placeholder={t("password.placeholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <div className="flex justify-end mt-2">
          <Link
            href="/forgot-password"
            className="text-sm text-indigo-500 hover:text-indigo-600 hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12"
        isLoading={login.isPending}
        disabled={login.isPending}
      >
        {login.isPending ? t("signingIn") : t("submit")}
      </Button>
    </form>
  );
}
