import { NextRequest, NextResponse } from "next/server";

const GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json";

// Server-side key — no NEXT_PUBLIC prefix, never sent to the browser.
// Use IP restriction or no restriction in Google Cloud Console.
const GEOCODING_KEY = process.env.GOOGLE_MAPS_GEOCODING_KEY;

export async function GET(request: NextRequest) {
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
