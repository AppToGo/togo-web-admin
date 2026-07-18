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
} from "lucide-react";
import { COLOMBIA_DEPARTMENTS } from "@/lib/colombia-cities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CreateBranchRequest,
  UpdateBranchRequest,
  DeliveryFeeType,
  DeliveryConfig,
  BusinessHours,
  TransferOptions,
} from "../types";
import { DEFAULT_TRANSFER_OPTIONS } from "../types";
import { DeliveryConfigSection } from "./DeliveryConfigSection";
import { BusinessHoursSection } from "./BusinessHoursSection";
import { TransferOptionsSection } from "./TransferOptionsSection";
import { BranchLocationPicker } from "./BranchLocationPicker";

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

  // Default business hours — defined before useState so it can be used in lazy initializer
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

  // Form state — lazy initializer reads from branch prop on first render
  const [formData, setFormData] = useState(() => {
    if (!branch) {
      return {
        name: "",
        slug: "",
        code: "",
        address: "",
        department: "",
        city: "",
        timezone: "America/Bogota",
        currency: "COP",
        isActive: true,
        contactPhone: "",
        latitude: null as number | null,
        longitude: null as number | null,
        deliveryConfig: { type: "FREE" as DeliveryFeeType },
        businessHours: DEFAULT_BUSINESS_HOURS,
        transferOptions: DEFAULT_TRANSFER_OPTIONS,
      };
    }
    const bh = branch.businessHours as BusinessHours | null;
    const to = branch.transferOptions as TransferOptions | null;
    return {
      name: branch.name,
      slug: branch.slug,
      code: branch.code,
      address: branch.address || "",
      department: branch.department || "",
      city: branch.city || "",
      timezone: branch.timezone,
      currency: branch.currency,
      isActive: branch.isActive,
      contactPhone: branch.contactPhone || "",
      latitude: branch.latitude ?? null,
      longitude: branch.longitude ?? null,
      deliveryConfig: (branch.deliveryConfig as DeliveryConfig)?.type
        ? (branch.deliveryConfig as DeliveryConfig)
        : { type: "FREE" as DeliveryFeeType },
      businessHours: bh?.timezone && bh?.schedule ? bh : DEFAULT_BUSINESS_HOURS,
      transferOptions: to?.options !== undefined ? to : DEFAULT_TRANSFER_OPTIONS,
    };
  });

  // Cities available for the selected department
  const availableCities =
    COLOMBIA_DEPARTMENTS.find((d) => d.name === formData.department)?.cities ??
    [];

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!branch);

  // Sync form when branch prop changes (e.g. after React Query background refetch)
  useEffect(() => {
    if (branch) {
      const bh = branch.businessHours as BusinessHours | null;
      const to = branch.transferOptions as TransferOptions | null;
      setFormData({
        name: branch.name,
        slug: branch.slug,
        code: branch.code,
        address: branch.address || "",
        department: branch.department || "",
        city: branch.city || "",
        timezone: branch.timezone,
        currency: branch.currency,
        isActive: branch.isActive,
        contactPhone: branch.contactPhone || "",
        latitude: branch.latitude ?? null,
        longitude: branch.longitude ?? null,
        deliveryConfig: (branch.deliveryConfig as DeliveryConfig)?.type
          ? (branch.deliveryConfig as DeliveryConfig)
          : { type: "FREE" as DeliveryFeeType },
        businessHours:
          bh?.timezone && bh?.schedule ? bh : DEFAULT_BUSINESS_HOURS,
        transferOptions: to?.options !== undefined ? to : DEFAULT_TRANSFER_OPTIONS,
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

  // Handle department change — persists department and resets city
  const handleDepartmentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, department: value, city: "" }));
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
    const fieldsToValidate = ["name", "slug", "code"];

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

  // Normalize JSON config fields before submit — guards against empty {} from Prisma defaults
  const normalizeDeliveryConfig = (cfg: unknown): DeliveryConfig =>
    (cfg as DeliveryConfig)?.type
      ? (cfg as DeliveryConfig)
      : { type: "FREE" as DeliveryFeeType };

  const normalizeBusinessHours = (bh: unknown): BusinessHours => {
    const typed = bh as BusinessHours | null;
    return typed?.timezone && typed?.schedule ? typed : DEFAULT_BUSINESS_HOURS;
  };

  const normalizeTransferOptions = (to: unknown): TransferOptions => {
    const typed = to as TransferOptions | null;
    return typed?.options !== undefined ? typed : DEFAULT_TRANSFER_OPTIONS;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const data = isEditing
      ? {
          name: formData.name,
          slug: formData.slug,
          code: formData.code,
          address: formData.address || undefined,
          department: formData.department || undefined,
          city: formData.city || undefined,
          timezone: formData.timezone,
          currency: formData.currency,
          isActive: formData.isActive,
          contactPhone: formData.contactPhone || undefined,
          latitude: formData.latitude ?? undefined,
          longitude: formData.longitude ?? undefined,
          deliveryConfig: normalizeDeliveryConfig(formData.deliveryConfig),
          businessHours: normalizeBusinessHours(formData.businessHours),
          transferOptions: normalizeTransferOptions(formData.transferOptions),
        }
      : {
          name: formData.name,
          slug: formData.slug,
          code: formData.code,
          address: formData.address || undefined,
          department: formData.department || undefined,
          city: formData.city || undefined,
          timezone: formData.timezone,
          currency: formData.currency,
          contactPhone: formData.contactPhone || undefined,
          latitude: formData.latitude ?? undefined,
          longitude: formData.longitude ?? undefined,
          deliveryConfig: normalizeDeliveryConfig(formData.deliveryConfig),
          businessHours: normalizeBusinessHours(formData.businessHours),
          transferOptions: normalizeTransferOptions(formData.transferOptions),
        };

    onSubmit(data);
  };

  const isFormValid =
    formData.name.trim() && formData.slug.trim() && formData.code.trim();

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

          {/* Department & City */}
          <div className="grid grid-cols-2 gap-3">
            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-department`}>
                {t("form.fields.department")}
              </Label>
              <Select
                value={formData.department}
                onValueChange={handleDepartmentChange}
                disabled={isLoading}
              >
                <SelectTrigger id={`${formId}-department`} className="h-11">
                  <span
                    className={cn(
                      "flex-1 text-left truncate text-sm",
                      !formData.department && "text-slate-400"
                    )}
                  >
                    {formData.department || t("form.placeholders.department")}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {COLOMBIA_DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept.name} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-city`}>{t("form.fields.city")}</Label>
              <Select
                value={formData.city}
                onValueChange={(v) => handleSelectChange("city", v)}
                disabled={!formData.department || isLoading}
              >
                <SelectTrigger id={`${formId}-city`} className="h-11">
                  <span
                    className={cn(
                      "flex-1 text-left truncate text-sm",
                      !formData.city && "text-slate-400"
                    )}
                  >
                    {formData.city ||
                      (!formData.department
                        ? t("form.placeholders.citySelectDepartmentFirst")
                        : t("form.placeholders.city"))}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
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
              <Input
                id={`${formId}-address`}
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder={t("form.placeholders.address")}
                disabled={isLoading}
                className="pl-9 resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map location picker */}
      <BranchLocationPicker
        latitude={formData.latitude}
        longitude={formData.longitude}
        address={formData.address}
        city={formData.city}
        department={formData.department}
        onChange={(lat, lng) =>
          setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))
        }
      />

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

      {/* Transfer Payment */}
      <TransferOptionsSection
        value={formData.transferOptions}
        onChange={(opts) =>
          setFormData((prev) => ({ ...prev, transferOptions: opts }))
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
