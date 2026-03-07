"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import { UseMutationResult } from "@tanstack/react-query"

interface ToastMutationOptions<TData, TError, TVariables> {
  successMessage?: string
  errorMessage?: string | ((error: TError) => string)
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: TError, variables: TVariables) => void
}

export function useToastMutation<TData, TError extends Error, TVariables>(
  mutation: UseMutationResult<TData, TError, TVariables, unknown>,
  options: ToastMutationOptions<TData, TError, TVariables> = {}
) {
  const { successMessage, errorMessage, onSuccess, onError } = options

  const mutate = useCallback(
    (variables: TVariables, customOptions?: ToastMutationOptions<TData, TError, TVariables>) => {
      const mergedOptions = { ...options, ...customOptions }
      
      return mutation.mutate(variables, {
        onSuccess: (data) => {
          if (mergedOptions.successMessage) {
            toast.success(mergedOptions.successMessage)
          }
          mergedOptions.onSuccess?.(data, variables)
        },
        onError: (error) => {
          const message = typeof mergedOptions.errorMessage === "function"
            ? mergedOptions.errorMessage(error)
            : mergedOptions.errorMessage || error.message || "Ha ocurrido un error"
          
          toast.error(message)
          mergedOptions.onError?.(error, variables)
        },
      })
    },
    [mutation, successMessage, errorMessage, onSuccess, onError]
  )

  return {
    ...mutation,
    mutate,
    mutateAsync: mutation.mutateAsync,
  }
}

export function showSuccessToast(message: string) {
  toast.success(message)
}

export function showErrorToast(message: string) {
  toast.error(message)
}

export function showWarningToast(message: string) {
  toast.warning(message)
}

export function showInfoToast(message: string) {
  toast.info(message)
}
