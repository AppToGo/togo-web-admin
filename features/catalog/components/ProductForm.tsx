"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Package,
  Plus,
  Trash2,
  AlertCircle,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VariantList } from "./VariantList";
import { useIndustryCategoryVariantTemplates } from "../hooks";
import { useVariants } from "../hooks/useCatalog";
import { useBranches } from "@/features/branches/hooks/useBranches";
import {
  useBranchInventory,
  useActivateProduct,
  useDeactivateProduct,
} from "@/features/branch-inventory/hooks/useBranchInventory";
import { VariantBranchRow } from "@/features/branch-inventory/components/VariantBranchRow";
import type {
  CatalogProduct,
  BusinessCategory,
  CreateProductDto,
  UpdateCatalogProductDto,
  ProductVariant,
} from "../types/catalog.types";
import { generateSlug } from "../utils/slug";

const SELECT_NONE = "__none__" as const;
const SELECT_DISABLED = "__disabled__" as const;

// ─── Public types ─────────────────────────────────────────────────────────────

export interface VariantActivation {
  variantLabel: string;
  isAvailable: boolean;
  priceOverride?: number;
}

export interface BranchActivation {
  branchId: string;
  variants: VariantActivation[];
}

// ─── Internal state types ─────────────────────────────────────────────────────

interface SelectedVariant {
  templateId: string;
  label: string;
  attributes: Record<string, string | number>;
  price: number;
}

interface VariantBranchConfig {
  enabled: boolean;
  priceOverride: string;
}

interface BranchActivationState {
  enabled: boolean;
  simplePriceOverride: string;
  variants: Record<string, VariantBranchConfig>; // key = templateId
}

export interface ProductFormProps {
  product?: CatalogProduct | null;
  businessId: string;
  categories: BusinessCategory[];
  onSubmit: (
    data: CreateProductDto | UpdateCatalogProductDto,
    branchActivations?: BranchActivation[]
  ) => void;
  onCancel: () => void;
  isLoading?: boolean;
  showProductImages?: boolean;
  defaultTab?: "info" | "variants" | "branches";
}

// ─── Edit mode: collapsible branch section ────────────────────────────────────

interface BranchActivationSectionProps {
  businessId: string;
  branchId: string;
  productId: string;
  productName: string;
  branchName: string;
  isMainBranch: boolean;
  variants: ProductVariant[];
}

