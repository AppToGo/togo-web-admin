"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useTranslations } from "next-intl";
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
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MessageCircle,
} from "lucide-react";
import { useConversationColumns } from "./columns";
import type { ConversationListItem, PaginationMeta } from "../../types";

interface ConversationsTableProps {
  data: ConversationListItem[];
  isLoading: boolean;
  /** Fetch fallido (500, timeout) — distinto de una lista vacía real. */
  isError?: boolean;
  onSelectConversation: (sessionId: string) => void;
  /** Si se omite, no se muestra el pie de paginación (uso compacto, ej. sección de cliente). */
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
}

export function ConversationsTable({
  data,
  isLoading,
  isError = false,
  onSelectConversation,
  pagination,
  onPageChange,
}: ConversationsTableProps) {
  const t = useTranslations("conversations");
  const tc = useTranslations("common");

  const columns = useConversationColumns({ onSelectConversation });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200">
          <div className="p-4">
            <Skeleton className="h-8 w-full" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border-t border-slate-100">
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">
          {t("error.title")}
        </h3>
        <p className="text-slate-500 text-center max-w-sm">
          {t("error.description")}
        </p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <MessageCircle className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">
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
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-slate-50">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
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
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => onSelectConversation(row.original.id)}
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
      </div>

      {pagination && !onPageChange && pagination.total > data.length && (
        <p className="text-sm text-slate-500 text-center">
          {t("table.showingRange", {
            from: 1,
            to: data.length,
            total: pagination.total,
          })}
        </p>
      )}

      {pagination && onPageChange && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-slate-500">
            {t("table.showingRange", {
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
              {tc("pagination.pageOf", {
                page: pagination.page,
                totalPages: pagination.totalPages,
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
      )}
    </div>
  );
}
