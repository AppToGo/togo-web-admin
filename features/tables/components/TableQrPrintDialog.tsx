"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";
import { Printer, Download, QrCode as QrCodeIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_CONFIG } from "@/config/app.config";
import { buildTableQrUrl } from "../utils/table-url.utils";
import type { RestaurantTable } from "../types";

interface TableQrPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: RestaurantTable[];
  businessSlug: string;
  branchSlug: string;
  /** true si el negocio tiene más de una sede activa (incluye el segmento de sede en la URL) */
  isMultiBranch: boolean;
}

interface TableQr {
  table: RestaurantTable;
  url: string;
  dataUrl: string;
}

/**
 * QR imprimible por mesa (Fase 2, docs/architecture/pedidos-en-mesa.md).
 *
 * Generación 100% client-side (dependencia `qrcode`) — la URL es
 * determinística a partir de slugs + código de mesa, sin endpoint nuevo en
 * el backend. Un `code` inválido o de otra sede simplemente cae al catálogo
 * normal sin mesa (ver PublicOrderService.createOrder en api-togo), así que
 * no hace falta token firmado ni expiración.
 */
export function TableQrPrintDialog({
  open,
  onOpenChange,
  tables,
  businessSlug,
  branchSlug,
  isMultiBranch,
}: TableQrPrintDialogProps) {
  const t = useTranslations("tables.qr");
  const [qrs, setQrs] = useState<TableQr[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const activeTables = tables.filter((table) => table.isActive);

  useEffect(() => {
    if (!open || activeTables.length === 0) return;

    let cancelled = false;
    setIsGenerating(true);

    Promise.all(
      activeTables.map(async (table) => {
        const url = buildTableQrUrl({
          baseUrl: APP_CONFIG.webCatalog.baseUrl,
          businessSlug,
          branchSlug,
          tableCode: table.code,
          isMultiBranch,
        });
        const dataUrl = await QRCode.toDataURL(url, {
          width: 480,
          margin: 1,
          errorCorrectionLevel: "M",
        });
        return { table, url, dataUrl };
      })
    ).then((results) => {
      if (!cancelled) {
        setQrs(results);
        setIsGenerating(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, businessSlug, branchSlug, isMultiBranch, tables.length]);

  const downloadPng = (qr: TableQr) => {
    const link = document.createElement("a");
    link.href = qr.dataUrl;
    link.download = `mesa-${qr.table.code}.png`;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .table-qr-print-root, .table-qr-print-root * { visibility: visible; }
            .table-qr-print-root {
              position: fixed;
              inset: 0;
              overflow: visible !important;
              max-height: none !important;
            }
            .table-qr-print-hide { display: none !important; }
            .table-qr-print-grid {
              display: grid !important;
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 24px !important;
            }
            .table-qr-print-card { break-inside: avoid; }
          }
        `}</style>

        <div className="table-qr-print-root">
          <DialogHeader className="table-qr-print-hide">
            <DialogTitle className="flex items-center gap-2">
              <QrCodeIcon className="w-4 h-4 text-indigo-500" />
              {t("title")}
            </DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          {activeTables.length === 0 ? (
            <p className="table-qr-print-hide text-sm text-slate-500 py-8 text-center">
              {t("noActiveTables")}
            </p>
          ) : isGenerating ? (
            <div className="table-qr-print-hide grid grid-cols-2 sm:grid-cols-3 gap-4 py-4">
              {activeTables.map((table) => (
                <Skeleton key={table.id} className="h-48 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="table-qr-print-hide flex justify-end mb-3">
                <Button type="button" size="sm" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-1" />
                  {t("printAll")}
                </Button>
              </div>

              <div className="table-qr-print-grid grid grid-cols-2 sm:grid-cols-3 gap-4 py-2">
                {qrs.map((qr) => (
                  <div
                    key={qr.table.id}
                    className="table-qr-print-card border rounded-lg p-4 flex flex-col items-center gap-2 text-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qr.dataUrl}
                      alt={t("qrAlt", { name: qr.table.name })}
                      className="w-full h-auto"
                    />
                    <div className="font-medium text-sm">{qr.table.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{qr.table.code}</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="table-qr-print-hide mt-1"
                      onClick={() => downloadPng(qr)}
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      {t("downloadPng")}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
