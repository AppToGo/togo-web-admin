"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Store } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import {
  useHasBusiness,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionNav } from "@/components/ui/section-nav";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { UpdateBranchRequest } from "@/features/branches/types";
import {
  BranchForm,
  useBranch,
  useUpdateBranch,
  useBranchesByBusiness,
} from "@/features/branches";
import { useBranchMetrics } from "@/features/branches/hooks/useBranches";
import { BRANCH_FORM_SECTION_IDS } from "@/features/branches/components/branch-form";
import {
  BranchStatusLine,
  MainBranchBadge,
} from "@/features/branches/components/branch-card";
import { getBranchStatus } from "@/features/branches/utils/branch-status";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";

const TABLES_SECTION_ID = "sede-mesas";
const ATTENTION_SECTION_ID = "sede-atencion";
import { useBusiness } from "@/features/business";
import { TablesManager } from "@/features/tables";
import { Can } from "@/components/auth/Can";
import {
  WhatsAppBranchAttentionCard,
  branchesWithOwnNumber,
  dedicatedBranchIds,
  useWhatsAppAccounts,
  useWhatsAppRoutings,
} from "@/features/whatsapp";

export default function EditBranchPage() {
  const t = useTranslations("branches");
  const tc = useTranslations("common");
  const router = useRouter();

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();

  const params = useParams();
  const id = params.id as string;
  const locale = params.locale as string;

  const { data: branch, isLoading: isLoadingBranch } = useBranch(id);
  const { data: metrics } = useBranchMetrics(branch?.isActive ? id : null);
  const { hasPermission } = useMyPermissions();
  const canViewTables = hasPermission("table.view");
  const updateBranch = useUpdateBranch();

  // QR imprimible por mesa (Fase 2, docs/architecture/pedidos-en-mesa.md):
  // necesita el slug del negocio y saber si hay más de una sede activa para
  // armar la misma URL que arma el backend (CatalogLinkService.buildTableQrUrl).
  const { data: business } = useBusiness(branch?.businessId ?? "", {
    enabled: !!branch?.businessId,
  });
  const { data: businessBranches } = useBranchesByBusiness(branch?.businessId ?? null);
  const isMultiBranch = (businessBranches?.filter((b) => b.isActive).length ?? 0) > 1;

  // Número exclusivo de la sede: misma regla que la API.
  const { data: whatsappRoutings } = useWhatsAppRoutings();
  const { data: whatsappAccounts } = useWhatsAppAccounts();
  const hasDedicatedNumber = dedicatedBranchIds(
    whatsappRoutings,
    whatsappAccounts
  ).has(id);
  const hasOwnNumber = branchesWithOwnNumber(whatsappRoutings).has(id);

  const handleSubmit = (data: UpdateBranchRequest) => {
    updateBranch.mutate(
      { branchId: id, data },
      {
        onSuccess: () => {
          router.push("/dashboard/branches");
        },
      }
    );
  };

  const handleCancel = () => {
    router.push("/dashboard/branches");
  };

  if (!hasBusiness && !isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("noBusiness.title")}
          </h2>
          <p className="text-slate-500 text-center max-w-md mb-6">
            {t("noBusiness.description")}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoadingBranch) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-2xl">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10" />
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!branch) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("notFound.title")}
          </h2>
          <p className="text-slate-500 text-center max-w-md mb-6">
            {t("notFound.description")}
          </p>
          <Button onClick={() => router.push("/dashboard/branches")}>
            {tc("buttons.back")}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const status = getBranchStatus(branch);
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const sections = [
    { id: BRANCH_FORM_SECTION_IDS.general, label: t("detail.sections.general") },
    { id: BRANCH_FORM_SECTION_IDS.location, label: t("detail.sections.location") },
    { id: BRANCH_FORM_SECTION_IDS.hours, label: t("detail.sections.hours") },
    { id: BRANCH_FORM_SECTION_IDS.delivery, label: t("detail.sections.delivery") },
    { id: BRANCH_FORM_SECTION_IDS.channels, label: t("detail.sections.channels") },
    { id: BRANCH_FORM_SECTION_IDS.payments, label: t("detail.sections.payments") },
    ...(canViewTables ? [{ id: TABLES_SECTION_ID, label: t("detail.sections.tables") }] : []),
    { id: ATTENTION_SECTION_ID, label: t("detail.sections.attention") },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
        <button
          type="button"
          onClick={() => router.push("/dashboard/branches")}
          className="hidden items-center gap-1.5 self-start text-sm font-medium text-slate-600 hover:text-slate-900 md:inline-flex"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("title")}
        </button>

        <header className="flex flex-wrap items-center gap-4 rounded-3xl border border-white/90 bg-white/65 px-6 py-5">
          <div className="min-w-0 flex-[1_1_320px]">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900">{branch.name}</h1>
              {branch.isMainBranch && <MainBranchBadge />}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <BranchStatusLine status={status} timezone={branch.timezone} />
              <span className="font-mono text-[13px]">{branch.code}</span>
              {branch.address && <span className="truncate">{branch.address}</span>}
            </div>
          </div>
          {metrics && (
            <dl className="grid grid-cols-3 gap-6 rounded-2xl bg-white/80 px-5 py-3">
              <div>
                <dt className="text-xs text-slate-500">{t("metrics.ordersToday")}</dt>
                <dd className="text-lg font-bold tabular-nums text-slate-900">{metrics.ordersToday}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t("metrics.pending")}</dt>
                <dd className="text-lg font-bold tabular-nums text-amber-700">{metrics.pendingOrders}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t("metrics.revenueToday")}</dt>
                <dd className="text-lg font-bold tabular-nums text-emerald-700">
                  {formatCurrency(metrics.revenueToday, branch.currency)}
                </dd>
              </div>
            </dl>
          )}
        </header>

        <div className="flex items-start gap-5">
          <SectionNav
            label={t("detail.sectionsLabel")}
            title={t("detail.sectionsTitle")}
            items={sections}
            className="hidden w-56 shrink-0 lg:flex"
          />

          <div className="min-w-0 flex-1 space-y-6">
            <BranchForm
              branch={branch}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={updateBranch.isPending}
            />

            {/* Atención por sede (F5): modo, minutos y horario propios con herencia */}
            <div id={ATTENTION_SECTION_ID} className="scroll-mt-4">
              <WhatsAppBranchAttentionCard
                branch={branch}
                dedicated={hasDedicatedNumber}
                ownNumber={hasOwnNumber}
              />
            </div>

            {/* Mesas (docs/architecture/pedidos-en-mesa.md, Fase 1) */}
            <Can permission="table.view">
              <div id={TABLES_SECTION_ID} className="scroll-mt-4">
                <TablesManager
                  businessId={branch.businessId}
                  branchId={id}
                  businessSlug={business?.slug}
                  branchSlug={branch.slug}
                  isMultiBranch={isMultiBranch}
                />
              </div>
            </Can>

            <p className="text-xs text-slate-500">
              {t("detail.meta", {
                created: formatDate(branch.createdAt),
                updated: formatDate(branch.updatedAt),
              })}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
