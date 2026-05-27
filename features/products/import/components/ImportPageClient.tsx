"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "./FileDropzone";
import { ImportProcessingState } from "./ImportProcessingState";
import { DetectedProductsGrid } from "./DetectedProductsGrid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useImportJob, importJobKeys } from "../hooks/useImportJob";
import { useUploadImportFile } from "../hooks/useImportMutations";
import { confirmImportJob } from "../services/import.service";
import type { BusinessCategory } from "@/features/catalog/types/catalog.types";
import type { IndustryCategory } from "@/features/admin/industry-categories/types/industry-category.types";
import { catalogKeys } from "@/features/catalog/hooks";
import type { ImportJob } from "../types/import.types";

type WizardStep = "upload" | "review" | "confirm";

// Accepts UUID v4 (xxxxxxxx-xxxx-4xxx-...) and cuid/cuid2 formats used by the backend
const JOB_ID_REGEX = /^[a-zA-Z0-9_-]{20,36}$/;
const isValidJobId = (value: string | null): value is string => !!value && JOB_ID_REGEX.test(value);

interface StepIndicatorProps {
  step: WizardStep;
}

function StepIndicator({ step }: StepIndicatorProps) {
  const t = useTranslations("catalog.import.step");
  const steps: { key: WizardStep; label: string }[] = [
    { key: "upload", label: t("upload") },
    { key: "review", label: t("review") },
    { key: "confirm", label: t("confirm") },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div
          key={s.key}
          className="flex items-center gap-1 flex-1 last:flex-none"
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
              i < currentIdx
                ? "bg-indigo-600 text-white"
                : i === currentIdx
                  ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-600"
                  : "bg-slate-100 text-slate-400"
            }`}
          >
            {i < currentIdx ? "✓" : i + 1}
          </div>
          <span
            className={`text-xs font-medium ${
              i === currentIdx ? "text-indigo-700" : "text-slate-400"
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className="flex-1 h-px bg-slate-200 mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}

interface ImportPageClientProps {
  businessId: string;
  categories: BusinessCategory[];
  industryCategories?: IndustryCategory[];
}

export function ImportPageClient({
  businessId,
  categories,
  industryCategories = [],
}: ImportPageClientProps) {
  const t = useTranslations("catalog.import");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<WizardStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const rawJobId = searchParams.get("jobId");
  const [currentJobId, setCurrentJobId] = useState<string | null>(
    isValidJobId(rawJobId) ? rawJobId : null
  );

  useEffect(() => {
    const currentParam = searchParams.get("jobId");
    if (currentJobId && currentParam !== currentJobId) {
      router.replace(`?jobId=${currentJobId}`, { scroll: false });
    } else if (!currentJobId && currentParam) {
      router.replace(`?`, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only reacts to currentJobId; including router/searchParams would cause a replace→searchParams-change→replace loop
  }, [currentJobId]);

  const queryClient = useQueryClient();
  const uploadMutation = useUploadImportFile(businessId);
  const { data: jobData } = useImportJob(businessId, currentJobId);

  const confirmMutation = useMutation({
    mutationFn: ({ jobId, itemIds }: { jobId: string; itemIds: string[] }) =>
      confirmImportJob(businessId, jobId, { itemIds }),
    onSuccess: (_data, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: importJobKeys.job(businessId, jobId) });
      queryClient.invalidateQueries({ queryKey: importJobKeys.jobs(businessId) });
      queryClient.invalidateQueries({ queryKey: ["catalog", "products", businessId] });
      // Invalidar BusinessCategories para incluir las auto-creadas por el backend al confirmar
      queryClient.invalidateQueries({ queryKey: catalogKeys.categories(businessId) });
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : t("error.confirmFailed");
      toast.error(message);
    },
  });

  const isProcessing =
    jobData?.status === "PENDING" || jobData?.status === "PROCESSING";
  const isReadyForReview = jobData?.status === "READY_FOR_REVIEW";
  const isCompleted = jobData?.status === "COMPLETED";
  const isFailed = jobData?.status === "FAILED";
  const isJobConfirming = jobData?.status === "CONFIRMING";

  useEffect(() => {
    if (currentJobId && jobData) {
      if (
        jobData.status === "READY_FOR_REVIEW" ||
        jobData.status === "PROCESSING" ||
        jobData.status === "PENDING" ||
        jobData.status === "FAILED"
      ) {
        setStep("review");
      } else if (
        jobData.status === "COMPLETED" ||
        jobData.status === "CONFIRMING"
      ) {
        setStep("confirm");
      }
    }
  }, [currentJobId, jobData]);

  const selectedItems = jobData?.items.filter((i) => i.isSelected) ?? [];
  const selectedItemIds = selectedItems.map((i) => i.id);

  const handleBack = () => {
    router.push("/dashboard/catalog/products");
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile, {
      onSuccess: (job: ImportJob) => {
        setCurrentJobId(isValidJobId(job.id) ? job.id : null);
        setStep("review");
      },
    });
  };

  const handleConfirm = () => {
    if (!currentJobId || selectedItemIds.length === 0) return;
    confirmMutation.mutate(
      { jobId: currentJobId, itemIds: selectedItemIds },
      { onSuccess: () => setStep("confirm") }
    );
  };

  const handleReset = () => {
    setStep("upload");
    setSelectedFile(null);
    setCurrentJobId(null);
    uploadMutation.reset();
    confirmMutation.reset();
  };

  const renderUploadStep = () => (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <FileDropzone
        onFileSelected={handleFileSelected}
        isLoading={uploadMutation.isPending}
      />
    </div>
  );

  const renderReviewStep = () => {
    if (isProcessing) {
      return (
        <div className="flex justify-center py-16">
          <ImportProcessingState fileName={jobData?.fileName} />
        </div>
      );
    }
    if (isFailed) {
      return (
        <div className="flex flex-col items-center gap-3 py-16">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className="text-sm font-medium text-slate-900">
            {t("error.title")}
          </p>
          <p className="text-xs text-slate-500 text-center max-w-xs">
            {jobData?.errorMessage ?? t("error.subtitle")}
          </p>
          <Button variant="outline" onClick={handleReset} className="mt-2">
            {tCommon("buttons.back")}
          </Button>
        </div>
      );
    }
    if (isReadyForReview && jobData) {
      return (
        <DetectedProductsGrid
          businessId={businessId}
          jobId={jobData.id}
          items={jobData.items}
          categories={categories}
          industryCategories={industryCategories}
        />
      );
    }
    return null;
  };

  const renderConfirmStep = () => {
    if (confirmMutation.isPending || isJobConfirming) {
      return (
        <div className="flex justify-center py-16">
          <ImportProcessingState fileName={t("confirm.importing")} />
        </div>
      );
    }
    if (isCompleted) {
      return (
        <div className="flex flex-col items-center gap-4 py-16">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900">
              {t("success.title")}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {t("success.subtitle", { count: jobData?.totalImported ?? 0 })}
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={handleReset}>
              <Upload className="w-4 h-4 mr-2" />
              {t("success.importAnother")}
            </Button>
            <Button
              onClick={handleBack}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <PackageCheck className="w-4 h-4 mr-2" />
              {t("success.viewProducts")}
            </Button>
          </div>
        </div>
      );
    }
    if (jobData) {
      return (
        <div className="max-w-lg mx-auto space-y-4">
          <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4">
            <p className="text-sm font-medium text-indigo-900">
              {t("confirm.title")}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-indigo-700">
              <li>
                {t("confirm.detected")}: {jobData.totalDetected}
              </li>
              <li>
                {t("confirm.selected")}: {selectedItemIds.length}
              </li>
            </ul>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Page header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("page.back")}
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("page.title")}
            </h1>
            {step === "review" && isReadyForReview && (
              <p className="text-slate-500 mt-1">{t("page.subtitle")}</p>
            )}
          </div>
          <div className="sm:w-72">
            <StepIndicator step={step} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {step === "upload" && renderUploadStep()}
        {step === "review" && renderReviewStep()}
        {step === "confirm" && renderConfirmStep()}
      </div>

      {/* Footer actions */}
      {!isCompleted && (
        <div className="border-t border-slate-200 bg-white px-6 py-4 flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={uploadMutation.isPending || confirmMutation.isPending || isJobConfirming}
          >
            {t("page.back")}
          </Button>

          <div className="flex gap-2">
            {step === "upload" && (
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                isLoading={uploadMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {t("step.upload")}
              </Button>
            )}

            {step === "review" && isReadyForReview && (
              <Button
                onClick={() => setStep("confirm")}
                disabled={selectedItemIds.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {t("step.confirm")} ({selectedItemIds.length})
              </Button>
            )}

            {step === "confirm" && !isCompleted && jobData && (
              <Button
                onClick={handleConfirm}
                disabled={
                  selectedItemIds.length === 0 ||
                  confirmMutation.isPending ||
                  isJobConfirming
                }
                isLoading={confirmMutation.isPending || isJobConfirming}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {t("confirm.confirmButton")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
