/**
 * API Route: Clear Refresh Token Cookie
 * 
 * Removes the refresh token cookie on logout
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("togo_refresh_token");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing cookie:", error);
    return NextResponse.json(
      { error: "Failed to clear cookie" },
      { status: 500 }
    );
  }
}
