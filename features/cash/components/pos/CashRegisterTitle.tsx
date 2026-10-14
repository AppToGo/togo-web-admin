"use client";
/**
 * Título de la página "Caja" con la caja lista: el nombre de la caja (con
 * selector si la sede tiene varias) y el estado de su turno debajo. Lo
 * registra `CashPosPage` en `usePosPageStore`; sin registro (cargando, sin
 * cajas) devuelve `null` y la página muestra "Caja" y su descripción.
 */
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePosPageStore } from "@/stores/pos-menu.store";

export function CashRegisterTitle() {
  const t = useTranslations("cash");
  const header = usePosPageStore((state) => state.page?.header ?? null);
  if (!header) return null;

  const selected = header.registers.find(
    (item) => item.id === header.selectedId
  );

  return (
    <div className="min-w-0">
      <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900">
        <span
          aria-hidden
          className={cn(
            "h-2.5 w-2.5 shrink-0 rounded-full",
            header.isOpen ? "bg-emerald-600" : "bg-slate-400"
          )}
        />
        {header.registers.length > 1 ? (
          <Select
            value={header.selectedId}
            onValueChange={header.onSelectRegister}
          >
            <SelectTrigger
              aria-label={t("pos.header.register")}
              className="h-auto w-auto gap-2 border-none bg-transparent p-0 text-2xl font-bold shadow-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {header.registers.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="truncate">{selected?.name}</span>
        )}
      </h1>
      <p
        className="mt-1 truncate text-slate-500"
        data-testid="pos-session-status"
      >
        {header.statusText}
      </p>
    </div>
  );
}
