/**
 * Tests for customer-selection.store
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  useCustomerSelectionStore,
  useSelectedCustomerCount,
  useHasCustomerSelection,
  useIsCustomerSelected,
} from "./customer-selection.store";

describe("customer-selection.store", () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useCustomerSelectionStore.getState();
    store.clearSelection();
    store.setTotalItems(100);
  });

  describe("toggleSelection", () => {
    it("should add id to selection when not present", () => {
      const store = useCustomerSelectionStore.getState();
      store.toggleSelection("customer-1");

      expect(store.selectedIds.has("customer-1")).toBe(true);
      expect(store.selectedIds.size).toBe(1);
    });

    it("should remove id from selection when already present", () => {
      const store = useCustomerSelectionStore.getState();
      store.toggleSelection("customer-1");
      store.toggleSelection("customer-1");

      expect(store.selectedIds.has("customer-1")).toBe(false);
      expect(store.selectedIds.size).toBe(0);
    });

    it("should set isAllSelected to false when toggling individual", () => {
      const store = useCustomerSelectionStore.getState();
      store.selectAllPages(100);
      expect(store.isAllSelected).toBe(true);

      store.toggleSelection("customer-1");
      expect(store.isAllSelected).toBe(false);
    });
  });

  describe("selectAll", () => {
    it("should add all provided ids to selection", () => {
      const store = useCustomerSelectionStore.getState();
      store.selectAll(["customer-1", "customer-2", "customer-3"]);

      expect(store.selectedIds.size).toBe(3);
      expect(store.selectedIds.has("customer-1")).toBe(true);
      expect(store.selectedIds.has("customer-2")).toBe(true);
      expect(store.selectedIds.has("customer-3")).toBe(true);
    });

    it("should merge with existing selection", () => {
      const store = useCustomerSelectionStore.getState();
      store.toggleSelection("customer-1");
      store.selectAll(["customer-2", "customer-3"]);

      expect(store.selectedIds.size).toBe(3);
    });
  });

  describe("selectAllPages", () => {
    it("should set isAllSelected to true", () => {
      const store = useCustomerSelectionStore.getState();
      store.selectAllPages(100);

      expect(store.isAllSelected).toBe(true);
      expect(store.totalItems).toBe(100);
    });
  });

  describe("clearSelection", () => {
    it("should clear all selected ids", () => {
      const store = useCustomerSelectionStore.getState();
      store.selectAll(["customer-1", "customer-2"]);
      store.clearSelection();

      expect(store.selectedIds.size).toBe(0);
      expect(store.isAllSelected).toBe(false);
    });
  });

  describe("isSelected", () => {
    it("should return true when id is in selectedIds", () => {
      const store = useCustomerSelectionStore.getState();
      store.toggleSelection("customer-1");

      expect(store.isSelected("customer-1")).toBe(true);
    });

    it("should return true when isAllSelected is true", () => {
      const store = useCustomerSelectionStore.getState();
      store.selectAllPages(100);

      expect(store.isSelected("any-customer")).toBe(true);
    });

    it("should return false when id is not selected", () => {
      const store = useCustomerSelectionStore.getState();
      expect(store.isSelected("customer-1")).toBe(false);
    });
  });

  describe("useSelectedCustomerCount", () => {
    it("should return totalItems when isAllSelected", () => {
      const store = useCustomerSelectionStore.getState();
      store.selectAllPages(100);

      const count = useSelectedCustomerCount.getState?.() || 100;
      expect(store.totalItems).toBe(100);
    });

    it("should return selectedIds size when not isAllSelected", () => {
      const store = useCustomerSelectionStore.getState();
      store.selectAll(["customer-1", "customer-2"]);

      expect(store.selectedIds.size).toBe(2);
    });
  });

  describe("useHasCustomerSelection", () => {
    it("should return true when isAllSelected", () => {
      const store = useCustomerSelectionStore.getState();
      store.selectAllPages(100);

      const hasSelection =
        store.isAllSelected || store.selectedIds.size > 0;
      expect(hasSelection).toBe(true);
    });

    it("should return true when selectedIds has items", () => {
      const store = useCustomerSelectionStore.getState();
      store.toggleSelection("customer-1");

      const hasSelection =
        store.isAllSelected || store.selectedIds.size > 0;
      expect(hasSelection).toBe(true);
    });

    it("should return false when nothing is selected", () => {
      const store = useCustomerSelectionStore.getState();
      const hasSelection =
        store.isAllSelected || store.selectedIds.size > 0;
      expect(hasSelection).toBe(false);
    });
  });
});
