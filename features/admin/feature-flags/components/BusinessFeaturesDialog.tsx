"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BusinessFeaturesPanel } from "./BusinessFeaturesPanel";

interface BusinessFeaturesDialogProps {
  business: { id: string; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

/** Funcionalidades de un negocio, abierto desde el listado de negocios. */
export function BusinessFeaturesDialog({
  business,
  isOpen,
  onClose,
}: BusinessFeaturesDialogProps) {
  const t = useTranslations("admin-feature-flags");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t("dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("dialog.description", { businessName: business?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[65vh] overflow-y-auto p-7 pt-0">
          {business && <BusinessFeaturesPanel businessId={business.id} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
