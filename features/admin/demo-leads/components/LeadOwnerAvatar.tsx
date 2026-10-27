"use client";

/**
 * Responsable del lead como avatar. Sin responsable, un "+" para asignarlo.
 * Quien puede asignar (ve todos los leads y los gestiona) abre el selector al
 * hacer clic; el resto solo ve el avatar.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { usePlatformPermissions } from "@/features/auth/hooks/usePlatformPermission";
import { LeadOwnerDialog } from "./LeadOwnerDialog";

interface LeadOwnerAvatarProps {
  lead: {
    id: string;
    name?: string | null;
    ownerUserId?: string | null;
    ownerName?: string | null;
  };
  /** Muestra el nombre junto al avatar (ficha del lead). */
  showName?: boolean;
  className?: string;
}

export function LeadOwnerAvatar({ lead, showName = false, className }: LeadOwnerAvatarProps) {
  const t = useTranslations("admin-demo-leads");
  const { can } = usePlatformPermissions();
  const canAssign = can("platform.leads.view_all") && can("platform.leads.manage");
  const [isOpen, setIsOpen] = useState(false);

  const hasOwner = !!lead.ownerUserId;
  if (!hasOwner && !canAssign) return null;

  const label = hasOwner
    ? t("owner.current", { name: lead.ownerName ?? "" })
    : t("owner.add");

  const avatar = hasOwner ? (
    <InitialsAvatar name={lead.ownerName} seed={lead.ownerUserId!} size="xs" />
  ) : (
    <span
      aria-hidden
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 transition-colors group-hover/owner:border-indigo-400 group-hover/owner:text-indigo-600"
    >
      <Plus className="h-3.5 w-3.5" />
    </span>
  );

  const content = (
    <>
      {avatar}
      {showName && (
        <span className={cn("truncate text-sm", hasOwner ? "text-slate-900" : "text-slate-500")}>
          {hasOwner ? lead.ownerName : t("owner.add")}
        </span>
      )}
    </>
  );

  if (!canAssign) {
    return (
      <span title={label} className={cn("flex items-center gap-2", className)}>
        {content}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        title={label}
        aria-label={label}
        onClick={(e) => {
          // En la tarjeta del tablero, no abrir la ficha
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={cn("group/owner flex items-center gap-2 rounded-full", className)}
      >
        {content}
      </button>
      {isOpen && (
        // Los eventos de React cruzan el portal del modal: sin esto, un clic
        // adentro llegaría a la tarjeta del tablero y abriría la ficha.
        <span
          className="contents"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <LeadOwnerDialog lead={lead} isOpen onClose={() => setIsOpen(false)} />
        </span>
      )}
    </>
  );
}
