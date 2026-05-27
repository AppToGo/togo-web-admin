import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  uploadImportFile,
  updateImportItem,
  deleteImportItem,
} from "../services/import.service";
import { importJobKeys } from "./useImportJob";
import type { UpdateImportItemDto } from "../types/import.types";

export function useUploadImportFile(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadImportFile(businessId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importJobKeys.jobs(businessId) });
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Error al subir el archivo";
      toast.error(message);
    },
  });
}

export function useUpdateImportItem(businessId: string, jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      dto,
    }: {
      itemId: string;
      dto: UpdateImportItemDto;
    }) => updateImportItem(businessId, jobId, itemId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: importJobKeys.job(businessId, jobId),
      });
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Error al actualizar el producto";
      toast.error(message);
    },
  });
}

export function useDeleteImportItem(businessId: string, jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => deleteImportItem(businessId, jobId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: importJobKeys.job(businessId, jobId),
      });
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Error al eliminar el producto";
      toast.error(message);
    },
  });
}

