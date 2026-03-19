"use client";

import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IndustryCategoryActions } from "./IndustryCategoryActions";
import type { IndustryCategory } from "../types/industry-category.types";

interface IndustryCategoryListProps {
  categories: IndustryCategory[];
  isLoading: boolean;
  onEdit: (category: IndustryCategory) => void;
  onDelete: (category: IndustryCategory) => void;
  onToggleStatus: (category: IndustryCategory) => void;
}

export function IndustryCategoryList({
  categories,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
}: IndustryCategoryListProps) {
  const t = useTranslations("admin-industry-categories");

  if (isLoading) {
    return <IndustryCategoryListSkeleton />;
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
        <p className="text-slate-500">{t("empty.noCategories")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="w-16 text-center text-slate-500">
              {t("table.icon")}
            </TableHead>
            <TableHead className="text-slate-500">{t("table.name")}</TableHead>
            <TableHead className="text-slate-500">
              {t("table.industries")}
            </TableHead>
            <TableHead className="text-center text-slate-500">
              {t("table.order")}
            </TableHead>
            <TableHead className="text-center text-slate-500">
              {t("table.status")}
            </TableHead>
            <TableHead className="text-right text-slate-500">
              {t("table.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow
              key={category.id}
              className="hover:bg-slate-50 transition-colors"
            >
              {/* Icon */}
              <TableCell className="text-center">
                {category.icon ? (
                  <span className="text-xl">{category.icon}</span>
                ) : (
                  <span className="text-slate-300">-</span>
                )}
              </TableCell>

              {/* Name */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">
                    {category.name}
                  </span>
                  {category.color && (
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: category.color }}
                      title={category.color}
                    />
                  )}
                </div>
                <span className="text-xs text-slate-500">{category.slug}</span>
              </TableCell>

              {/* Industries */}
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {category.industries?.length > 0 ? (
                    <>
                      {category.industries.slice(0, 2).map((ind) => (
                        <Badge key={ind.id} variant="outline" className="text-xs">
                          {ind.name}
                        </Badge>
                      ))}
                      {category.industries.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{category.industries.length - 2}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </div>
              </TableCell>

              {/* Order */}
              <TableCell className="text-center">
                <span className="text-slate-600 font-mono">
                  {category.order}
                </span>
              </TableCell>

              {/* Status */}
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Badge
                    variant={category.isActive ? "default" : "secondary"}
                    className={
                      category.isActive
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                    }
                  >
                    {category.isActive
                      ? t("status.active")
                      : t("status.inactive")}
                  </Badge>
                </div>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <IndustryCategoryActions
                  category={category}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleStatus={onToggleStatus}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function IndustryCategoryListSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-16">
              <Skeleton className="h-4 w-8 mx-auto" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead className="w-24">
              <Skeleton className="h-4 w-12 mx-auto" />
            </TableHead>
            <TableHead className="w-32">
              <Skeleton className="h-4 w-16 mx-auto" />
            </TableHead>
            <TableHead className="w-20">
              <Skeleton className="h-4 w-8 ml-auto" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-6 w-6 mx-auto rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8 mx-auto" />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 ml-auto rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
