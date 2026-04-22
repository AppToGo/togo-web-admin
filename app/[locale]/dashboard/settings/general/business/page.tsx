"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import {
  Store,
  ArrowLeft,
  Loader2,
  Upload,
  Palette,
  Globe,
  ShoppingBag,
  MessageCircle,
  Edit2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";
import { useCurrentBusiness, useUpdateBusiness } from "@/features/business";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  useWhatsAppAccounts,
  useWhatsAppRoutings,
  WhatsAppConnectDialog,
} from "@/features/whatsapp";


interface FormData {
  name: string;
  slug: string;
  phone: string;
  industryId: string;
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  accentColor: string;
  description: string;
  welcomeMessage: string;
  useProductImages: boolean;
}

const defaultFormData: FormData = {
  name: "",
  slug: "",
  phone: "",
  industryId: "",
  logoUrl: "",
  bannerUrl: "",
  primaryColor: "#4F46E5",
  accentColor: "#10B981",
  description: "",
  welcomeMessage: "",
  useProductImages: false,
};

export default function BusinessSettingsPage() {
  const t = useTranslations("settings");
  const tb = useTranslations("settings.business");
  const tc = useTranslations("common");
  const tWa = useTranslations("whatsapp");

  useAuthGuard();

  const user = useCurrentUser();
  const { data: business, isLoading, error } = useCurrentBusiness();
  const updateBusiness = useUpdateBusiness();

  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );

  // WhatsApp state
  const { data: whatsappAccounts } = useWhatsAppAccounts();
  const { data: whatsappRoutings } = useWhatsAppRoutings();
  const [waDialogOpen, setWaDialogOpen] = useState(false);

  // Find AUTO_ASSIGN routing (business-level, branchId is null)
  const autoAssignRouting =
    whatsappRoutings?.find(
      (r) => r.strategy === "AUTO_ASSIGN" && r.isActive
    ) ?? null;
  const autoAssignAccount = autoAssignRouting
    ? (whatsappAccounts?.find(
        (a) => a.id === autoAssignRouting.whatsappAccountId
      ) ?? null)
    : null;

  // Initialize form data when business loads
  useEffect(() => {
    if (business) {
      const s = (business.settings as Record<string, unknown>) ?? {};
      setFormData({
        name: business.name || "",
        slug: business.slug || "",
        phone: business.phone || "",
        industryId: business.industryId || "",
        logoUrl: (s.logo as string) || (s.logoUrl as string) || "",
        bannerUrl: (s.banner as string) || (s.bannerUrl as string) || "",
        primaryColor: (s.primaryColor as string) || "#4F46E5",
        accentColor: (s.accentColor as string) || "#10B981",
        description: (s.description as string) || "",
        welcomeMessage: (s.welcomeMessage as string) || "",
        useProductImages: Boolean(s.useProductImages),
      });
    }
  }, [business]);

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field changes
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleBooleanChange = useCallback((field: keyof FormData, value: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = tb("validation.nameRequired");
    }

    if (!formData.slug.trim()) {
      newErrors.slug = tb("validation.slugRequired");
    } else if (formData.slug.length < 3) {
      newErrors.slug = tb("validation.slugMinLength");
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = tb("validation.slugFormat");
    }

    if (
      formData.primaryColor &&
      !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(formData.primaryColor)
    ) {
      newErrors.primaryColor = tb("validation.colorFormat");
    }

    if (
      formData.accentColor &&
      !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(formData.accentColor)
    ) {
      newErrors.accentColor = tb("validation.colorFormat");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!business?.id) return;
      if (!validateForm()) return;

      await updateBusiness.mutateAsync({
        businessId: business.id,
        data: {
          name: formData.name,
          slug: formData.slug,
          phone: formData.phone || undefined,
          industryId: formData.industryId || undefined,
          catalogVisibility: 'PUBLIC',
          settings: {
            ...((business.settings as Record<string, unknown>) ?? {}),
            logo: formData.logoUrl || undefined,
            banner: formData.bannerUrl || undefined,
            primaryColor: formData.primaryColor || undefined,
            accentColor: formData.accentColor || undefined,
            description: formData.description || undefined,
            welcomeMessage: formData.welcomeMessage || undefined,
            useProductImages: formData.useProductImages,
          },
        },
      });
    },
    [business?.id, formData, updateBusiness, validateForm]
  );

  const isDirty = business
    ? (() => {
        const s = (business.settings as Record<string, unknown>) ?? {};
        return (
          formData.name !== (business.name || "") ||
          formData.slug !== (business.slug || "") ||
          formData.phone !== (business.phone || "") ||
          formData.industryId !== (business.industryId || "") ||
          formData.logoUrl !== ((s.logo as string) || (s.logoUrl as string) || "") ||
          formData.bannerUrl !== ((s.banner as string) || (s.bannerUrl as string) || "") ||
          formData.primaryColor !== ((s.primaryColor as string) || "#4F46E5") ||
          formData.accentColor !== ((s.accentColor as string) || "#10B981") ||
          formData.description !== ((s.description as string) || "") ||
          formData.welcomeMessage !== ((s.welcomeMessage as string) || "") ||
          formData.useProductImages !== Boolean(s.useProductImages)
        );
      })()
    : false;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !business) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto mt-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{tb("error.carga")}</AlertTitle>
            <AlertDescription>
              {error?.message || tb("errors.loadFailed")}
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Store className="h-6 w-6 text-indigo-600" />
              {tb("title")}
            </h1>
            <p className="text-slate-500">{tb("subtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Information */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-600" />
                {tb("information.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {tb("information.name")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder={tb("placeholders.name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex justify-between">
                    {tb("information.phone")}
                    <span className="text-xs text-slate-500 mr-2">
                      {tb("information.phoneDescription")}
                    </span>
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder={tb("placeholders.phone")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  {tb("information.slug")}{" "}
                  <span className="text-red-500">*</span>
                  <span className="text-xs text-slate-500 ml-4">
                    {tb("information.slugDescription")}
                  </span>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">togo.com/</span>
                  <Input
                    id="slug"
                    value={formData.slug}
                    readOnly
                    disabled
                    onChange={(e) =>
                      handleChange(
                        "slug",
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
                      )
                    }
                    placeholder={tb("placeholders.slug")}
                    className="flex-1"
                  />
                </div>
                {errors.slug && (
                  <p className="text-sm text-red-500">{errors.slug}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  {tb("information.description")}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder={tb("information.descriptionPlaceholder")}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">
                  {tb("information.menssage")}
                </Label>
                <Textarea
                  id="welcomeMessage"
                  value={formData.welcomeMessage}
                  onChange={(e) =>
                    handleChange("welcomeMessage", e.target.value)
                  }
                  placeholder={tb("information.menssagePlaceholder")}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Catalog Configuration */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-indigo-600" />
                {tb("config.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="useProductImages" className="text-base">
                    {tb("config.useProductImages.label")}
                  </Label>
                  <p className="text-sm text-slate-500">
                    {tb("config.useProductImages.description")}
                  </p>
                </div>
                <Switch
                  id="useProductImages"
                  checked={formData.useProductImages}
                  onCheckedChange={(checked) => handleBooleanChange("useProductImages", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5 text-indigo-600" />
                {tb("branding.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div className="space-y-2">
                <Label>{tb("branding.logo.label")}</Label>
                <div className="flex items-center gap-4">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      className="w-20 h-20 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center border">
                      <Store className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                  <div className="space-y-2 flex-1">
                    <Input
                      value={formData.logoUrl}
                      onChange={(e) => handleChange("logoUrl", e.target.value)}
                      placeholder="URL del logo"
                    />
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      {tb("branding.logo.upload")}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div className="space-y-2">
                <Label>{tb("branding.banner.label")}</Label>
                <div className="space-y-2">
                  {formData.bannerUrl ? (
                    <img
                      src={formData.bannerUrl}
                      alt="Banner"
                      className="w-full h-32 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="w-full h-32 rounded-lg bg-slate-100 flex items-center justify-center border">
                      <Upload className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                  <Input
                    value={formData.bannerUrl}
                    onChange={(e) => handleChange("bannerUrl", e.target.value)}
                    placeholder={tb("placeholders.bannerUrl")}
                  />
                </div>
              </div>

              {/* Colors */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">{tb("branding.colors.primary")}</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        handleChange("primaryColor", e.target.value)
                      }
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) =>
                        handleChange("primaryColor", e.target.value)
                      }
                      className="flex-1 uppercase"
                    />
                  </div>
                  {errors.primaryColor && (
                    <p className="text-sm text-red-500">
                      {errors.primaryColor}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor">{tb("branding.colors.accent")}</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) =>
                        handleChange("accentColor", e.target.value)
                      }
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    />
                    <Input
                      value={formData.accentColor}
                      onChange={(e) =>
                        handleChange("accentColor", e.target.value)
                      }
                      className="flex-1 uppercase"
                    />
                  </div>
                  {errors.accentColor && (
                    <p className="text-sm text-red-500">{errors.accentColor}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard">
              <Button type="button" variant="outline">
                {tb("buttons.cancel")}
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={!isDirty || updateBusiness.isPending}
              isLoading={updateBusiness.isPending}
            >
              {tc("buttons.save")}
            </Button>
          </div>
        </form>

        {/* WhatsApp Compartido (AUTO_ASSIGN) */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              {tWa("business.sectionTitle")}
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              {tWa("business.sectionDescription")}
            </p>
          </CardHeader>
          <CardContent>
            {autoAssignAccount && autoAssignRouting ? (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    {tWa("business.configured")}
                  </Badge>
                  <span className="text-sm font-mono text-slate-700">
                    {autoAssignAccount.displayName ?? autoAssignAccount.phoneNumber}
                  </span>
                  {autoAssignAccount.displayName && (
                    <span className="text-xs text-slate-500">
                      ({autoAssignAccount.phoneNumber})
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWaDialogOpen(true)}
                  className="ml-auto"
                >
                  <Edit2 className="w-4 h-4 mr-1.5" />
                  {tWa("accounts.edit")}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setWaDialogOpen(true)}
                className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {tWa("business.configure")}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Dialog — branchId=null means AUTO_ASSIGN */}
      <WhatsAppConnectDialog
        open={waDialogOpen}
        onOpenChange={setWaDialogOpen}
        branchId={null}
        account={autoAssignAccount}
        existingRouting={autoAssignRouting}
      />
    </DashboardLayout>
  );
}
