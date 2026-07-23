import { useQuery } from "@tanstack/react-query";
import { getImportJob } from "../services/import.service";
import type { ImportJob } from "../types/import.types";

const POLLING_STATUSES = new Set(["PENDING", "PROCESSING", "CONFIRMING"]);

// FIX P: stop polling after 5 minutes to avoid infinite polling on stuck jobs
const POLLING_TIMEOUT_MS = 5 * 60 * 1000;

export const importJobKeys = {
  all: ["product-import"] as const,
  job: (businessId: string, jobId: string) =>
    [...importJobKeys.all, businessId, jobId] as const,
  jobs: (businessId: string) =>
    [...importJobKeys.all, businessId] as const,
};

export function useImportJob(businessId: string, jobId: string | null) {
  return useQuery<ImportJob>({
    queryKey: importJobKeys.job(businessId, jobId ?? ""),
    queryFn: () => getImportJob(businessId, jobId!),
    enabled: !!businessId && !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || !POLLING_STATUSES.has(status)) return false;
      // Preferir startedAt (referencia de "inicio de esta fase", refrescada al
      // pasar a PROCESSING o CONFIRMING) sobre createdAt: si el admin tardó en
      // revisar los items antes de confirmar, createdAt puede ser de hace rato
      // y cortaría el polling de inmediato.
      const referenceTimestamp = query.state.data?.startedAt ?? query.state.data?.createdAt;
      if (referenceTimestamp) {
        const elapsed = Date.now() - new Date(referenceTimestamp).getTime();
        if (elapsed > POLLING_TIMEOUT_MS) return false;
      }
      return 1500;
    },
  });
}