function BranchActivationSection({
  businessId,
  branchId,
  productId,
  productName,
  branchName,
  isMainBranch,
  variants,
}: BranchActivationSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: inventory } = useBranchInventory(businessId, branchId, {
    search: productName,
    limit: 50,
  });

  const variantIds = useMemo(() => new Set(variants.map((v) => v.id)), [variants]);

  const inventoryByVariantId = useMemo(() => {
    const map = new Map<string, import("@/features/branch-inventory/types").InventoryItem>();
    for (const item of inventory?.items ?? []) {
      if (variantIds.has(item.productVariantId)) {
        map.set(item.productVariantId, item);
      }
    }
    return map;
  }, [inventory, variantIds]);

  const activatedCount = inventoryByVariantId.size;
  const isAnyActivated = activatedCount > 0;

  const activateMutation = useActivateProduct(businessId, branchId);
  const deactivateMutation = useDeactivateProduct(businessId, branchId);

  const handleToggleAll = (enable: boolean) => {
    if (enable) {
      Promise.allSettled(
        variants
          .filter((v) => !inventoryByVariantId.has(v.id))
          .map((v) =>
            activateMutation.mutateAsync({ productId: v.id, data: { isAvailable: true } })
          )
      );
      setIsExpanded(true);
    } else {
      Promise.allSettled(
        variants
          .filter((v) => inventoryByVariantId.has(v.id))
          .map((v) => deactivateMutation.mutateAsync(v.id))
      );
    }
  };

  const isBusy = activateMutation.isPending || deactivateMutation.isPending;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 bg-slate-50 cursor-pointer select-none"
        onClick={() => setIsExpanded((p) => !p)}
      >
        <Switch
          checked={isAnyActivated}
          onCheckedChange={handleToggleAll}
          disabled={isBusy}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{branchName}</p>
          {isMainBranch && <span className="text-xs text-indigo-600">Principal</span>}
        </div>
        <span className="text-xs text-slate-400 shrink-0">
          {activatedCount}/{variants.length} variantes
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 shrink-0 transition-transform",
            isExpanded && "rotate-180"
          )}
        />
      </div>

      {isExpanded && (
        <div className="divide-y border-t">
          {variants.map((variant) => (
            <VariantBranchRow
              key={variant.id}
              businessId={businessId}
              branchId={branchId}
              variant={variant}
              inventoryItem={inventoryByVariantId.get(variant.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Edit mode: branches tab ──────────────────────────────────────────────────

function BranchActivationTab({
  businessId,
  productId,
  productName,
}: {
  businessId: string;
  productId: string;
  productName: string;
}) {
  const { data: variants = [], isLoading: variantsLoading } = useVariants(
    businessId,
    productId
  );
  const { data: branches = [], isLoading: branchesLoading } = useBranches();

  if (variantsLoading || branchesLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-14 animate-pulse bg-slate-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>
          Este producto no tiene variantes. Creá al menos una variante antes de
          activarlo en sedes.
        </span>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <p className="text-sm text-slate-500 bg-slate-50 border rounded-lg px-3 py-2.5">
        No hay sedes configuradas para este negocio.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 mb-3">
        Activá el producto en cada sede y configurá precios por variante. Podés
        desactivar variantes específicas en sedes donde no se vendan.
      </p>
      {branches.map((branch) => (
        <BranchActivationSection
          key={branch.id}
          businessId={businessId}
          branchId={branch.id}
          productId={productId}
          productName={productName}
          branchName={branch.name}
          isMainBranch={branch.isMainBranch}
          variants={variants}
        />
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ProductForm({
  product,
  businessId,
  categories,
  onSubmit,
  onCancel,
  isLoading = false,
  showProductImages = true,
  defaultTab = "info",
}: ProductFormProps) {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const isEditing = !!product;

  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    businessCategoryId: "",
    industryCategoryId: "",
    isActive: true,
    isFeatured: false,
  });

  // Pricing mode
  const [pricingMode, setPricingMode] = useState<"simple" | "variants">("simple");
  const [simplePrice, setSimplePrice] = useState<string>("");

  // Confirmed variant rows
  const [selectedVariants, setSelectedVariants] = useState<SelectedVariant[]>([]);

  // "Add row" pending state
  const [pendingTemplateId, setPendingTemplateId] = useState<string>("");
  const [pendingPrice, setPendingPrice] = useState<string>("");

  // Branch activation state (create mode)
  const [branchState, setBranchState] = useState<Record<string, BranchActivationState>>({});
  const branchInitRef = useRef(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const initializedProductIdRef = useRef<string | null>(null);

  // Branches
  const { data: branches = [] } = useBranches();

  // Initialize branch state once (create mode)
  useEffect(() => {
    if (!isEditing && branches.length > 0 && !branchInitRef.current) {
      branchInitRef.current = true;
      setBranchState(
        Object.fromEntries(
          branches.map((b) => [
            b.id,
            { enabled: true, simplePriceOverride: "", variants: {} },
          ])
        )
      );
    }
  }, [branches, isEditing]);

  // Parent categories
  const parentCategories = useMemo(() => {
    const seen = new Set<string>();
    const parents: { id: string; name: string }[] = [];
    for (const cat of categories) {
      if (
        cat.industryCategoryId &&
        cat.industryCategoryName &&
        !seen.has(cat.industryCategoryId)
      ) {
        seen.add(cat.industryCategoryId);
        parents.push({ id: cat.industryCategoryId, name: cat.industryCategoryName });
      }
    }
    return parents.sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const filteredSubcategories = useMemo(() => {
    if (!formData.industryCategoryId) return [];
    return categories.filter(
      (c) => c.industryCategoryId === formData.industryCategoryId
    );
  }, [categories, formData.industryCategoryId]);

  const { data: variantTemplates = [], isLoading: loadingTemplates } =
    useIndustryCategoryVariantTemplates(formData.industryCategoryId || null);

  const selectedIds = useMemo(
    () => new Set(selectedVariants.map((v) => v.templateId)),
    [selectedVariants]
  );

  const availableTemplates = useMemo(
    () => variantTemplates.filter((t) => !selectedIds.has(t.id)),
    [variantTemplates, selectedIds]
  );

  // Reset variants when industry category changes
  useEffect(() => {
    setPendingTemplateId("");
    setPendingPrice("");
    setSelectedVariants([]);
    setBranchState((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        next[id] = { ...next[id], variants: {} };
      }
      return next;
    });
  }, [formData.industryCategoryId]);

  // Initialize form when editing
  useEffect(() => {
    if (!product) {
      initializedProductIdRef.current = null;
      return;
    }
    const isNewProduct = initializedProductIdRef.current !== product.id;
    const resolvedIndustryCategoryId =
      product.industryCategoryId ??
      categories.find((c) => c.id === product.businessCategoryId)
        ?.industryCategoryId ??
      "";
    const industryCategoryArrived =
      !formData.industryCategoryId && resolvedIndustryCategoryId;

    if (isNewProduct || industryCategoryArrived) {
      setFormData({
        name: product.name ?? "",
        description: product.description ?? "",
        image: product.image ?? "",
        businessCategoryId: product.businessCategoryId ?? "",
        industryCategoryId: resolvedIndustryCategoryId,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
      });
      setImagePreview(product.image ?? null);
      if (isNewProduct) initializedProductIdRef.current = product.id;
    }
  }, [product, categories, formData.industryCategoryId]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [product?.id, defaultTab]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, image: url }));
    setImagePreview(url || null);
  };

  const updateBranch = (branchId: string, update: Partial<BranchActivationState>) => {
    setBranchState((prev) => ({
      ...prev,
      [branchId]: { ...prev[branchId], ...update },
    }));
  };

  const updateBranchVariant = (
    branchId: string,
    templateId: string,
    update: Partial<VariantBranchConfig>
  ) => {
    setBranchState((prev) => ({
      ...prev,
      [branchId]: {
        ...prev[branchId],
        variants: {
          ...prev[branchId]?.variants,
          [templateId]: {
            ...(prev[branchId]?.variants?.[templateId] ?? {
              enabled: true,
              priceOverride: "",
            }),
            ...update,
          },
        },
      },
    }));
  };

  const addPendingVariant = () => {
    if (!pendingTemplateId) return;
    const tpl = variantTemplates.find((t) => t.id === pendingTemplateId);
    if (!tpl) return;
    const price = parseFloat(pendingPrice) || 0;

    setSelectedVariants((prev) => [
      ...prev,
      { templateId: tpl.id, label: tpl.label, attributes: tpl.attributes, price },
    ]);

    // Add this variant to every branch's config
    setBranchState((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        next[id] = {
          ...next[id],
          variants: {
            ...next[id].variants,
            [tpl.id]: {
              enabled: true,
              priceOverride: price > 0 ? price.toString() : "",
            },
          },
        };
      }
      return next;
    });

    setPendingTemplateId("");
    setPendingPrice("");
  };

  const updateVariantPrice = (templateId: string, price: number) => {
    setSelectedVariants((prev) =>
      prev.map((v) => (v.templateId === templateId ? { ...v, price } : v))
    );
  };

  const removeVariant = (templateId: string) => {
    setSelectedVariants((prev) => prev.filter((v) => v.templateId !== templateId));
    // Remove from all branches
    setBranchState((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        const { [templateId]: _removed, ...rest } = next[id]?.variants ?? {};
        next[id] = { ...next[id], variants: rest };
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      onSubmit({
        name: formData.name,
        description: formData.description || undefined,
        image: formData.image || undefined,
        businessCategoryId: formData.businessCategoryId || undefined,
        industryCategoryId: formData.industryCategoryId || undefined,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
      } as UpdateCatalogProductDto);
      return;
    }

    const base: CreateProductDto = {
      name: formData.name,
      slug: generateSlug(formData.name),
      description: formData.description || undefined,
      image: formData.image || undefined,
      businessCategoryId: formData.businessCategoryId || undefined,
      industryCategoryId: formData.industryCategoryId || undefined,
      isActive: true,
      isFeatured: formData.isFeatured,
    };

    if (pricingMode === "simple") {
      const price = parseFloat(simplePrice);
      if (!isNaN(price) && price >= 0) {
        base.price = price;
        base.kind = "SIMPLE";
      }
    } else {
      const valid = selectedVariants.filter((v) => v.price >= 0);
      if (valid.length > 0) {
        base.inlineVariants = valid.map((v) => ({
          label: v.label,
          price: v.price,
          attributes:
            Object.keys(v.attributes).length > 0 ? v.attributes : undefined,
        }));
        base.kind = "CONFIGURABLE";
      }
    }

    // Build branch activations
    const enabledBranches = Object.entries(branchState).filter(([, s]) => s.enabled);
    let activations: BranchActivation[] | undefined;

    if (enabledBranches.length > 0) {
      if (pricingMode === "simple") {
        activations = enabledBranches.map(([branchId, s]) => ({
          branchId,
          variants: [
            {
              variantLabel: "Unidad",
              isAvailable: true,
              priceOverride: s.simplePriceOverride
                ? parseFloat(s.simplePriceOverride)
                : undefined,
            },
          ],
        }));
      } else if (selectedVariants.length > 0) {
        activations = enabledBranches.map(([branchId, s]) => ({
          branchId,
          variants: selectedVariants.map((sv) => ({
            variantLabel: sv.label,
            isAvailable: s.variants[sv.templateId]?.enabled ?? true,
            priceOverride: (() => {
              const po = s.variants[sv.templateId]?.priceOverride;
              return po ? parseFloat(po) : undefined;
            })(),
          })),
        }));
      }
    }

    onSubmit(base, activations);
  };

  const canSubmit = formData.name.trim().length > 0;

  // ─── Info fields ─────────────────────────────────────────────────────────────

  const infoFields = (
    <>
      {showProductImages && (
        <div className="flex justify-center">
          <div className="relative w-28 h-28 rounded-card-lg bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => setImagePreview(null)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <Package className="w-8 h-8 mb-1" />
                <span className="text-[10px]">{tCommon("status.noImage")}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">
          {t("products.name")} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={t("products.form.namePlaceholder")}
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("products.form.parentCategory")}</Label>
          <Select
            value={formData.industryCategoryId || SELECT_NONE}
            onValueChange={(value) => {
              const newParentId = value === SELECT_NONE ? "" : value;
              const subcatStillValid = categories.some(
                (c) =>
                  c.id === formData.businessCategoryId &&
                  c.industryCategoryId === newParentId
              );
              setFormData((prev) => ({
                ...prev,
                industryCategoryId: newParentId,
                businessCategoryId: subcatStillValid ? prev.businessCategoryId : "",
              }));
            }}
            disabled={isLoading || parentCategories.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("products.form.selectParentCategory")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_NONE}>
                {t("products.form.selectParentCategory")}
              </SelectItem>
              {parentCategories.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{t("products.form.subcategoryOptional")}</Label>
          <Select
            value={formData.businessCategoryId || SELECT_NONE}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                businessCategoryId: value === SELECT_NONE ? "" : value,
              }))
            }
            disabled={
              isLoading ||
              !formData.industryCategoryId ||
              filteredSubcategories.length === 0
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("products.form.selectSubcategory")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_NONE}>
                {t("products.form.selectSubcategory")}
              </SelectItem>
              {filteredSubcategories.length === 0 && formData.industryCategoryId ? (
                <SelectItem value={SELECT_DISABLED} disabled>
                  {t("products.form.noSubcategoriesInParent")}
                </SelectItem>
              ) : (
                filteredSubcategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">{t("products.description")}</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={t("products.form.descriptionPlaceholder")}
          rows={2}
          disabled={isLoading}
        />
      </div>

      {showProductImages && (
        <div className="space-y-1.5">
          <Label htmlFor="image">{t("products.imageUrl")}</Label>
          <Input
            id="image"
            name="image"
            type="url"
            value={formData.image}
            onChange={handleImageChange}
            placeholder={t("products.imagePlaceholder")}
            disabled={isLoading}
          />
        </div>
      )}

      {isEditing && (
        <div className="flex items-center justify-between py-2 border-t">
          <div>
            <p className="text-sm font-medium">{t("products.active") || "Activo"}</p>
            <p className="text-xs text-slate-500">
              {t("products.activeHint") || "Visible en el catálogo"}
            </p>
          </div>
          <Switch
            checked={formData.isActive}
            onCheckedChange={(val) => setFormData((prev) => ({ ...prev, isActive: val }))}
            disabled={isLoading}
          />
        </div>
      )}
    </>
  );

  // ─── Pricing section ─────────────────────────────────────────────────────────

  const pricingSection = (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-slate-900 flex-1">Precio</p>
        <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setPricingMode("simple")}
            className={cn(
              "px-3 py-1 text-xs rounded-md transition-colors font-medium",
              pricingMode === "simple"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Precio único
          </button>
          <button
            type="button"
            onClick={() => setPricingMode("variants")}
            className={cn(
              "px-3 py-1 text-xs rounded-md transition-colors font-medium",
              pricingMode === "variants"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Variantes
          </button>
        </div>
      </div>

      {pricingMode === "simple" ? (
        <div className="space-y-1.5">
          <Label htmlFor="simplePrice">Precio</Label>
          <div className="relative max-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
              $
            </span>
            <Input
              id="simplePrice"
              type="number"
              min={0}
              value={simplePrice}
              onChange={(e) => setSimplePrice(e.target.value)}
              placeholder="0"
              className="pl-6"
              disabled={isLoading}
            />
          </div>
          <p className="text-xs text-slate-500">
            Podés ajustar el precio después desde el listado de variantes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {!formData.industryCategoryId ? (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Seleccioná una categoría para ver las variantes disponibles.</span>
            </div>
          ) : loadingTemplates ? (
            <p className="text-sm text-slate-400 py-1">Cargando variantes…</p>
          ) : variantTemplates.length === 0 ? (
            <p className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5">
              No hay variantes predefinidas para esta categoría.
            </p>
          ) : (
            <>
              {selectedVariants.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_7rem_2rem] gap-2 text-xs text-slate-400 font-medium px-1">
                    <span>Variante</span>
                    <span>Precio base</span>
                    <span />
                  </div>
                  {selectedVariants.map((v) => (
                    <div
                      key={v.templateId}
                      className="grid grid-cols-[1fr_7rem_2rem] gap-2 items-center"
                    >
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 truncate">
                        {v.label}
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                          $
                        </span>
                        <Input
                          type="number"
                          min={0}
                          value={v.price === 0 ? "" : v.price}
                          onChange={(e) =>
                            updateVariantPrice(
                              v.templateId,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          className="pl-5 h-8 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariant(v.templateId)}
                        className="flex items-center justify-center h-8 w-8 text-slate-300 hover:text-red-400 transition-colors rounded-md hover:bg-red-50"
                        tabIndex={-1}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {availableTemplates.length > 0 && <div className="pt-1" />}
                </div>
              )}

              {availableTemplates.length > 0 && (
                <div className="grid grid-cols-[1fr_7rem_auto] gap-2 items-end">
                  <div className="space-y-1">
                    {selectedVariants.length === 0 && (
                      <p className="text-xs text-slate-400 mb-1">
                        Elegí una variante y asignale el precio base
                      </p>
                    )}
                    <Select
                      value={pendingTemplateId || SELECT_NONE}
                      onValueChange={(v) =>
                        setPendingTemplateId(v === SELECT_NONE ? "" : v)
                      }
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Seleccioná una variante" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SELECT_NONE}>
                          Seleccioná una variante
                        </SelectItem>
                        {availableTemplates.map((tpl) => (
                          <SelectItem key={tpl.id} value={tpl.id}>
                            {tpl.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                      $
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={pendingPrice}
                      onChange={(e) => setPendingPrice(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addPendingVariant())
                      }
                      placeholder="0"
                      className="pl-5 h-9 text-sm"
                      disabled={!pendingTemplateId}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 gap-1.5"
                    onClick={addPendingVariant}
                    disabled={!pendingTemplateId}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar
                  </Button>
                </div>
              )}

              {availableTemplates.length === 0 && selectedVariants.length > 0 && (
                <p className="text-xs text-slate-400 text-center py-1">
                  Todas las variantes disponibles ya fueron agregadas.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );

  // ─── Branch section (create mode) ────────────────────────────────────────────

  const branchSection = (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-slate-400" />
        <p className="text-sm font-medium text-slate-900 flex-1">Sedes</p>
        <p className="text-xs text-slate-400">Disponibilidad y precio por sede</p>
      </div>

      {branches.length === 0 ? (
        <p className="text-sm text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5">
          No hay sedes configuradas.
        </p>
      ) : pricingMode === "simple" ? (
        // Simple mode: one price override per branch
        <div className="space-y-2">
          {branches.map((branch) => {
            const state = branchState[branch.id] ?? {
              enabled: true,
              simplePriceOverride: "",
              variants: {},
            };
            return (
              <div
                key={branch.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50"
              >
                <Switch
                  checked={state.enabled}
                  onCheckedChange={(val) => updateBranch(branch.id, { enabled: val })}
                  disabled={isLoading}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {branch.name}
                  </p>
                  {branch.isMainBranch && (
                    <span className="text-xs text-indigo-600">Principal</span>
                  )}
                </div>
                {state.enabled && (
                  <div className="relative w-28 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                      $
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={state.simplePriceOverride}
                      onChange={(e) =>
                        updateBranch(branch.id, { simplePriceOverride: e.target.value })
                      }
                      placeholder="Precio (opc)"
                      className="pl-5 h-8 text-sm"
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : selectedVariants.length === 0 ? (
        // Variants mode but no variants added yet
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Agregá variantes para configurar precios por sede.</span>
        </div>
      ) : (
        // Variants mode: per-variant per-branch pricing
        <div className="space-y-2">
          {branches.map((branch) => {
            const state = branchState[branch.id] ?? {
              enabled: true,
              simplePriceOverride: "",
              variants: {},
            };
            const enabledVariantCount = selectedVariants.filter(
              (sv) => state.variants[sv.templateId]?.enabled !== false
            ).length;

            return (
              <div key={branch.id} className="border rounded-lg overflow-hidden">
                {/* Branch header */}
                <div className="flex items-center gap-3 p-3 bg-slate-50">
                  <Switch
                    checked={state.enabled}
                    onCheckedChange={(val) => updateBranch(branch.id, { enabled: val })}
                    disabled={isLoading}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {branch.name}
                    </p>
                    {branch.isMainBranch && (
                      <span className="text-xs text-indigo-600">Principal</span>
                    )}
                  </div>
                  {state.enabled && (
                    <span className="text-xs text-slate-400 shrink-0">
                      {enabledVariantCount}/{selectedVariants.length} variantes
                    </span>
                  )}
                </div>

                {/* Per-variant rows */}
                {state.enabled && (
                  <div className="divide-y border-t">
                    {selectedVariants.map((sv) => {
                      const varState = state.variants[sv.templateId] ?? {
                        enabled: true,
                        priceOverride: sv.price > 0 ? sv.price.toString() : "",
                      };
                      return (
                        <div
                          key={sv.templateId}
                          className="flex items-center gap-3 px-4 py-2.5 bg-white"
                        >
                          <Switch
                            checked={varState.enabled}
                            onCheckedChange={(val) =>
                              updateBranchVariant(branch.id, sv.templateId, {
                                enabled: val,
                              })
                            }
                            disabled={isLoading}
                          />
                          <span className="flex-1 text-sm text-slate-700 truncate">
                            {sv.label}
                          </span>
                          <span className="text-xs text-slate-400 shrink-0">
                            base: ${sv.price}
                          </span>
                          {varState.enabled && (
                            <div className="relative w-24 shrink-0">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                                $
                              </span>
                              <Input
                                type="number"
                                min={0}
                                value={varState.priceOverride}
                                onChange={(e) =>
                                  updateBranchVariant(branch.id, sv.templateId, {
                                    priceOverride: e.target.value,
                                  })
                                }
                                placeholder="Precio"
                                className="pl-5 h-8 text-xs"
                                disabled={isLoading}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ─── Edit mode: tabbed ────────────────────────────────────────────────────────

  if (isEditing) {
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
        <TabsList className="w-full mx-7" style={{ width: "calc(100% - 3.5rem)" }}>
          <TabsTrigger value="info" className="flex-1">
            {t("products.tabs.info") || "Información"}
          </TabsTrigger>
          <TabsTrigger value="variants" className="flex-1">
            {t("products.tabs.variants") || "Variantes"}
            {product.variantCount > 0 && (
              <span className="ml-1.5 bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full">
                {product.variantCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="branches" className="flex-1">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            {t("products.tabs.branches") || "Sedes"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <form onSubmit={handleSubmit} className="space-y-4 p-7">
            {infoFields}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                {tCommon("buttons.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !canSubmit}
                isLoading={isLoading}
              >
                {tCommon("buttons.saveChanges")}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="variants" className="p-7 pt-4">
          <VariantList
            productId={product.id}
            businessId={businessId}
            schema={product.attributeSchema}
          />
        </TabsContent>

        <TabsContent value="branches" className="p-7 pt-4">
          <BranchActivationTab
            businessId={businessId}
            productId={product.id}
            productName={product.name}
          />
        </TabsContent>
      </Tabs>
    );
  }

  // ─── Create mode ─────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-7">
      {infoFields}
      {pricingSection}
      {branchSection}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {tCommon("buttons.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !canSubmit}
          isLoading={isLoading}
        >
          {t("products.create")}
        </Button>
      </div>
    </form>
  );
}
