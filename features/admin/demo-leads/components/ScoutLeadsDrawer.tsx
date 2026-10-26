"use client";

/**
 * ScoutLeadsDrawer — Agente Harvey Scout (Buscador y extractor de prospectos).
 *
 * Permite buscar posibles clientes por rubro + ciudad (Google Places) o
 * extraerlos con IA pegando texto libre (directorios, Instagram, Maps),
 * deduplicando teléfonos contra el Mini CRM antes de sumarlos al tablero.
 */

import * as React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  CheckSquare,
  Compass,
  FileText,
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
  const [candidates, setCandidates] = useState<ScoutProspectCandidate[]>([]);
  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set());

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
          setCandidates(res.candidates);
          const selectable = new Set(
            res.candidates
              .filter((c) => !c.alreadyInCrm && !c.alreadyCustomerBusiness)
              .map((c) => c.phone)
          );
          setSelectedPhones(selectable);
        },
      }
    );
  };

  const toggleCandidate = (phone: string) => {
    setSelectedPhones((prev) => {
      const next = new Set(prev);
      if (next.has(phone)) {
        next.delete(phone);
      } else {
        next.add(phone);
      }
      return next;
    });
  };

  const updateCandidateNote = (phone: string, note: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.phone === phone ? { ...c, suggestedNote: note } : c))
    );
  };

  const handleImport = () => {
    const toImport = candidates
      .filter((c) => selectedPhones.has(c.phone))
      .map((c) => ({
        name: c.name || undefined,
        phone: c.phone,
        businessName: c.businessName,
        businessType: c.businessType,
        note: c.suggestedNote,
      }));

    if (toImport.length === 0) return;

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
    (c) => !c.alreadyInCrm && !c.alreadyCustomerBusiness
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
                  <h3 className="text-sm font-semibold text-slate-800">
                    {t("scout.resultsTitle", { count: candidates.length })}
                  </h3>
                  {selectableCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedPhones.size === selectableCount) {
                          setSelectedPhones(new Set());
                        } else {
                          setSelectedPhones(
                            new Set(
                              candidates
                                .filter(
                                  (c) =>
                                    !c.alreadyInCrm &&
                                    !c.alreadyCustomerBusiness
                                )
                                .map((c) => c.phone)
                            )
                          );
                        }
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      {selectedPhones.size === selectableCount
                        ? t("scout.deselectAll")
                        : t("scout.selectAll")}
                    </button>
                  )}
                </div>

                <ul className="space-y-2.5">
                  {candidates.map((candidate) => {
                    const disabled =
                      candidate.alreadyInCrm ||
                      candidate.alreadyCustomerBusiness;
                    const checked = selectedPhones.has(candidate.phone);

                    return (
                      <li
                        key={candidate.phone}
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
                            onClick={() => toggleCandidate(candidate.phone)}
                            className="mt-0.5 text-indigo-600 disabled:text-slate-300"
                          >
                            {checked ? (
                              <CheckSquare className="h-5 w-5" aria-hidden />
                            ) : (
                              <Square className="h-5 w-5" aria-hidden />
                            )}
                          </button>
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  {candidate.businessName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {candidate.businessType} ·{" "}
                                  <span className="tabular-nums font-medium text-slate-700">
                                    {candidate.formattedPhone}
                                  </span>
                                </p>
                              </div>

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

                            {candidate.address && (
                              <p className="flex items-center gap-1 text-xs text-slate-500">
                                <MapPin
                                  className="h-3 w-3 shrink-0"
                                  aria-hidden
                                />
                                <span className="truncate">
                                  {candidate.address}
                                </span>
                              </p>
                            )}

                            {!disabled && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <FileText
                                  className="h-3.5 w-3.5 shrink-0 text-slate-400"
                                  aria-hidden
                                />
                                <input
                                  type="text"
                                  value={candidate.suggestedNote}
                                  onChange={(e) =>
                                    updateCandidateNote(
                                      candidate.phone,
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border border-slate-200/80 bg-white/90 px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-indigo-400"
                                />
                              </div>
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
              disabled={selectedPhones.size === 0 || scoutImport.isPending}
              isLoading={scoutImport.isPending}
              className="ml-auto rounded-full px-5"
            >
              {scoutImport.isPending
                ? t("scout.importing")
                : t("scout.importButton", { count: selectedPhones.size })}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
