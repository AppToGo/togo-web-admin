"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { useTranslations } from "next-intl";
import {
  Building2,
  Link2,
  Hash,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  Info,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  Branch,
  RoutingMode,
  CreateBranchRequest,
  UpdateBranchRequest,
  DeliveryFeeType,
  BusinessHours,
} from "../types";
import { getPrimaryWhatsApp } from "../utils/branch-helpers";
import { DeliveryConfigSection } from "./DeliveryConfigSection";
import { BusinessHoursSection } from "./BusinessHoursSection";

interface BranchFormProps {
  branch?: Branch | null;
  onSubmit: (data: CreateBranchRequest | UpdateBranchRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
  availableTimezones?: string[];
  availableCurrencies?: { code: string; name: string }[];
}

// Default options
const DEFAULT_TIMEZONES = [
  "America/Bogota",
  "America/Mexico_City",
  "America/Lima",
  "America/Santiago",
  "America/Buenos_Aires",
  "America/Caracas",
  "America/Guayaquil",
  "America/La_Paz",
  "America/Montevideo",
  "America/Asuncion",
  "America/Panama",
  "America/Costa_Rica",
  "America/El_Salvador",
  "America/Guatemala",
  "America/Tegucigalpa",
  "America/Managua",
];

const DEFAULT_CURRENCIES = [
  { code: "COP", name: "Peso Colombiano" },
  { code: "MXN", name: "Peso Mexicano" },
  { code: "PEN", name: "Sol Peruano" },
  { code: "CLP", name: "Peso Chileno" },
  { code: "ARS", name: "Peso Argentino" },
  { code: "VES", name: "Bolívar Venezolano" },
  { code: "USD", name: "Dólar Estadounidense" },
  { code: "BRL", name: "Real Brasileño" },
  { code: "UYU", name: "Peso Uruguayo" },
  { code: "BOB", name: "Boliviano" },
  { code: "PYG", name: "Guaraní Paraguayo" },
  { code: "CRC", name: "Colón Costarricense" },
];

// E.164 phone validation regex
const E164_REGEX = /^\+[1-9]\d{1,14}$/;

// Slug generation from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/-+/g, "-"); // Collapse consecutive dashes
};

