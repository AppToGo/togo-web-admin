"use client";

/**
 * ScoutLeadsDrawer — Agente ToGo Scout (Buscador y extractor de prospectos).
 *
 * Permite buscar posibles clientes por rubro + ciudad (Google Places) o
 * extraerlos con IA pegando texto libre (directorios, Instagram, Maps),
 * permitiendo corregir cualquier dato en cada tarjeta antes de sumarlos al CRM.
 */

import * as React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  CheckSquare,
  Compass,
  MapPin,
  Search,
  Sparkles,
  Square,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/ui/pill-group";
import { IndustrySelect } from "@/features/auth/components/IndustrySelect";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type {
  ScoutProspectCandidate,
  ScoutSearchMode,
} from "@/types/auth.types";
import {
  useScoutImport,
  useScoutSearch,
} from "@/features/admin/demo-leads/hooks/useDemoLeads";

interface ScoutLeadsDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenLead: (id: string) => void;
}

interface EditableScoutCandidate extends ScoutProspectCandidate {
  localId: string;
}

function isValidScoutPhone(phone: string): boolean {
  return phone.replace(/\D/g, "").length >= 10;
}

export function ScoutLeadsDrawer({
  open,
  onClose,
  onOpenLead,
}: ScoutLeadsDrawerProps) {
  const t = useTranslations("admin-demo-leads");
  const scoutSearch = useScoutSearch();
  const scoutImport = useScoutImport();

  const [mode, setMode] = useState<ScoutSearchMode>("PLACES");
  const [query, setQuery] = useState("");
  const [rawText, setRawText] = useState("");
  const [defaultBusinessType, setDefaultBusinessType] = useState("Restaurante");
  const [candidates, setCandidates] = useState<EditableScoutCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleClose = () => {
    scoutSearch.reset();
    scoutImport.reset();
    onClose();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    scoutSearch.mutate(
      {
        mode,
        query: mode === "PLACES" ? query.trim() : undefined,
        rawText: mode === "TEXT" ? rawText.trim() : undefined,
        defaultBusinessType: defaultBusinessType.trim() || "Restaurante",
      },
      {
        onSuccess: (res) => {
          const withIds: EditableScoutCandidate[] = res.candidates.map(
            (c, idx) => ({
              ...c,
              localId: `scout_${idx}_${c.phone}`,
            })
          );
          setCandidates(withIds);
          const selectable = new Set(
            withIds
              .filter(
                (c) =>
                  !c.alreadyInCrm &&
                  !c.alreadyCustomerBusiness &&
                  isValidScoutPhone(c.phone)
              )
              .map((c) => c.localId)
          );
          setSelectedIds(selectable);
        },
      }
    );
  };

  const toggleCandidate = (localId: string) => {
    const target = candidates.find((c) => c.localId === localId);
    if (!target) return;
    if (!selectedIds.has(localId) && !isValidScoutPhone(target.phone)) {
      toast.error(t("create.phoneInvalid"));
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(localId)) {
        next.delete(localId);
      } else {
        next.add(localId);
      }
      return next;
    });
  };

  const updateCandidateField = <K extends keyof EditableScoutCandidate>(
    localId: string,
    field: K,
    value: EditableScoutCandidate[K]
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.localId !== localId) return c;
        if (field === "phone") {
          return {
            ...c,
            phone: String(value),
            alreadyInCrm: false,
            existingLeadId: null,
            alreadyCustomerBusiness: false,
          };
        }
        return { ...c, [field]: value };
      })
    );
  };

  const validSelectedCandidates = candidates.filter(
    (c) =>
      selectedIds.has(c.localId) &&
      !c.alreadyInCrm &&
      !c.alreadyCustomerBusiness &&
      isValidScoutPhone(c.phone)
  );

  const handleImport = () => {
    if (validSelectedCandidates.length === 0) {
      toast.error(t("create.phoneInvalid"));
      return;
    }

    const toImport = validSelectedCandidates.map((c) => ({
      name: c.name.trim() || undefined,
      phone: c.phone.trim(),
      businessName: c.businessName.trim() || t("scout.defaultBusinessName"),
      businessType: c.businessType.trim() || undefined,
      note: c.suggestedNote.trim() || undefined,
    }));

    scoutImport.mutate(
      { leads: toImport },
      {
        onSuccess: (res) => {
          handleClose();
          if (res.createdLeads.length === 1) {
            onOpenLead(res.createdLeads[0].id);
          }
        },
      }
    );
  };

  const selectableCount = candidates.filter(
    (c) =>
      !c.alreadyInCrm &&
      !c.alreadyCustomerBusiness &&
      isValidScoutPhone(c.phone)
  ).length;

  return (
    <Drawer open={open} onOpenChange={(next) => !next && handleClose()}>
      <DrawerContent>
        <DrawerHeader className="border-b border-slate-100/80 px-6 pb-4 pt-6">
          <div className="flex items-center gap-2.5 pr-10">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <Compass className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <DrawerTitle className="text-xl font-bold text-slate-900">
                {t("scout.title")}
              </DrawerTitle>
              <p className="text-sm text-slate-500">{t("scout.subtitle")}</p>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <SegmentedControl
              label={t("scout.modeLabel")}
              variant="tabs"
              value={mode}
              onChange={setMode}
              options={[
                { id: "PLACES", label: t("scout.modePlaces") },
                { id: "TEXT", label: t("scout.modeText") },
              ]}
            />

            <form onSubmit={handleSearch} className="space-y-3">
              {mode === "PLACES" ? (
                <Input
                  label={t("scout.placesQueryLabel")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("scout.placesQueryPlaceholder")}
                  maxLength={200}
                  required
                />
              ) : (
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    {t("scout.rawTextLabel")}
                  </span>
                  <Textarea
                    rows={4}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={t("scout.rawTextPlaceholder")}
                    maxLength={8000}
                    required
                  />
                </label>
              )}

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <IndustrySelect
                    id="scout-default-industry"
                    label={t("scout.defaultIndustryLabel")}
                    name="defaultBusinessType"
                    value={defaultBusinessType}
                    onChange={setDefaultBusinessType}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={scoutSearch.isPending}
                  isLoading={scoutSearch.isPending}
                  className="h-11 rounded-xl px-5"
                >
                  {mode === "PLACES" ? (
                    <Search className="mr-2 h-4 w-4" aria-hidden />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" aria-hidden />
                  )}
                  {scoutSearch.isPending
                    ? t("scout.searching")
                    : mode === "PLACES"
                      ? t("scout.searchButton")
                      : t("scout.extractButton")}
                </Button>
              </div>
            </form>

            {candidates.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      {t("scout.resultsTitle", { count: candidates.length })}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {t("scout.editHint")}
                    </p>
                  </div>
                  {selectableCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (validSelectedCandidates.length === selectableCount) {
                          setSelectedIds(new Set());
                        } else {
                          setSelectedIds(
                            new Set(
                              candidates
                                .filter(
                                  (c) =>
                                    !c.alreadyInCrm &&
                                    !c.alreadyCustomerBusiness &&
                                    isValidScoutPhone(c.phone)
                                )
                                .map((c) => c.localId)
                            )
                          );
                        }
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      {validSelectedCandidates.length === selectableCount
                        ? t("scout.deselectAll")
                        : t("scout.selectAll")}
                    </button>
                  )}
                </div>

                <ul className="space-y-3">
                  {candidates.map((candidate) => {
                    const disabled =
                      candidate.alreadyInCrm ||
                      candidate.alreadyCustomerBusiness;
                    const phoneValid = isValidScoutPhone(candidate.phone);
                    const checked =
                      selectedIds.has(candidate.localId) && phoneValid;

                    return (
                      <li
                        key={candidate.localId}
                        className={cn(
                          "rounded-2xl border p-3.5 transition-colors",
                          disabled
                            ? "border-slate-200 bg-slate-50/70 opacity-75"
                            : checked
                              ? "border-indigo-300 bg-indigo-50/40"
                              : "border-slate-200 bg-white/80"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => toggleCandidate(candidate.localId)}
                            className="mt-1 text-indigo-600 disabled:text-slate-300"
                          >
                            {checked ? (
                              <CheckSquare className="h-5 w-5" aria-hidden />
                            ) : (
                              <Square className="h-5 w-5" aria-hidden />
                            )}
                          </button>

                          <div className="min-w-0 flex-1 space-y-2.5">
                            {/* Encabezado de estado y calificación */}
                            {(candidate.rating !== null ||
                              candidate.alreadyInCrm ||
                              candidate.alreadyCustomerBusiness ||
                              candidate.address) && (
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                {candidate.address ? (
                                  <p className="flex items-center gap-1 text-xs text-slate-500">
                                    <MapPin
                                      className="h-3 w-3 shrink-0"
                                      aria-hidden
                                    />
                                    <span className="truncate">
                                      {candidate.address}
                                    </span>
                                  </p>
                                ) : (
                                  <span />
                                )}

                                <div className="flex items-center gap-1.5">
                                  {candidate.rating !== null && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                      <Star
                                        className="h-3 w-3 fill-amber-400 text-amber-500"
                                        aria-hidden
                                      />
                                      {candidate.rating}
                                    </span>
                                  )}
                                  {candidate.alreadyInCrm && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        if (candidate.existingLeadId) {
                                          handleClose();
                                          onOpenLead(candidate.existingLeadId);
                                        }
                                      }}
                                      className="h-7 rounded-full px-2.5 text-xs"
                                    >
                                      {t("scout.alreadyInCrm")}
                                    </Button>
                                  )}
                                  {candidate.alreadyCustomerBusiness && (
                                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                                      {t("scout.alreadyCustomer")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Campos editables de la tarjeta */}
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <label className="block space-y-0.5">
                                <span className="text-[11px] font-medium text-slate-500">
                                  {t("detail.businessName")}
                                </span>
                                <input
                                  type="text"
                                  disabled={disabled}
                                  value={candidate.businessName}
                                  onChange={(e) =>
                                    updateCandidateField(
                                      candidate.localId,
                                      "businessName",
                                      e.target.value
                                    )
                                  }
                                  maxLength={120}
                                  className="w-full rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 disabled:bg-slate-100"
                                />
                              </label>

                              <label className="block space-y-0.5">
                                <span className="text-[11px] font-medium text-slate-500">
                                  {t("create.phone")}
                                </span>
                                <input
                                  type="tel"
                                  disabled={disabled}
                                  value={candidate.phone}
                                  onChange={(e) =>
                                    updateCandidateField(
                                      candidate.localId,
                                      "phone",
                                      e.target.value
                                    )
                                  }
                                  maxLength={25}
                                  className={cn(
                                    "w-full rounded-lg border bg-white px-2.5 py-1.5 text-xs font-medium tabular-nums text-slate-800 outline-none disabled:bg-slate-100",
                                    phoneValid
                                      ? "border-slate-200/90 focus:border-indigo-500"
                                      : "border-amber-400 focus:border-amber-500"
                                  )}
                                />
                              </label>

                              <label className="block space-y-0.5">
                                <span className="text-[11px] font-medium text-slate-500">
                                  {t("create.name")}
                                </span>
                                <input
                                  type="text"
                                  disabled={disabled}
                                  value={candidate.name}
                                  placeholder={t("scout.contactNamePlaceholder")}
                                  onChange={(e) =>
                                    updateCandidateField(
                                      candidate.localId,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  maxLength={80}
                                  className="w-full rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 disabled:bg-slate-100"
                                />
                              </label>

                              <label className="block space-y-0.5">
                                <span className="text-[11px] font-medium text-slate-500">
                                  {t("detail.businessType")}
                                </span>
                                <input
                                  type="text"
                                  disabled={disabled}
                                  value={candidate.businessType}
                                  onChange={(e) =>
                                    updateCandidateField(
                                      candidate.localId,
                                      "businessType",
                                      e.target.value
                                    )
                                  }
                                  maxLength={80}
                                  className="w-full rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 disabled:bg-slate-100"
                                />
                              </label>
                            </div>

                            {!disabled && (
                              <label className="block space-y-0.5">
                                <span className="text-[11px] font-medium text-slate-500">
                                  {t("create.note")}
                                </span>
                                <input
                                  type="text"
                                  value={candidate.suggestedNote}
                                  onChange={(e) =>
                                    updateCandidateField(
                                      candidate.localId,
                                      "suggestedNote",
                                      e.target.value
                                    )
                                  }
                                  maxLength={2000}
                                  className="w-full rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500"
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100/80 px-6 py-4">
            <Button type="button" variant="ghost" onClick={handleClose}>
              {t("detail.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={
                validSelectedCandidates.length === 0 || scoutImport.isPending
              }
              isLoading={scoutImport.isPending}
              className="ml-auto rounded-full px-5"
            >
              {scoutImport.isPending
                ? t("scout.importing")
                : t("scout.importButton", {
                    count: validSelectedCandidates.length,
                  })}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
