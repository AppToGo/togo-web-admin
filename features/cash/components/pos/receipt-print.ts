/**
 * Recibo de 80 mm generado en el navegador (docs/caja-pos.md). Se abre en
 * una ventana aparte y se imprime con `window.print()`, así la pantalla de
 * Caja no necesita estilos de impresión propios.
 */
import { formatCOP } from "../../utils/cash.utils";

export interface ReceiptData {
  businessName: string;
  orderNumber: string;
  dateLabel: string;
  typeLabel: string;
  lines: Array<{ name: string; quantity: number; total: number }>;
  subtotal: number;
  deliveryFee: number | null;
  total: number;
  methodLabel: string;
  received: number | null;
  change: number | null;
  labels: {
    order: string;
    subtotal: string;
    deliveryFee: string;
    total: string;
    paidWith: string;
    received: string;
    change: string;
    thanks: string;
  };
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(left: string, right: string, strong = false): string {
  const tag = strong ? "strong" : "span";
  return `<div class="row"><${tag}>${escape(left)}</${tag}><${tag}>${escape(right)}</${tag}></div>`;
}

export function buildReceiptHtml(data: ReceiptData): string {
  const { labels } = data;
  const items = data.lines
    .map((line) =>
      row(`${line.quantity} x ${line.name}`, formatCOP(line.total))
    )
    .join("");
  const totals = [
    row(labels.subtotal, formatCOP(data.subtotal)),
    data.deliveryFee
      ? row(labels.deliveryFee, formatCOP(data.deliveryFee))
      : "",
    row(labels.total, formatCOP(data.total), true),
    row(labels.paidWith, data.methodLabel),
    data.received !== null
      ? row(labels.received, formatCOP(data.received))
      : "",
    data.change !== null ? row(labels.change, formatCOP(data.change)) : "",
  ].join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escape(labels.order)} #${escape(data.orderNumber)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { width: 72mm; margin: 0 auto; font: 12px/1.4 ui-monospace, Menlo, Consolas, monospace; color: #000; }
  h1 { font-size: 15px; text-align: center; margin: 0 0 2px; }
  .center { text-align: center; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .row span:first-child, .row strong:first-child { overflow-wrap: anywhere; }
  hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
</style></head>
<body>
  <h1>${escape(data.businessName)}</h1>
  <div class="center">${escape(labels.order)} #${escape(data.orderNumber)} · ${escape(data.typeLabel)}</div>
  <div class="center">${escape(data.dateLabel)}</div>
  <hr>${items}<hr>${totals}<hr>
  <div class="center">${escape(labels.thanks)}</div>
  <script>window.onload = function () { window.print(); };</script>
</body></html>`;
}

/** Abre el recibo y lanza la impresión. false si el navegador bloqueó la ventana. */
export function printReceipt(data: ReceiptData): boolean {
  const popup = window.open("", "_blank", "width=420,height=640");
  if (!popup) return false;
  popup.document.open();
  popup.document.write(buildReceiptHtml(data));
  popup.document.close();
  return true;
}
