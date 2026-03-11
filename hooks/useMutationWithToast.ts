"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import { UseMutationResult } from "@tanstack/react-query"
import { getHumanizedErrorMessage } from "@/lib/error.utils"

interface ToastMutationOptions<TData, TError, TVariables> {
  successMessage?: string | ((data: TData, variables: TVariables) => string)
  errorMessage?: string | ((error: TError) => string)
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: TError, variables: TVariables) => void
}

/**
 * Hook helper para envolver mutaciones de React Query con notificaciones toast
 * 
 * Ejemplo de uso:
 * ```tsx
 * const mutation = useUpdateOrderStatus()
 * const { mutate } = useMutationWithToast(mutation, {
 *   successMessage: (data) => `Orden actualizada: ${data.id}`,
 *   errorMessage: (error) => error.message
 * })
 * ```
 */
export function useMutationWithToast<TData, TError extends Error, TVariables>(
  mutation: UseMutationResult<TData, TError, TVariables, unknown>,
  options: ToastMutationOptions<TData, TError, TVariables> = {}
) {
  const { successMessage, errorMessage, onSuccess, onError } = options

  const mutate = useCallback(
    (
      variables: TVariables,
      customOptions?: ToastMutationOptions<TData, TError, TVariables>
    ) => {
      const mergedOptions = { ...options, ...customOptions }

      return mutation.mutate(variables, {
        onSuccess: (data) => {
          if (mergedOptions.successMessage) {
            const message =
              typeof mergedOptions.successMessage === "function"
                ? mergedOptions.successMessage(data, variables)
                : mergedOptions.successMessage
            toast.success(message)
          }
          mergedOptions.onSuccess?.(data, variables)
        },
        onError: (error) => {
          if (mergedOptions.errorMessage) {
            const message =
              typeof mergedOptions.errorMessage === "function"
                ? mergedOptions.errorMessage(error)
                : mergedOptions.errorMessage
            toast.error(message)
          }
          mergedOptions.onError?.(error, variables)
        },
      })
    },
    [mutation, successMessage, errorMessage, onSuccess, onError]
  )

  return {
    ...mutation,
    mutate,
  }
}

/**
 * Función helper para ejecutar una acción con toast
 * 
 * Ejemplo:
 * ```tsx
 * await withToast(
 *   () => api.updateOrder(id, data),
 *   { successMessage: "Orden actualizada", errorMessage: "Error al actualizar" }
 * )
 * ```
 */
export async function withToast<T>(
  action: () => Promise<T>,
  options: {
    successMessage?: string
    errorMessage?: string
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  } = {}
): Promise<T | undefined> {
  const { successMessage, errorMessage, onSuccess, onError } = options

  try {
    const result = await action()
    if (successMessage) {
      toast.success(successMessage)
    }
    onSuccess?.(result)
    return result
  } catch (error) {
    const humanizedMessage = getHumanizedErrorMessage(error)
    toast.error(errorMessage || humanizedMessage)
    onError?.(error as Error)
    return undefined
  }
}