export function BranchForm({
  branch,
  onSubmit,
  onCancel,
  isLoading = false,
  availableTimezones = DEFAULT_TIMEZONES,
  availableCurrencies = DEFAULT_CURRENCIES,
}: BranchFormProps) {
  const t = useTranslations("branches");
  const tCommon = useTranslations("common");
  const formId = useId();

  const isEditing = !!branch;
  const isMainBranch = branch?.isMainBranch ?? false;

  // Default business hours
  const DEFAULT_BUSINESS_HOURS: BusinessHours = {
    timezone: "America/Bogota",
    schedule: {
      monday: { isOpen: true, open: "09:00", close: "18:00" },
      tuesday: { isOpen: true, open: "09:00", close: "18:00" },
      wednesday: { isOpen: true, open: "09:00", close: "18:00" },
      thursday: { isOpen: true, open: "09:00", close: "18:00" },
      friday: { isOpen: true, open: "09:00", close: "18:00" },
      saturday: { isOpen: false, open: "09:00", close: "18:00" },
      sunday: { isOpen: false, open: "09:00", close: "18:00" },
    },
    holidays: [],
  };

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    code: "",
    whatsappPhoneNumber: "",
    whatsappPhoneNumberId: "",
    routingMode: "DEDICATED" as RoutingMode,
    address: "",
    timezone: "America/Bogota",
    currency: "COP",
    isActive: true,
    contactPhone: "",
    deliveryConfig: { type: "FREE" as DeliveryFeeType },
    businessHours: DEFAULT_BUSINESS_HOURS,
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Initialize form with branch data when editing
  useEffect(() => {
    if (branch) {
      const phone = getPrimaryWhatsApp(branch);
      setFormData({
        name: branch.name,
        slug: branch.slug,
        code: branch.code,
        whatsappPhoneNumber: phone || "",
        whatsappPhoneNumberId: branch.whatsappPhoneNumberId || "",
        routingMode: branch.routingMode,
        address: branch.address || "",
        timezone: branch.timezone,
        currency: branch.currency,
        isActive: branch.isActive,
        contactPhone: branch.contactPhone || "",
        deliveryConfig: branch.deliveryConfig || { type: "FREE" },
        businessHours: branch.businessHours || DEFAULT_BUSINESS_HOURS,
      });
      setErrors({});
      setTouched({});
      setSlugManuallyEdited(true);
    }
  }, [branch]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && !isEditing && formData.name) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(prev.name) }));
    }
  }, [formData.name, slugManuallyEdited, isEditing]);

  // Validate field
  const validateField = useCallback(
    (name: string, value: string): string => {
      switch (name) {
        case "name":
          return !value.trim() ? t("form.errors.nameRequired") : "";
        case "slug":
          if (!value.trim()) return t("form.errors.slugRequired");
          if (!/^[a-z0-9-]+$/.test(value)) return t("form.errors.slugInvalid");
          return "";
        case "code":
          return !value.trim() ? t("form.errors.codeRequired") : "";
        case "whatsappPhoneNumber":
          if (value && !E164_REGEX.test(value)) {
            return t("form.errors.phoneInvalid");
          }
          return "";
        default:
          return "";
      }
    },
    [t]
  );

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  // Handle slug manual edit
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    handleChange(e);
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Handle blur for validation
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fieldsToValidate = ["name", "slug", "code", "whatsappPhoneNumber"];

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
          slug: formData.slug,
          code: formData.code,
          whatsappPhoneNumber: formData.whatsappPhoneNumber || undefined,
          whatsappPhoneNumberId: formData.whatsappPhoneNumberId || undefined,
          routingMode: formData.routingMode,
          address: formData.address || undefined,
          timezone: formData.timezone,
          currency: formData.currency,
          isActive: formData.isActive,
          contactPhone: formData.contactPhone || undefined,
          deliveryConfig: formData.deliveryConfig,
          businessHours: formData.businessHours,
        }
      : {
          // Create: send all required fields
          name: formData.name,
          slug: formData.slug,
          code: formData.code,
          whatsappPhoneNumber: formData.whatsappPhoneNumber || undefined,
          whatsappPhoneNumberId: formData.whatsappPhoneNumberId || undefined,
          routingMode: formData.routingMode,
          address: formData.address || undefined,
          timezone: formData.timezone,
          currency: formData.currency,
          contactPhone: formData.contactPhone || undefined,
          deliveryConfig: formData.deliveryConfig,
          businessHours: formData.businessHours,
        };

    onSubmit(data);
  };

  const isFormValid =
    formData.name.trim() &&
    formData.slug.trim() &&
    formData.code.trim() &&
    (!formData.whatsappPhoneNumber ||
      E164_REGEX.test(formData.whatsappPhoneNumber));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card variant="glass">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            {t("form.sections.basic")}
          </CardTitle>
          <CardDescription>{t("form.descriptions.basic")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
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
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-slug`}>
                {t("form.fields.slug")} <span className="text-red-500">*</span>{" "}
                <span className="text-xs text-slate-500">
                  {t("form.help.slug")}
                </span>
              </Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id={`${formId}-slug`}
                  name="slug"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  onBlur={handleBlur}
                  placeholder={t("form.placeholders.slug")}
                  disabled={isLoading || (isEditing && isMainBranch)}
                  readOnly={isEditing && isMainBranch}
                  error={errors.slug}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-code`}>
              {t("form.fields.code")} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id={`${formId}-code`}
                name="code"
                value={formData.code}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t("form.placeholders.code")}
                disabled={isLoading || (isEditing && isMainBranch)}
                error={errors.code}
                className="pl-9"
                readOnly={isEditing && isMainBranch}
              />
            </div>
            {isEditing && isMainBranch && (
              <p className="text-xs text-amber-600">
                {t("form.help.codeLocked")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Configuration */}
      <Card variant="glass">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-500" />
            {t("form.sections.whatsapp")}
          </CardTitle>
          <CardDescription>{t("form.descriptions.whatsapp")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Routing Mode */}
          <div className="space-y-3">
            <Label>{t("form.fields.routingMode")}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["DEDICATED", "SINGLE_NUMBER"] as RoutingMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleSelectChange("routingMode", mode)}
                  disabled={isLoading}
                  className={cn(
                    "relative flex flex-col items-start p-4 rounded-lg border text-left transition-all",
                    formData.routingMode === mode
                      ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <span className="font-medium text-slate-900">
                    {t(`routingModes.${mode}.title`)}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    {t(`routingModes.${mode}.description`)}
                  </span>
                  {formData.routingMode === mode && (
                    <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* WhatsApp Phone Number */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-whatsappPhoneNumber`}>
                {t("form.fields.whatsappPhoneNumber")}
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id={`${formId}-whatsappPhoneNumber`}
                  name="whatsappPhoneNumber"
                  type="tel"
                  value={formData.whatsappPhoneNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="+573001234567"
                  disabled={isLoading}
                  error={errors.whatsappPhoneNumber}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-slate-500">
                {t("form.help.phoneFormat")}
              </p>
            </div>

            {/* WhatsApp Phone Number ID */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-whatsappPhoneNumberId`}>
                {t("form.fields.whatsappPhoneNumberId")}
              </Label>
              <Input
                id={`${formId}-whatsappPhoneNumberId`}
                name="whatsappPhoneNumberId"
                value={formData.whatsappPhoneNumberId}
                onChange={handleChange}
                placeholder={t("form.placeholders.whatsappPhoneNumberId")}
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500">
                {t("form.help.phoneNumberId")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location & Settings */}
      <Card variant="glass">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            {t("form.sections.location")}
          </CardTitle>
          <CardDescription>{t("form.descriptions.location")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-timezone`}>
                {t("form.fields.timezone")}
              </Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => handleSelectChange("timezone", value)}
                disabled={isLoading}
              >
                <SelectTrigger id={`${formId}-timezone`} className="h-11">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableTimezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-currency`}>
                {t("form.fields.currency")}
              </Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleSelectChange("currency", value)}
                disabled={isLoading}
              >
                <SelectTrigger id={`${formId}-currency`} className="h-11">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.code} - {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-address`}>
              {t("form.fields.address")}
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Textarea
                id={`${formId}-address`}
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder={t("form.placeholders.address")}
                rows={3}
                disabled={isLoading}
                className="pl-9 resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status (only when editing) */}
      {isEditing && (
        <Card variant="glass">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-500" />
              {t("form.sections.status")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <Label htmlFor={`${formId}-isActive`} className="font-medium">
                  {t("form.fields.isActive")}
                </Label>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("form.help.isActive")}
                </p>
              </div>
              <Switch
                id={`${formId}-isActive`}
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  handleSwitchChange("isActive", checked)
                }
                disabled={isLoading || isMainBranch}
              />
            </div>
            {isMainBranch && (
              <p className="text-xs text-amber-600 mt-2">
                {t("form.help.mainBranchAlwaysActive")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contact Phone */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="w-4 h-4 text-purple-500" />
            {t("form.sections.contact")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-contactPhone`}>
              {t("form.fields.contactPhone")}
            </Label>
            <Input
              id={`${formId}-contactPhone`}
              name="contactPhone"
              type="tel"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder={t("form.placeholders.contactPhone")}
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500">
              {t("form.help.contactPhone")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Config */}
      <DeliveryConfigSection
        value={formData.deliveryConfig}
        onChange={(config) =>
          setFormData((prev) => ({ ...prev, deliveryConfig: config }))
        }
      />

      {/* Business Hours */}
      <BusinessHoursSection
        value={formData.businessHours}
        onChange={(hours) =>
          setFormData((prev) => ({ ...prev, businessHours: hours }))
        }
      />

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
          {isEditing ? tCommon("buttons.saveChanges") : t("form.createBranch")}
        </Button>
      </div>
    </form>
  );
}
