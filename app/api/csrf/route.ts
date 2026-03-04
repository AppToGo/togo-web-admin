/**
 * CSRF Token API Route
 * 
 * Generates and returns a CSRF token for protecting against cross-site
 * request forgery attacks on sensitive operations.
 * 
 * SECURITY: The CSRF token is cryptographically signed and bound to:
 * - The user's session (via refresh token cookie)
 * - User ID (extracted from the session)
 * 
 * This prevents token reuse across sessions or users.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

const CSRF_SECRET = process.env.CSRF_SECRET || "your-csrf-secret-min-32-chars-long!";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Generate a CSRF token bound to a specific user session
 * Format: userId:timestamp:signature
 */
function generateCsrfToken(userId: string): string {
  const timestamp = Date.now();
  const data = `${userId}:${timestamp}`;
  
  // Sign with HMAC-SHA256
  const signature = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(data)
    .digest("hex");
  
  // Return as base64 to make it URL-safe
  const token = Buffer.from(`${data}:${signature}`).toString("base64url");
  return token;
}

/**
 * Validate a refresh token and extract user info
 * This ensures CSRF token is bound to an active session
 */
async function validateSession(refreshToken: string): Promise<{ userId: string } | null> {
  try {
    // Call backend to validate refresh token and get user info
    const response = await fetch(`${API_BASE_URL}/auth/validate-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return { userId: data.userId };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("togo_refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No active session" },
        { status: 401 }
      );
    }

    // Validate session and get user ID
    // This binds CSRF token to the specific user session
    const session = await validateSession(refreshToken);
    
    if (!session) {
      // Invalid or expired session
      cookieStore.delete("togo_refresh_token");
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    // Generate CSRF token bound to this user
    const csrfToken = generateCsrfToken(session.userId);
    
    // Store CSRF token in cookie (for server-side validation)
    cookieStore.set({
      name: "togo_csrf_token",
      value: csrfToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    // Return token in response for client-side use
    return NextResponse.json({ csrfToken });
  } catch (error) {
    console.error("Error generating CSRF token:", error);
    return NextResponse.json(
      { error: "Failed to generate CSRF token" },
      { status: 500 }
    );
  }
}

/**
 * Verify a CSRF token
 * This should be called by protected API routes
 */
export function verifyCsrfToken(token: string, userId: string): boolean {
  try {
    // Decode from base64url
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [tokenUserId, timestamp, signature] = decoded.split(":");
    
    // Check user ID matches
    if (tokenUserId !== userId) {
      return false;
    }
    
    // Check token hasn't expired (1 hour)
    const tokenTime = parseInt(timestamp, 10);
    if (Date.now() - tokenTime > 60 * 60 * 1000) {
      return false;
    }
    
    // Verify signature
    const data = `${tokenUserId}:${timestamp}`;
    const expectedSignature = crypto
      .createHmac("sha256", CSRF_SECRET)
      .update(data)
      .digest("hex");
    
    return signature === expectedSignature;
  } catch {
    return false;
  }
}
