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
import type { BusinessCategory } from "../types/catalog.types";

interface CategoryActionsProps {
  category: BusinessCategory;
  onEdit: (category: BusinessCategory) => void;
  onDelete: (category: BusinessCategory) => void;
  onToggleStatus: (category: BusinessCategory) => void;
}

export function CategoryActions({
  category,
  onEdit,
  onDelete,
  onToggleStatus,
}: CategoryActionsProps) {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-slate-600"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">{tCommon("actions.openMenu")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => onEdit(category)}
          className="cursor-pointer"
        >
          <Pencil className="mr-2 h-4 w-4" />
          {tCommon("actions.edit")}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onToggleStatus(category)}
          className="cursor-pointer"
        >
          {category.isActive ? (
            <>
              <PowerOff className="mr-2 h-4 w-4" />
              {tCommon("actions.deactivate")}
            </>
          ) : (
            <>
              <Power className="mr-2 h-4 w-4" />
              {tCommon("actions.activate")}
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onDelete(category)}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {tCommon("actions.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
