/**
 * Tests for Metrics CVA Variants
 */

import {
  metricCardVariants,
  rankingItemVariants,
  rankBadgeVariants,
  progressBarContainerVariants,
  progressBarFillVariants,
  metricValueVariants,
  metricIconContainerVariants,
  metricIconColorVariants,
  metricHeaderVariants,
} from "../variants";

describe("Metrics Variants", () => {
  describe("metricCardVariants", () => {
    it("should generate base classes", () => {
      const result = metricCardVariants({});
      expect(result).toContain("relative");
      expect(result).toContain("overflow-hidden");
    });

    it("should apply size variants", () => {
      const sm = metricCardVariants({ size: "sm" });
      const md = metricCardVariants({ size: "md" });
      const lg = metricCardVariants({ size: "lg" });

      expect(sm).toContain("p-4");
      expect(md).toContain("p-5");
      expect(lg).toContain("p-6");
    });

    it("should apply glass variant by default", () => {
      const result = metricCardVariants({});
      expect(result).toContain("rounded-card-xl");
      expect(result).toContain("bg-white/30");
      expect(result).toContain("backdrop-blur-xl");
      expect(result).toContain("border-white/40");
    });

    it("should apply glass variant explicitly", () => {
      const result = metricCardVariants({ variantType: "glass" });
      expect(result).toContain("rounded-card-xl");
      expect(result).toContain("bg-white/30");
      expect(result).toContain("backdrop-blur-xl");
      expect(result).toContain("border-white/40");
    });

    it("should apply gradient variant for indigo", () => {
      const result = metricCardVariants({
        variantType: "gradient",
        colorScheme: "indigo",
      });
      expect(result).toContain("bg-gradient-indigo-purple");
      expect(result).toContain("rounded-card-lg");
      expect(result).toContain("shadow-card");
      expect(result).toContain("text-white");
    });

    it("should apply gradient variant for emerald", () => {
      const result = metricCardVariants({
        variantType: "gradient",
        colorScheme: "emerald",
      });
      expect(result).toContain("bg-gradient-emerald-teal");
      expect(result).toContain("text-white");
    });

    it("should apply gradient variant for amber", () => {
      const result = metricCardVariants({
        variantType: "gradient",
        colorScheme: "amber",
      });
      expect(result).toContain("bg-gradient-orange-amber");
      expect(result).toContain("text-white");
    });

    it("should apply gradient variant for blue", () => {
      const result = metricCardVariants({
        variantType: "gradient",
        colorScheme: "blue",
      });
      expect(result).toContain("bg-gradient-blue-cyan");
      expect(result).toContain("text-white");
    });

    it("should apply gradient variant for purple", () => {
      const result = metricCardVariants({
        variantType: "gradient",
        colorScheme: "purple",
      });
      expect(result).toContain("bg-gradient-purple-indigo");
      expect(result).toContain("text-white");
    });

    it("should apply border for glass variant with header", () => {
      const result = metricCardVariants({
        variantType: "glass",
        showHeaderBorder: true,
      });
      expect(result).toContain("border-slate-100");
    });
  });

  describe("rankingItemVariants", () => {
    it("should generate base classes", () => {
      const result = rankingItemVariants({});
      expect(result).toContain("flex");
      expect(result).toContain("items-center");
      expect(result).toContain("justify-between");
    });

    it("should apply clickable styles", () => {
      const result = rankingItemVariants({ isClickable: true });
      expect(result).toContain("cursor-pointer");
      expect(result).toContain("hover:bg-slate-50");
    });

    it("should apply size variants", () => {
      const sm = rankingItemVariants({ size: "sm" });
      const md = rankingItemVariants({ size: "md" });
      const lg = rankingItemVariants({ size: "lg" });

      expect(sm).toContain("p-2");
      expect(md).toContain("p-3");
      expect(lg).toContain("p-4");
    });
  });

  describe("rankBadgeVariants", () => {
    it("should apply gold styling for rank 1", () => {
      const result = rankBadgeVariants({ rank: 1 });
      expect(result).toContain("bg-amber-100");
      expect(result).toContain("text-amber-700");
    });

    it("should apply silver styling for rank 2", () => {
      const result = rankBadgeVariants({ rank: 2 });
      expect(result).toContain("bg-slate-100");
      expect(result).toContain("text-slate-700");
    });

    it("should apply bronze styling for rank 3", () => {
      const result = rankBadgeVariants({ rank: 3 });
      expect(result).toContain("bg-orange-100");
      expect(result).toContain("text-orange-700");
    });

    it("should apply default styling for other ranks", () => {
      const result = rankBadgeVariants({ rank: "other" });
      expect(result).toContain("bg-slate-50");
      expect(result).toContain("text-slate-600");
    });
  });

  describe("progressBarContainerVariants", () => {
    it("should generate base classes", () => {
      const result = progressBarContainerVariants({});
      expect(result).toContain("rounded-full");
      expect(result).toContain("bg-slate-100");
    });

    it("should apply size variants", () => {
      const sm = progressBarContainerVariants({ size: "sm" });
      const md = progressBarContainerVariants({ size: "md" });
      const lg = progressBarContainerVariants({ size: "lg" });

      expect(sm).toContain("h-1");
      expect(md).toContain("h-1.5");
      expect(lg).toContain("h-2");
    });
  });

  describe("progressBarFillVariants", () => {
    it("should apply color variants", () => {
      expect(progressBarFillVariants({ color: "blue" })).toContain(
        "bg-blue-500"
      );
      expect(progressBarFillVariants({ color: "purple" })).toContain(
        "bg-purple-500"
      );
      expect(progressBarFillVariants({ color: "emerald" })).toContain(
        "bg-emerald-500"
      );
    });

    it("should include transition classes", () => {
      const result = progressBarFillVariants({});
      expect(result).toContain("transition-all");
      expect(result).toContain("duration-500");
    });
  });

  describe("metricValueVariants", () => {
    it("should apply size variants", () => {
      const sm = metricValueVariants({ size: "sm" });
      const md = metricValueVariants({ size: "md" });
      const lg = metricValueVariants({ size: "lg" });

      expect(sm).toContain("text-xl");
      expect(md).toContain("text-2xl");
      expect(lg).toContain("text-3xl");
    });

    it("should apply color scheme variants", () => {
      expect(metricValueVariants({ colorScheme: "emerald" })).toContain(
        "text-emerald-600"
      );
      expect(metricValueVariants({ colorScheme: "indigo" })).toContain(
        "text-indigo-600"
      );
      expect(metricValueVariants({ colorScheme: "white" })).toContain(
        "text-white"
      );
    });
  });

  describe("metricIconContainerVariants", () => {
    it("should generate correct container structure", () => {
      const result = metricIconContainerVariants({});
      expect(result).toContain("w-12");
      expect(result).toContain("h-12");
      expect(result).toContain("rounded-full");
    });

    it("should apply color scheme backgrounds", () => {
      expect(metricIconContainerVariants({ colorScheme: "indigo" })).toContain(
        "bg-indigo-100"
      );
      expect(metricIconContainerVariants({ colorScheme: "emerald" })).toContain(
        "bg-emerald-100"
      );
    });
  });

  describe("metricIconColorVariants", () => {
    it("should apply color scheme text colors", () => {
      expect(metricIconColorVariants({ colorScheme: "indigo" })).toContain(
        "text-indigo-600"
      );
      expect(metricIconColorVariants({ colorScheme: "amber" })).toContain(
        "text-amber-600"
      );
      expect(metricIconColorVariants({ colorScheme: "white" })).toContain(
        "text-white"
      );
    });
  });

  describe("metricHeaderVariants", () => {
    it("should generate base header classes", () => {
      const result = metricHeaderVariants({});
      expect(result).toContain("flex");
      expect(result).toContain("items-center");
      expect(result).toContain("justify-between");
      expect(result).toContain("border-b");
    });

    it("should apply variant styles", () => {
      const defaultVariant = metricHeaderVariants({ variant: "default" });
      const lightVariant = metricHeaderVariants({ variant: "light" });

      expect(defaultVariant).toContain("border-slate-100");
      expect(lightVariant).toContain("border-white/20");
    });
  });
});
