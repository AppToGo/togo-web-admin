import { NextRequest, NextResponse } from "next/server";

const GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json";

// Server-side key — no NEXT_PUBLIC prefix, never sent to the browser.
// Use IP restriction or no restriction in Google Cloud Console.
const GEOCODING_KEY = process.env.GOOGLE_MAPS_GEOCODING_KEY;

// Ver la nota en app/api/auth/refresh/route.ts: preferir la red interna de
// Docker/Swarm para llamadas servidor-a-servidor.
const API_BASE_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000/v1";

/**
 * Solo usuarios con sesión: sin esto la ruta era un proxy abierto a la
 * Geocoding API, y cualquiera podía gastar la cuota de Google del negocio.
 * Valida el access token (el mismo que manda el admin al API) contra un
 * endpoint autenticado del backend.
 */
async function hasValidSession(authorization: string): Promise<"ok" | "invalid" | "error"> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me/permissions`, {
      headers: { Authorization: authorization },
      cache: "no-store",
    });
    if (res.ok) return "ok";
    return res.status === 401 || res.status === 403 ? "invalid" : "error";
  } catch {
    return "error";
  }
}

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }
  const session = await hasValidSession(authorization);
  if (session === "invalid") {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
  if (session === "error") {
    return NextResponse.json({ error: "Failed to validate session" }, { status: 502 });
  }

  const address = request.nextUrl.searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  if (!GEOCODING_KEY) {
    return NextResponse.json(
      { error: "Geocoding not configured" },
      { status: 503 }
    );
  }

  const params = new URLSearchParams({
    address,
    region: "co",
    components: "country:CO",
    language: "es",
    key: GEOCODING_KEY,
  });

  try {
    const res = await fetch(`${GEOCODING_URL}?${params.toString()}`);

    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }
}
