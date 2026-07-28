/**
 * API Route: Logout
 *
 * Single atomic endpoint that revokes the refresh token on the backend
 * AND clears all auth cookies in the same response.
 *
 * The try/finally guarantees cookies are always cleared regardless of
 * backend availability — prevents "zombie session" state.
 *
 * Replaces the former two-step dance of:
 *   POST /api/auth/logout-proxy  (revoke)
 *   POST /api/auth/clear-cookie  (clear cookie)
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Ver la nota en app/api/auth/refresh/route.ts: preferir la red interna de
// Docker/Swarm para llamadas servidor-a-servidor, que el Managed Challenge
// de Cloudflare bloquea si se usa el dominio público.
const API_BASE_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000/v1";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("togo_refresh_token")?.value;

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
    // Log but don't throw — cookies must be cleared regardless
    console.warn("Backend logout failed (token might already be expired):", error);
  } finally {
    cookieStore.delete("togo_refresh_token");
    cookieStore.delete("togo_csrf_token");
    cookieStore.delete("togo_session");
  }

  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
