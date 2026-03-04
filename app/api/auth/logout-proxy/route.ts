/**
 * API Route: Logout Proxy
 * 
 * Calls backend logout with the httpOnly cookie
 * CRITICAL: Always clears cookies even if backend call fails
 * to prevent inconsistent state.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("togo_refresh_token")?.value;
  const csrfToken = cookieStore.get("togo_csrf_token")?.value;

  // Try to revoke token on backend
  // Use try/finally to ensure we ALWAYS clear cookies
  try {
    if (refreshToken) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch (error) {
    // Log but don't throw - we still want to clear cookies
    console.warn("Backend logout failed (token might already be expired):", error);
  } finally {
    // ALWAYS clear cookies, regardless of backend success
    // This prevents the "zombie session" problem
    cookieStore.delete("togo_refresh_token");
    cookieStore.delete("togo_csrf_token");
    
    // Also clear any other auth-related cookies
    cookieStore.delete("togo_session");
  }

  // Always return success - client should proceed with local cleanup
  return NextResponse.json({ 
    success: true,
    message: "Logged out successfully"
  });
}
