"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Phone,
  Mail,
  Calendar,
  StickyNote,
} from "lucide-react";
import type { Customer } from "../../types";
import { SidebarSkeleton } from "./skeletons/sidebar-skeleton";
import { AddressList, type Address } from "./address-list";
import { MAX_NOTES_LENGTH } from "../../constants";

interface CustomerSidebarProps {
  customer: Customer | null;
  isLoading?: boolean;
  notes: string;
  onNotesChange: (notes: string) => void;
  onNotesSave: () => void;
  isSaving?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function CustomerSidebar({
  customer,
  isLoading = false,
  notes,
  onNotesChange,
  onNotesSave,
  isSaving = false,
  isCollapsed = false,
  onToggle,
}: CustomerSidebarProps) {
  const t = useTranslations("customers");
  const tc = useTranslations("common");

  // Debounce para guardar notas automáticamente
  const handleNotesChange = useCallback(
    (value: string) => {
      const trimmedValue = value.slice(0, MAX_NOTES_LENGTH);
      onNotesChange(trimmedValue);
    },
    [onNotesChange]
  );

  // Memoizar fechas formateadas
  const formattedDates = useMemo(() => {
    if (!customer) return null;
    
    const formatDate = (date: Date | string | null) => {
      if (!date) return "-";
      return new Date(date).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    return {
      customerSince: formatDate(customer.createdAt),
    };
  }, [customer?.createdAt]);

  if (isLoading || !customer) {
    return (
      <div className="p-6">
        <SidebarSkeleton />
      </div>
    );
  }

  const addresses: Address[] = customer.addresses || [];

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 space-y-6">
          {/* Avatar y nombre */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {customer.name?.charAt(0).toUpperCase() ||
                  customer.phoneNumber.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                {customer.name || t("detail.anonymous")}
              </h2>
              <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mt-1">
                <Phone className="h-3.5 w-3.5" />
                {customer.phoneNumber}
              </div>
              {customer.email && (
                <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mt-0.5">
                  <Mail className="h-3.5 w-3.5" />
                  {customer.email}
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex justify-center gap-2 flex-wrap">
            <Badge
              variant={customer.isActive ? "default" : "secondary"}
              className={
                customer.isActive
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-100"
              }
            >
              {customer.isActive ? t("status.active") : t("status.inactive")}
            </Badge>
            <Badge
              variant="outline"
              className="bg-indigo-50 text-indigo-700 border-indigo-200"
            >
              {t("detail.customer")}
            </Badge>
          </div>

          {/* Fechas */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-slate-500 text-xs">{t("detail.customerSince")}</p>
                <p className="font-medium text-slate-900">
                  {formattedDates?.customerSince || "-"}
                </p>
              </div>
            </div>
          </div>

          {addresses.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <AddressList
                addresses={addresses}
                translations={{
                  title: t("detail.addresses"),
                  defaultLabel: t("detail.default"),
                  showMore: t("detail.showMore"),
                  showLess: t("detail.showLess"),
                }}
              />
            </div>
          )}

          {/* Notas */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <StickyNote className="h-4 w-4 text-slate-400" />
              <h3 className="font-medium text-slate-900 text-sm">
                {t("detail.notes")}
              </h3>
            </div>
            <Textarea
              placeholder={t("detail.notesPlaceholder")}
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              maxLength={MAX_NOTES_LENGTH}
              rows={4}
              className="resize-none text-sm"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">
                {notes.length}/{MAX_NOTES_LENGTH}
              </span>
              <Button
                size="sm"
                onClick={onNotesSave}
                disabled={isSaving}
                className="text-xs"
              >
                {isSaving ? tc("buttons.saving") : tc("buttons.save")}
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
