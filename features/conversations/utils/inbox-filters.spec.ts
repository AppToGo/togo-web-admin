/**
 * Tests for inbox-filters (vista + período → query params).
 *
 * NOTA: el repo aún no tiene runner unitario (sin vitest instalado ni script
 * `test:unit`); estos tests corren cuando se agregue. Verificación manual en
 * su lugar: tsc + eslint.
 */

import { describe, it, expect } from "vitest";
import {
  DEFAULT_INBOX_FILTERS,
  inboxFiltersToParams,
} from "./inbox-filters";
import type { InboxFiltersValue } from "../types";

const CUSTOM_DAY = {
  preset: "custom",
  range: { from: "2026-10-01", to: "2026-10-01" },
} as const;

describe("inboxFiltersToParams", () => {
  it("filtros por defecto: sin params (Todos, todas las fechas)", () => {
    expect(inboxFiltersToParams(DEFAULT_INBOX_FILTERS)).toEqual({});
  });

  it("mapea cada vista a sus params", () => {
    const view = (v: InboxFiltersValue["view"]): InboxFiltersValue => ({
      view: v,
      date: null,
    });
    expect(inboxFiltersToParams(view("all"))).toEqual({});
    expect(inboxFiltersToParams(view("waiting"))).toEqual({
      control: ["PENDING_HUMAN"],
    });
    expect(inboxFiltersToParams(view("mine"))).toEqual({ assignedTo: "me" });
    expect(inboxFiltersToParams(view("unassigned"))).toEqual({
      control: ["HUMAN"],
      assignedTo: "unassigned",
    });
  });

  it("un preset no-custom manda el día local completo en ISO", () => {
    const params = inboxFiltersToParams({
      view: "all",
      date: { preset: "today", range: { from: "2000-01-01", to: "2000-01-01" } },
    });
    // El rango guardado se ignora: el preset se recalcula al día de hoy.
    const from = new Date(params.dateFrom!);
    const to = new Date(params.dateTo!);
    expect(from.getHours()).toBe(0);
    expect(from.getMinutes()).toBe(0);
    expect(to.getTime() - from.getTime()).toBe(24 * 3_600_000 - 1);
  });

  it("un rango custom respeta sus bordes como día local completo", () => {
    const params = inboxFiltersToParams({
      view: "waiting",
      date: { preset: "custom", range: { ...CUSTOM_DAY.range } },
    });
    expect(params.control).toEqual(["PENDING_HUMAN"]);
    const from = new Date(params.dateFrom!);
    const to = new Date(params.dateTo!);
    expect([from.getFullYear(), from.getMonth(), from.getDate()]).toEqual([
      2026, 9, 1,
    ]);
    expect(to.getTime() - from.getTime()).toBe(24 * 3_600_000 - 1);
  });

  it("un rango malformado ignora la fecha en vez de romper", () => {
    const params = inboxFiltersToParams({
      view: "all",
      date: { preset: "custom", range: { from: "no-fecha", to: "2026-02-30" } },
    });
    expect(params.dateFrom).toBeUndefined();
    expect(params.dateTo).toBeUndefined();
  });
});
