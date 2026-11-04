"use client";

/**
 * Precio de los usuarios o sedes por encima del límite del plan, y qué se
 * cobra al guardar (docs/cobro-suscripciones.md §16 de la API). Lo usan
 * EditUsersLimitModal y EditBranchesLimitModal.
 */

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useAddonQuote } from "../hooks";
import type {
  AddonType,
  MonthlyBreakdown,
} from "../types/business-subscription.types";

interface AddonChargeSectionProps {
  businessId: string | undefined;
  type: AddonType;
  /** Límite que quedará (null = el del plan). */
  limit: number | null;
  /** Límite del plan; undefined mientras carga el catálogo. */
  planLimit: number | undefined;
  isPlanUnlimited: boolean;
  unitPrice: string;
  onUnitPriceChange: (value: string) => void;
}

/** ¿El límite deja unidades por encima del plan? Esas se cobran. */
export function hasExtraUnits(
  limit: number | null,
  planLimit: number | undefined,
  isPlanUnlimited: boolean
): boolean {
  return (
    limit !== null &&
    planLimit !== undefined &&
    !isPlanUnlimited &&
    limit > planLimit
  );
}

/**
 * Límite entero ≥ 1 (o null = el del plan) y, si hay adicionales, precio
 * entero ≥ 0. Los modales lo usan para habilitar Guardar: sin esto un precio
 * con decimales se truncaba al enviar sin haber mostrado la cotización.
 */
export function isValidAddonInput(
  limit: number | null,
  unitPrice: string,
  withExtras: boolean
): boolean {
  const validLimit = limit === null || (Number.isInteger(limit) && limit >= 1);
  const price = unitPrice === "" ? NaN : Number(unitPrice);
  const validPrice = !withExtras || (Number.isInteger(price) && price >= 0);
  return validLimit && validPrice;
}

export function AddonChargeSection({
  businessId,
  type,
  limit,
  planLimit,
  isPlanUnlimited,
  unitPrice,
  onUnitPriceChange,
}: AddonChargeSectionProps) {
  const t = useTranslations("admin-businesses.modals.addon");
  const withExtras = hasExtraUnits(limit, planLimit, isPlanUnlimited);
  const parsedPrice = unitPrice === "" ? null : Number(unitPrice);
  const valid = isValidAddonInput(limit, unitPrice, withExtras);

  const params = useMemo(
    () => ({ type, limit, unitPrice: withExtras ? parsedPrice : null }),
    [type, limit, withExtras, parsedPrice]
  );
  const debouncedParams = useDebounce(params, 400);
  // Solo se cotiza cuando el debounce alcanzó a lo escrito: si no, se pedía
  // con valores viejos (p. ej. el límite nuevo sin su precio → 400).
  const { data: quote, isFetching } = useAddonQuote(
    businessId,
    debouncedParams,
    valid && debouncedParams === params
  );

  const unitLabel = type === "USERS" ? t("perUser") : t("perBranch");

  return (
    <div className="grid gap-4">
      {withExtras && (
        <div className="grid gap-2">
          <Label htmlFor={`addon-price-${type}`}>{unitLabel} *</Label>
          <Input
            id={`addon-price-${type}`}
            type="number"
            min="0"
            step="1"
            placeholder={t("pricePlaceholder")}
            value={unitPrice}
            onChange={(e) => onUnitPriceChange(e.target.value)}
            required
          />
          <p className="text-xs text-slate-500">
            {t("priceHint", { count: (limit ?? 0) - (planLimit ?? 0) })}
          </p>
        </div>
      )}

      {quote && valid && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            quote.mode === "CHARGED"
              ? "border-amber-200 bg-amber-50"
              : "border-slate-200 bg-slate-50"
          } ${isFetching ? "opacity-60" : ""}`}
        >
          <p className="font-medium text-slate-900">
            {quote.mode === "CHARGED"
              ? t("chargedToday", {
                  amount: formatCurrency(
                    quote.amountInCents / 100,
                    quote.currency
                  ),
                  days: quote.proratedDays ?? 0,
                  card: quote.card
                    ? `${quote.card.brand ?? ""} •••• ${quote.card.lastFour ?? ""}`.trim()
                    : "",
                })
              : quote.mode === "APPLIED_NEXT_CYCLE"
                ? t("nextCycle")
                : quote.next.total < quote.current.total
                  ? t("lowered")
                  : t("noChange")}
          </p>
          {quote.mode === "CHARGED" && (
            <p className="mt-1 text-xs text-slate-600">
              {t("activatesOnApproval")}
            </p>
          )}
          {quote.next.total !== quote.current.total && (
            <BreakdownLines
              breakdown={quote.next}
              previousTotal={quote.current.total}
              currency={quote.currency}
            />
          )}
        </div>
      )}
    </div>
  );
}

function BreakdownLines({
  breakdown,
  previousTotal,
  currency,
}: {
  breakdown: MonthlyBreakdown;
  previousTotal: number;
  currency: string;
}) {
  const t = useTranslations("admin-businesses.modals.addon");
  const money = (amount: number) => formatCurrency(amount, currency);

  return (
    <dl className="mt-3 grid gap-1 border-t border-slate-200 pt-3 text-slate-600">
      <div className="flex justify-between">
        <dt>{t("planLine", { name: breakdown.planName })}</dt>
        <dd>{money(breakdown.planAmount)}</dd>
      </div>
      {breakdown.users.count > 0 && (
        <div className="flex justify-between">
          <dt>
            {t("usersLine", {
              count: breakdown.users.count,
              price: money(breakdown.users.unitPrice),
            })}
          </dt>
          <dd>{money(breakdown.users.amount)}</dd>
        </div>
      )}
      {breakdown.branches.count > 0 && (
        <div className="flex justify-between">
          <dt>
            {t("branchesLine", {
              count: breakdown.branches.count,
              price: money(breakdown.branches.unitPrice),
            })}
          </dt>
          <dd>{money(breakdown.branches.amount)}</dd>
        </div>
      )}
      <div className="flex justify-between font-medium text-slate-900">
        <dt>{t("monthlyTotal")}</dt>
        <dd>
          <span className="mr-2 text-xs font-normal text-slate-400 line-through">
            {money(previousTotal)}
          </span>
          {money(breakdown.total)}
        </dd>
      </div>
    </dl>
  );
}
