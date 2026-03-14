"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
      if (!data.sku) errors.push("SKU es requerido");
      if (!data.name) errors.push("Nombre es requerido");
      if (!data.industryid) errors.push("IndustryId es requerido");

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
      alert("Por favor selecciona un archivo CSV");
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
            Acceso denegado
          </h2>
          <p className="text-slate-500 text-center max-w-md">
            Esta sección es solo para Super Administradores.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Count valid/invalid rows
  const validRows = parsedData.filter((row) => row.isValid);
  const invalidRows = parsedData.filter((row) => !row.isValid);

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
              Importar Productos
            </h1>
            <p className="text-slate-500">
              Sube productos masivamente desde un archivo CSV
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-4">
          {[
            { id: "upload", label: "Subir archivo" },
            { id: "preview", label: "Vista previa" },
            { id: "importing", label: "Importando" },
            { id: "results", label: "Resultados" },
          ].map((step, index) => (
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
              <CardTitle>Subir archivo CSV</CardTitle>
              <CardDescription>
                El archivo debe tener las columnas: sku, name, description, brand, industryId,
                industryCategoryId, imageUrl
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
                  Arrastra y suelta tu archivo CSV aquí
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
                    <span>Seleccionar archivo</span>
                  </Button>
                </label>
              </div>

              {/* Download Template */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-700">¿No tienes el formato?</p>
                    <p className="text-sm text-slate-500">
                      Descarga la plantilla con el formato correcto
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleDownloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar plantilla
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <p className="font-medium text-slate-700">Instrucciones:</p>
                <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                  <li>El archivo debe estar en formato CSV (valores separados por comas)</li>
                  <li>La primera fila debe contener los nombres de las columnas</li>
                  <li>SKU, name e industryId son campos obligatorios</li>
                  <li>Si un SKU ya existe, el producto será actualizado</li>
                  <li>Máximo 1000 filas por archivo</li>
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
                  <CardTitle>Vista previa</CardTitle>
                  <CardDescription>
                    Revisa los datos antes de importar
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-100 text-green-700">
                    <Check className="w-3 h-3 mr-1" />
                    {validRows.length} válidos
                  </Badge>
                  {invalidRows.length > 0 && (
                    <Badge variant="destructive">
                      <X className="w-3 h-3 mr-1" />
                      {invalidRows.length} con errores
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
                    Hay {invalidRows.length} filas con errores. Corrige el archivo antes de continuar.
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">Fila</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">SKU</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">Nombre</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">Marca</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">Estado</th>
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
                                Válido
                              </Badge>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <Badge variant="destructive">
                                  <X className="w-3 h-3 mr-1" />
                                  Error
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
                  Volver
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={validRows.length === 0 || importProducts.isPending}
                  isLoading={importProducts.isPending}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar {validRows.length} productos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Importing Step */}
        {currentStep === "importing" && (
          <Card>
            <CardHeader>
              <CardTitle>Importando productos...</CardTitle>
              <CardDescription>
                Esto puede tomar unos momentos dependiendo de la cantidad de productos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 py-8">
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
                <p className="text-lg font-medium text-slate-700">
                  Procesando archivo...
                </p>
                <p className="text-sm text-slate-500">
                  Por favor no cierres esta página
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
              <CardTitle>Importación completada</CardTitle>
              <CardDescription>
                Resumen de la importación de productos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {importResult.totalRows}
                  </p>
                  <p className="text-sm text-slate-500">Total</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {importResult.imported}
                  </p>
                  <p className="text-sm text-green-600">Importados</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {importResult.skipped}
                  </p>
                  <p className="text-sm text-amber-600">Omitidos</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {importResult.failed}
                  </p>
                  <p className="text-sm text-red-600">Fallidos</p>
                </div>
              </div>

              {/* Error Details */}
              {importResult.failed > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Algunos productos no pudieron ser importados. Revisa los detalles abajo.
                  </AlertDescription>
                </Alert>
              )}

              {importResult.results.filter((r) => !r.success).length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">Fila</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">SKU</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">Error</th>
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
                  Ver catálogo
                </Button>
                <Button
                  onClick={() => {
                    setCurrentStep("upload");
                    setFile(null);
                    setParsedData([]);
                    setImportResult(null);
                  }}
                >
                  Importar más productos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
