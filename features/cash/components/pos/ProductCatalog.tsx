"use client";
/**
 * Productos de Caja · Vender (docs/caja-pos.md): buscador, categorías y la
 * vista lista o grilla.
 *
 * - Lista: la misma fila del drawer de Nuevo pedido (`ProductRow`).
 * - Grilla: tarjeta con foto, nombre, precio y +. Solo si algún producto de
 *   la sede tiene foto; si no, queda deshabilitada con la explicación.
 * - Enter en el buscador agrega el único resultado (lector de código de
 *   barras que escribe y envía Enter).
 */
import { forwardRef, useState } from "react";
import { useTranslations } from "next-intl";
import { LayoutGrid, List, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ProductRow,
  QuantityStepper,
  maxQuantity,
  productLabel,
} from "@/features/orders/components/ProductRow";
import { formatCurrency } from "@/features/orders/utils/order-status.utils";
import type { OrderComposer } from "@/features/orders/hooks/useOrderComposer";
import type { InventoryItem } from "@/features/branch-inventory/types";
import {
  readProductView,
  saveProductView,
  type ProductView,
} from "./pos-storage";

interface ProductCatalogProps {
  composer: OrderComposer;
}

export const ProductCatalog = forwardRef<HTMLInputElement, ProductCatalogProps>(
  function ProductCatalog({ composer }, searchRef) {
    const t = useTranslations("cash.pos");
    const tOrder = useTranslations("orders.createOrder");
    const {
      products,
      isLoadingProducts,
      hasProductImages,
      categories,
      visibleProducts,
      search,
      setSearch,
      categoryId,
      setCategoryId,
      cart,
      setQuantity,
    } = composer;

    // Con fotos arranca en grilla (o en lo último que eligió el cajero); sin
    // fotos siempre lista, como el drawer de Nuevo pedido.
    const [pickedView, setPickedView] = useState<ProductView | null>(() =>
      readProductView()
    );
    const view: ProductView = hasProductImages
      ? (pickedView ?? "grid")
      : "list";
    const pickView = (next: ProductView) => {
      setPickedView(next);
      saveProductView(next);
    };

    const quantityOf = (item: InventoryItem) =>
      cart[item.productVariantId]?.quantity ?? 0;
    const add = (item: InventoryItem) =>
      setQuantity(item, quantityOf(item) + 1);

    const handleSearchKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      if (visibleProducts.length === 1) {
        add(visibleProducts[0]);
        setSearch("");
      }
    };

    return (
      <section className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              ref={searchRef}
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleSearchKey}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="pl-9"
            />
          </div>
          <div
            role="group"
            aria-label={t("view.label")}
            className="inline-flex shrink-0 gap-1 rounded-card border border-slate-100 bg-white p-1"
          >
            <ViewButton
              active={view === "list"}
              label={t("view.list")}
              onClick={() => pickView("list")}
            >
              <List className="h-4 w-4" />
            </ViewButton>
            <ViewButton
              active={view === "grid"}
              label={hasProductImages ? t("view.grid") : t("view.gridDisabled")}
              disabled={!hasProductImages}
              onClick={() => pickView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </ViewButton>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex shrink-0 gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <CategoryChip
              label={tOrder("allCategories")}
              active={!categoryId}
              onClick={() => setCategoryId(null)}
            />
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                label={category.name}
                active={categoryId === category.id}
                onClick={() => setCategoryId(category.id)}
              />
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin">
          {isLoadingProducts ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-card" />
              ))}
            </div>
          ) : visibleProducts.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              {products.length === 0
                ? tOrder("noProducts")
                : tOrder("noResults")}
            </p>
          ) : view === "list" ? (
            <div className="space-y-2" data-testid="pos-product-list">
              {visibleProducts.map((item) => (
                <ProductRow
                  key={item.productVariantId}
                  item={item}
                  quantity={quantityOf(item)}
                  onChange={(quantity) => setQuantity(item, quantity)}
                  addLabel={tOrder("add")}
                  removeLabel={tOrder("remove")}
                />
              ))}
            </div>
          ) : (
            <div
              className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3"
              data-testid="pos-product-grid"
            >
              {visibleProducts.map((item) => (
                <ProductTile
                  key={item.productVariantId}
                  item={item}
                  quantity={quantityOf(item)}
                  onChange={(quantity) => setQuantity(item, quantity)}
                  addLabel={tOrder("add")}
                  removeLabel={tOrder("remove")}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }
);

function ViewButton({
  active,
  label,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-indigo-100 text-indigo-700"
          : "text-slate-500 hover:bg-slate-100"
      )}
    >
      {children}
    </button>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-slate-900 text-white"
          : "bg-white/80 text-slate-700 hover:bg-slate-100"
      )}
    >
      {label}
    </button>
  );
}

function ProductTile({
  item,
  quantity,
  onChange,
  addLabel,
  removeLabel,
}: {
  item: InventoryItem;
  quantity: number;
  onChange: (quantity: number) => void;
  addLabel: string;
  removeLabel: string;
}) {
  const name = productLabel(item);
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-card border bg-white/70 transition-colors",
        quantity > 0 ? "border-indigo-300" : "border-slate-100"
      )}
    >
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= maxQuantity(item)}
        aria-label={`${addLabel} ${name}`}
        className="block aspect-4/3 w-full bg-slate-100 disabled:cursor-not-allowed"
      >
        {item.productImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.productImage}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-slate-400">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </button>
      {quantity > 0 && (
        <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-bold text-white tabular-nums">
          {quantity}
        </span>
      )}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-semibold text-slate-900">
          {name}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2">
          <p className="text-sm font-bold tabular-nums text-slate-700">
            {formatCurrency(item.effectivePrice)}
          </p>
          {quantity === 0 && (
            <button
              type="button"
              onClick={() => onChange(1)}
              aria-label={`${addLabel} ${name}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-icon bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* En la tarjeta el control va a lo ancho: al lado del precio no
            cabe en columnas angostas. */}
        {quantity > 0 && (
          <QuantityStepper
            name={name}
            quantity={quantity}
            onChange={onChange}
            maxReached={quantity >= maxQuantity(item)}
            addLabel={addLabel}
            removeLabel={removeLabel}
            size="sm"
            className="w-full justify-between"
          />
        )}
      </div>
    </div>
  );
}
