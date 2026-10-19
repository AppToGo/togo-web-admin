"use client";
/**
 * Página de Caja por sede (docs/caja-pedidos.md). Desde docs/caja-pos.md
 * es un punto de venta para el cajero: el contenido vive en `CashPosPage`.
 */
import { useBranch } from "@/features/branches/hooks/useBranches";
import { CashTimeZoneProvider } from "../utils/cash-time";
import { CashPosPage } from "./pos/CashPosPage";

interface CashPageProps {
  businessId: string;
  branchId: string;
}

/** Provee la zona horaria de la sede a toda la pantalla de Caja. */
export function CashPage(props: CashPageProps) {
  const { data: branch } = useBranch(props.branchId, true);
  return (
    <CashTimeZoneProvider timeZone={branch?.timezone}>
      <CashPosPage {...props} />
    </CashTimeZoneProvider>
  );
}
