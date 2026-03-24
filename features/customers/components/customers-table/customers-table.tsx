"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  flexRender,
} from "@tanstack/react-table";
import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
} from "lucide-react";
import { useCustomerColumns } from "./columns";
import { SelectionBar } from "./selection-bar";
import {
  useCustomerSelectionStore,
  useSelectedCustomerCount,
} from "../../stores/customer-selection.store";
import type { CustomerWithMetrics } from "../../types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface CustomersTableProps {
  data: CustomerWithMetrics[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  onPageChange: (page: number) => void;
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
}

export function CustomersTable({
  data,
  isLoading,
  pagination,
  onPageChange,
  onSortChange,
}: CustomersTableProps) {
  const t = useTranslations("customers");
  const tc = useTranslations("common");
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);

  // Store de selección
  const {
    selectedIds,
    isAllSelected,
    toggleSelection,
    selectAll,
    selectAllPages,
    clearSelection,
    setTotalItems,
  } = useCustomerSelectionStore();
  const selectedCount = useSelectedCustomerCount();

  // Actualizar total de items cuando cambia
  useEffect(() => {
    setTotalItems(pagination.total);
  }, [pagination.total, setTotalItems]);

  // Manejar selección de todos los items visibles
  const handleSelectAll = useCallback(() => {
    const visibleIds = data.map((customer) => customer.id);
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAll(visibleIds);
    }
  }, [data, isAllSelected, selectAll, clearSelection]);

  // Manejar selección de todas las páginas
  const handleSelectAllPages = useCallback(() => {
    selectAllPages(pagination.total);
  }, [pagination.total, selectAllPages]);

  // Doble click para navegar
  const handleRowDoubleClick = useCallback(
    (customerId: string) => {
      router.push(`/dashboard/customers/${customerId}`);
    },
    [router]
  );

  // Columnas configuradas
  const columns = useCustomerColumns({
    selectedIds,
    onToggleSelection: toggleSelection,
    onSelectAll: handleSelectAll,
    isAllSelected,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  // Skeleton loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200">
          <div className="p-4">
            <Skeleton className="h-8 w-full" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-t border-slate-100">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {t("empty.title")}
        </h3>
        <p className="text-slate-500 text-center max-w-sm">
          {t("empty.description")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de selección */}
      <SelectionBar
        selectedCount={selectedCount}
        totalCount={pagination.total}
        onClearSelection={clearSelection}
        onSelectAllPages={handleSelectAllPages}
      />

      {/* Tabla */}
      <Card>
        <div className="rounded-lg border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="bg-slate-50 hover:bg-slate-50"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className="text-slate-700 font-semibold"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
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
                      "cursor-pointer transition-colors",
                      (selectedIds.has(row.original.id) || isAllSelected) &&
                        "bg-indigo-50/50",
                      "hover:bg-slate-50"
                    )}
                    onDoubleClick={() => handleRowDoubleClick(row.original.id)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* Paginación */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-slate-500">
          {tc("pagination.showing", {
            from: (pagination.page - 1) * pagination.limit + 1,
            to: Math.min(pagination.page * pagination.limit, pagination.total),
            total: pagination.total,
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={!pagination.hasPreviousPage}
            className="hidden sm:flex"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!pagination.hasPreviousPage}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {tc("pagination.previous")}
          </Button>

          <span className="text-sm text-slate-600 px-2">
            {tc("pagination.page", {
              page: pagination.page,
              total: pagination.totalPages,
            })}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasNextPage}
          >
            {tc("pagination.next")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.totalPages)}
            disabled={!pagination.hasNextPage}
            className="hidden sm:flex"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
