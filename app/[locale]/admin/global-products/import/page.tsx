"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  useCreateGlobalImportJob,
  useGlobalImportJob,
  useUpdateGlobalImportItem,
  useConfirmGlobalImportJob,
  adminCatalogKeys,
} from "@/features/admin/catalog/hooks";
import * as adminCatalogService from "@/features/admin/catalog/services/admin-catalog.service";
import { ImportItemCard } from "@/features/admin/catalog/components/ImportItemCard";
import { ImportItemEditForm } from "@/features/admin/catalog/components/ImportItemEditForm";
import type {
  ImportJobDto,
  ImportItemDto,
  UpdateImportItemPayload,
} from "@/features/admin/catalog/types";

// ============================================================================
// TYPES
// ============================================================================

type ImportStep = "upload" | "processing" | "review" | "results";

// ============================================================================
// STEP INDICATOR
// ============================================================================

interface StepIndicatorProps {
  currentStep: ImportStep;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  const t = useTranslations("common");

  const steps: { id: ImportStep; label: string }[] = [
    { id: "upload", label: t("steps.uploadFile") },
    { id: "processing", label: t("steps.importing") },
    { id: "review", label: t("steps.preview") },
    { id: "results", label: t("steps.results") },
  ];

  const stepOrder: ImportStep[] = ["upload", "processing", "review", "results"];

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {steps.map((step, index) => {
        const currentIndex = stepOrder.indexOf(currentStep);
        const isCompleted = index < currentIndex;
        const isActive = step.id === currentStep;

        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
            </div>
            <span
              className={`text-sm ${
                isActive ? "text-slate-900 font-medium" : "text-slate-500"
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className="w-8 h-px bg-slate-200 mx-2" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// UPLOAD STEP
// ============================================================================

interface UploadStepProps {
  onJobCreated: (job: ImportJobDto) => void;
}

function UploadStep({ onJobCreated }: UploadStepProps) {
  const t = useTranslations("admin-catalog");
  const tCommon = useTranslations("common");
  const [isDragging, setIsDragging] = useState(false);
  const createJob = useCreateGlobalImportJob();

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const job = await createJob.mutateAsync(file);
        onJobCreated(job);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("errors.importProducts");
        toast.error(message);
      }
    },
    [createJob, onJobCreated, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("importProducts")}</CardTitle>
        <CardDescription>{t("uploadFileFormats")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            isDragging
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-300 hover:border-slate-400"
          }`}
        >
          {createJob.isPending ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
              <p className="text-lg font-medium text-slate-700">
                {t("processingFile")}
              </p>
            </div>
          ) : (
            <>
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-lg font-medium text-slate-700 mb-2">
                {t("dragDropFile")}
              </p>
              <p className="text-sm text-slate-500 mb-4">o</p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                className="hidden"
                id="import-upload"
                disabled={createJob.isPending}
              />
              <label htmlFor="import-upload">
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  disabled={createJob.isPending}
                  onClick={() =>
                    document.getElementById("import-upload")?.click()
                  }
                  type="button"
                >
                  {tCommon("buttons.selectFile")}
                </Button>
              </label>
              <p className="text-xs text-slate-400 mt-4">
                {t("uploadFileFormats")}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PROCESSING STEP
// ============================================================================

interface ProcessingStepProps {
  jobId: string;
  onReady: () => void;
  onFailed: () => void;
}

function ProcessingStep({ jobId, onReady, onFailed }: ProcessingStepProps) {
  const t = useTranslations("admin-catalog");
  const { data: job } = useGlobalImportJob(jobId, true);

  useEffect(() => {
    if (job?.status === "READY_FOR_REVIEW") {
      onReady();
    } else if (job?.status === "FAILED") {
      onFailed();
    }
  }, [job?.status, onReady, onFailed]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("processingFile")}</CardTitle>
        <CardDescription>{t("importingDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-14 h-14 animate-spin text-indigo-600" />
          <p className="text-lg font-medium text-slate-700">
            {t("analyzingWithAI")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// REVIEW STEP
// ============================================================================

interface ReviewStepProps {
  jobId: string;
  onConfirmed: () => void;
  onBack: () => void;
}

function ReviewStep({ jobId, onConfirmed, onBack }: ReviewStepProps) {
  const t = useTranslations("admin-catalog");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const { data: job } = useGlobalImportJob(jobId, true);
  const updateItem = useUpdateGlobalImportItem();
  const confirmJob = useConfirmGlobalImportJob();

  const items = job?.items ?? [];

  // Selection is managed locally to avoid N parallel PATCH requests on select-all/deselect-all.
  // Initialized once from server state; polling updates to item data do not reset selection.
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(
    new Set()
  );
  const [selectionInitialized, setSelectionInitialized] = useState(false);
  const [editingItem, setEditingItem] = useState<ImportItemDto | null>(null);

  useEffect(() => {
    if (items.length > 0 && !selectionInitialized) {
      setLocalSelectedIds(
        new Set(items.filter((i) => i.isSelected).map((i) => i.id))
      );
      setSelectionInitialized(true);
    }
  }, [items, selectionInitialized]);

  const selectedCount = localSelectedIds.size;

  const handleToggleItem = (itemId: string) => {
    setLocalSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleSelectAll = () => {
    setLocalSelectedIds(new Set(items.map((i) => i.id)));
  };

  const handleDeselectAll = () => {
    setLocalSelectedIds(new Set());
  };

  const handleConfirm = async () => {
    if (selectedCount === 0) {
      toast.error(t("noItemsSelected"));
      return;
    }
    try {
      await confirmJob.mutateAsync({
        jobId,
        itemIds: Array.from(localSelectedIds),
      });
      onConfirmed();
    } catch (err) {
      // Un error acá (timeout, 409 por doble-click) no significa que el
      // import haya fallado de verdad: el job puede seguir procesándose (o
      // ya haber terminado) en el backend. Reconciliamos contra el estado
      // real antes de decidir si mostrar un error.
      //
      // Usamos fetchQuery (staleTime: 0, para forzar red) en vez de una
      // llamada suelta al servicio, y escribimos el resultado en la MISMA
      // query key que lee ResultsStep — sin esto, ResultsStep podía montar y
      // leer el snapshot viejo (READY_FOR_REVIEW) todavía "fresco" en cache,
      // reintroduciendo el bug de "0 importados" que este flujo async fue
      // pensado para resolver.
      try {
        const freshJob = await queryClient.fetchQuery({
          queryKey: adminCatalogKeys.importJob(jobId),
          queryFn: () => adminCatalogService.getGlobalImportJob(jobId),
          staleTime: 0,
        });
        if (freshJob.status === "FAILED") {
          toast.error(freshJob.errorMessage ?? t("errors.importProducts"));
          return;
        }
        // CONFIRMING/COMPLETED: no es un error real, seguimos a resultados
        // y dejamos que el polling de ResultsStep refleje el estado real.
        onConfirmed();
      } catch {
        const message =
          err instanceof Error ? err.message : t("errors.importProducts");
        toast.error(message);
      }
    }
  };

  const handleUpdateItem = async (payload: UpdateImportItemPayload) => {
    if (!editingItem) return;
    await updateItem.mutateAsync({ jobId, itemId: editingItem.id, payload });
    setEditingItem(null);
  };

  const confirmLabel =
    selectedCount === 1
      ? t("confirmSelectedOne")
      : t("confirmSelected", { count: selectedCount });

  const duplicateCount = items.filter((i) => i.suggestedGlobalProductId).length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>{t("reviewItems")}</CardTitle>
              <CardDescription>{t("reviewItemsDescription")}</CardDescription>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>
                  {t("totalDetected")}:{" "}
                  <strong className="text-slate-900">{items.length}</strong>
                </span>
                <span>·</span>
                <span>
                  {tCommon("status.selected")}:{" "}
                  <strong className="text-indigo-700">{selectedCount}</strong>
                </span>
                {duplicateCount > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-yellow-700">
                      {t("withErrors")}: <strong>{duplicateCount}</strong>
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {t("selectAll")}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                  {t("deselectAll")}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <ImportItemCard
                key={item.id}
                item={item}
                isSelected={localSelectedIds.has(item.id)}
                onToggleSelect={handleToggleItem}
                onEdit={setEditingItem}
              />
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button variant="outline" onClick={onBack}>
              {tCommon("buttons.back")}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedCount === 0 || confirmJob.isPending}
            >
              {confirmJob.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {confirmLabel}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Drawer */}
      <Drawer
        open={!!editingItem}
        onOpenChange={(open) => {
          if (!updateItem.isPending && !open) setEditingItem(null);
        }}
        isLoading={updateItem.isPending}
      >
        <DrawerContent key={editingItem?.id} size="md">
          <DrawerHeader>
            <DrawerTitle>{t("editImportItem")}</DrawerTitle>
            <DrawerDescription>{editingItem?.name}</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto">
            {editingItem && (
              <ImportItemEditForm
                formId="edit-import-item-form"
                item={editingItem}
                onSubmit={handleUpdateItem}
                isLoading={updateItem.isPending}
              />
            )}
          </div>
          <DrawerFooter className="border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingItem(null)}
              disabled={updateItem.isPending}
            >
              {tCommon("buttons.cancel")}
            </Button>
            <Button
              type="submit"
              form="edit-import-item-form"
              disabled={updateItem.isPending}
            >
              {updateItem.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {tCommon("buttons.saveChanges")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// ============================================================================
// RESULTS STEP
// ============================================================================

interface ResultsStepProps {
  jobId: string;
  onNewImport: () => void;
}

function ResultsStep({ jobId, onNewImport }: ResultsStepProps) {
  const t = useTranslations("admin-catalog");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  // confirmJob() ahora encola la creación de productos en un worker async —
  // seguimos haciendo polling (vía useGlobalImportJob) hasta que el job
  // realmente termine, en vez de asumir que la respuesta de confirmar ya es
  // el resultado final.
  const { data: job } = useGlobalImportJob(jobId, true);

  useEffect(() => {
    if (job?.status === "COMPLETED") {
      queryClient.invalidateQueries({ queryKey: adminCatalogKeys.products() });
      queryClient.invalidateQueries({ queryKey: adminCatalogKeys.stats() });
    }
  }, [job?.status, queryClient]);

  if (!job || job.status === "CONFIRMING") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("importCompleted")}</CardTitle>
          <CardDescription>{t("importingDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-14 h-14 animate-spin text-indigo-600" />
            <p className="text-lg font-medium text-slate-700">
              {t("importingProducts")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (job.status === "FAILED") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("importJobFailed")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              {job.errorMessage ?? t("someProductsFailed")}
            </AlertDescription>
          </Alert>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/global-products")}
            >
              {t("viewCatalog")}
            </Button>
            <Button onClick={onNewImport}>{t("newImport")}</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const errorItems = job.items.filter((item) => item.importError !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("importCompleted")}</CardTitle>
        <CardDescription>{t("importSummary")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {job.totalDetected}
            </p>
            <p className="text-sm text-slate-500">{t("totalDetected")}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {job.totalImported}
            </p>
            <p className="text-sm text-green-600">{t("imported")}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {errorItems.length}
            </p>
            <p className="text-sm text-red-600">{t("withErrors")}</p>
          </div>
        </div>

        {errorItems.length > 0 && (
          <>
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{t("someProductsFailed")}</AlertDescription>
            </Alert>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">
                      {tCommon("fields.name")}
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">
                      {tCommon("fields.error")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {errorItems.map((item) => (
                    <tr key={item.id} className="bg-red-50">
                      <td className="px-4 py-2 text-slate-700">{item.name}</td>
                      <td className="px-4 py-2 text-red-600">
                        {item.importError}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/global-products")}
          >
            {t("viewCatalog")}
          </Button>
          <Button onClick={onNewImport}>{t("newImport")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function ImportGlobalProductsPage() {
  useAuthGuard();
  const router = useRouter();
  const isSuperAdmin = useIsSuperAdmin();
  const t = useTranslations("admin-catalog");
  const tCommon = useTranslations("common");

  const [currentStep, setCurrentStep] = useState<ImportStep>("upload");
  const [jobId, setJobId] = useState<string | null>(null);

  const handleJobCreated = useCallback((job: ImportJobDto) => {
    setJobId(job.id);
    if (job.status === "READY_FOR_REVIEW") {
      setCurrentStep("review");
    } else {
      setCurrentStep("processing");
    }
  }, []);

  const handleProcessingReady = useCallback(() => {
    setCurrentStep("review");
  }, []);

  const handleProcessingFailed = useCallback(() => {
    toast.error(t("importJobFailed"));
    setCurrentStep("upload");
    setJobId(null);
  }, [t]);

  const handleConfirmed = useCallback(() => {
    setCurrentStep("results");
  }, []);

  const handleNewImport = useCallback(() => {
    setCurrentStep("upload");
    setJobId(null);
  }, []);

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {tCommon("errors.accessDenied")}
          </h2>
          <p className="text-slate-500 text-center max-w-md">
            {t("superAdminOnly")}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("importProducts")}
            </h1>
            <p className="text-slate-500">{t("importDescription")}</p>
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Steps */}
        {currentStep === "upload" && (
          <UploadStep onJobCreated={handleJobCreated} />
        )}

        {currentStep === "processing" && jobId && (
          <ProcessingStep
            jobId={jobId}
            onReady={handleProcessingReady}
            onFailed={handleProcessingFailed}
          />
        )}

        {currentStep === "review" && jobId && (
          <ReviewStep
            jobId={jobId}
            onConfirmed={handleConfirmed}
            onBack={() => {
              setCurrentStep("upload");
              setJobId(null);
            }}
          />
        )}

        {currentStep === "results" && jobId && (
          <ResultsStep jobId={jobId} onNewImport={handleNewImport} />
        )}
      </div>
    </DashboardLayout>
  );
}
