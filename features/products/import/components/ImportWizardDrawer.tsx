"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertCircle } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "./FileDropzone";
import { ImportProcessingState } from "./ImportProcessingState";
import { DetectedProductsTable } from "./DetectedProductsTable";
import { useImportJob } from "../hooks/useImportJob";
import {
  useUploadImportFile,
  useConfirmImportJob,
} from "../hooks/useImportMutations";
import type { ImportJob } from "../types/import.types";

type WizardStep = "upload" | "review" | "confirm";

interface ImportWizardDrawerProps {
  businessId: string;
  isOpen: boolean;
  onClose: () => void;
}

function StepIndicator({ step }: { step: WizardStep }) {
  const t = useTranslations("catalog.import.step");
  const steps: { key: WizardStep; label: string }[] = [
    { key: "upload", label: t("upload") },
    { key: "review", label: t("review") },
    { key: "confirm", label: t("confirm") },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-1 mb-4">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1 flex-1 last:flex-none">
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

export function ImportWizardDrawer({
  businessId,
  isOpen,
  onClose,
}: ImportWizardDrawerProps) {
  const t = useTranslations("catalog.import");
  const [step, setStep] = useState<WizardStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const uploadMutation = useUploadImportFile(businessId);
  const { data: jobData } = useImportJob(businessId, currentJobId);
  const confirmMutation = useConfirmImportJob(businessId, currentJobId ?? "");

  const isProcessing =
    jobData?.status === "PENDING" || jobData?.status === "PROCESSING";
  const isReadyForReview = jobData?.status === "READY_FOR_REVIEW";
  const isCompleted = jobData?.status === "COMPLETED";
  const isFailed = jobData?.status === "FAILED";

  const selectedItems = jobData?.items.filter((i) => i.isSelected) ?? [];
  const selectedItemIds = selectedItems.map((i) => i.id);

  const handleClose = () => {
    if (uploadMutation.isPending || confirmMutation.isPending) return;
    setStep("upload");
    setSelectedFile(null);
    setCurrentJobId(null);
    uploadMutation.reset();
    confirmMutation.reset();
    onClose();
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile, {
      onSuccess: (job: ImportJob) => {
        setCurrentJobId(job.id);
        setStep("review");
      },
    });
  };

  const handleConfirm = () => {
    if (!currentJobId || selectedItemIds.length === 0) return;
    confirmMutation.mutate(
      { itemIds: selectedItemIds },
      { onSuccess: () => setStep("confirm") }
    );
  };

  const renderUploadStep = () => (
    <div className="flex flex-col gap-4">
      <FileDropzone
        onFileSelected={handleFileSelected}
        isLoading={uploadMutation.isPending}
      />
    </div>
  );

  const renderReviewStep = () => {
    if (isProcessing) {
      return <ImportProcessingState fileName={jobData?.fileName} />;
    }
    if (isFailed) {
      return (
        <div className="flex flex-col items-center gap-3 py-12">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className="text-sm font-medium text-slate-900">{t("error.title")}</p>
          <p className="text-xs text-slate-500 text-center max-w-xs">
            {jobData?.errorMessage ?? t("error.subtitle")}
          </p>
        </div>
      );
    }
    if (isReadyForReview && jobData) {
      return (
        <DetectedProductsTable
          businessId={businessId}
          jobId={jobData.id}
          items={jobData.items}
        />
      );
    }
    return null;
  };

  const renderConfirmStep = () => {
    if (confirmMutation.isPending) {
      return (
        <div className="flex flex-col items-center gap-3 py-12">
          <ImportProcessingState fileName={t("confirm.importing")} />
        </div>
      );
    }
    if (isCompleted) {
      return (
        <div className="flex flex-col items-center gap-4 py-14">
          <CheckCircle2 className="w-14 h-14 text-green-500" />
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900">
              {t("success.title")}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {t("success.subtitle", { count: jobData?.totalImported ?? 0 })}
            </p>
          </div>
          <Button onClick={handleClose} className="mt-2">
            {t("step.confirm")}
          </Button>
        </div>
      );
    }
    if (jobData) {
      return (
        <div className="space-y-4">
          <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4">
            <p className="text-sm font-medium text-indigo-900">
              {t("confirm.title")}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-indigo-700">
              <li>{t("confirm.detected")}: {jobData.totalDetected}</li>
              <li>{t("confirm.selected")}: {selectedItemIds.length}</li>
            </ul>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      isLoading={uploadMutation.isPending || confirmMutation.isPending}
    >
      <DrawerContent size="xl">
        <DrawerHeader>
          <DrawerTitle>{t("title")}</DrawerTitle>
          <DrawerDescription>{t("description")}</DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <StepIndicator step={step} />

          {step === "upload" && renderUploadStep()}
          {step === "review" && renderReviewStep()}
          {step === "confirm" && renderConfirmStep()}
        </div>

        {!isCompleted && (
          <DrawerFooter className="border-t border-slate-200">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploadMutation.isPending || confirmMutation.isPending}
            >
              {t("step.confirm")}
            </Button>

            {step === "upload" && (
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                isLoading={uploadMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {t("dropzone.hint")}
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

            {step === "confirm" && !isCompleted && (
              <Button
                onClick={handleConfirm}
                disabled={
                  selectedItemIds.length === 0 || confirmMutation.isPending
                }
                isLoading={confirmMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {t("confirm.confirmButton")}
              </Button>
            )}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
