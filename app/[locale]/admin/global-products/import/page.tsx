"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminCatalogTranslations } from "@/features/admin/catalog/hooks";
import {
  ArrowLeft,
  Upload,
  Download,
  FileSpreadsheet,
  Check,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { useBulkImportProducts } from "@/features/admin/catalog/hooks";
import { downloadImportTemplate } from "@/features/admin/catalog/services/admin-catalog.service";
import type { BulkImportResult } from "@/features/admin/catalog/types";

// ============================================================================
// TYPES
// ============================================================================

type ImportStep = "upload" | "preview" | "importing" | "results";

interface CsvRow {
  row: number;
  data: Record<string, string>;
  isValid: boolean;
  errors: string[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ImportGlobalProductsPage() {
  useAuthGuard();
  const router = useRouter();
  const isSuperAdmin = useIsSuperAdmin();
  const { admin, common, catalog } = useAdminCatalogTranslations();

  // State
  const [currentStep, setCurrentStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CsvRow[]>([]);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Mutation
  const importProducts = useBulkImportProducts();

  // Parse CSV file
  const parseCSV = (content: string): CsvRow[] => {
    const lines = content.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows: CsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const data: Record<string, string> = {};
      const errors: string[] = [];

      headers.forEach((header, index) => {
        data[header] = values[index] || "";
      });

      // Validation
      if (!data.sku) errors.push(admin('validation.skuRequired'));
      if (!data.name) errors.push(admin('validation.nameRequired'));
      if (!data.industryid) errors.push(admin('validation.industryIdRequired'));

      rows.push({
        row: i,
        data,
        isValid: errors.length === 0,
        errors,
      });
    }

    return rows;
  };

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
      alert(admin('validation.selectCsvFile'));
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);
      setParsedData(parsed);
      setCurrentStep("preview");
    };
    reader.readAsText(selectedFile);
  };

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  // Handle import
  const handleImport = async () => {
    if (!file) return;

    setCurrentStep("importing");

    try {
      const result = await importProducts.mutateAsync(file);
      setImportResult(result);
      setCurrentStep("results");
    } catch (error) {
      setCurrentStep("preview");
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    downloadImportTemplate();
  };

  // Check access
  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {common('errors.accessDenied')}
          </h2>
          <p className="text-slate-500 text-center max-w-md">
            {admin('superAdminOnly')}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Count valid/invalid rows
  const validRows = parsedData.filter((row) => row.isValid);
  const invalidRows = parsedData.filter((row) => !row.isValid);

  const steps = [
    { id: "upload", label: common('steps.uploadFile') },
    { id: "preview", label: common('steps.preview') },
    { id: "importing", label: common('steps.importing') },
    { id: "results", label: common('steps.results') },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {admin('importProducts')}
            </h1>
            <p className="text-slate-500">
              {admin('importDescription')}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step.id
                    ? "bg-indigo-600 text-white"
                    : ["preview", "importing", "results"].includes(currentStep) &&
                      index < ["upload", "preview", "importing", "results"].indexOf(currentStep)
                    ? "bg-green-500 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {["preview", "importing", "results"].includes(currentStep) &&
                index < ["upload", "preview", "importing", "results"].indexOf(currentStep) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-sm ${
                  currentStep === step.id ? "text-slate-900 font-medium" : "text-slate-500"
                }`}
              >
                {step.label}
              </span>
              {index < 3 && <div className="w-8 h-px bg-slate-200 mx-2" />}
            </div>
          ))}
        </div>

        {/* Upload Step */}
        {currentStep === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle>{admin('uploadCsvFile')}</CardTitle>
              <CardDescription>
                {admin('csvColumnsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Drop Zone */}
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
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-medium text-slate-700 mb-2">
                  {admin('dragDropCsv')}
                </p>
                <p className="text-sm text-slate-500 mb-4">o</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>{common('buttons.selectFile')}</span>
                  </Button>
                </label>
              </div>

              {/* Download Template */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-700">{admin('noFormatQuestion')}</p>
                    <p className="text-sm text-slate-500">
                      {admin('downloadTemplateDescription')}
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleDownloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    {common('buttons.downloadTemplate')}
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <p className="font-medium text-slate-700">{common('instructions')}:</p>
                <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                  <li>{admin('csvFormatInstruction')}</li>
                  <li>{admin('firstRowHeaders')}</li>
                  <li>{admin('requiredFields')}</li>
                  <li>{admin('skuUpdateNote')}</li>
                  <li>{admin('maxRows')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Step */}
        {currentStep === "preview" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{common('steps.preview')}</CardTitle>
                  <CardDescription>
                    {admin('reviewBeforeImport')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-100 text-green-700">
                    <Check className="w-3 h-3 mr-1" />
                    {validRows.length === 1 
                      ? admin('validCountOne') 
                      : admin('validCount', { count: validRows.length })}
                  </Badge>
                  {invalidRows.length > 0 && (
                    <Badge variant="destructive">
                      <X className="w-3 h-3 mr-1" />
                      {invalidRows.length === 1 
                        ? admin('errorsCountOne') 
                        : admin('errorsCount', { count: invalidRows.length })}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Validation Alert */}
              {invalidRows.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    {admin('errorsInRows', { count: invalidRows.length })}
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">{common('fields.row')}</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">{common('fields.sku')}</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">{common('fields.name')}</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">{common('fields.brand')}</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">{common('fields.status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {parsedData.slice(0, 50).map((row) => (
                        <tr key={row.row} className={!row.isValid ? "bg-red-50" : ""}>
                          <td className="px-4 py-2 text-slate-500">{row.row}</td>
                          <td className="px-4 py-2 font-mono">{row.data.sku}</td>
                          <td className="px-4 py-2">{row.data.name}</td>
                          <td className="px-4 py-2 text-slate-600">{row.data.brand}</td>
                          <td className="px-4 py-2">
                            {row.isValid ? (
                              <Badge variant="default" className="bg-green-100 text-green-700">
                                <Check className="w-3 h-3 mr-1" />
                                {common('status.valid')}
                              </Badge>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <Badge variant="destructive">
                                  <X className="w-3 h-3 mr-1" />
                                  {common('status.error')}
                                </Badge>
                                <span className="text-xs text-red-600">
                                  {row.errors.join(", ")}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 50 && (
                  <p className="text-center text-sm text-slate-500 py-2 border-t">
                    Y {parsedData.length - 50} filas más...
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep("upload")}>
                  {common('buttons.back')}
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={validRows.length === 0 || importProducts.isPending}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {validRows.length === 1 
                    ? admin('importCountProductsOne') 
                    : admin('importCountProducts', { count: validRows.length })}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Importing Step */}
        {currentStep === "importing" && (
          <Card>
            <CardHeader>
              <CardTitle>{admin('importingProducts')}</CardTitle>
              <CardDescription>
                {admin('importingDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 py-8">
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
                <p className="text-lg font-medium text-slate-700">
                  {common('status.processingFile')}
                </p>
                <p className="text-sm text-slate-500">
                  {common('doNotClosePage')}
                </p>
              </div>
              <Progress value={45} className="w-full" />
            </CardContent>
          </Card>
        )}

        {/* Results Step */}
        {currentStep === "results" && importResult && (
          <Card>
            <CardHeader>
              <CardTitle>{admin('importCompleted')}</CardTitle>
              <CardDescription>
                {admin('importSummary')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {importResult.totalRows}
                  </p>
                  <p className="text-sm text-slate-500">{common('fields.total')}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {importResult.imported}
                  </p>
                  <p className="text-sm text-green-600">{admin('imported')}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {importResult.skipped}
                  </p>
                  <p className="text-sm text-amber-600">{admin('skipped')}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {importResult.failed}
                  </p>
                  <p className="text-sm text-red-600">{common('status.failed')}</p>
                </div>
              </div>

              {/* Error Details */}
              {importResult.failed > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    {admin('someProductsFailed')}
                  </AlertDescription>
                </Alert>
              )}

              {importResult.results.filter((r) => !r.success).length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">{common('fields.row')}</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">{common('fields.sku')}</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">{common('errors.error')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {importResult.results
                        .filter((r) => !r.success)
                        .map((result, index) => (
                          <tr key={index} className="bg-red-50">
                            <td className="px-4 py-2 text-slate-500">{result.row}</td>
                            <td className="px-4 py-2 font-mono">{result.sku}</td>
                            <td className="px-4 py-2 text-red-600">{result.error}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin/global-products")}
                >
                  {admin('viewCatalog')}
                </Button>
                <Button
                  onClick={() => {
                    setCurrentStep("upload");
                    setFile(null);
                    setParsedData([]);
                    setImportResult(null);
                  }}
                >
                  {admin('importMoreProducts')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
