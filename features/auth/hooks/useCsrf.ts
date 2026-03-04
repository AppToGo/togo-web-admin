"use client";

/**
 * CSRF Protection Hook
 * 
 * Use this hook to get a CSRF token for protecting critical operations.
 * 
 * Example usage:
 * ```typescript
 * function DeleteBusinessButton() {
 *   const { csrfToken, isLoading, getCsrfToken } = useCsrf();
 *   
 *   const handleDelete = async () => {
 *     const token = await getCsrfToken();
 *     await deleteBusiness({ csrfToken: token });
 *   };
 *   
 *   return (
 *     <Button onClick={handleDelete} disabled={isLoading}>
 *       {isLoading ? "Loading..." : "Delete Business"}
 *     </Button>
 *   );
 * }
 * ```
 */

import { useState, useCallback } from "react";

interface UseCsrfReturn {
  csrfToken: string | null;
  isLoading: boolean;
  error: Error | null;
  getCsrfToken: () => Promise<string | null>;
}

export function useCsrf(): UseCsrfReturn {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getCsrfToken = useCallback(async (): Promise<string | null> => {
    // Return cached token if available
    if (csrfToken) {
      return csrfToken;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/csrf", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch CSRF token");
      }

      const data = await response.json();
      setCsrfToken(data.csrfToken);
      return data.csrfToken;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [csrfToken]);

  return {
    csrfToken,
    isLoading,
    error,
    getCsrfToken,
  };
}
