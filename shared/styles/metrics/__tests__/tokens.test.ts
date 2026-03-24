/**
 * Tests for Metrics Tokens
 */

import {
  metricColors,
  rankingColors,
  metricSpacing,
  metricRadius,
  metricShadows,
  metricTypography,
  progressBarTokens,
  metricTransitions,
  headerTokens,
  getRankingColor,
  getProgressBarColor,
} from "../tokens";

describe("Metric Tokens", () => {
  describe("metricColors", () => {
    it("should have all required color schemes", () => {
      expect(metricColors).toHaveProperty("indigo");
      expect(metricColors).toHaveProperty("emerald");
      expect(metricColors).toHaveProperty("amber");
      expect(metricColors).toHaveProperty("blue");
      expect(metricColors).toHaveProperty("purple");
      expect(metricColors).toHaveProperty("slate");
      expect(metricColors).toHaveProperty("cyan");
    });

    it("each color scheme should have required properties", () => {
      Object.values(metricColors).forEach((scheme) => {
        expect(scheme).toHaveProperty("bg");
        expect(scheme).toHaveProperty("text");
        expect(scheme).toHaveProperty("icon");
        expect(scheme).toHaveProperty("fill");
        expect(scheme).toHaveProperty("gradient");
      });
    });
  });

  describe("rankingColors", () => {
    it("should have medal colors", () => {
      expect(rankingColors).toHaveProperty("gold");
      expect(rankingColors).toHaveProperty("silver");
      expect(rankingColors).toHaveProperty("bronze");
      expect(rankingColors).toHaveProperty("default");
    });

    it("medal colors should have correct Tailwind classes", () => {
      expect(rankingColors.gold.icon).toBe("text-amber-500");
      expect(rankingColors.silver.icon).toBe("text-slate-400");
      expect(rankingColors.bronze.icon).toBe("text-orange-400");
    });
  });

  describe("metricSpacing", () => {
    it("should have spacing definitions", () => {
      expect(metricSpacing.card).toBeDefined();
      expect(metricSpacing.gap).toBeDefined();
      expect(metricSpacing.item).toBeDefined();
    });

    it("should have size variants", () => {
      expect(metricSpacing.card).toHaveProperty("sm");
      expect(metricSpacing.card).toHaveProperty("md");
      expect(metricSpacing.card).toHaveProperty("lg");
    });
  });

  describe("metricRadius", () => {
    it("should use correct CSS variable classes", () => {
      expect(metricRadius.sm).toBe("rounded-card-sm");
      expect(metricRadius.md).toBe("rounded-card");
      expect(metricRadius.lg).toBe("rounded-card-lg");
      expect(metricRadius.xl).toBe("rounded-card-xl");
    });
  });

  describe("metricShadows", () => {
    it("should use correct shadow classes", () => {
      expect(metricShadows.sm).toBe("shadow-card-sm");
      expect(metricShadows.md).toBe("shadow-card");
      expect(metricShadows.lg).toBe("shadow-card-md");
      expect(metricShadows.xl).toBe("shadow-card-lg");
    });
  });

  describe("progressBarTokens", () => {
    it("should have height variants", () => {
      expect(progressBarTokens.height.sm).toBe("h-1");
      expect(progressBarTokens.height.md).toBe("h-1.5");
      expect(progressBarTokens.height.lg).toBe("h-2");
    });

    it("should have color variants", () => {
      expect(progressBarTokens.colors.blue).toBe("bg-blue-500");
      expect(progressBarTokens.colors.emerald).toBe("bg-emerald-500");
    });
  });

  describe("headerTokens", () => {
    it("should have correct header styling", () => {
      expect(headerTokens.default).toContain("border-b");
      expect(headerTokens.default).toContain("border-slate-100");
      expect(headerTokens.title).toContain("uppercase");
      expect(headerTokens.title).toContain("tracking-wide");
    });
  });

  describe("getRankingColor", () => {
    it("should return gold colors for position 1", () => {
      const colors = getRankingColor(1);
      expect(colors.bg).toBe("bg-amber-100");
      expect(colors.text).toBe("text-amber-700");
      expect(colors.icon).toBe("text-amber-500");
    });

    it("should return silver colors for position 2", () => {
      const colors = getRankingColor(2);
      expect(colors.bg).toBe("bg-slate-100");
      expect(colors.text).toBe("text-slate-700");
      expect(colors.icon).toBe("text-slate-400");
    });

    it("should return bronze colors for position 3", () => {
      const colors = getRankingColor(3);
      expect(colors.bg).toBe("bg-orange-100");
      expect(colors.text).toBe("text-orange-700");
      expect(colors.icon).toBe("text-orange-400");
    });

    it("should return default colors for other positions", () => {
      const colors = getRankingColor(4);
      expect(colors.bg).toBe("bg-slate-50");
      expect(colors.text).toBe("text-slate-600");
      expect(colors.icon).toBe("text-slate-400");
    });
  });

  describe("getProgressBarColor", () => {
    it("should return correct color classes", () => {
      expect(getProgressBarColor("blue")).toBe("bg-blue-500");
      expect(getProgressBarColor("purple")).toBe("bg-purple-500");
      expect(getProgressBarColor("amber")).toBe("bg-amber-500");
      expect(getProgressBarColor("cyan")).toBe("bg-cyan-500");
      expect(getProgressBarColor("emerald")).toBe("bg-emerald-500");
    });
  });
});
