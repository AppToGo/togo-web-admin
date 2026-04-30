interface GoogleGeocodeResponse {
  status: string;
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
}

/**
 * Geocodes a free-text address query via the internal /api/geocode route,
 * which proxies Google Geocoding API restricted to Colombia.
 *
 * Using a server-side proxy avoids the "referer restriction" error that occurs
 * when calling the Geocoding API directly from the browser with an HTTP-referrer-
 * restricted key.
 *
 * @returns A [lat, lng] tuple when a result is found, or null otherwise.
 */
export async function geocodeAddress(
  query: string
): Promise<[number, number] | null> {
  try {
    const params = new URLSearchParams({ address: query });
    const res = await fetch(`/api/geocode?${params.toString()}`);

    if (!res.ok) {
      return null;
    }

    const data: GoogleGeocodeResponse = await res.json();

    if (data.status !== "OK" || data.results.length === 0) {
      return null;
    }

    const { lat, lng } = data.results[0].geometry.location;
    return [lat, lng];
  } catch {
    return null;
  }
}
