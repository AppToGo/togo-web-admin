"use client";

/**
 * BranchInventoryTable Component
 * 
 * Tabla editable de inventario usando TanStack Table v8.
 * Muestra TODOS los productos del negocio (LEFT JOIN).
 * Soporta edición inline con debounce y selección múltiple.
 */

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  flexRender,
} from "@tanstack/react-table";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Package,
  AlertTriangle,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { InventoryItem } from "../types";

interface BranchInventoryTableProps {
  data: InventoryItem[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onActivate: (product: InventoryItem) => void;
  onDeactivate: (productId: string) => void;
  onUpdateStock?: (productId: string, stock: number) => void;
  onUpdatePrice?: (productId: string, price: number) => void;
  onToggleAvailability: (productId: string, isAvailable: boolean) => void;
  debouncedUpdate?: (
    productId: string,
    field: "stock" | "priceOverride",
    value: number
  ) => void;
}

// Stock badge component
function StockBadge({ stock }: { stock: number | null }) {
  const t = useTranslations("inventory");

  if (stock === null) {
    return (
      <Badge variant="secondary" className="font-normal">
        ∞
      </Badge>
    );
  }

  if (stock === 0) {
    return (
      <Badge variant="destructive" className="font-normal">
        {t("table.outOfStock")}
      </Badge>
    );
  }

  if (stock < 10) {
    return (
      <Badge
        variant="outline"
        className="font-normal bg-amber-50 text-amber-700 border-amber-200"
      >
        <AlertTriangle className="w-3 h-3 mr-1" />
        {stock}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="font-normal text-green-700 border-green-200">
      {stock}
    </Badge>
  );
}

// Price display component
function PriceDisplay({
  basePrice,
  effectivePrice,
  priceOverride,
}: {
  basePrice: number;
  effectivePrice: number;
  priceOverride: number | null;
}) {
  const hasOverride = priceOverride !== null && priceOverride !== basePrice;

  return (
    <div className="flex flex-col">
      {hasOverride && (
        <span className="text-xs text-slate-400 line-through">
          {formatCurrency(basePrice)}
        </span>
      )}
      <span className={cn("font-medium", hasOverride ? "text-indigo-600" : "text-slate-900")}>
        {formatCurrency(effectivePrice)}
      </span>
      {hasOverride && (
        <span className="text-xs">
          {priceOverride! > basePrice ? (
            <span className="text-green-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +{formatCurrency(priceOverride! - basePrice)}
            </span>
          ) : (
            <span className="text-amber-600 flex items-center gap-0.5">
              <TrendingDown className="w-3 h-3" />
              {formatCurrency(priceOverride! - basePrice)}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

export function BranchInventoryTable({
  data,
  isLoading,
  selectedIds,
  onToggleSelection,
  onSelectAll,
  onActivate,
  onDeactivate,
  debouncedUpdate,
  onToggleAvailability,
}: BranchInventoryTableProps) {
  const t = useTranslations("inventory");
  const tc = useTranslations("common");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Local state for inline editing
  const [editingStock, setEditingStock] = useState<Record<string, string>>({});
  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({});

  // Derived state for "select all" checkbox
  const allSelected = useMemo(
    () => data.length > 0 && data.every((row) => selectedIds.has(row.businessProductId)),
    [data, selectedIds]
  );

  const someSelected = useMemo(
    () => data.some((row) => selectedIds.has(row.businessProductId)) && !allSelected,
    [data, selectedIds, allSelected]
  );

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onSelectAll([]);
    } else {
      onSelectAll(data.map((row) => row.businessProductId));
    }
  }, [allSelected, data, onSelectAll]);

  // Handle stock change with debounce
  const handleStockChange = useCallback(
    (productId: string, value: string) => {
      setEditingStock((prev) => ({ ...prev, [productId]: value }));

      const numValue = value === "" ? null : parseInt(value, 10);
      if (numValue !== null && !isNaN(numValue) && numValue >= 0) {
        debouncedUpdate?.(productId, "stock", numValue);
      }
    },
    [debouncedUpdate]
  );

  // Handle price change with debounce
  const handlePriceChange = useCallback(
    (productId: string, value: string) => {
      setEditingPrice((prev) => ({ ...prev, [productId]: value }));

      const numValue = value === "" ? null : parseFloat(value);
      if (numValue !== null && !isNaN(numValue) && numValue > 0) {
        debouncedUpdate?.(productId, "priceOverride", numValue);
      }
    },
    [debouncedUpdate]
  );

  // Reset editing state when data changes
  useEffect(() => {
    setEditingStock({});
    setEditingPrice({});
  }, [data]);

  const columns = useMemo<ColumnDef<InventoryItem>[]>(
    () => [
      // Selection checkbox
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={allSelected || someSelected ? true : false}
            onCheckedChange={handleSelectAll}
            aria-label={t("table.selectAll")}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.businessProductId)}
            onCheckedChange={() => onToggleSelection(row.original.businessProductId)}
            onClick={(e) => e.stopPropagation()}
            aria-label={t("table.selectRow")}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      // Product info
      {
        accessorKey: "productName",
        header: t("table.product"),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-3">
              {item.productImage ? (
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-slate-400" />
                </div>
              )}
              <div className="flex flex-col">
                <span
                  className={cn(
                    "font-medium",
                    item.isActivated ? "text-slate-900" : "text-slate-500"
                  )}
                >
                  {item.productName}
                </span>
                {item.categoryName && (
                  <span className="text-xs text-slate-400">{item.categoryName}</span>
                )}
              </div>
            </div>
          );
        },
        size: 250,
      },
      // Activation toggle
      {
        id: "activated",
        header: t("table.activated"),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <Switch
              checked={item.isActivated}
              onCheckedChange={(checked) => {
                if (checked) {
                  onActivate(item);
                } else {
                  onDeactivate(item.businessProductId);
                }
              }}
            />
          );
        },
        enableSorting: false,
        size: 100,
      },
      // Availability toggle (only when activated)
      {
        id: "available",
        header: t("table.available"),
        cell: ({ row }) => {
          const item = row.original;
          if (!item.isActivated) {
            return <span className="text-slate-400">-</span>;
          }
          return (
            <Switch
              checked={item.isAvailable}
              onCheckedChange={(checked) =>
                onToggleAvailability(item.businessProductId, checked)
              }
              disabled={!item.isActivated}
            />
          );
        },
        enableSorting: false,
        size: 100,
      },
      // Stock input
      {
        accessorKey: "stock",
        header: t("table.stock"),
        cell: ({ row }) => {
          const item = row.original;
          if (!item.isActivated) {
            return <span className="text-slate-400">-</span>;
          }

          const editValue = editingStock[item.businessProductId];
          const displayValue =
            editValue !== undefined
              ? editValue
              : item.stock === null
              ? ""
              : String(item.stock);

          return (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder="∞"
                value={displayValue}
                onChange={(e) => handleStockChange(item.businessProductId, e.target.value)}
                disabled={!item.isActivated}
                className="w-20 h-8 text-sm"
              />
              <StockBadge stock={item.stock} />
            </div>
          );
        },
        size: 140,
      },
      // Base price
      {
        accessorKey: "basePrice",
        header: t("table.basePrice"),
        cell: ({ row }) => formatCurrency(row.original.basePrice),
        size: 100,
      },
      // Price override input
      {
        accessorKey: "priceOverride",
        header: t("table.branchPrice"),
        cell: ({ row }) => {
          const item = row.original;
          if (!item.isActivated) {
            return <span className="text-slate-400">-</span>;
          }

          const editValue = editingPrice[item.businessProductId];
          const displayValue =
            editValue !== undefined
              ? editValue
              : item.priceOverride === null
              ? ""
              : String(item.priceOverride);

          return (
            <div className="space-y-1">
              <Input
                type="number"
                min={0.01}
                step={0.01}
                placeholder={String(item.basePrice)}
                value={displayValue}
                onChange={(e) => handlePriceChange(item.businessProductId, e.target.value)}
                disabled={!item.isActivated}
                className="w-24 h-8 text-sm"
              />
              <PriceDisplay
                basePrice={item.basePrice}
                effectivePrice={item.effectivePrice}
                priceOverride={item.priceOverride}
              />
            </div>
          );
        },
        size: 140,
      },
    ],
    [
      allSelected,
      someSelected,
      handleSelectAll,
      selectedIds,
      onToggleSelection,
      onActivate,
      onDeactivate,
      handleStockChange,
      handlePriceChange,
      editingStock,
      editingPrice,
      onToggleAvailability,
      t,
    ]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  if (isLoading) {
    return (
      <Card className="border border-slate-200">
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border border-slate-200 p-8 text-center">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-slate-900 mb-1">
          {t("table.empty.title")}
        </h3>
        <p className="text-slate-500">{t("table.empty.message")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder={t("table.search")}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-slate-500">
          {t("table.showing", {
            count: table.getFilteredRowModel().rows.length,
            total: data.length,
          })}
        </div>
      </div>

      {/* Table */}
      <Card className="border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-slate-50/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="text-slate-700 font-semibold whitespace-nowrap"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "transition-colors",
                    selectedIds.has(row.original.businessProductId) && "bg-indigo-50/50",
                    !row.original.isActivated && "bg-slate-50/50"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {tc("pagination.showing", {
            from:
              table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
              1,
            to: Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            ),
            total: table.getFilteredRowModel().rows.length,
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {tc("pagination.previous")}
          </Button>
          <span className="text-sm text-slate-600">
            {tc("pagination.page", {
              page: table.getState().pagination.pageIndex + 1,
              total: table.getPageCount(),
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {tc("pagination.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
