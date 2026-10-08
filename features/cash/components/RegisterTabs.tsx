"use client";
/**
 * Tabs de cajas de la sede + creación (gateada `cash.manage`).
 * El plan pide gateo por pestaña: sin `cash.view` la página completa se
 * bloquea (ver `CashPage`); aquí cada tab muestra su estado.
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
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
    <div className="flex flex-wrap items-center gap-2">
      <Tabs
        value={selectedId ?? ""}
        onValueChange={onSelect}
        className="min-w-0 flex-1"
      >
        <TabsList className="flex-wrap">
          {registers.map((register) => (
            <TabsTrigger
              key={register.id}
              value={register.id}
              className="gap-2"
            >
              {register.name}
              <Badge
                variant={register.openSession ? "default" : "secondary"}
                className="text-[11px]"
              >
                {register.openSession ? t("open") : t("closed")}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {canManage && (
        <Button
          variant="outline"
          size="sm"
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
          <DrawerFooter>
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
