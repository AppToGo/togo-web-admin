"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Store,
  Loader2,
  Upload,
  MessageCircle,
  Edit2,
  ExternalLink,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, HEX_COLOR } from "@/lib/utils";
import { APP_CONFIG } from "@/config/app.config";
import { CatalogPreview } from "@/features/business/components/CatalogPreview";
import {
  BotVoiceCard,
  botVoiceKey,
  useCurrentBusiness,
  useUpdateBusiness,
  useUploadBusinessLogo,
} from "@/features/business";
import type { Business } from "@/features/business";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  useWhatsAppAccounts,
  useWhatsAppRoutings,
  WhatsAppAttentionCard,
  WhatsAppConnectDialog,
  WhatsAppUsageCard,
} from "@/features/whatsapp";

const SECTION =
  "flex flex-col gap-4 rounded-3xl border border-white/90 bg-white/65 p-6";
const FIELD = "h-11 rounded-[14px] border-0 bg-white";
const FORM_ID = "business-settings-form";

interface FormData {
  name: string;
  slug: string;
  phone: string;
  industryId: string;
  primaryColor: string;
  accentColor: string;
  description: string;
  useProductImages: boolean;
}

const defaultFormData: FormData = {
  name: "",
  slug: "",
  phone: "",
  industryId: "",
  primaryColor: "#4F46E5",
  accentColor: "#10B981",
  description: "",
  useProductImages: false,
};

/**
 * Etiqueta del estado de un sync con fallback al valor crudo si el backend
 * envía un estado sin traducción (mismo patrón que el motivo de borrador
 * en el hilo: nunca mostrar la ruta de la clave al usuario).
 */
function syncStateLabel(
  t: ReturnType<typeof useTranslations>,
  status?: string | null
): string {
  const normalized = status ?? "PENDING";
  const key = `connection.syncState_${normalized}`;
  return t.has(key) ? t(key) : normalized;
}

function formDataFrom(business: Business): FormData {
  const s = (business.settings as Record<string, unknown>) ?? {};
  return {
    name: business.name || "",
    slug: business.slug || "",
    phone: business.phone || "",
    industryId: business.industryId || "",
    primaryColor: (s.primaryColor as string) || "#4F46E5",
    accentColor: (s.accentColor as string) || "#10B981",
    description: (s.description as string) || "",
    useProductImages: Boolean(s.useProductImages),
  };
}

