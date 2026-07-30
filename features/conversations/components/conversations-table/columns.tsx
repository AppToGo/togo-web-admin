"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageSquareText, Phone, User } from "lucide-react";
import { ConversationOutcomeBadge } from "../conversation-outcome-badge";
import type { ConversationListItem } from "../../types";

interface ColumnsProps {
  onSelectConversation: (sessionId: string) => void;
}

export function useConversationColumns({
  onSelectConversation,
}: ColumnsProps): ColumnDef<ConversationListItem>[] {
  const t = useTranslations("conversations");

  return [
    {
      accessorKey: "customer",
      header: () => t("table.customer"),
      cell: ({ row }) => {
        const { customer, phoneNumber } = row.original;
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-slate-900">
                {customer?.name || t("table.anonymous")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
              <Phone className="h-3 w-3" />
              <span>{customer?.phoneNumber || phoneNumber}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "outcome",
      header: () => t("table.outcome"),
      cell: ({ row }) => (
        <ConversationOutcomeBadge
          outcome={row.original.outcome}
          status={row.original.status}
        />
      ),
    },
    {
      accessorKey: "lastMessageAt",
      header: () => t("table.lastMessageAt"),
      cell: ({ row }) => (
        <span className="text-slate-600 text-sm">
          {new Date(row.original.lastMessageAt).toLocaleString(undefined, {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      accessorKey: "messageCount",
      header: () => t("table.messageCount"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <MessageSquareText className="h-3.5 w-3.5" />
          <span>{row.original.messageCount}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("table.actions")}</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 cursor-pointer"
            onClick={() => onSelectConversation(row.original.id)}
          >
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">{t("table.viewConversation")}</span>
          </Button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 60,
    },
  ];
}
