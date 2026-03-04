/**
 * API Route: Refresh Access Token
 * 
 * Uses the httpOnly cookie to refresh tokens
 * Returns new access token to client
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/v1";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("togo_refresh_token")?.value;

    console.log("[API /auth/refresh] Attempting refresh...");
    console.log("[API /auth/refresh] Cookie present:", !!refreshToken);
    
    if (!refreshToken) {
      console.log("[API /auth/refresh] No refresh token in cookie");
      return NextResponse.json(
        { error: "No refresh token found" },
        { status: 401 }
      );
    }

    console.log("[API /auth/refresh] Token length:", refreshToken.length);
    console.log("[API /auth/refresh] Calling backend...");

    // Call backend refresh endpoint with full token
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    console.log("[API /auth/refresh] Backend status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("[API /auth/refresh] Backend error:", errorText);
      
      // Clear invalid cookie
      cookieStore.delete("togo_refresh_token");
      return NextResponse.json(
        { error: "Invalid refresh token", details: errorText },
        { status: 401 }
      );
    }

    const data = await response.json();
    console.log("[API /auth/refresh] Success, new token received");

    // Update cookie with new refresh token
    cookieStore.set({
      name: "togo_refresh_token",
      value: data.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    // Return new access token
    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      user: data.user,
    });
  } catch (error) {
    console.error("[API /auth/refresh] Error:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}
