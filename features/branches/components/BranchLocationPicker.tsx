"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MapComponent = dynamic(
  () =>
    import("./BranchLocationPickerMap").then(
      (m) => m.BranchLocationPickerMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-slate-100 rounded-lg h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    ),
  }
);

const COLOMBIA_CENTER: [number, number] = [4.711, -74.0721];

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

async function geocode(query: string): Promise<[number, number] | null> {
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      { headers: { "Accept-Language": "es" } }
    );
    if (!res.ok) return null;
    const results: NominatimResult[] = await res.json();
    if (!results.length) return null;
    return [parseFloat(results[0].lat), parseFloat(results[0].lon)];
  } catch {
    return null;
  }
}

export interface BranchLocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  city?: string;
  department?: string;
  onChange: (lat: number | null, lng: number | null) => void;
}

export function BranchLocationPicker({
  latitude,
  longitude,
  address,
  city,
  department,
  onChange,
}: BranchLocationPickerProps) {
  const t = useTranslations("branches");

  const hasCoords =
    latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude);

  const [mapCenter, setMapCenter] = useState<[number, number]>(
    hasCoords ? [latitude, longitude] : COLOMBIA_CENTER
  );
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Snapshot of the address present when coords were last loaded from parent props.
  // Geocoding is skipped when the query matches this snapshot, so saved coords are
  // not overridden when branch data arrives (sync or async).
  const addressAtCoordLoad = useRef<string>(
    hasCoords
      ? [address, city, department, "Colombia"].filter(Boolean).join(", ")
      : ""
  );

  // True after the user manually places the pin — address edits no longer move the pin.
  const pinManuallyPlaced = useRef(false);

  // When parent provides valid coords (initial load or async data arrival),
  // center the map and snapshot the current address so geocoding is skipped for it.
  useEffect(() => {
    if (latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude)) {
      setMapCenter([latitude, longitude]);
      addressAtCoordLoad.current = [address, city, department, "Colombia"]
        .filter(Boolean)
        .join(", ");
    }
    // Intentionally omits address/city/department: we only react to coord changes here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  const handleMarkerMove = useCallback(
    (lat: number, lng: number) => {
      pinManuallyPlaced.current = true;
      setMapCenter([lat, lng]);
      onChange(lat, lng);
    },
    [onChange]
  );

  useEffect(() => {
    if (pinManuallyPlaced.current) return;

    const parts = [address, city, department, "Colombia"].filter(Boolean);
    if (parts.length < 2) return;

    const query = parts.join(", ");

    // Skip when the query matches the address that was active when coords loaded —
    // prevents geocoding from overriding the saved coords on data load.
    if (query === addressAtCoordLoad.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setGeocoding(true);
      setGeocodeError(false);
      const coords = await geocode(query);
      setGeocoding(false);

      if (coords) {
        setMapCenter(coords);
        onChange(coords[0], coords[1]);
      } else {
        setGeocodeError(true);
      }
    }, 800);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, city, department]);

  const displayLat = latitude?.toFixed(6) ?? "—";
  const displayLng = longitude?.toFixed(6) ?? "—";

  return (
    <Card variant="glass">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="w-4 h-4 text-green-500" />
          {t("form.sections.mapLocation")}
          {geocoding && (
            <Loader2 className="w-3 h-3 animate-spin text-slate-400 ml-1" />
          )}
        </CardTitle>
        <CardDescription>{t("form.descriptions.mapLocation")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {geocodeError && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {t("form.help.geocodeNotFound")}
          </div>
        )}

        <MapComponent
          latitude={mapCenter[0]}
          longitude={mapCenter[1]}
          onChange={handleMarkerMove}
        />

        <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
          <span>
            <span className="font-medium text-slate-700">Lat:</span> {displayLat}
          </span>
          <span>
            <span className="font-medium text-slate-700">Lng:</span> {displayLng}
          </span>
          {!hasCoords && (
            <span className="text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {t("form.help.noCoordsYet")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
