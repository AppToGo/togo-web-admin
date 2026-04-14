"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRegister } from "@/features/auth/hooks/useAuth";
import {
  fetchIndustries,
  IndustryOption,
} from "@/features/auth/services/auth.service";
import { COLOMBIA_DEPARTMENTS } from "@/lib/colombia-cities";
import type { Step1Data } from "./Step1BasicData";

interface Step2BusinessDataProps {
  step1Data: Step1Data;
  onBack: () => void;
}

const SELECT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed";

const PHONE_PREFIX = "+57";

export function Step2BusinessData({
  step1Data,
  onBack,
}: Step2BusinessDataProps) {
  const t = useTranslations("auth.register");
  const register = useRegister();

  const [businessName, setBusinessName] = useState("");
  const [industryId, setIndustryId] = useState("");
  const [department, setDepartment] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [industries, setIndustries] = useState<IndustryOption[]>([]);

  useEffect(() => {
    fetchIndustries().then(setIndustries);
  }, []);

  // Reset city whenever department changes
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDepartment(e.target.value);
    setCity("");
  };

  const availableCities =
    COLOMBIA_DEPARTMENTS.find((d) => d.name === department)?.cities ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate({
      name: step1Data.name,
      email: step1Data.email,
      phoneNumber: `${PHONE_PREFIX}${step1Data.localPhone}`,
      password: step1Data.password,
      businessName,
      industryId: industryId || undefined,
      address: address || undefined,
      city: city || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Business name */}
      <Input
        label={t("businessName.label")}
        placeholder={t("businessName.placeholder")}
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        required
        disabled={register.isPending}
      />

      {/* Industry */}
      <div className="w-full">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {t("industry.label")}
        </label>
        <select
          value={industryId}
          onChange={(e) => setIndustryId(e.target.value)}
          disabled={register.isPending}
          className={SELECT_CLASS}
        >
          <option value="">{t("industry.placeholder")}</option>
          {industries.map((ind) => (
            <option key={ind.id} value={ind.id}>
              {ind.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400 mt-1">{t("industry.helper")}</p>
      </div>

      {/* Address */}
      <Input
        label={t("address.label")}
        placeholder={t("address.placeholder")}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        disabled={register.isPending}
      />

      {/* Department — filters city list, NOT saved to DB */}
      <div className="w-full">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {t("department.label")}
        </label>
        <select
          value={department}
          onChange={handleDepartmentChange}
          disabled={register.isPending}
          className={SELECT_CLASS}
        >
          <option value="">{t("department.placeholder")}</option>
          {COLOMBIA_DEPARTMENTS.map((dep) => (
            <option key={dep.name} value={dep.name}>
              {dep.name}
            </option>
          ))}
        </select>
      </div>

      {/* City — saved to DB */}
      <div className="w-full">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {t("city.label")} <span className="text-red-500">*</span>
        </label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={register.isPending || !department}
          required
          className={SELECT_CLASS}
        >
          <option value="">
            {department ? t("city.placeholder") : t("city.selectDepartmentFirst")}
          </option>
          {availableCities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <Button
        type="submit"
        className="w-full"
        isLoading={register.isPending}
        disabled={register.isPending}
      >
        {register.isPending ? t("creatingAccount") : t("wizard.createAccount")}
      </Button>

      <button
        type="button"
        onClick={onBack}
        disabled={register.isPending}
        className="w-full text-center text-sm text-slate-500 hover:text-slate-700 py-2 disabled:opacity-50"
      >
        {t("wizard.goBack")}
      </button>
    </form>
  );
}
