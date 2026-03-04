/**
 * API Route: Refresh Access Token
 * 
 * Uses the httpOnly cookie to refresh tokens
 * Returns new access token to client
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("togo_refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token found" },
        { status: 401 }
      );
    }

    // Call backend refresh endpoint
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Clear invalid cookie
      cookieStore.delete("togo_refresh_token");
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    const data = await response.json();

    // Update cookie with new refresh token
    cookieStore.set({
      name: "togo_refresh_token",
      value: data.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // Return new access token (refresh token stays in cookie)
    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      user: data.user,
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}