export default function BusinessSettingsPage() {
  const t = useTranslations("settings");
  const tb = useTranslations("settings.business");
  const tc = useTranslations("common");
  const tWa = useTranslations("whatsapp");

  useAuthGuard();

  const { data: business, isLoading, error } = useCurrentBusiness();
  const updateBusiness = useUpdateBusiness();
  const uploadLogo = useUploadBusinessLogo();
  const logoInputRef = useRef<HTMLInputElement>(null);

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
    whatsappRoutings?.find((r) => r.strategy === "AUTO_ASSIGN" && r.isActive) ??
    null;
  const autoAssignAccount = autoAssignRouting
    ? (whatsappAccounts?.find(
        (a) => a.id === autoAssignRouting.whatsappAccountId
      ) ?? null)
    : null;

  // Initialize form data when business loads. Keyed on the form's own
  // fields, not the whole business object: saving another section (e.g. the
  // assistant voice card) refetches the business and must not wipe unsaved
  // edits here.
  const formSource = business ? JSON.stringify(formDataFrom(business)) : null;
  useEffect(() => {
    if (formSource) {
      setFormData(JSON.parse(formSource) as FormData);
    }
  }, [formSource]);

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field changes
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleBooleanChange = useCallback(
    (field: keyof FormData, value: boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

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
      !HEX_COLOR.test(formData.primaryColor)
    ) {
      newErrors.primaryColor = tb("validation.colorFormat");
    }

    if (
      formData.accentColor &&
      !HEX_COLOR.test(formData.accentColor)
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

      const {
        logo: _logo,
        logoKey: _logoKey,
        ...existingSettings
      } = (business.settings as Record<string, unknown>) ?? {};

      try {
        await updateBusiness.mutateAsync({
          businessId: business.id,
          data: {
            name: formData.name,
            slug: formData.slug,
            phone: formData.phone || undefined,
            industryId: formData.industryId || undefined,
            catalogVisibility: business.catalogVisibility,
            settings: {
              ...existingSettings,
              primaryColor: formData.primaryColor || undefined,
              accentColor: formData.accentColor || undefined,
              description: formData.description || undefined,
              useProductImages: formData.useProductImages,
            },
          },
        });
        toast.success(tb("saveSuccess"));
      } catch {
        toast.error(tb("saveError"));
      }
    },
    [
      business?.id,
      business?.catalogVisibility,
      business?.settings,
      formData,
      updateBusiness,
      validateForm,
      tb,
    ]
  );

  const isDirty =
    formSource !== null && JSON.stringify(formData) !== formSource;

  const handleDiscard = useCallback(() => {
    if (formSource) setFormData(JSON.parse(formSource) as FormData);
    setErrors({});
  }, [formSource]);

  const handleLogoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !business?.id) return;

      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error(tb("branding.logo.invalidType"));
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error(tb("branding.logo.tooLarge"));
        return;
      }

      try {
        await uploadLogo.mutateAsync({ businessId: business.id, file });
        toast.success(tb("branding.logo.uploadSuccess"));
      } catch {
        toast.error(tb("branding.logo.uploadError"));
      } finally {
        if (logoInputRef.current) logoInputRef.current.value = "";
      }
    },
    [business?.id, uploadLogo, tb]
  );

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
            <AlertTitle>{t("error.carga")}</AlertTitle>
            <AlertDescription>
              {error?.message || tb("errors.loadFailed")}
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const logoUrl = (business.settings as Record<string, unknown>)?.logo as
    | string
    | undefined;
  const catalogUrl = `${APP_CONFIG.webCatalog.baseUrl}/${formData.slug}`;
  const catalogLabel = catalogUrl.replace(/^https?:\/\//, "");

  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
        {/* Header (< md el título está en la barra superior) */}
        <header className="hidden md:block">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Store className="h-6 w-6 text-indigo-600" />
            {tb("title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{tb("subtitle")}</p>
        </header>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          {/* Vista previa: fija mientras se recorre el formulario */}
          <aside
            aria-label={tb("preview.title")}
            className="flex shrink-0 flex-col gap-3.5 rounded-3xl border border-white/90 bg-white/70 p-5 lg:sticky lg:top-6 lg:w-[340px]"
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {tb("preview.title")}
                </h2>
                <p className="mt-1 text-[13px] text-slate-500">{tb("preview.subtitle")}</p>
              </div>
              {isDirty && (
                <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {tb("preview.unsaved")}
                </span>
              )}
            </div>
            <CatalogPreview
              name={formData.name}
              description={formData.description}
              logoUrl={logoUrl}
              primaryColor={formData.primaryColor}
              accentColor={formData.accentColor}
              useProductImages={formData.useProductImages}
            />
            {formData.slug && (
              <a
                href={catalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 self-center break-all text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                {catalogLabel}
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            )}
          </aside>

          <div className="min-w-0 flex-1 space-y-4">
            <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
              <section className={SECTION}>
                <div>
                  <h2 className="text-[17px] font-semibold text-slate-900">{tb("information.title")}</h2>
                  <p className="mt-1 text-[13px] text-slate-500">{tb("information.lead")}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {tb("information.name")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder={tb("placeholders.name")}
                      className={FIELD}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>
                  <PhoneInput
                    label={tb("information.phone")}
                    value={formData.phone}
                    onChange={(v) => handleChange("phone", v)}
                    helperText={tb("information.phoneDescription")}
                    id="phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{tb("information.description")}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder={tb("information.descriptionPlaceholder")}
                    rows={3}
                    className="rounded-[14px] border-0 bg-white"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-white/80 px-4 py-3 text-sm">
                  <span className="text-slate-500">{tb("information.catalogAddress")}</span>
                  <span className="break-all font-medium text-slate-800">{catalogLabel}</span>
                  {errors.slug && <p className="w-full text-sm text-red-500">{errors.slug}</p>}
                </div>
              </section>

              <section className={SECTION}>
                <div>
                  <h2 className="text-[17px] font-semibold text-slate-900">{tb("branding.title")}</h2>
                  <p className="mt-1 text-[13px] text-slate-500">{tb("branding.lead")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt={tb("branding.logo.label")}
                      className="h-[72px] w-[72px] rounded-[18px] bg-white object-cover"
                    />
                  ) : (
                    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[18px] bg-white">
                      <Store className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <Button
                      type="button"
                      variant="slate-outline"
                      disabled={uploadLogo.isPending}
                      isLoading={uploadLogo.isPending}
                      onClick={() => logoInputRef.current?.click()}
                      className="h-11 rounded-[14px] px-4 font-semibold text-slate-700"
                    >
                      <Upload className="h-4 w-4" />
                      {uploadLogo.isPending
                        ? tb("branding.logo.uploading")
                        : logoUrl
                          ? tb("branding.logo.change")
                          : tb("branding.logo.upload")}
                    </Button>
                    <span className="text-xs text-slate-500">{tb("branding.logo.help")}</span>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {(["primaryColor", "accentColor"] as const).map((field) => (
                    <div key={field} className="space-y-1.5">
                      <Label htmlFor={field}>
                        {tb(field === "primaryColor" ? "branding.colors.primary" : "branding.colors.accent")}
                      </Label>
                      <p className="text-xs text-slate-500">
                        {tb(field === "primaryColor" ? "branding.colors.primaryHelp" : "branding.colors.accentHelp")}
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData[field]}
                          onChange={(e) => handleChange(field, e.target.value)}
                          aria-label={tb(field === "primaryColor" ? "branding.colors.primary" : "branding.colors.accent")}
                          className="h-11 w-11 shrink-0 cursor-pointer rounded-xl border-0 p-0"
                        />
                        <Input
                          id={field}
                          value={formData[field]}
                          onChange={(e) => handleChange(field, e.target.value)}
                          className={cn(FIELD, "uppercase")}
                        />
                      </div>
                      {errors[field] && <p className="text-sm text-red-500">{errors[field]}</p>}
                    </div>
                  ))}
                </div>
              </section>

              <section className={SECTION}>
                <h2 className="text-[17px] font-semibold text-slate-900">{tb("config.title")}</h2>
                <div className="flex items-center gap-4 rounded-2xl bg-white/80 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="useProductImages" className="text-sm font-semibold">
                      {tb("config.useProductImages.label")}
                    </Label>
                    <p className="text-xs text-slate-500">{tb("config.useProductImages.description")}</p>
                  </div>
                  <Switch
                    id="useProductImages"
                    checked={formData.useProductImages}
                    onCheckedChange={(checked) => handleBooleanChange("useProductImages", checked)}
                  />
                </div>
              </section>

            </form>

            {/* Voz del asistente de WhatsApp (plan bot natural, T18) */}
            <BotVoiceCard key={botVoiceKey(business)} business={business} />

            {/* WhatsApp Compartido (AUTO_ASSIGN) */}
            <section className={SECTION}>
              <div>
                <h2 className="flex items-center gap-2 text-[17px] font-semibold text-slate-900">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  {tWa("business.sectionTitle")}
                </h2>
                <p className="mt-1 text-[13px] text-slate-500">{tWa("business.sectionDescription")}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white/80 px-4 py-3.5">
                {autoAssignAccount && autoAssignRouting ? (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {autoAssignAccount.displayName ?? autoAssignAccount.phoneNumber}
                    </p>
                    {autoAssignAccount.displayName && (
                      <p className="text-xs text-slate-500">{autoAssignAccount.phoneNumber}</p>
                    )}
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          autoAssignAccount.connectionType === "COEXISTENCE"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {autoAssignAccount.connectionType === "COEXISTENCE"
                          ? tWa("connection.coexistence")
                          : tWa("connection.cloudApi")}
                      </span>
                      {autoAssignAccount.status === "DISCONNECTED" && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700">
                          {tWa("connection.disconnected")}
                        </span>
                      )}
                      {autoAssignAccount.connectionType === "COEXISTENCE" && (
                          <span className="text-slate-500">
                            {tWa("connection.syncContacts", {
                              state: syncStateLabel(
                                tWa,
                                autoAssignAccount.contactsSyncStatus
                              ),
                            })}
                            {" · "}
                            {tWa("connection.syncHistory", {
                              state: syncStateLabel(
                                tWa,
                                autoAssignAccount.historySyncStatus
                              ),
                            })}
                            {(autoAssignAccount.contactsSyncStatus === "PENDING" ||
                              autoAssignAccount.historySyncStatus === "PENDING") &&
                              ` — ${tWa("connection.syncPending")}`}
                          </span>
                        )}
                    </p>
                  </div>
                ) : (
                  <p className="min-w-0 flex-1 text-sm text-slate-500">{tb("whatsapp.notConfigured")}</p>
                )}
                <Button
                  type="button"
                  variant="slate-outline"
                  onClick={() => setWaDialogOpen(true)}
                  className="h-11 rounded-[14px] px-4 font-semibold text-slate-700"
                >
                  {autoAssignAccount && autoAssignRouting ? (
                    <>
                      <Edit2 className="h-4 w-4" />
                      {tWa("accounts.edit")}
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4" />
                      {tWa("business.configure")}
                    </>
                  )}
                </Button>
              </div>
              {/* Consumo de mensajería Meta del mes */}
              <div className="mt-3">
                <WhatsAppUsageCard />
              </div>
              {/* Modo de atención en coexistencia (F2/F5): solo con número
                  compartido. Con números por sede, cada sede configura su
                  atención en su página. */}
              {business && autoAssignAccount && autoAssignRouting && (
                <div className="mt-3">
                  <WhatsAppAttentionCard business={business} />
                </div>
              )}
              {business &&
                !autoAssignAccount &&
                (whatsappRoutings?.some(
                  (r) => r.strategy === "DIRECT_TO_BRANCH" && r.isActive
                ) ??
                  false) && (
                  <p className="mt-3 text-xs text-slate-500">
                    {tWa("branchAttention.dedicatedOnlyHint")}
                  </p>
                )}
            </section>

            {/* Guardar: barra fija abajo mientras haya cambios */}
            {(isDirty || updateBusiness.isPending) && (
              <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-[20px] bg-indigo-950 py-3 pl-5 pr-3 text-white shadow-[0_10px_30px_rgba(30,27,75,0.25)]">
                <span className="min-w-48 flex-1 text-sm">{tb("unsavedChanges")}</span>
                <Button
                  type="button"
                  onClick={handleDiscard}
                  disabled={updateBusiness.isPending}
                  className="h-11 rounded-[14px] border-0 bg-white/15 px-4 text-white shadow-none hover:bg-white/25"
                >
                  {tb("discard")}
                </Button>
                <Button
                  type="submit"
                  form={FORM_ID}
                  disabled={!isDirty || updateBusiness.isPending}
                  isLoading={updateBusiness.isPending}
                  className="h-11 rounded-[14px] bg-white px-5 font-semibold text-indigo-950 shadow-none hover:bg-white/90"
                >
                  {tc("buttons.save")}
                </Button>
              </div>
            )}
          </div>
        </div>
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
