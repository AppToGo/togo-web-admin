"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  Zap,
  Building2,
  Rocket,
  CreditCard,
  MessageCircle,
  Copy,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  QUALITATIVE_PLAN_FEATURES,
  NEQUI_PAYMENT_INFO,
  type PlanNumber,
} from "@/lib/plan.utils";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useUpgradePlan } from "../hooks/useUpgradePlan";
import { usePlanCatalog } from "../hooks/usePlanCatalog";
import { UNLIMITED_PLAN_LIMIT, type PlanCatalogEntry } from "../services/subscription.service";

interface UpgradePlanModalProps {
  open: boolean;
  onClose: () => void;
}

type ModalView = "plans" | "payment";

const PAID_PLANS: Exclude<PlanNumber, 1>[] = [2, 3, 4];

const PLAN_ICONS: Record<Exclude<PlanNumber, 1>, React.ElementType> = {
  2: Zap,
  3: Rocket,
  4: Building2,
};

function formatBranchesFeature(maxBranches: number): string {
  if (maxBranches >= UNLIMITED_PLAN_LIMIT) return "Sedes ilimitadas";
  if (maxBranches === 1) return "1 sede";
  return `Hasta ${maxBranches} sedes`;
}

function formatUsersFeature(maxUsers: number): string {
  if (maxUsers >= UNLIMITED_PLAN_LIMIT) return "Usuarios ilimitados";
  if (maxUsers === 1) return "1 usuario";
  return `Hasta ${maxUsers} usuarios`;
}

export function UpgradePlanModal({ open, onClose }: UpgradePlanModalProps) {
  const t = useTranslations("subscription.upgradePlanModal");
  const user = useCurrentUser();
  const [view, setView] = React.useState<ModalView>("plans");
  const [selectedPlan, setSelectedPlan] = React.useState<Exclude<
    PlanNumber,
    1
  > | null>(null);

  const { mutate: upgradePlan, isPending } = useUpgradePlan();
  // Solo pide el catálogo cuando el modal realmente está abierto — evita un
  // fetch innecesario en cada carga del dashboard para negocios que nunca lo abren.
  const { data: catalog, isLoading: isCatalogLoading, isError: isCatalogError, refetch: refetchCatalog } = usePlanCatalog(open);

  // Reset view when modal opens
  React.useEffect(() => {
    if (open) {
      setView("plans");
      setSelectedPlan(null);
    }
  }, [open]);

  const handleUpgrade = (plan: Exclude<PlanNumber, 1>) => {
    setSelectedPlan(plan);
    upgradePlan(plan, {
      onSuccess: () => {
        setView("payment");
      },
    });
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: catalog?.currency ?? "COP",
      maximumFractionDigits: 0,
    }).format(amount);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("copiedToClipboard"));
  };

  const getPlanEntry = (planNum: Exclude<PlanNumber, 1>) =>
    catalog?.plans.find((p) => p.plan === planNum);

  // Los bullets de sedes/usuarios se generan desde el catálogo real (no un
  // texto hardcodeado) para que nunca queden desactualizados si el backend
  // cambia un límite por env — antes esto vivía como texto fijo en
  // lib/plan.utils.ts y había que editarlo a mano en cada cambio de límite.
  const getPlanFeatures = (planEntry: PlanCatalogEntry): string[] => [
    formatBranchesFeature(planEntry.maxBranches),
    formatUsersFeature(planEntry.maxUsers),
    ...QUALITATIVE_PLAN_FEATURES[planEntry.plan as Exclude<PlanNumber, 1>],
  ];

  const selectedPlanInfo = selectedPlan ? getPlanEntry(selectedPlan) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      className="max-w-3xl"
    >
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        {view === "plans" ? (
          <>
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle className="text-xl font-bold text-slate-900">
                {t("title")}
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
            </DialogHeader>

            <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {isCatalogLoading && (
                <div className="col-span-3 py-8 flex justify-center">
                  <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                </div>
              )}
              {!isCatalogLoading && isCatalogError && (
                <div className="col-span-3 py-8 flex flex-col items-center gap-3 text-center">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <p className="text-sm text-slate-600">{t("catalogError")}</p>
                  <Button size="sm" variant="outline" onClick={() => refetchCatalog()}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    {t("catalogRetry")}
                  </Button>
                </div>
              )}
              {!isCatalogLoading &&
                !isCatalogError &&
                PAID_PLANS.map((planNum) => {
                const planEntry = getPlanEntry(planNum);
                if (!planEntry) return null;
                const features = getPlanFeatures(planEntry);
                const Icon = PLAN_ICONS[planNum];
                const isPopular = planNum === 3;
                const isLoadingThis = isPending && selectedPlan === planNum;
                const isDisabled = isPending && selectedPlan !== planNum;

                return (
                  <div
                    key={planNum}
                    className={cn(
                      "relative rounded-xl border-2 p-4 flex flex-col gap-3 transition-all",
                      isPopular
                        ? "border-indigo-500 bg-indigo-50/50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    {isPopular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                        {t("mostPopular")}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          isPopular ? "bg-indigo-100" : "bg-slate-100"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4",
                            isPopular ? "text-indigo-600" : "text-slate-600"
                          )}
                        />
                      </div>
                      <span className="font-semibold text-slate-900 text-sm">
                        {planEntry.name}
                      </span>
                    </div>

                    <div>
                      <span className="text-2xl font-bold text-slate-900">
                        {formatPrice(planEntry.priceMonthly)}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">
                        {t("perMonth")}
                      </span>
                    </div>

                    <ul className="space-y-1.5 flex-1">
                      {features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-xs text-slate-600"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      size="sm"
                      className={cn(
                        "w-full mt-2",
                        isPopular
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      )}
                      disabled={isDisabled}
                      onClick={() => handleUpgrade(planNum)}
                    >
                      {isLoadingThis ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {t("upgradingButton")}
                        </span>
                      ) : (
                        t("upgradeButton", { planName: planEntry.name })
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="px-6 pb-4 flex justify-center">
              <button
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                {t("skipButton")}
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    {t("paymentPendingTitle")}
                  </DialogTitle>
                  <p className="text-xs text-slate-500">
                    {t("paymentPendingSubtitle", {
                      planName: selectedPlanInfo?.name ?? "",
                    })}
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full w-fit">
                <CreditCard className="w-3 h-3" />
                {t("pendingBadge")}
              </div>
            </DialogHeader>

            <div className="px-6 pb-6 space-y-4">
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <p className="text-sm font-semibold text-slate-900">
                    {t("paymentInstructionsTitle")}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t("paymentInstructionsSubtitle")}
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { label: t("nequiPhone"), value: NEQUI_PAYMENT_INFO.phone },
                    { label: t("nequiName"), value: NEQUI_PAYMENT_INFO.name },
                    {
                      label: t("nequiAmount"),
                      value: selectedPlanInfo
                        ? formatPrice(selectedPlanInfo.priceMonthly)
                        : "",
                    },
                    {
                      label: t("nequiConcept"),
                      value: NEQUI_PAYMENT_INFO.concept.replace(
                        "{businessName}",
                        user?.businessName ?? ""
                      ),
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-xs text-slate-500">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">
                          {value}
                        </span>
                        <button
                          onClick={() => copyToClipboard(value)}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                          title={t("copyButtonTooltip")}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex gap-3">
                <MessageCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {t("supportTitle")}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    {t("supportText")}
                  </p>
                </div>
              </div>

              <Button className="w-full" onClick={onClose}>
                {t("closeButton")}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
