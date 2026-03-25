"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderDetailContainer } from "./OrderDetailContainer";
import { OrderDetailContent } from "./OrderDetailContent";
import type { OrderDetailTranslations } from "./OrderDetailContainer";

interface OrderDetailDialogBaseProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

/**
 * Props for using OrderDetailDialog within next-intl context (orders routes)
 * Uses useTranslations internally
 */
interface OrderDetailDialogWithIntlProps extends OrderDetailDialogBaseProps {
  translations?: never;
}

/**
 * Props for using OrderDetailDialog outside next-intl context (customer routes)
 * Requires translations to be passed as props
 */
interface OrderDetailDialogWithTranslationsProps extends OrderDetailDialogBaseProps {
  translations: OrderDetailTranslations;
}

type OrderDetailDialogProps = 
  | OrderDetailDialogWithIntlProps 
  | OrderDetailDialogWithTranslationsProps;

/**
 * Type guard to check if translations are provided
 */
function hasTranslations(
  props: OrderDetailDialogProps
): props is OrderDetailDialogWithTranslationsProps {
  return 'translations' in props && props.translations !== undefined;
}

/**
 * OrderDetailDialog - Reusable dialog for displaying order details
 * 
 * USAGE:
 * 
 * 1. Within orders routes (next-intl context available):
 *    <OrderDetailDialog
 *      orderId="..."
 *      isOpen={isOpen}
 *      onClose={handleClose}
 *      title="Order Details"
 *    />
 * 
 * 2. Outside orders routes (e.g., customer detail page):
 *    <OrderDetailDialog
 *      orderId="..."
 *      isOpen={isOpen}
 *      onClose={handleClose}
 *      title="Order Details"
 *      translations={translations}  // Required!
 *    />
 * 
 * For customer routes, you can use CustomerOrderDetailDialog which wraps
 * this component and provides the translations automatically.
 */
export function OrderDetailDialog(props: OrderDetailDialogProps) {
  const { orderId, isOpen, onClose, title = "Detalle de Orden" } = props;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white/95 backdrop-blur-lg sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4">
          {hasTranslations(props) ? (
            // Outside next-intl context - use content directly with provided translations
            <OrderDetailContent 
              orderId={orderId} 
              onClose={onClose} 
              translations={props.translations}
            />
          ) : (
            // Within next-intl context - use container to get translations
            <OrderDetailContainer orderId={orderId} onClose={onClose} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Re-export types for consumers
export type { OrderDetailTranslations };
