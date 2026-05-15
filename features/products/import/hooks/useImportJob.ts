import { useQuery } from "@tanstack/react-query";
import { getImportJob } from "../services/import.service";
import type { ImportJob } from "../types/import.types";

const POLLING_STATUSES = new Set(["PENDING", "PROCESSING"]);

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
      return status && POLLING_STATUSES.has(status) ? 1500 : false;
    },
  });
}
