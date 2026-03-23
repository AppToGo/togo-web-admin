"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Phone, User, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { CustomerWithMetrics } from "../../types";
import Link from "next/link";

// Helper para formatear fechas relativas
function formatRelativeDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

interface ColumnsProps {
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
}

export function useCustomerColumns({
  selectedIds,
  onToggleSelection,
  onSelectAll,
  isAllSelected,
}: ColumnsProps): ColumnDef<CustomerWithMetrics>[] {
  const t = useTranslations("customers");

  return [
    // Checkbox de selección
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={onSelectAll}
          aria-label={t("table.selectAll")}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id) || isAllSelected}
          onCheckedChange={() => onToggleSelection(row.original.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={t("table.selectRow")}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    // Nombre y teléfono
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 -ml-2"
        >
          {t("table.columns.name")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const name = row.original.name;
        const phone = row.original.phoneNumber;
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-slate-900">
                {name || t("table.anonymous")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
              <Phone className="h-3 w-3" />
              <span>{phone}</span>
            </div>
          </div>
        );
      },
    },
    // Teléfono (columna separada para sorting)
    {
      accessorKey: "phoneNumber",
      header: t("table.columns.phone"),
      cell: () => null, // Se muestra en la columna de nombre
      enableHiding: true,
    },
    // Total de pedidos
    {
      accessorKey: "totalOrders",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 -ml-2"
        >
          {t("table.columns.orders")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {row.original.totalOrders}
          </span>
        </div>
      ),
    },
    // Total gastado
    {
      accessorKey: "totalSpent",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 -ml-2"
        >
          {t("table.columns.spent")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium text-slate-900">
          {formatCurrency(row.original.totalSpent)}
        </div>
      ),
    },
    // Último pedido
    {
      accessorKey: "lastOrderDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 -ml-2"
        >
          {t("table.columns.lastOrder")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-slate-600">
          {formatRelativeDate(row.original.lastOrderDate)}
        </span>
      ),
    },
    // Acciones
    {
      id: "actions",
      header: () => <span className="sr-only">{t("table.columns.actions")}</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 w-8 p-0"
          >
            <Link href={`/dashboard/customers/${row.original.id}`}>
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">{t("table.viewDetails")}</span>
            </Link>
          </Button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 60,
    },
  ];
}
