"use client";

import { MoreVertical, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { IndustryCategory } from "../types/industry-category.types";

interface IndustryCategoryActionsProps {
  category: IndustryCategory;
  onEdit: (category: IndustryCategory) => void;
  onDelete: (category: IndustryCategory) => void;
  onToggleStatus: (category: IndustryCategory) => void;
}

export function IndustryCategoryActions({
  category,
  onEdit,
  onDelete,
  onToggleStatus,
}: IndustryCategoryActionsProps) {
  const t = useTranslations("admin-industry-categories");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-slate-600"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">{t("actions.openMenu")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => onEdit(category)}
          className="cursor-pointer"
        >
          <Pencil className="mr-2 h-4 w-4" />
          {t("actions.edit")}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onToggleStatus(category)}
          className="cursor-pointer"
        >
          {category.isActive ? (
            <>
              <PowerOff className="mr-2 h-4 w-4" />
              {t("actions.deactivate")}
            </>
          ) : (
            <>
              <Power className="mr-2 h-4 w-4" />
              {t("actions.activate")}
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onDelete(category)}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("actions.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
