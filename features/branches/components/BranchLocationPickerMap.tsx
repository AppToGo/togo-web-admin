"use client";

import { useEffect } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  MapMouseEvent,
  useMap,
} from "@vis.gl/react-google-maps";
import { useTranslations } from "next-intl";

const FALLBACK_MAP_ID = "togo-branch-map";
const DEFAULT_ZOOM = 15;
const MAP_HEIGHT = "300px";

export interface BranchLocationPickerMapProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}

interface MapPanControllerProps {
  lat: number;
  lng: number;
}

// Imperatively pans the map when coords change (e.g. after geocoding).
// Lives inside <Map> so it can access the map instance via useMap().
// Using panTo instead of a controlled `center` prop keeps the map
// freely draggable — a controlled prop snaps it back on every render.
function MapPanController({ lat, lng }: MapPanControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      map.panTo({ lat, lng });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  return null;
}

export function BranchLocationPickerMap({
  latitude,
  longitude,
  onChange,
}: BranchLocationPickerMapProps) {
  const t = useTranslations("branches");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? FALLBACK_MAP_ID;

  if (!apiKey) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-lg bg-slate-100 px-4 text-center text-xs text-slate-500"
        style={{ height: MAP_HEIGHT }}
      >
        {t("form.help.mapKeyMissing")}
      </div>
    );
  }

  const center = { lat: latitude, lng: longitude };

  const handleMapClick = (event: MapMouseEvent) => {
    const lat = event.detail.latLng?.lat;
    const lng = event.detail.latLng?.lng;
    if (lat != null && lng != null) {
      onChange(lat, lng);
    }
  };

  const handleMarkerDragEnd = (event: google.maps.MapMouseEvent) => {
    const lat = event.latLng?.lat();
    const lng = event.latLng?.lng();
    if (lat != null && lng != null) {
      onChange(lat, lng);
    }
  };

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={center}
        defaultZoom={DEFAULT_ZOOM}
        mapId={mapId}
        onClick={handleMapClick}
        style={{ height: MAP_HEIGHT, width: "100%", borderRadius: "8px" }}
        gestureHandling="greedy"
      >
        <MapPanController lat={latitude} lng={longitude} />
        <AdvancedMarker
          position={center}
          draggable
          onDragEnd={handleMarkerDragEnd}
        />
      </Map>
    </APIProvider>
  );
}
