"use client";
/**
 * Cajas de la sede como pestañas-tarjeta: nombre + estado del turno y quién
 * lo abrió. La creación (gateada `cash.manage`) va en un drawer.
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useCreateRegister } from "../hooks/useCashMutations";
import type { CashRegister } from "../types/cash.types";

interface RegisterTabsProps {
  businessId: string;
  branchId: string;
  registers: CashRegister[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  canManage: boolean;
}

export function RegisterTabs({
  businessId,
  branchId,
  registers,
  selectedId,
  onSelect,
  canManage,
}: RegisterTabsProps) {
  const t = useTranslations("cash");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const createRegister = useCreateRegister(businessId, branchId);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createRegister.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          setCreating(false);
          setName("");
        },
      }
    );
  };

  return (
    <div className="flex flex-wrap items-stretch gap-2" role="tablist">
      {registers.map((register) => {
        const active = register.id === selectedId;
        const session = register.openSession;
        return (
          <button
            key={register.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(register.id)}
            className={cn(
              "min-h-14 rounded-card px-4 py-2 text-left text-sm transition-colors",
              active
                ? "bg-indigo-100"
                : "border border-white/80 bg-white/40 backdrop-blur-xl hover:bg-white/60"
            )}
          >
            <span
              className={cn(
                "block font-semibold",
                active ? "text-indigo-700" : "text-slate-900"
              )}
            >
              {register.name}
            </span>
            <span
              className={cn(
                "block text-xs",
                session ? "text-emerald-700" : "text-slate-500"
              )}
            >
              {session
                ? session.openedByName
                  ? t("registerOpenBy", { name: session.openedByName })
                  : t("registerOpen")
                : t("registerClosed")}
            </span>
          </button>
        );
      })}
      {canManage && (
        <Button
          variant="ghost"
          className="min-h-14 rounded-card text-slate-600"
          onClick={() => setCreating(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          {t("addRegister")}
        </Button>
      )}
      <Drawer open={creating} onOpenChange={setCreating}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("addRegister")}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 space-y-2 overflow-y-auto px-6 py-4">
            <label htmlFor="cash-register-name" className="text-sm font-medium">
              {t("registerName")}
            </label>
            <Input
              id="cash-register-name"
              value={name}
              placeholder={t("registerNamePlaceholder")}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
            />
          </div>
          <DrawerFooter className="gap-2 sm:space-x-0">
            <Button variant="outline" onClick={() => setCreating(false)}>
              {t("actions.cancel")}
            </Button>
            <Button
              onClick={submit}
              disabled={!name.trim() || createRegister.isPending}
            >
              {t("addRegister")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
