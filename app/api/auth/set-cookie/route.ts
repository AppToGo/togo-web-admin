/**
 * API Route: Set Refresh Token Cookie
 * 
 * Stores the refresh token in an httpOnly cookie
 * This is secure because it runs server-side
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    console.log("[API /auth/set-cookie] Setting cookie...");
    console.log("[API /auth/set-cookie] Token length:", refreshToken?.length);
    console.log("[API /auth/set-cookie] Token format:");
    
    if (refreshToken) {
      // Check token format
      const parts = refreshToken.split('.');
      console.log("[API /auth/set-cookie] Number of parts (separated by dots):", parts.length);
      console.log("[API /auth/set-cookie] Part lengths:", parts.map((p: string) => p.length));
      
      // Backend format should be: jwt.header.jwt.payload.jwt.signature.randomString
      // So 4 parts: [jwtHeader, jwtPayload, jwtSignature, randomString]
      if (parts.length === 4) {
        console.log("[API /auth/set-cookie] Token has expected format (JWT + random)");
      } else if (parts.length === 3) {
        console.log("[API /auth/set-cookie] Token is standard JWT only (no random part)");
      }
    }

    if (!refreshToken) {
      console.log("[API /auth/set-cookie] ERROR: No refresh token provided");
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }

    // Set httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "togo_refresh_token",
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    console.log("[API /auth/set-cookie] Cookie set successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /auth/set-cookie] Error:", error);
    return NextResponse.json(
      { error: "Failed to set cookie" },
      { status: 500 }
    );
  }
}
