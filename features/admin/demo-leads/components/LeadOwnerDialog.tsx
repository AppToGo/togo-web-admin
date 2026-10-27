"use client";

/**
 * Elegir el responsable de un lead entre el personal de ToGo (super admin y
 * usuarios internos con acceso a posibles clientes). Nunca usuarios de
 * negocios: la lista sale de GET /admin/demo-leads/owners.
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchField } from "@/components/ui/search-field";
import { Skeleton } from "@/components/ui/skeleton";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { useDemoLeadOwners, useUpdateDemoLead } from "../hooks/useDemoLeads";

interface LeadOwnerDialogProps {
  lead: { id: string; name?: string | null; ownerUserId?: string | null };
  isOpen: boolean;
  onClose: () => void;
}

export function LeadOwnerDialog({ lead, isOpen, onClose }: LeadOwnerDialogProps) {
  const t = useTranslations("admin-demo-leads");
  const { data: owners = [], isLoading } = useDemoLeadOwners(isOpen);
  const updateLead = useUpdateDemoLead();
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return owners;
    return owners.filter(
      (o) =>
        o.name.toLowerCase().includes(query) ||
        (o.email ?? "").toLowerCase().includes(query)
    );
  }, [owners, search]);

  const assign = (ownerUserId: string | null) => {
    if (ownerUserId === (lead.ownerUserId ?? null)) {
      onClose();
      return;
    }
    updateLead.mutate({ id: lead.id, data: { ownerUserId } }, { onSuccess: onClose });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t("owner.title")}</DialogTitle>
          <DialogDescription>
            {t("owner.description", { name: lead.name || t("card.noName") })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-7 pb-7">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder={t("owner.search")}
          />

          <div className="max-h-[50vh] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : visible.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">{t("owner.empty")}</p>
            ) : (
              visible.map((owner) => {
                const selected = owner.id === lead.ownerUserId;
                return (
                  <button
                    key={owner.id}
                    type="button"
                    disabled={updateLead.isPending}
                    onClick={() => assign(owner.id)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 disabled:opacity-60",
                      selected && "bg-indigo-50/60"
                    )}
                  >
                    <InitialsAvatar name={owner.name} seed={owner.id} size="xs" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium text-slate-900">
                        {owner.name}
                      </span>
                      {owner.email && (
                        <span className="truncate text-xs text-slate-500">{owner.email}</span>
                      )}
                    </span>
                    {selected && <Check className="h-4 w-4 text-indigo-600" aria-hidden />}
                  </button>
                );
              })
            )}
          </div>

          {lead.ownerUserId && (
            <button
              type="button"
              disabled={updateLead.isPending}
              onClick={() => assign(null)}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 disabled:opacity-60"
            >
              <UserMinus className="h-4 w-4" aria-hidden />
              {t("owner.remove")}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
